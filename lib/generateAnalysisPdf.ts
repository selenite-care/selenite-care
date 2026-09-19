import { jsPDF } from "jspdf";

type SkinAnalysisPdfData = {
  skinType: string;
  concerns: string[];
  fullAnalysis: string;
  summary: string;
  consultationNote: string;
};

const PAGE_WIDTH = 210;
const MARGIN_X = 18;
const FOOTER_Y = 286;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const GOLD: [number, number, number] = [196, 165, 107];
const DARK: [number, number, number] = [43, 43, 43];
const GRAY: [number, number, number] = [105, 105, 105];
const LIGHT_GRAY: [number, number, number] = [245, 245, 245];
const CONTACT_EMAIL =
  process.env.ADMIN_EMAIL?.trim() || "management@selenitecare.com";

function formatReportDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function addPageFooter(doc: jsPDF) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text("selenitecare.com | +880 1647-660300", PAGE_WIDTH / 2, FOOTER_Y, {
    align: "center",
  });
}

function ensureSpace(doc: jsPDF, y: number, requiredHeight: number) {
  if (y + requiredHeight <= FOOTER_Y - 8) {
    return y;
  }

  addPageFooter(doc);
  doc.addPage();
  return 18;
}

function addSectionHeading(doc: jsPDF, title: string, y: number) {
  const nextY = ensureSpace(doc, y, 12);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...DARK);
  doc.text(title, MARGIN_X, nextY);

  return nextY + 8;
}

function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight = 6,
) {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  let currentY = y;

  for (const line of lines) {
    currentY = ensureSpace(doc, currentY, lineHeight);
    doc.text(line, x, currentY);
    currentY += lineHeight;
  }

  return currentY;
}

function addParagraphs(
  doc: jsPDF,
  text: string,
  y: number,
  maxWidth = CONTENT_WIDTH,
) {
  const paragraphs = text
    .split(/\n{2,}|\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  let currentY = y;

  for (const paragraph of paragraphs.length ? paragraphs : [text]) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...DARK);
    currentY = addWrappedText(doc, paragraph, MARGIN_X, currentY, maxWidth, 5.8);
    currentY += 3;
  }

  return currentY;
}

function addBulletList(
  doc: jsPDF,
  items: string[],
  y: number,
  emptyText = "No specific concerns identified.",
) {
  let currentY = y;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...DARK);

  if (items.length === 0) {
    return addWrappedText(doc, emptyText, MARGIN_X, currentY, CONTENT_WIDTH);
  }

  for (const item of items) {
    currentY = ensureSpace(doc, currentY, 8);
    doc.text("-", MARGIN_X, currentY);
    currentY = addWrappedText(
      doc,
      item,
      MARGIN_X + 5,
      currentY,
      CONTENT_WIDTH - 5,
      5.8,
    );
    currentY += 1;
  }

  return currentY;
}

function addBorderedBox(
  doc: jsPDF,
  title: string,
  body: string,
  y: number,
  options: {
    borderColor?: [number, number, number];
    fillColor?: [number, number, number];
  } = {},
) {
  const padding = 5;
  const titleHeight = 7;
  const lineHeight = 5.4;
  const lines = doc.splitTextToSize(body, CONTENT_WIDTH - padding * 2) as string[];
  const boxHeight = padding * 2 + titleHeight + lines.length * lineHeight + 2;
  const currentY = ensureSpace(doc, y, boxHeight + 4);

  if (options.fillColor) {
    doc.setFillColor(...options.fillColor);
  }
  doc.setDrawColor(...(options.borderColor ?? GOLD));
  doc.setLineWidth(0.45);
  doc.roundedRect(
    MARGIN_X,
    currentY,
    CONTENT_WIDTH,
    boxHeight,
    2,
    2,
    options.fillColor ? "FD" : "S",
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...DARK);
  doc.text(title, MARGIN_X + padding, currentY + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);

  let textY = currentY + padding + titleHeight + 5;
  for (const line of lines) {
    doc.text(line, MARGIN_X + padding, textY);
    textY += lineHeight;
  }

  return currentY + boxHeight + 10;
}

export async function generateSkinAnalysisPdf(
  analysis: SkinAnalysisPdfData,
  clientName: string,
  analysisDate: Date,
  analysisId: string,
): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  const formattedDate = formatReportDate(analysisDate);

  doc.setFont("times", "bold");
  doc.setFontSize(26);
  doc.setTextColor(...GOLD);
  doc.text("SELENITE CARE", PAGE_WIDTH / 2, 22, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...GRAY);
  doc.text(
    "Professional Skincare Consultation Platform",
    PAGE_WIDTH / 2,
    29,
    { align: "center" },
  );

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.35);
  doc.line(MARGIN_X, 36, PAGE_WIDTH - MARGIN_X, 36);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...DARK);
  doc.text("Personal AI Skin Analysis Report", PAGE_WIDTH / 2, 50, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`Analysis ID: ${analysisId}`, PAGE_WIDTH / 2, 57, {
    align: "center",
  });

  doc.setFillColor(...LIGHT_GRAY);
  doc.roundedRect(MARGIN_X, 66, CONTENT_WIDTH, 32, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text(`Prepared for: ${clientName}`, MARGIN_X + 6, 76);
  doc.text(`Date: ${formattedDate}`, MARGIN_X + 6, 85);
  doc.text(`Skin Type Identified: ${analysis.skinType}`, MARGIN_X + 6, 94);

  let y = 114;

  y = addSectionHeading(doc, "Overview", y);
  y = addParagraphs(doc, analysis.summary, y);

  y = addSectionHeading(doc, "Your Identified Skin Concerns", y + 3);
  y = addBulletList(doc, analysis.concerns, y);

  y = addSectionHeading(doc, "Professional Assessment", y + 4);
  y = addParagraphs(doc, analysis.fullAnalysis, y);

  y = addBorderedBox(
    doc,
    "Consultation Note",
    analysis.consultationNote,
    y + 4,
    { borderColor: GOLD },
  );

  y = addBorderedBox(
    doc,
    "Contact Our Experts",
    [
      "Ready for professional guidance? Our certified aestheticians are here to help.",
      "",
      "Website: selenitecare.com",
      "WhatsApp: +880 1647-660300",
      "Facebook: facebook.com/care.selenite",
      `Email: ${CONTACT_EMAIL}`,
    ].join("\n"),
    y,
    { borderColor: GOLD, fillColor: [252, 250, 246] },
  );

  y = ensureSpace(doc, y, 30);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  addWrappedText(
    doc,
    "This AI analysis is for educational and informational purposes only and does not constitute medical advice, diagnosis, or treatment. For professional skin consultation and personalized product recommendations, please book an appointment with our certified aestheticians at selenitecare.com",
    MARGIN_X,
    y,
    CONTENT_WIDTH,
    4.5,
  );

  addPageFooter(doc);

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
