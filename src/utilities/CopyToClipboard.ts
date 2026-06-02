function stripMarkdown(input: string): string {
    return input
        .replace(/\r\n/g, "\n")
        .replace(/```[\s\S]*?```/g, (block) => block.replace(/```/g, ""))
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/^\s*>\s?/gm, "")
        .replace(/^\s*[-*+]\s+/gm, "")
        .replace(/^\s*\d+\.\s+/gm, "")
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$1")
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/__([^_]+)__/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/_([^_]+)_/g, "$1")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

const CopyToClipboard = async (text: string): Promise<boolean> => {
    const plainText = stripMarkdown(text);

    if (!plainText) return false;

    try {
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(plainText);
            return true;
        }

        if (typeof document !== "undefined") {
            const textarea = document.createElement("textarea");
            textarea.value = plainText;
            textarea.setAttribute("readonly", "");
            textarea.style.position = "absolute";
            textarea.style.left = "-9999px";
            document.body.appendChild(textarea);
            textarea.select();

            const copied = document.execCommand("copy");
            document.body.removeChild(textarea);
            return copied;
        }

        return false;
    } catch {
        return false;
    }
};

export default CopyToClipboard;
