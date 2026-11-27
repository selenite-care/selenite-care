import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  generateConsultationReportPdf,
  type ConsultationReportData,
} from "../lib/generatePrescriptionPdf";

const outputDirectory = path.join(process.cwd(), "scripts", "output");
const generatedAt = new Date("2026-11-22T11:15:00+06:00");

const doctor: ConsultationReportData["doctor"] = {
  name: "Dr. Safna Mehreen / ডা. সাফনা মেহরীন",
  designation: "Aesthetic Physician",
  specialization: "AESTHETICIAN",
  bio: "Experienced aesthetic physician focused on practical, sustainable skincare guidance for acne, sensitivity, dehydration, and pigmentation concerns.",
  imageUrl: null,
};

const shortReport: ConsultationReportData = {
  bookingToken: "SC-SHORT-001",
  clientName: "Raisa Islam / রাইসা ইসলাম",
  clientAge: "28",
  clientSkinType: "Combination / কম্বিনেশন",
  doctor,
  consultationDate: new Date("2026-11-22T10:00:00+06:00"),
  consultationTime: "10:30",
  problemIdentification:
    "Mild dehydration and sensitivity with occasional pigmentation. ত্বকে শুষ্কতা, সংবেদনশীলতা ও হালকা পিগমেন্টেশনের লক্ষণ দেখা যাচ্ছে।",
  recommendedTests: [
    {
      name: "Vitamin D",
      details: "Morning sample preferred. সকালে নমুনা দেওয়া ভালো।",
    },
    {
      name: "Complete Blood Count",
      details: "No fasting required.",
    },
  ],
  recommendedProducts: [
    {
      name: "Gentle Hydrating Cleanser / মৃদু ক্লিনজার",
      type: "Cleanser",
      price: 1250,
      doctorNote: "Use morning and night without rubbing the skin.",
    },
    {
      name: "Barrier Support Moisturizer",
      type: "Moisturizer",
      price: 1650,
      doctorNote: "Apply after cleansing on slightly damp skin.",
    },
  ],
  additionalNotes:
    "Introduce new products one at a time and contact the consultation team if irritation develops. / নতুন পণ্য একটি করে ব্যবহার শুরু করুন।",
  followUpDays: 30,
  followUpDate: new Date("2026-12-22T10:00:00+06:00"),
  version: 1,
  generatedAt,
};

const longProducts = Array.from({ length: 30 }, (_, index) => ({
  name: `Recommended Product ${index + 1} / প্রস্তাবিত পণ্য ${index + 1}`,
  type: index % 2 === 0 ? "Serum" : "Moisturizer",
  price: 900 + index * 75,
  doctorNote:
    "Introduce gradually and monitor comfort. অল্প পরিমাণে শুরু করুন এবং জ্বালা, শুষ্কতা বা অস্বস্তি হলে ব্যবহার বন্ধ করে যোগাযোগ করুন।",
}));

const longTests = Array.from({ length: 8 }, (_, index) => ({
  name: `Laboratory Test ${index + 1} / পরীক্ষা ${index + 1}`,
  details:
    "Follow the laboratory preparation instructions carefully. পরীক্ষাগারের প্রস্তুতি নির্দেশনা মেনে চলুন এবং আগের রিপোর্ট সঙ্গে আনুন।",
}));

const longAdditionalNotesParagraph =
  "Monitor the skin carefully and introduce only one new product at a time. Keep a simple record of comfort, dryness, redness, or irritation and share it during follow-up. / ত্বকের পরিবর্তন মনোযোগ দিয়ে লক্ষ্য করুন এবং একবারে একটি করে নতুন পণ্য ব্যবহার করুন। জ্বালা, লালচে ভাব বা অস্বস্তি হলে ব্যবহার বন্ধ করুন।";

const longReport: ConsultationReportData = {
  ...shortReport,
  bookingToken: "SC-LONG-002",
  clientName: "Long Report Test Client / দীর্ঘ রিপোর্ট পরীক্ষার্থী",
  problemIdentification: Array.from(
    { length: 10 },
    () =>
      "The client presents with recurring dehydration, sensitivity, uneven tone, and barrier weakness requiring gradual care. ত্বকে বারবার শুষ্কতা, সংবেদনশীলতা, অসম রঙ ও দুর্বল স্কিন ব্যারিয়ারের লক্ষণ রয়েছে; তাই ধীরে ধীরে যত্ন নেওয়া প্রয়োজন।",
  ).join("\n\n"),
  recommendedTests: longTests,
  recommendedProducts: longProducts,
  additionalNotes: Array.from({ length: 18 }, () => longAdditionalNotesParagraph).join(
    "\n\n",
  ),
  followUpDays: 14,
  followUpDate: new Date("2026-12-06T10:00:00+06:00"),
  version: 4,
};

const noDoctorReport: ConsultationReportData = {
  ...shortReport,
  bookingToken: "SC-NO-DOCTOR-003",
  clientName: "Consultation Team Client",
  clientAge: null,
  clientSkinType: null,
  doctor: null,
  recommendedTests: [],
  recommendedProducts: [],
  additionalNotes: null,
  followUpDays: null,
  followUpDate: null,
  version: 1,
};

async function writeSample(filename: string, data: ConsultationReportData) {
  const pdf = await generateConsultationReportPdf(data);
  const outputPath = path.join(outputDirectory, filename);
  await writeFile(outputPath, pdf);
  console.log(`Sample consultation report created: ${outputPath}`);
}

async function main() {
  await mkdir(outputDirectory, { recursive: true });
  await writeSample("consultation-report-short.pdf", shortReport);
  await writeSample("consultation-report-long.pdf", longReport);
  await writeSample("consultation-report-no-doctor.pdf", noDoctorReport);
}

main().catch((error) => {
  console.error("Unable to generate sample consultation reports:", error);
  process.exitCode = 1;
});
