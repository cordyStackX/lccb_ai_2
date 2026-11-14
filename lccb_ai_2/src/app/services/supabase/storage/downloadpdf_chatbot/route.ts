import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/firewall/security";

export async function GET(req: NextRequest): Promise<NextResponse> {
    const auth = await Security(req);
    if (auth?.error instanceof NextResponse) return auth.error;
    if (auth?.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const filePath = req.nextUrl.searchParams.get("filePath")?.trim();
    const email = auth.email?.trim().toLowerCase();
    if (!filePath || !email) {
        return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    }

    const bucketName = "chatbot_pdfs";
    let relativePath = filePath;
    if (relativePath.includes("/storage/v1/object/public/")) {
        relativePath = relativePath.split("/storage/v1/object/public/")[1] || relativePath;
    }
    if (relativePath.includes("/pdfs/")) {
        relativePath = relativePath.split("/pdfs/")[1] || relativePath;
    }
    relativePath = relativePath.replace(/^\/+/, "");
    if (relativePath.startsWith(`${bucketName}/`)) {
        relativePath = relativePath.slice(bucketName.length + 1);
    }

    const { data: document, error: documentError } = await supabaseServer
        .from("chatbot_pdf_file")
        .select("file")
        .eq("email", email)
        .eq("file", filePath)
        .maybeSingle();
    if (documentError || !document?.file) {
        return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    }

    const { data, error } = await supabaseServer.storage.from(bucketName).download(relativePath);
    if (error || !data) {
        console.error("Supabase PDF preview error:", error);
        return NextResponse.json({ error: "Could not load PDF" }, { status: 502 });
    }

    return new NextResponse(await data.arrayBuffer(), {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(filePath.split("/").pop() || "document.pdf")}`,
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
        },
    });
}

export async function POST(req: NextRequest) {
    const auth = await Security(req);
    if (auth?.error) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { filePath } = await req.json().catch(() => ({ filePath: "" }));
    const cleanFilePath = String(filePath || "").trim();

    if (!cleanFilePath) {
        return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
    }

    const bucketName = "chatbot_pdfs";

    const toRelativePath = (value: string) => {
        let path = value.trim();

        if (path.includes("/storage/v1/object/public/")) {
            path = path.split("/storage/v1/object/public/")[1] || path;
        }

        if (path.includes("/pdfs/")) {
            path = path.split("/pdfs/")[1] || path;
        }

        path = path.replace(/^\/+/, "");

        if (path.startsWith(`${bucketName}/`)) {
            path = path.slice(bucketName.length + 1);
        }

        return decodeURIComponent(path);
    };

    const relativePath = toRelativePath(cleanFilePath);

    if (!relativePath) {
        return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
    }

    const cleanEmail = auth.email?.trim().toLowerCase();
    if (!cleanEmail) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { data: document, error: documentError } = await supabaseServer
        .from("chatbot_pdf_file")
        .select("file")
        .eq("email", cleanEmail)
        .eq("file", cleanFilePath)
        .maybeSingle();
    if (documentError || !document?.file) {
        return NextResponse.json({ success: false, error: "PDF not found" }, { status: 404 });
    }

    const { data, error } = await supabaseServer
        .storage
        .from(bucketName)
        .createSignedUrl(relativePath, 3600);

    if (error) {
        console.error("Supabase Query Error:", error);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    return NextResponse.json({ success: true, url: data?.signedUrl }, { status: 200 });
}
