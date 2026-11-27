import { existsSync } from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

export type ConsultationReportProduct = {
  name: string;
  type: string;
  price: number;
  doctorNote: string;
};

export type ConsultationReportTest = {
  name: string;
  details: string;
};

export type ConsultationReportDoctor = {
  name: string;
  designation: string;
  specialization: string;
  bio: string;
  imageUrl: string | null;
};

export type ConsultationReportData = {
  bookingToken: string;
  clientName: string;
  clientAge: string | null;
  clientSkinType: string | null;
  doctor: ConsultationReportDoctor | null;
  consultationDate: Date | string;
  consultationTime?: string | null;
  problemIdentification: string;
  recommendedTests: ConsultationReportTest[];
  recommendedProducts: ConsultationReportProduct[];
  additionalNotes: string | null;
  followUpDays: number | null;
  followUpDate: Date | string | null;
  version: number | string;
  generatedAt: Date | string;
};

type FlowStyle = "body" | "bold" | "meta" | "muted" | "space";

type FlowLine = {
  text: string;
  style: FlowStyle;
  indent?: number;
  height: number;
  itemKey?: string;
};

type SectionPlan = {
  title: string;
  continued: boolean;
  top: number;
  height: number;
  lines: FlowLine[];
};

type ColumnPlan = {
  sections: SectionPlan[];
  usedHeight: number;
  problemIndex: number;
  testIndex: number;
};

const PAGE_WIDTH = 595.28;
const MARGIN_X = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const CONTENT_BOTTOM = 758;
const FOOTER_Y = 663;
const GOLD = "#C6A56B";
const DARK = "#2B2B2B";
const TAUPE = "#74685F";
const NUDE = "#EADDCD";
const IVORY = "#FCFAF7";
const FONT_NAME = "NotoSansBengali";
const FONT_PATH = path.join(process.cwd(), "public", "fonts", "NotoSansBengali.ttf");
const LOGO_PATH = path.join(process.cwd(), "public", "final_logo.png");
const LEFT_COLUMN_WIDTH = CONTENT_WIDTH * 0.55;
const RIGHT_COLUMN_WIDTH = CONTENT_WIDTH - LEFT_COLUMN_WIDTH;
const TABLE_HEADER_HEIGHT = 27;
const CELL_PADDING = 9;

function parseDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: Date | string) {
  const date = parseDate(value);
  if (!date) return String(value);

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatDateTime(value: Date | string) {
  const date = parseDate(value);
  if (!date) return String(value);

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatConsultationTime(value?: string | null) {
  const time = value?.trim();
  if (!time) return "Time to be confirmed";

  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return time;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return time;

  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}

function formatBdt(value: number) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)} BDT`;
}

function formatSpecialization(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeRoleLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

function truncate(value: string, maxLength: number) {
  const normalized = value.trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
}

function collectPdf(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer | Uint8Array) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

function setBodyFont(doc: PDFKit.PDFDocument, size = 8.7) {
  doc.font(FONT_NAME).fontSize(size).fillColor(DARK);
}

function getFlowMetrics(style: FlowStyle) {
  switch (style) {
    case "bold":
      return { size: 9, height: 13 };
    case "meta":
      return { size: 7.7, height: 11 };
    case "muted":
      return { size: 8.1, height: 11.5 };
    case "space":
      return { size: 1, height: 5 };
    default:
      return { size: 8.6, height: 12.5 };
  }
}

function splitLongWord(doc: PDFKit.PDFDocument, word: string, width: number) {
  const parts: string[] = [];
  let current = "";

  for (const character of Array.from(word)) {
    const candidate = current + character;
    if (current && doc.widthOfString(candidate) > width) {
      parts.push(current);
      current = character;
    } else {
      current = candidate;
    }
  }

  if (current) parts.push(current);
  return parts;
}

function wrapFlowText(
  doc: PDFKit.PDFDocument,
  text: string,
  width: number,
  style: FlowStyle = "body",
  indent = 0,
): FlowLine[] {
  const metrics = getFlowMetrics(style);
  setBodyFont(doc, metrics.size);
  const usableWidth = Math.max(20, width - indent);
  const output: FlowLine[] = [];
  const paragraphs = (text.trim() || "Not provided").replace(/\r/g, "").split("\n");

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      output.push({ text: "", style: "space", indent, height: 6 });
      continue;
    }

    const words = paragraph.trim().split(/\s+/).flatMap((word) =>
      doc.widthOfString(word) > usableWidth
        ? splitLongWord(doc, word, usableWidth)
        : [word],
    );
    let line = "";

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && doc.widthOfString(candidate) > usableWidth) {
        output.push({ text: line, style, indent, height: metrics.height });
        line = word;
      } else {
        line = candidate;
      }
    }

    if (line) output.push({ text: line, style, indent, height: metrics.height });
  }

  return output;
}

function takeFlowLines(lines: FlowLine[], startIndex: number, maxHeight: number) {
  const taken: FlowLine[] = [];
  let height = 0;
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.itemKey) {
      if (height + line.height > maxHeight) break;
      taken.push(line);
      height += line.height;
      index += 1;
      continue;
    }

    const itemLines: FlowLine[] = [];
    let itemHeight = 0;
    let itemIndex = index;
    while (itemIndex < lines.length && lines[itemIndex].itemKey === line.itemKey) {
      itemLines.push(lines[itemIndex]);
      itemHeight += lines[itemIndex].height;
      itemIndex += 1;
    }

    if (height + itemHeight > maxHeight) break;
    taken.push(...itemLines);
    height += itemHeight;
    index = itemIndex;
  }

  return { lines: taken, nextIndex: index, height };
}

function drawFlowLines(
  doc: PDFKit.PDFDocument,
  lines: FlowLine[],
  x: number,
  y: number,
  width: number,
) {
  let cursor = y;

  for (const line of lines) {
    if (line.style === "space") {
      cursor += line.height;
      continue;
    }

    const metrics = getFlowMetrics(line.style);
    const lineX = x + (line.indent ?? 0);
    const lineWidth = width - (line.indent ?? 0);
    setBodyFont(doc, metrics.size);
    doc.fillColor(line.style === "meta" || line.style === "muted" ? TAUPE : DARK);
    doc.text(line.text, lineX, cursor, {
      width: lineWidth,
      height: line.height + 2,
      lineBreak: false,
    });

    if (line.style === "bold") {
      doc.text(line.text, lineX + 0.22, cursor, {
        width: lineWidth,
        height: line.height + 2,
        lineBreak: false,
      });
    }
    cursor += line.height;
  }
}

function addDocumentHeader(
  doc: PDFKit.PDFDocument,
  data: ConsultationReportData,
  continuation = false,
) {
  if (existsSync(LOGO_PATH)) doc.image(LOGO_PATH, MARGIN_X, 40, { fit: [32, 32] });

  doc.font("Times-Bold").fontSize(continuation ? 17 : 21).fillColor(DARK).text(
    "SELENITE CARE",
    MARGIN_X + 42,
    42,
    { width: 260 },
  );
  doc.font("Helvetica").fontSize(8.2).fillColor(TAUPE).text(
    "Professional Skincare Consultation Platform",
    MARGIN_X + 42,
    65,
    { width: 310 },
  );
  doc.moveTo(MARGIN_X, 87).lineTo(PAGE_WIDTH - MARGIN_X, 87).lineWidth(1.4).strokeColor(GOLD).stroke();
  doc.font("Times-Bold").fontSize(continuation ? 15 : 20).fillColor(DARK).text(
    "Consultation Report & Skincare Plan",
    MARGIN_X,
    101,
    { width: CONTENT_WIDTH, align: "center" },
  );
  doc.font("Helvetica").fontSize(8).fillColor(TAUPE).text(
    continuation ? `Booking: ${data.bookingToken} | Continued` : `Booking: ${data.bookingToken}`,
    MARGIN_X,
    continuation ? 124 : 132,
    { width: CONTENT_WIDTH, align: "center" },
  );
  doc.y = continuation ? 149 : 158;
}

function addInfoBox(doc: PDFKit.PDFDocument, data: ConsultationReportData) {
  const boxY = doc.y;
  const columnWidth = (CONTENT_WIDTH - 36) / 2;
  const rows = [
    ["Client name", data.clientName],
    ["Age", data.clientAge?.trim() || "\u2014"],
    ["Skin type", data.clientSkinType?.trim() || "\u2014"],
    ["Consultation date", formatDate(data.consultationDate)],
    ["Consultation time", formatConsultationTime(data.consultationTime)],
  ];
  const renderedRowCount = Math.ceil(rows.length / 2);
  const boxHeight = 17 + renderedRowCount * 25;

  doc.roundedRect(MARGIN_X, boxY, CONTENT_WIDTH, boxHeight, 7).fillAndStroke(IVORY, NUDE);
  rows.forEach(([label, value], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = MARGIN_X + 12 + column * (columnWidth + 12);
    const y = boxY + 13 + row * 25;

    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(TAUPE).text(label.toUpperCase(), x, y, {
      width: columnWidth,
    });
    setBodyFont(doc, 9.2);
    doc.text(value, x, y + 10, { width: columnWidth, ellipsis: true });
  });
  doc.y = boxY + boxHeight + 15;
}

function buildTestLines(doc: PDFKit.PDFDocument, tests: ConsultationReportTest[], width: number) {
  if (tests.length === 0) return wrapFlowText(doc, "No tests advised", width, "muted");

  return tests.flatMap((test, index) => {
    const itemKey = `test-${index}`;
    return [
      ...wrapFlowText(doc, `${index + 1}. ${test.name}`, width, "bold"),
      ...(test.details ? wrapFlowText(doc, test.details, width, "body", 12) : []),
      { text: "", style: "space" as const, height: 5 },
    ].map((line) => ({ ...line, itemKey }));
  });
}

function buildProductLines(
  doc: PDFKit.PDFDocument,
  products: ConsultationReportProduct[],
  width: number,
) {
  if (products.length === 0) {
    return wrapFlowText(doc, "No products were recommended.", width, "muted");
  }

  return products.flatMap((product, index) => {
    const itemKey = `product-${index}`;
    return [
      ...wrapFlowText(doc, `${index + 1}. ${product.name}`, width, "bold"),
      ...wrapFlowText(doc, `${product.type} | ${formatBdt(product.price)}`, width, "meta", 12),
      ...(product.doctorNote
        ? wrapFlowText(doc, product.doctorNote, width, "body", 12)
        : []),
      { text: "", style: "space" as const, height: 6 },
    ].map((line) => ({ ...line, itemKey }));
  });
}

function planLeftColumn(input: {
  problemLines: FlowLine[];
  testLines: FlowLine[];
  problemIndex: number;
  testIndex: number;
  maxHeight: number;
}): ColumnPlan {
  const sections: SectionPlan[] = [];
  let cursor = 0;
  let problemIndex = input.problemIndex;
  let testIndex = input.testIndex;

  const addSection = (title: string, lines: FlowLine[], startIndex: number) => {
    const remaining = input.maxHeight - cursor;
    if (remaining < TABLE_HEADER_HEIGHT + CELL_PADDING * 2 + 10) return startIndex;

    const slice = takeFlowLines(
      lines,
      startIndex,
      remaining - TABLE_HEADER_HEIGHT - CELL_PADDING * 2,
    );
    if (slice.lines.length === 0) return startIndex;

    const sectionHeight = TABLE_HEADER_HEIGHT + CELL_PADDING * 2 + slice.height;
    sections.push({
      title,
      continued: startIndex > 0,
      top: cursor,
      height: sectionHeight,
      lines: slice.lines,
    });
    cursor += sectionHeight;
    return slice.nextIndex;
  };

  if (problemIndex < input.problemLines.length) {
    problemIndex = addSection("Problem Identification", input.problemLines, problemIndex);
  }
  if (problemIndex >= input.problemLines.length && testIndex < input.testLines.length) {
    testIndex = addSection("Tests", input.testLines, testIndex);
  }

  return { sections, usedHeight: cursor, problemIndex, testIndex };
}

function planProductsColumn(lines: FlowLine[], startIndex: number, maxHeight: number) {
  if (startIndex >= lines.length) {
    return { lines: [] as FlowLine[], nextIndex: startIndex, usedHeight: 0 };
  }

  const slice = takeFlowLines(
    lines,
    startIndex,
    maxHeight - TABLE_HEADER_HEIGHT - CELL_PADDING * 2,
  );
  return {
    lines: slice.lines,
    nextIndex: slice.nextIndex,
    usedHeight: TABLE_HEADER_HEIGHT + CELL_PADDING * 2 + slice.height,
  };
}

function drawSectionHeader(
  doc: PDFKit.PDFDocument,
  title: string,
  continued: boolean,
  x: number,
  y: number,
  width: number,
) {
  doc.rect(x, y, width, TABLE_HEADER_HEIGHT).fill(IVORY);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(DARK).text(
    `${title}${continued ? " (continued)" : ""}`,
    x + CELL_PADDING,
    y + 9,
    { width: width - CELL_PADDING * 2, lineBreak: false },
  );
}

function drawMainTablePage(
  doc: PDFKit.PDFDocument,
  input: {
    y: number;
    height: number;
    left: ColumnPlan;
    rightLines: FlowLine[];
    rightContinued: boolean;
  },
) {
  const rightX = MARGIN_X + LEFT_COLUMN_WIDTH;
  doc.rect(MARGIN_X, input.y, CONTENT_WIDTH, input.height).fillAndStroke("#FFFFFF", NUDE);
  doc.moveTo(rightX, input.y).lineTo(rightX, input.y + input.height).lineWidth(0.8).strokeColor(NUDE).stroke();

  input.left.sections.forEach((section, index) => {
    const sectionY = input.y + section.top;
    if (index > 0) {
      doc.moveTo(MARGIN_X, sectionY).lineTo(rightX, sectionY).lineWidth(0.8).strokeColor(NUDE).stroke();
    }
    drawSectionHeader(doc, section.title, section.continued, MARGIN_X, sectionY, LEFT_COLUMN_WIDTH);
    drawFlowLines(
      doc,
      section.lines,
      MARGIN_X + CELL_PADDING,
      sectionY + TABLE_HEADER_HEIGHT + CELL_PADDING,
      LEFT_COLUMN_WIDTH - CELL_PADDING * 2,
    );
  });

  if (input.rightLines.length > 0) {
    drawSectionHeader(
      doc,
      "Recommended Products",
      input.rightContinued,
      rightX,
      input.y,
      RIGHT_COLUMN_WIDTH,
    );
    drawFlowLines(
      doc,
      input.rightLines,
      rightX + CELL_PADDING,
      input.y + TABLE_HEADER_HEIGHT + CELL_PADDING,
      RIGHT_COLUMN_WIDTH - CELL_PADDING * 2,
    );
  }
}

function addContinuationPage(doc: PDFKit.PDFDocument, data: ConsultationReportData) {
  doc.addPage();
  addDocumentHeader(doc, data, true);
}

function addReportTable(doc: PDFKit.PDFDocument, data: ConsultationReportData) {
  const problemLines = wrapFlowText(
    doc,
    data.problemIdentification || "Not provided",
    LEFT_COLUMN_WIDTH - CELL_PADDING * 2,
  );
  const testLines = buildTestLines(
    doc,
    data.recommendedTests,
    LEFT_COLUMN_WIDTH - CELL_PADDING * 2,
  );
  const productLines = buildProductLines(
    doc,
    data.recommendedProducts,
    RIGHT_COLUMN_WIDTH - CELL_PADDING * 2,
  );
  let problemIndex = 0;
  let testIndex = 0;
  let productIndex = 0;

  while (
    problemIndex < problemLines.length ||
    testIndex < testLines.length ||
    productIndex < productLines.length
  ) {
    if (CONTENT_BOTTOM - doc.y < 95) addContinuationPage(doc, data);

    const tableY = doc.y;
    const maxHeight = CONTENT_BOTTOM - tableY;
    const left = planLeftColumn({
      problemLines,
      testLines,
      problemIndex,
      testIndex,
      maxHeight,
    });
    const right = planProductsColumn(productLines, productIndex, maxHeight);
    const allDone =
      left.problemIndex >= problemLines.length &&
      left.testIndex >= testLines.length &&
      right.nextIndex >= productLines.length;
    const usedHeight = Math.max(left.usedHeight, right.usedHeight, 74);
    const tableHeight = allDone ? usedHeight : maxHeight;

    if (
      left.problemIndex === problemIndex &&
      left.testIndex === testIndex &&
      right.nextIndex === productIndex
    ) {
      addContinuationPage(doc, data);
      continue;
    }

    drawMainTablePage(doc, {
      y: tableY,
      height: tableHeight,
      left,
      rightLines: right.lines,
      rightContinued: productIndex > 0,
    });
    problemIndex = left.problemIndex;
    testIndex = left.testIndex;
    productIndex = right.nextIndex;
    doc.y = tableY + tableHeight;

    if (!allDone) addContinuationPage(doc, data);
  }

}

function addAdditionalNotesRow(
  doc: PDFKit.PDFDocument,
  data: ConsultationReportData,
) {
  const notes = data.additionalNotes?.trim();
  if (!notes) return;

  const noteLines = wrapFlowText(
    doc,
    notes,
    CONTENT_WIDTH - CELL_PADDING * 2,
  );
  let noteIndex = 0;

  while (noteIndex < noteLines.length) {
    if (CONTENT_BOTTOM - doc.y < 80) addContinuationPage(doc, data);

    const rowY = doc.y;
    const maxHeight = CONTENT_BOTTOM - rowY;
    const slice = takeFlowLines(
      noteLines,
      noteIndex,
      maxHeight - TABLE_HEADER_HEIGHT - CELL_PADDING * 2,
    );
    if (slice.lines.length === 0) {
      addContinuationPage(doc, data);
      continue;
    }

    const done = slice.nextIndex >= noteLines.length;
    const rowHeight = done ? TABLE_HEADER_HEIGHT + CELL_PADDING * 2 + slice.height : maxHeight;
    doc.rect(MARGIN_X, rowY, CONTENT_WIDTH, rowHeight).fillAndStroke("#FFFFFF", NUDE);
    drawSectionHeader(doc, "Additional Notes", noteIndex > 0, MARGIN_X, rowY, CONTENT_WIDTH);
    drawFlowLines(
      doc,
      slice.lines,
      MARGIN_X + CELL_PADDING,
      rowY + TABLE_HEADER_HEIGHT + CELL_PADDING,
      CONTENT_WIDTH - CELL_PADDING * 2,
    );
    noteIndex = slice.nextIndex;
    doc.y = rowY + rowHeight;
    if (!done) addContinuationPage(doc, data);
  }
}

function addFollowUpBox(doc: PDFKit.PDFDocument, data: ConsultationReportData) {
  if (data.followUpDays === null && data.followUpDate === null) return;
  if (CONTENT_BOTTOM - doc.y < 72) addContinuationPage(doc, data);

  const dateText = data.followUpDate ? ` - on ${formatDate(data.followUpDate)}` : "";
  const daysText = data.followUpDays === null
    ? "Please follow up on the scheduled date"
    : `Please follow up after ${data.followUpDays} day${data.followUpDays === 1 ? "" : "s"}`;
  const y = doc.y + 10;

  doc.roundedRect(MARGIN_X, y, CONTENT_WIDTH, 56, 7).fillAndStroke("#FFF9EC", GOLD);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(DARK).text("Follow-up", MARGIN_X + 13, y + 11, {
    width: CONTENT_WIDTH - 26,
  });
  setBodyFont(doc, 9.2);
  doc.text(`${daysText}${dateText}.`, MARGIN_X + 13, y + 29, {
    width: CONTENT_WIDTH - 26,
    lineGap: 2,
  });
  doc.y = y + 56;
}

async function loadDoctorImage(url: string | null) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    const response = await fetch(parsed, {
      signal: AbortSignal.timeout(5_000),
      cache: "no-store",
    });
    if (!response.ok) return null;

    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > 5 * 1024 * 1024) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer.length <= 5 * 1024 * 1024 ? buffer : null;
  } catch {
    return null;
  }
}

function addFinalFooter(
  doc: PDFKit.PDFDocument,
  data: ConsultationReportData,
  doctorImage: Buffer | null,
) {
  if (doc.y > FOOTER_Y - 14) addContinuationPage(doc, data);

  const originalBottomMargin = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;
  doc.save();

  const doctor = data.doctor;
  const dividerX = MARGIN_X + CONTENT_WIDTH * 0.58;
  const footerTop = FOOTER_Y;
  doc.moveTo(MARGIN_X, footerTop).lineTo(PAGE_WIDTH - MARGIN_X, footerTop).lineWidth(1.2).strokeColor(GOLD).stroke();
  doc.moveTo(dividerX, footerTop + 12).lineTo(dividerX, footerTop + 105).lineWidth(0.6).strokeColor(NUDE).stroke();

  let imageDrawn = false;
  if (doctorImage && doctor) {
    try {
      doc.image(doctorImage, MARGIN_X, footerTop + 15, { fit: [48, 48] });
      imageDrawn = true;
    } catch {
      imageDrawn = false;
    }
  }

  const doctorX = MARGIN_X + (imageDrawn ? 58 : 0);
  const doctorWidth = dividerX - doctorX - 14;
  const doctorName = doctor?.name || "Selenite Care Consultation Team";
  const doctorDesignation = doctor?.designation || "Skincare Consultation";
  setBodyFont(doc, 10);
  doc.fillColor(DARK).text(doctorName, doctorX, footerTop + 15, {
    width: doctorWidth,
    lineBreak: false,
    ellipsis: true,
  });
  doc.text(doctorName, doctorX + 0.22, footerTop + 15, {
    width: doctorWidth,
    lineBreak: false,
    ellipsis: true,
  });
  setBodyFont(doc, 8);
  doc.fillColor(TAUPE).text(doctorDesignation, doctorX, footerTop + 32, {
    width: doctorWidth,
    lineBreak: false,
    ellipsis: true,
  });

  const showSpecialization = doctor?.specialization &&
    normalizeRoleLabel(doctor.specialization) !== normalizeRoleLabel(doctorDesignation);
  if (showSpecialization) {
    setBodyFont(doc, 7.8);
    doc.fillColor(GOLD).text(formatSpecialization(doctor.specialization), doctorX, footerTop + 46, {
      width: doctorWidth,
      lineBreak: false,
      ellipsis: true,
    });
  }
  if (doctor?.bio) {
    setBodyFont(doc, 7.4);
    doc.fillColor(TAUPE).text(truncate(doctor.bio, 200), MARGIN_X, footerTop + 70, {
      width: dividerX - MARGIN_X - 14,
      height: 36,
      lineGap: 1,
      ellipsis: true,
    });
  }

  const brandX = dividerX + 15;
  const brandWidth = PAGE_WIDTH - MARGIN_X - brandX;
  doc.font("Times-Bold").fontSize(13).fillColor(DARK).text("SELENITE CARE", brandX, footerTop + 15, {
    width: brandWidth,
  });
  doc.font("Helvetica").fontSize(7.8).fillColor(TAUPE).text("selenitecare.com", brandX, footerTop + 38, {
    width: brandWidth,
  });
  doc.text("+880 1647-660300", brandX, footerTop + 52, { width: brandWidth });
  doc.text(`Report ID: ${data.bookingToken}`, brandX, footerTop + 73, { width: brandWidth });
  doc.text(`Version: ${data.version}`, brandX, footerTop + 87, { width: brandWidth });
  doc.font("Helvetica").fontSize(6.8).fillColor(TAUPE).text(
    `Generated: ${formatDateTime(data.generatedAt)}`,
    brandX,
    footerTop + 101,
    { width: brandWidth, lineBreak: false },
  );

  doc.moveTo(MARGIN_X, 786).lineTo(PAGE_WIDTH - MARGIN_X, 786).lineWidth(0.6).strokeColor(NUDE).stroke();
  doc.font("Helvetica-Oblique").fontSize(6.7).fillColor(TAUPE).text(
    "This report is for skincare guidance and education and does not replace medical advice.",
    MARGIN_X,
    798,
    { width: CONTENT_WIDTH, align: "center", lineBreak: false },
  );
  doc.restore();
  doc.page.margins.bottom = originalBottomMargin;
}

export async function generateConsultationReportPdf(
  data: ConsultationReportData,
): Promise<Buffer> {
  if (!existsSync(FONT_PATH)) {
    throw new Error(`Consultation report font was not found at ${FONT_PATH}.`);
  }

  const doctorImage = await loadDoctorImage(data.doctor?.imageUrl ?? null);
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 40, right: MARGIN_X, bottom: 38, left: MARGIN_X },
    bufferPages: true,
    info: {
      Title: "Consultation Report & Skincare Plan",
      Author: "Selenite Care",
      Subject: `Consultation report for booking ${data.bookingToken}`,
      CreationDate: parseDate(data.generatedAt) ?? new Date(),
    },
  });

  doc.registerFont(FONT_NAME, FONT_PATH);
  addDocumentHeader(doc, data);
  addInfoBox(doc, data);
  addReportTable(doc, data);
  addAdditionalNotesRow(doc, data);
  addFollowUpBox(doc, data);
  addFinalFooter(doc, data, doctorImage);

  return collectPdf(doc);
}
