import { NextRequest, NextResponse } from "next/server";
import { Security } from "@/firewall/security";
import { decryptStudentId, decryptText } from "@/firewall/encryptions";
import { supabaseServer } from "@/lib/supabase-server";

function decodeRecords(ciphertext: string, password: string) {
    return JSON.parse(decryptText(ciphertext, password)) as unknown;
}

export async function POST(req: NextRequest) {
    const auth = await Security(req);
    if (auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (auth.role?.toLowerCase() !== "admin") return NextResponse.json({ success: false, error: "Only administrators can view sensitive student records" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const studentEmail = typeof body.student_email === "string" ? body.student_email.trim().toLowerCase() : "";
    if (!email || auth.email?.trim().toLowerCase() !== email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

    const password = process.env.PDF_ENCRYPT_PASSWORD;
    if (!password) return NextResponse.json({ success: false, error: "Sensitive record encryption is not configured" }, { status: 500 });

    if (studentEmail) {
        const [{ data: student, error: studentError }, { data: records, error: recordsError }] = await Promise.all([
            supabaseServer.from("auth_student").select("email, school_id").eq("email", studentEmail).maybeSingle(),
            supabaseServer.from("chatbot_student_records").select("id, created_at, source_file_name, page_numbers, record_count, records_ciphertext").eq("student_email", studentEmail).order("created_at", { ascending: false }),
        ]);
        if (studentError || recordsError) return NextResponse.json({ success: false, error: "Failed to retrieve student records" }, { status: 500 });
        if (!student) return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
        let schoolId: string | null = null;
        schoolId = decryptStudentId(student.school_id, process.env.API_KEY || "");
        try {
            const decoded = (records ?? []).map((record) => ({
                id: record.id,
                created_at: record.created_at,
                source_file_name: record.source_file_name,
                page_numbers: record.page_numbers,
                record_count: record.record_count,
                records: decodeRecords(record.records_ciphertext, password),
            }));
            return NextResponse.json({ success: true, student: { email: student.email, school_id: schoolId }, records: decoded });
        } catch (error) {
            console.error("Failed to decrypt student academic records:", error);
            return NextResponse.json({ success: false, error: "Could not decrypt student records" }, { status: 500 });
        }
    }

    const rows = [];
    for (let offset = 0; ; offset += 1000) {
        const { data: batch, error } = await supabaseServer.from("chatbot_student_records")
            .select("student_email, record_count, source_file_name, created_at")
            .order("created_at", { ascending: false }).range(offset, offset + 999);
        if (error) return NextResponse.json({ success: false, error: "Failed to retrieve student record list" }, { status: 500 });
        rows.push(...(batch ?? []));
        if (!batch || batch.length < 1000) break;
    }
    const counts = new Map<string, { record_count: number; document_count: number; latest_at: string; sources: Set<string> }>();
    for (const row of rows ?? []) {
        const key = row.student_email.toLowerCase();
        const current = counts.get(key) ?? { record_count: 0, document_count: 0, latest_at: row.created_at, sources: new Set<string>() };
        current.record_count += Number(row.record_count ?? 0);
        current.sources.add(row.source_file_name);
        if (new Date(row.created_at) > new Date(current.latest_at)) current.latest_at = row.created_at;
        counts.set(key, current);
    }

    const studentEmails = Array.from(counts.keys());
    if (!studentEmails.length) return NextResponse.json({ success: true, students: [] });
    const students: Array<{ email: string; school_id: string | null }> = [];
    const profiles: Array<{ email: string; f_name: string | null }> = [];
    for (let offset = 0; offset < studentEmails.length; offset += 100) {
        const emailBatch = studentEmails.slice(offset, offset + 100);
        const [{ data: studentBatch, error: studentError }, { data: profileBatch, error: profileError }] = await Promise.all([
            supabaseServer.from("auth_student").select("email, school_id").in("email", emailBatch),
            supabaseServer.from("auth").select("email, f_name").in("email", emailBatch),
        ]);
        if (studentError || profileError) return NextResponse.json({ success: false, error: "Failed to load student details" }, { status: 500 });
        students.push(...(studentBatch ?? []));
        profiles.push(...(profileBatch ?? []));
    }
    const profilesByEmail = new Map((profiles ?? []).map((profile) => [profile.email.toLowerCase(), profile]));
    const studentsByEmail = new Map((students ?? []).map((student) => [student.email.toLowerCase(), student]));
    const result = studentEmails.map((studentEmail) => {
        const aggregate = counts.get(studentEmail)!;
        const student = studentsByEmail.get(studentEmail);
        let schoolId: string | null = null;
        schoolId = decryptStudentId(student?.school_id, process.env.API_KEY || "");
        const profile = profilesByEmail.get(studentEmail);
        return {
            email: studentEmail,
            school_id: schoolId,
            name: profile?.f_name || "Student",
            record_count: aggregate.record_count,
            document_count: aggregate.sources.size,
            latest_at: aggregate.latest_at,
        };
    }).sort((a, b) => (a.name || a.school_id || "").localeCompare(b.name || b.school_id || ""));

    return NextResponse.json({ success: true, students: result });
}
