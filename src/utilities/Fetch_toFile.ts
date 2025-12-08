export default async function Fetch_toFile(
  dir: string,
  file: File,
  fields: Record<string, string | number> = {},
  headers: Record<string, string> = {},
  retries: number = 3,
  delay: number = 1000
) {
  if (!dir || dir === "") {
    if (typeof window !== "undefined") alert("Invalid API Directory not found");
    return { success: false, message: "Invalid API Directory" };
  }

  if (!file) {
    return { success: false, message: "No file provided" };
  }

  // Build multipart form
  const formData = new FormData();
  formData.append("file", file);

  for (const key in fields) {
    formData.append(key, String(fields[key]));
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(dir, {
        method: "POST",
        headers: {
          ...headers
        },
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        console.log("Status for file upload:", data);
        return { success: true, data };
      } else {
        console.log(data?.error);
        return {
          success: false,
          message: data?.error || `Request failed: ${response.status}`,
        };
      }
    } catch (err: unknown) {
      let message = "Unknown fetch error";
      if (err instanceof Error) message = err.message;
      console.error(`Attempt ${attempt} fetch error:`, message);
    }

    if (attempt < retries) await new Promise(res => setTimeout(res, delay));
  }

  return { success: false, message: `All ${retries} attempts failed for ${dir}` };
}
