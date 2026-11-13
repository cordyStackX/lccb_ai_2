import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabase-server";
import ChatPageContent from "./chat-page-content";

type SearchParams = Promise<{ email?: string | string[] }>;

const defaultMetadata: Metadata = {
    title: "LACO AI — Public Chatbot",
    description: "Ask questions about this public document collection.",
};

async function getPublicBranding(rawEmail: string) {
    const email = rawEmail.trim().toLowerCase();
    if (!email) return null;

    // This is the public-document chatbot route. Branding is never queried by
    // admin, business-dashboard, or private-document pages.
    const [{ data: business }, { data: profile }] = await Promise.all([
        supabaseServer.from("auth_business").select("business_name").eq("email", email).maybeSingle(),
        supabaseServer.from("profile_pic").select("file_link").eq("email", email).maybeSingle(),
    ]);

    return {
        email,
        businessName: business?.business_name?.trim() || "LACO AI",
        profilePicture: profile?.file_link?.trim() || "",
    };
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
    const params = await searchParams;
    const email = typeof params.email === "string" ? params.email : "";
    const branding = await getPublicBranding(email);
    if (!branding) return defaultMetadata;

    const title = branding.businessName;
    return {
        title,
        description: `Public document chatbot for ${branding.businessName}.`,
        openGraph: { title, description: `Public document chatbot for ${branding.businessName}.` },
        icons: branding.profilePicture ? { icon: [{ url: branding.profilePicture }] } : undefined,
    };
}

export default async function ChatPage({ searchParams }: { searchParams: SearchParams }) {
    const params = await searchParams;
    const rawEmail = typeof params.email === "string" ? params.email : "";
    const branding = await getPublicBranding(rawEmail);

    return <ChatPageContent email={branding?.email ?? ""} />;
}
