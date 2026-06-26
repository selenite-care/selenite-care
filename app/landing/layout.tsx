import type { Metadata } from "next";

const ogDescription =
  "Professional skincare consultation by certified aestheticians. Personalized routines, expert guidance, ongoing support.";

export const metadata: Metadata = {
  title: "Selenite Care - Professional Skincare Consultation",
  description: ogDescription,
  openGraph: {
    title: "Transform Your Skin - Selenite Care",
    description: ogDescription,
    url: "https://selenitecare.com/landing",
    type: "website",
  },
};

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
