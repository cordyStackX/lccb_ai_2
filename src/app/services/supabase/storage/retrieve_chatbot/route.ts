import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
// import { Security } from "@/lib/security";

export async function POST(req: NextRequest) {

    // const auth = await Security(req);
    // if(auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { email, page = 1, limit = 30, search = "" } = await req
      .json()
      .catch(() => ({ email: "", page: 1, limit: 30, search: "" }));
    const cleanEmail = String(email || "").trim().toLowerCase();
    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 30));
    const rangeFrom = (currentPage - 1) * pageSize;
    const rangeTo = rangeFrom + pageSize - 1;
    const term = String(search || "").trim();

    if (!cleanEmail) {
      return NextResponse.json(
        { success: false, error: "Email not found" },
        { status: 404 }
      );
    }

  let query = supabaseServer
    .from("chatbot_pdf_file")
    .select("id, file, file_name, summary", { count: "exact" })
    .eq("email", cleanEmail);

  if (term) {
    const safeTerm = term.replace(/[%_]/g, "\\$&");
    query = query.or(
      `file_name.ilike.%${safeTerm}%,summary.ilike.%${safeTerm}%`
    );
  }

  const { data, error, count } = await query.range(rangeFrom, rangeTo);

  if (error) {
    console.error("Supabase Query Error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (!data || data.length === 0) {
    return NextResponse.json(
      { success: true, message: [], page: currentPage, total, totalPages },
      { status: 200 }
    );
  }

  const bucketName = "chatbot_pdfs";

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
    { success: true, message: filesWithSize, page: currentPage, total, totalPages },
    { status: 200 }
  );
}