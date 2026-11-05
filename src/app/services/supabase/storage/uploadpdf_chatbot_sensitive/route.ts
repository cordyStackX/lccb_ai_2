import { NextResponse, NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/firewall/security";
import { Fetch_to } from "@/utilities";
import { encryptPDF } from "@pdfsmaller/pdf-encrypt-lite";
import { encryptText } from "@/firewall/encryptions";
import apiLinks from "@/config/conf/json_config/Api_links.json";

type ExtractedRecord = { student_id?: unknown; student_name?: unknown; page?: unknown; data?: unknown };

function normalizeStudentId(value: string) {
    const compact = value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    return /^[A-Z0-9]{9}$/.test(compact) ? `${compact.slice(0, 2)}-${compact.slice(2, 6)}-${compact.slice(6)}` : null;
}

export async function POST(req: NextRequest) {
    const auth = await Security(req);
    if (auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (auth.role?.toLowerCase() !== "admin") return NextResponse.json({ success: false, error: "Only administrators can process sensitive student records" }, { status: 403 });

    const form = await req.formData();
    const entries = form.getAll("file");
    const cleanEmail = String(form.get("email") || "").trim().toLowerCase();
    if (!cleanEmail || auth.email?.trim().toLowerCase() !== cleanEmail) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    const files = entries.filter((entry): entry is File => entry instanceof File);
    if (files.length === 0) return NextResponse.json({ success: false, error: "No PDF files detected" }, { status: 400 });
    const invalidFiles = files.filter((file) => file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"));
    if (invalidFiles.length) return NextResponse.json({ success: false, error: `Invalid PDF file: ${invalidFiles.map(({ name }) => name).join(", ")}` }, { status: 400 });

    const names = files.map(({ name }) => name);
    if (new Set(names.map((name) => name.toLowerCase())).size !== names.length) {
        return NextResponse.json({ success: false, error: "Duplicate PDF names in upload" }, { status: 409 });
    }
    const { data: existing, error: existingError } = await supabaseServer.from("chatbot_pdf_file_private")
        .select("file_name").eq("email", cleanEmail).in("file_name", names);
    if (existingError) return NextResponse.json({ success: false, error: "Failed to check existing sensitive documents" }, { status: 500 });
    if (existing?.length) return NextResponse.json({ success: false, error: `PDF name already exists: ${existing.map((item) => item.file_name).join(", ")}` }, { status: 409 });

    const token = process.env.API_KEY;
    const pdfPassword = process.env.PDF_ENCRYPT_PASSWORD;
    if (!token || !pdfPassword) return NextResponse.json({ success: false, error: "Sensitive document processing is not configured" }, { status: 500 });
    const apiUrl = process.env.RENDER_API || apiLinks.python_links;
    const studentsById = new Map<string, string | null>();
    for (let offset = 0; ; offset += 1000) {
        const { data: studentRows, error: studentsError } = await supabaseServer.from("auth_student")
            .select("email, school_id").range(offset, offset + 999);
        if (studentsError) return NextResponse.json({ success: false, error: "Could not load student ID records" }, { status: 500 });
        for (const student of studentRows ?? []) {
            if (!student.email || !student.school_id) continue;
            const normalizedId = normalizeStudentId(student.school_id);
            if (!normalizedId) continue;
            studentsById.set(normalizedId, studentsById.has(normalizedId) ? null : student.email.trim().toLowerCase());
        }
        if (!studentRows || studentRows.length < 1000) break;
    }
    const uploaded: Array<{ id?: number; originalName: string; filePath?: string; success: boolean; matchedStudents?: number; skippedRecords?: number; skippedMissingId?: number; skippedUnmatchedId?: number; skippedAmbiguousId?: number; invalidRecords?: number; message?: string }> = [];
    for (const file of files) {
        const filePath = `sensitive/${Date.now()}_${randomUUID()}_${file.name}`;
        let privateDocId: number | undefined;
        try {
            const { error: storageError } = await supabaseServer.storage.from("chatbot_pdfs").upload(filePath, file, { contentType: "application/pdf", upsert: false });
            if (storageError) throw new Error("Failed to upload the private PDF");

            const { data: privateDoc, error: insertError } = await supabaseServer.from("chatbot_pdf_file_private")
                .insert({ file: filePath, email: cleanEmail, file_name: file.name })
                .select("id").single();
            if (insertError || !privateDoc) throw new Error("Failed to save the private PDF record");
            privateDocId = privateDoc.id;

            const downloaded = await Fetch_to(`${apiUrl}download-file`, { token, filePath2: filePath });
            if (!downloaded.success) throw new Error(downloaded.message || "Python could not read the PDF");
            const extracted = await Fetch_to(`${apiUrl}extract-sensitive-records`, { token, email: cleanEmail, filePath });
            const extractedRecords = extracted.data?.records;
            if (!extracted.success || !Array.isArray(extractedRecords)) throw new Error(extracted.message || "Could not extract student records from the PDF");

            const grouped = new Map<string, { pages: Set<number>; records: Array<{ page: number; student_id: string; student_name: string | null; data: Record<string, unknown> }> }>();
            let skippedMissingId = 0;
            let skippedUnmatchedId = 0;
            let skippedAmbiguousId = 0;
            let invalidRecords = 0;
            for (const value of extractedRecords as ExtractedRecord[]) {
                const id = typeof value?.student_id === "string" ? normalizeStudentId(value.student_id) : null;
                const studentEmail = id ? studentsById.get(id) : undefined;
                const page = Number(value?.page);
                if (!id) {
                    skippedMissingId += 1;
                    continue;
                }
                if (!studentEmail) {
                    skippedUnmatchedId += 1;
                    if (studentsById.has(id)) skippedAmbiguousId += 1;
                    continue;
                }
                if (!Number.isInteger(page) || !value.data || typeof value.data !== "object" || Array.isArray(value.data)) {
                    invalidRecords += 1;
                    continue;
                }
                const group = grouped.get(studentEmail) ?? { pages: new Set<number>(), records: [] };
                group.pages.add(page);
                group.records.push({
                    page,
                    student_id: id,
                    student_name: typeof value.student_name === "string" ? value.student_name : null,
                    data: value.data as Record<string, unknown>,
                });
                grouped.set(studentEmail, group);
            }

            const encryptedBytes = await encryptPDF(new Uint8Array(await file.arrayBuffer()), pdfPassword);
            const { error: encryptionError } = await supabaseServer.storage.from("chatbot_pdfs").update(filePath, Buffer.from(encryptedBytes), { contentType: "application/pdf" });
            if (encryptionError) throw new Error("Failed to encrypt the private PDF at rest");

            const recordsToSave = Array.from(grouped.entries()).map(([studentEmail, group]) => ({
                student_email: studentEmail,
                source_pdf_id: privateDocId,
                source_file_name: file.name,
                page_numbers: Array.from(group.pages).sort((a, b) => a - b),
                record_count: group.records.length,
                records_ciphertext: encryptText(JSON.stringify(group.records), pdfPassword),
            }));
            if (recordsToSave.length) {
                const { error: recordsError } = await supabaseServer.from("chatbot_student_records")
                    .upsert(recordsToSave, { onConflict: "student_email,source_pdf_id" });
                if (recordsError) throw new Error("Failed to save the matched student records");
            }

            uploaded.push({
                id: privateDocId,
                originalName: file.name,
                filePath,
                success: true,
                matchedStudents: grouped.size,
                skippedRecords: skippedMissingId + skippedUnmatchedId,
                skippedMissingId,
                skippedUnmatchedId,
                skippedAmbiguousId,
                invalidRecords,
                message: `${grouped.size} student record groups saved.${skippedMissingId ? ` Skipped ${skippedMissingId} record(s) because no valid ID was extracted from the PDF.` : ""}${skippedUnmatchedId - skippedAmbiguousId ? ` Skipped ${skippedUnmatchedId - skippedAmbiguousId} record(s) because the ID is not registered to a student account.` : ""}${skippedAmbiguousId ? ` Skipped ${skippedAmbiguousId} record(s) because the ID matches multiple student accounts.` : ""}${!skippedMissingId && !skippedUnmatchedId ? " No records were skipped for missing or unmatched Student IDs." : ""}${invalidRecords ? ` Ignored ${invalidRecords} incomplete extraction result(s).` : ""}`,
            });
        } catch (error) {
            console.error("Sensitive PDF processing failed:", error);
            if (privateDocId !== undefined) {
                await supabaseServer.from("chatbot_student_records").delete().eq("source_pdf_id", privateDocId);
                await supabaseServer.from("chatbot_pdf_file_private").delete().eq("id", privateDocId).eq("email", cleanEmail);
            }
            await supabaseServer.storage.from("chatbot_pdfs").remove([filePath]);
            uploaded.push({ originalName: file.name, filePath, success: false, message: error instanceof Error ? error.message : "Sensitive PDF processing failed" });
        }
    }

    const successful = uploaded.filter((item) => item.success);
    const invalidRecords = successful.reduce((total, item) => total + (item.invalidRecords ?? 0), 0);
    const savedGroups = successful.reduce((total, item) => total + (item.matchedStudents ?? 0), 0);
    const skippedMissingId = successful.reduce((total, item) => total + (item.skippedMissingId ?? 0), 0);
    const skippedUnmatchedId = successful.reduce((total, item) => total + (item.skippedUnmatchedId ?? 0), 0);
    const skippedAmbiguousId = successful.reduce((total, item) => total + (item.skippedAmbiguousId ?? 0), 0);
    const message = `Processed ${successful.length} of ${files.length} PDF(s). ${savedGroups} student record groups saved.${skippedMissingId ? ` Skipped ${skippedMissingId} record(s) because no valid ID was extracted from the PDF.` : ""}${skippedUnmatchedId - skippedAmbiguousId ? ` Skipped ${skippedUnmatchedId - skippedAmbiguousId} record(s) because the ID is not registered to a student account.` : ""}${skippedAmbiguousId ? ` Skipped ${skippedAmbiguousId} record(s) because the ID matches multiple student accounts.` : ""}${!skippedMissingId && !skippedUnmatchedId ? " No records were skipped for missing or unmatched Student IDs." : ""}${invalidRecords ? ` Ignored ${invalidRecords} incomplete extraction result(s).` : ""}`;
    if (successful.length > 0) {
        const todayStart = new Date().toISOString().split("T")[0];
        const tomorrowStart = new Date(Date.now() + 86400000).toISOString().split("T")[0];
        const { data: log, error: logError } = await supabaseServer.from("system_logs")
            .select("uploaded_pdf").eq("request", cleanEmail).gte("created_at", todayStart).lt("created_at", tomorrowStart).maybeSingle();
        if (logError) console.error("Sensitive PDF usage log lookup failed:", logError);
        else if (log) {
            await supabaseServer.from("system_logs").update({ uploaded_pdf: Number(log.uploaded_pdf ?? 0) + successful.length })
                .eq("request", cleanEmail).gte("created_at", todayStart).lt("created_at", tomorrowStart);
        } else {
            await supabaseServer.from("system_logs").insert({ request: cleanEmail, uploaded_pdf: successful.length });
        }
    }
    return NextResponse.json({ success: successful.length > 0, message, uploaded }, { status: successful.length > 0 ? 200 : 422 });
}
