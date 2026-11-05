import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/firewall/security";
import { encryptText } from "@/firewall/encryptions";
import { Fetch_to } from "@/utilities";
import apiLinks from "@/config/conf/json_config/Api_links.json";

type ExtractedRecord = { student_id?: unknown; student_name?: unknown; page?: unknown; data?: unknown };

function normalizeStudentId(value: unknown) {
    if (typeof value !== "string") return null;
    const compact = value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    return /^[A-Z0-9]{9}$/.test(compact) ? `${compact.slice(0, 2)}-${compact.slice(2, 6)}-${compact.slice(6)}` : null;
}

export async function POST(req: NextRequest) {
    try {
        const auth = await Security(req);
        if (auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        if (auth.role?.toLowerCase() !== "admin") return NextResponse.json({ success: false, error: "Only administrators can recheck sensitive PDFs" }, { status: 403 });

        const body = await req.json().catch(() => ({}));
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        if (!email || auth.email?.trim().toLowerCase() !== email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

        const token = process.env.API_KEY;
        const pdfPassword = process.env.PDF_ENCRYPT_PASSWORD;
        if (!token || !pdfPassword) return NextResponse.json({ success: false, error: "Sensitive PDF processing is not configured" }, { status: 500 });

        const studentsById = new Map<string, string | null>();
        for (let offset = 0; ; offset += 1000) {
            const { data: students, error: studentError } = await supabaseServer.from("auth_student")
                .select("email, school_id").range(offset, offset + 999);
            if (studentError) return NextResponse.json({ success: false, error: "Could not load registered student IDs" }, { status: 500 });
            for (const student of students ?? []) {
                const id = normalizeStudentId(student.school_id);
                const studentEmail = typeof student.email === "string" ? student.email.trim().toLowerCase() : "";
                if (!id || !studentEmail) continue;
                studentsById.set(id, studentsById.has(id) ? null : studentEmail);
            }
            if (!students || students.length < 1000) break;
        }

        const { data: documents, error: documentsError } = await supabaseServer.from("chatbot_pdf_file_private")
            .select("id, file, file_name").eq("email", email).order("id", { ascending: true });
        if (documentsError) return NextResponse.json({ success: false, error: "Could not load sensitive PDFs" }, { status: 500 });
        if (!documents?.length) return NextResponse.json({ success: false, message: "No sensitive PDFs to recheck." }, { status: 404 });

        const apiUrl = process.env.RENDER_API || apiLinks.python_links;
        const outcomes: Array<{ file_name: string; success: boolean; message: string; newly_matched_students: number }> = [];
        let totalSavedGroups = 0;
        let newlyMatchedStudents = 0;

        for (const document of documents) {
            try {
                const downloaded = await Fetch_to(`${apiUrl}download-file`, { token, filePath2: document.file, force_refresh: true });
                if (!downloaded.success) throw new Error(downloaded.message || "Could not load PDF for rechecking");
                const extracted = await Fetch_to(`${apiUrl}extract-sensitive-records`, { token, email, filePath: document.file });
                if (!extracted.success || !Array.isArray(extracted.data?.records)) throw new Error(extracted.message || "Could not extract records from PDF");

                const grouped = new Map<string, { pages: Set<number>; records: Array<{ page: number; student_id: string; student_name: string | null; data: Record<string, unknown> }> }>();
                let skipped = 0;
                for (const value of extracted.data.records as ExtractedRecord[]) {
                    const id = normalizeStudentId(value?.student_id);
                    const studentEmail = id ? studentsById.get(id) : undefined;
                    const page = Number(value?.page);
                    if (!id || !studentEmail || !Number.isInteger(page) || !value.data || typeof value.data !== "object" || Array.isArray(value.data)) {
                        skipped += 1;
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

                const rows = Array.from(grouped.entries()).map(([studentEmail, group]) => ({
                    student_email: studentEmail,
                    source_pdf_id: document.id,
                    source_file_name: document.file_name,
                    page_numbers: Array.from(group.pages).sort((a, b) => a - b),
                    record_count: group.records.length,
                    records_ciphertext: encryptText(JSON.stringify(group.records), pdfPassword),
                }));

                const { data: previousRows, error: previousError } = await supabaseServer.from("chatbot_student_records")
                    .select("student_email").eq("source_pdf_id", document.id);
                if (previousError) throw new Error("Could not check existing bookshelf entries");
                const previouslyMatched = new Set((previousRows ?? []).map((row) => row.student_email.toLowerCase()));
                const newlyMatched = rows.filter((row) => !previouslyMatched.has(row.student_email.toLowerCase())).length;
                if (rows.length) {
                    const { error: saveError } = await supabaseServer.from("chatbot_student_records").upsert(rows, { onConflict: "student_email,source_pdf_id" });
                    if (saveError) throw new Error("Could not save the refreshed bookshelf records");
                }
                totalSavedGroups += rows.length;
                newlyMatchedStudents += newlyMatched;
                outcomes.push({
                    file_name: document.file_name,
                    success: true,
                    newly_matched_students: newlyMatched,
                    message: rows.length
                        ? `${newlyMatched} new student bookshelf entr${newlyMatched === 1 ? "y" : "ies"} created; ${rows.length - newlyMatched} existing entr${rows.length - newlyMatched === 1 ? "y" : "ies"} refreshed${skipped ? `; skipped ${skipped} unmatched or invalid record(s)` : ""}.`
                        : `No verified student records were extracted${skipped ? ` (${skipped} unmatched or invalid record(s))` : ""}. Existing bookshelf entries were left untouched; check the PDF ID and encryption settings.`,
                });
            } catch (error) {
                outcomes.push({ file_name: document.file_name, success: false, newly_matched_students: 0, message: error instanceof Error ? error.message : "PDF recheck failed" });
            }
        }

        const successful = outcomes.filter((item) => item.success).length;
        return NextResponse.json({
            success: successful > 0,
            message: totalSavedGroups
                ? `Rechecked ${successful} of ${documents.length} PDF(s); created ${newlyMatchedStudents} new student bookshelf entr${newlyMatchedStudents === 1 ? "y" : "ies"} and refreshed ${totalSavedGroups - newlyMatchedStudents} existing entr${totalSavedGroups - newlyMatchedStudents === 1 ? "y" : "ies"}.`
                : `Rechecked ${successful} of ${documents.length} PDF(s), but found no verified student record groups. Existing bookshelf entries were left untouched.`,
            outcomes,
            newlyMatchedStudents,
        }, { status: successful > 0 ? 200 : 500 });
    } catch (error) {
        console.error("Sensitive PDF recheck failed:", error);
        return NextResponse.json({ success: false, error: "Sensitive PDF recheck failed" }, { status: 500 });
    }
}
