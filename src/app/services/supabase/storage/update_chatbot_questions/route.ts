import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { Security } from "@/firewall/security";

type QuestionAnswer = { question: string; answer: string };

function isQuestionAnswer(value: unknown): value is QuestionAnswer {
    if (!value || typeof value !== "object") return false;
    const item = value as Record<string, unknown>;
    return typeof item.question === "string"
        && typeof item.answer === "string"
        && item.question.trim().endsWith("?")
        && item.question.trim().length <= 300
        && item.answer.trim().length > 0;
}

export async function POST(req: NextRequest) {
    try {
        const auth = await Security(req);
        if (auth?.error) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { id, email, questionsAndAnswers } = await req.json();
        const documentId = Number(id);
        const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

        if (!Number.isInteger(documentId) || documentId <= 0 || !cleanEmail) {
            return NextResponse.json({ success: false, error: "Document id and email are required" }, { status: 400 });
        }
        if (!Array.isArray(questionsAndAnswers) || questionsAndAnswers.length === 0 || questionsAndAnswers.length > 8 || !questionsAndAnswers.every(isQuestionAnswer)) {
            return NextResponse.json({ success: false, error: "Provide 1 to 8 questions and answers" }, { status: 400 });
        }

        const normalized = questionsAndAnswers.map(({ question, answer }: QuestionAnswer) => ({
            question: question.trim(),
            answer: answer.trim(),
        }));
        const suggest = normalized.map(({ question }) => question);

        const { data, error } = await supabaseServer
            .from("chatbot_pdf_file")
            .update({ summary: JSON.stringify(normalized), suggest: JSON.stringify(suggest) })
            .eq("id", documentId)
            .eq("email", cleanEmail)
            .select("id, file, file_name, summary, suggest")
            .maybeSingle();

        if (error) {
            console.error("Supabase question update error:", error);
            return NextResponse.json({ success: false, error: "Failed to save questions and answers" }, { status: 500 });
        }
        if (!data) return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });

        return NextResponse.json({ success: true, message: data });
    } catch (error) {
        console.error("update_chatbot_questions POST Error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
