import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/lib/security";

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

    const { data, error } = await supabaseServer
        .storage
        .from(bucketName)
        .createSignedUrl(relativePath, 60);

    if (error) {
        console.error("Supabase Query Error:", error);
        return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
    }

    return NextResponse.json({ success: true, url: data?.signedUrl }, { status: 200 });
}
