import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/lib/security";

export async function POST(req: NextRequest) {

    const auth = await Security(req);
    if(auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { email } = await req.json();
    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanEmail) {
      return NextResponse.json(
        { success: false, error: "Email not found" },
        { status: 404 }
      );
    }

  const { data, error } = await supabaseServer
    .from("pdf_file")
    .select("id, file, file_name, status")
    .eq("email", cleanEmail);

  if (error) {
    console.error("Supabase Query Error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      { success: true, error: [{ id: 0, file_name: "No PDF Found" }] },
      { status: 400 }
    );
  }

  const bucketName = "pdfs";

  const toRelativePath = (value: string) => {
    let path = value.trim();

    // Handle full public URL and plain paths consistently.
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

  const filesWithSize = await Promise.all(
    data.map(async (item) => {
      try {
        const fullPath = String(item.file || "");
        const relativePath = toRelativePath(fullPath);

        if (!relativePath) {
          return {
            ...item,
            file_size: null,
            file_size_mb: null,
          };
        }

        const pathParts = relativePath.split("/");
        const fileName = pathParts.pop();
        const folderPath = pathParts.join("/");

        const { data: storageFiles, error: storageError } = await supabaseServer
          .storage
          .from(bucketName)
          .list(folderPath || "", { search: fileName, limit: 100 });

        if (storageError) {
          console.error("Storage Error:", storageError);
          return {
            ...item,
            file_size: null,
            file_size_mb: null,
          };
        }

        const matchedFile = storageFiles?.find((f) => f.name === fileName);

        const sizeValue = matchedFile?.metadata?.size;
        const sizeBytes = typeof sizeValue === "number"
          ? sizeValue
          : typeof sizeValue === "string"
            ? Number(sizeValue)
            : null;

        return {
          ...item,
          file_size: sizeBytes,
          file_size_mb: sizeBytes
            ? (sizeBytes / (1024 * 1024)).toFixed(2)
            : null,
        };
      } catch (err) {
        console.error("File size processing error:", err);
        return {
          ...item,
          file_size: null,
          file_size_mb: null,
        };
      }
    })
  );


  return NextResponse.json(
    { success: true, message: filesWithSize },
    { status: 200 }
  );
}