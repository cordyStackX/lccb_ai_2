import { Fetch_to } from "@/utilities";
import { supabaseServer } from "@/lib/supabase-server";
import apiLinks from "@/config/conf/json_config/Api_links.json";

export const planPageLimit = (plan: string) => ({ "Free Trial": 50, Pro: 5000, Enterprise: 10000 }[plan] ?? 0);

export function usagePeriodStart(plan: string, createdAt: string) {
    const now = new Date();
    if (plan === "Free Trial") {
        const trialStart = new Date(createdAt);
        const expiresAt = new Date(trialStart);
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        if (now >= expiresAt) return null;
        return trialStart.toISOString();
    }
    if (plan === "Pro") return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    if (plan === "Enterprise") return new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString();
    return null;
}

export function isBusinessPlanExpired(plan: string, accountCreatedAt: string, planExpiresAt: string | null) {
    if (plan === "Free Trial") return usagePeriodStart(plan, accountCreatedAt) === null;
    if (plan === "Pro" || plan === "Enterprise") {
        // Existing paid accounts without a recorded expiry remain active until
        // their next confirmed payment starts a dated subscription term.
        return planExpiresAt ? new Date() >= new Date(planExpiresAt) : false;
    }
    return true;
}

export async function countPdfPages(pdfBase64: string, apiUrl: string, token: string): Promise<number> {
    const response = await Fetch_to(`${apiUrl}count-pdf-pages`, { token, pdf_base64: pdfBase64 });
    const count = Number(response.data?.page_count);
    if (!response.success || !Number.isInteger(count) || count < 1) throw new Error(response.message || "Unable to count PDF pages");
    return count;
}

export async function getUsedPdfPages(email: string) {
    const documents: Array<{ id: number; file: string; page_count: number | null }> = [];
    for (let offset = 0; ; offset += 1000) {
        const { data, error } = await supabaseServer.from("chatbot_pdf_file")
            .select("id, file, page_count").eq("email", email)
            .range(offset, offset + 999);
        if (error) throw error;
        documents.push(...(data ?? []));
        if (!data || data.length < 1000) break;
    }
    const missingCounts = documents.filter((item) => item.page_count === null || item.page_count === undefined);
    if (missingCounts.length) {
        const token = process.env.API_KEY;
        if (!token) throw new Error("PDF page counter is not configured");
        const apiUrl = process.env.RENDER_API || apiLinks.python_links;
        for (const item of missingCounts) {
            let filePath = String(item.file ?? "").trim();
            const publicPathMarker = "/storage/v1/object/public/chatbot_pdfs/";
            if (filePath.includes(publicPathMarker)) filePath = filePath.split(publicPathMarker).pop() ?? filePath;
            filePath = filePath.replace(/^chatbot_pdfs\//, "").replace(/^\/+/, "");
            const { data: signed, error: signedError } = await supabaseServer.storage.from("chatbot_pdfs").createSignedUrl(filePath, 60);
            if (signedError || !signed?.signedUrl) throw new Error("Unable to read page count for an existing PDF");
            const pdf = await fetch(signed.signedUrl);
            if (!pdf.ok) throw new Error("Unable to read page count for an existing PDF");
            const encoded = Buffer.from(await pdf.arrayBuffer()).toString("base64");
            const pageCount = await countPdfPages(encoded, apiUrl, token);
            const { error: updateError } = await supabaseServer.from("chatbot_pdf_file").update({ page_count: pageCount }).eq("id", item.id);
            if (updateError) throw updateError;
            item.page_count = pageCount;
        }
    }
    return documents.reduce((total, item) => total + Number(item.page_count ?? 0), 0);
}

export async function isApiLimitReached(email: string, periodStart: string, limit: number | null) {
    if (limit === null) return false;
    const { data, error } = await supabaseServer.from("system_logs").select("api_request").eq("request", email).gte("created_at", periodStart);
    if (error) throw error;
    return (data ?? []).reduce((total, row) => total + Number(row.api_request ?? 0), 0) >= limit;
}
