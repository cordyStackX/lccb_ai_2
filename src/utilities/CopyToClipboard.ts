const CopyToClipboard = async (text: string): Promise<boolean> => {
    if (!text || !text.trim()) return false;

    try {
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }

        if (typeof document !== "undefined") {
            const textarea = document.createElement("textarea");
            textarea.value = text;
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