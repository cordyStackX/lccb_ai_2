export default async function Fetch_toFile(
  dir: string,
  file: File | File[],
  fields: Record<string, string | number> = {},
  headers: Record<string, string> = {},
  retries: number = 3,
  delay: number = 1000,
  options: { signal?: AbortSignal; onUploadTransferred?: () => void } = {}
) {
  if (!dir || dir === "") {
    if (typeof window !== "undefined") alert("Invalid API Directory not found");
    return { success: false, message: "Invalid API Directory", data: null };
  }

  if (!file || (Array.isArray(file) && file.length === 0)) {
    return { success: false, message: "No file provided", data: null };
  }

  // Build multipart form
  const formData = new FormData();
  if (Array.isArray(file)) {
    for (const item of file) {
      formData.append("file", item);
    }
  } else {
    formData.append("file", file);
  }

  for (const key in fields) {
    formData.append(key, String(fields[key]));
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      let responseOk: boolean;
      let responseStatus: number;
      let data: Record<string, unknown> | null;
      if (options.onUploadTransferred) {
        const result = await new Promise<{ ok: boolean; status: number; body: string }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const abort = () => xhr.abort();
          xhr.open("POST", dir);
          Object.entries(headers).forEach(([key, value]) => xhr.setRequestHeader(key, value));
          const onUploadTransferred = options.onUploadTransferred;
          if (onUploadTransferred) xhr.upload.addEventListener("load", onUploadTransferred, { once: true });
          xhr.addEventListener("load", () => {
            options.signal?.removeEventListener("abort", abort);
            resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, body: xhr.responseText });
          }, { once: true });
          xhr.addEventListener("error", () => {
            options.signal?.removeEventListener("abort", abort);
            reject(new Error("Network error while uploading file"));
          }, { once: true });
          xhr.addEventListener("abort", () => {
            options.signal?.removeEventListener("abort", abort);
            reject(new DOMException("Upload request cancelled", "AbortError"));
          }, { once: true });
          if (options.signal?.aborted) {
            xhr.abort();
            return;
          }
          options.signal?.addEventListener("abort", abort, { once: true });
          xhr.send(formData);
        });
        responseOk = result.ok;
        responseStatus = result.status;
        try {
          const parsed: unknown = JSON.parse(result.body || "null");
          data = parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
            ? parsed as Record<string, unknown>
            : null;
        } catch {
          data = null;
        }
      } else {
        const response = await fetch(dir, {
          method: "POST",
          headers: { ...headers },
          signal: options.signal,
          body: formData,
        });
        responseOk = response.ok;
        responseStatus = response.status;
        const parsed: unknown = await response.json().catch(() => null);
        data = parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
          ? parsed as Record<string, unknown>
          : null;
      }

      if (responseOk) {
        console.log("Status for file upload:", data);
        return { success: true, data };
      } else {
        console.log(data?.error);
        return {
          success: false,
          message: typeof data?.error === "string" ? data.error : `Request failed: ${responseStatus}`,
          data,
        };
      }
    } catch (err: unknown) {
      if (options.signal?.aborted || (err instanceof DOMException && err.name === "AbortError")) {
        return { success: false, message: "Upload request cancelled", data: null };
      }
      let message = "Unknown fetch error";
      if (err instanceof Error) message = err.message;
      console.error(`Attempt ${attempt} fetch error:`, message);
    }

    if (attempt < retries) await new Promise(res => setTimeout(res, delay));
  }

  return { success: false, message: `All ${retries} attempts failed for ${dir}`, data: null };
}
