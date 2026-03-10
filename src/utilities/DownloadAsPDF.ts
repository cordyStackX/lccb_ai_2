import jsPDF from "jspdf";

export default function DownloadAsPDF(content: string, index: number) {
        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 20;
        const maxLineWidth = pageWidth - margin * 2;
        let yPosition = margin;

        // Header
        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        pdf.text(`LACO AI Response ${index + 1}`, margin, yPosition);
        yPosition += 10;

        // Separator line
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;

        // Content
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");

        // Split content into lines and handle page breaks
        const lines = pdf.splitTextToSize(content, maxLineWidth);
        
        lines.forEach((line: string) => {
            // Check if we need a new page
            if (yPosition > pageHeight - margin) {
                pdf.addPage();
                yPosition = margin;
            }
            
            pdf.text(line, margin, yPosition);
            yPosition += 7; // Line height
        });

        pdf.save(`LACO-AI-Response-${index + 1}.pdf`);
    };