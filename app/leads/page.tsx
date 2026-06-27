import type { Metadata } from "next";
import LeadsPageClient from "./LeadsPageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Connect With Selenite Care",
  description:
    "Share your contact details to learn about Selenite Care memberships, skincare services, procedures, and products.",
  openGraph: {
    title: "Connect With Selenite Care",
    description:
      "Interested in skincare consultation, memberships, procedures, or products? Leave your phone or email and our team will contact you.",
    url: "https://selenitecare.com/leads",
    type: "website",
  },
};

export default function LeadsPage() {
  return <LeadsPageClient />;
}
