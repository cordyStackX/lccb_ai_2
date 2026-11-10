import jsPDF from "jspdf";

function escapeHtml(input: string): string {
    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function wrapLists(lines: string[]): string[] {
    const output: string[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const unordered = line.match(/^\s*[-*+]\s+/);
        const ordered = line.match(/^\s*\d+\.\s+/);

        if (unordered) {
            const items: string[] = [];
            while (i < lines.length && lines[i].match(/^\s*[-*+]\s+/)) {
                items.push(lines[i].replace(/^\s*[-*+]\s+/, ""));
                i += 1;
            }
            output.push(`<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`);
            continue;
        }

        if (ordered) {
            const items: string[] = [];
            while (i < lines.length && lines[i].match(/^\s*\d+\.\s+/)) {
                items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
                i += 1;
            }
            output.push(`<ol>${items.map((item) => `<li>${item}</li>`).join("")}</ol>`);
            continue;
        }

        output.push(line);
        i += 1;
    }

    return output;
}

function markdownToHtml(input: string): string {
    const source = input.replace(/\r\n/g, "\n");
    const codeBlocks: string[] = [];

    const withCodeTokens = source.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
        const escaped = escapeHtml(code.trim());
        const html = `<pre class="md-code"><code${lang ? ` data-lang="${lang}"` : ""}>${escaped}</code></pre>`;
        const token = `@@CODE_BLOCK_${codeBlocks.length}@@`;
        codeBlocks.push(html);
        return token;
    });

    let text = escapeHtml(withCodeTokens);

    text = text
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
        .replace(/^######\s+(.+)$/gm, "<h6>$1</h6>")
        .replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>")
        .replace(/^####\s+(.+)$/gm, "<h4>$1</h4>")
        .replace(/^###\s+(.+)$/gm, "<h3>$1</h3>")
        .replace(/^##\s+(.+)$/gm, "<h2>$1</h2>")
        .replace(/^#\s+(.+)$/gm, "<h1>$1</h1>")
        .replace(/^&gt;\s?(.*)$/gm, "<blockquote>$1</blockquote>")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/__(.*?)__/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/_(.*?)_/g, "<em>$1</em>")
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\[([^\]]+)]\(([^)]+)\)/g, "<a href=\"$2\">$1</a>");

    const lines = wrapLists(text.split("\n"));
    const blocks = lines.join("\n").split(/\n\s*\n/);

    const html = blocks
        .map((block) => {
            const trimmed = block.trim();
            if (!trimmed) return "";

            if (
                trimmed.startsWith("<h") ||
                trimmed.startsWith("<ul>") ||
                trimmed.startsWith("<ol>") ||
                trimmed.startsWith("<pre") ||
                trimmed.startsWith("<blockquote>")
            ) {
                return trimmed;
            }

            return `<p>${trimmed.replace(/\n/g, "<br />")}</p>`;
        })
        .join("\n");

    return codeBlocks.reduce(
        (acc, block, index) => acc.replace(`@@CODE_BLOCK_${index}@@`, block),
        html
    );
}

export default async function DownloadAsPDF(content: string, index: number) {
    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    const pageWidth = 210;
    const margin = 12;

    const container = document.createElement("div");
    container.style.width = "620px";
    container.style.padding = "16px";
    container.style.fontFamily = "Arial, sans-serif";
    container.style.fontSize = "3px";
    container.style.color = "#111";
    container.style.lineHeight = "1.6";
    container.style.background = "#fff";

    const header = `
        <div style="margin-bottom: 16px;">
            <h2 style="margin: 0 0 6px 0; font-size: 16px;">LACO AI Response ${index + 1}</h2>
            <div style="height: 2px; background: #222; opacity: 0.2;"></div>
        </div>
    `;

    const body = markdownToHtml(content);
    container.innerHTML = `
        <style>
            h1, h2, h3, h4, h5, h6 { margin: 12px 0 6px; line-height: 1.3; }
            h1 { font-size: 20px; }
            h2 { font-size: 16px; }
            h3 { font-size: 15px; }
            h4 { font-size: 14px; }
            h5, h6 { font-size: 13px; }
            p { margin: 0 0 8px; }
            ul, ol { padding-left: 20px; margin: 0 0 10px; }
            blockquote { margin: 10px 0; padding-left: 10px; border-left: 3px solid #bbb; color: #555; }
            code { background: #f2f2f2; padding: 2px 4px; border-radius: 4px; font-size: 0.95em; }
            pre.md-code { background: #f5f5f5; padding: 8px; border-radius: 6px; overflow: hidden; font-size: 0.92em; }
            pre.md-code code { background: none; padding: 0; }
            a { color: #0b63d1; text-decoration: none; }
        </style>
        ${header}
        ${body}
    `;

    document.body.appendChild(container);

    await pdf.html(container, {
        x: margin,
        y: margin,
        width: pageWidth - margin * 2,
        windowWidth: 620,
        html2canvas: { scale: 0.75, backgroundColor: "#ffffff" },
    });

    document.body.removeChild(container);
    pdf.save(`LACO-AI-Response-${index + 1}.pdf`);
}