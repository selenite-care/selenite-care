import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Navbar } from "@/components/layout/Navbar";
import { SessionProvider } from "next-auth/react"
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "Selenite Care",
  description: "Premium skincare consultation services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-brand-ivory text-brand-charcoal">
        <SessionProvider>
          <AnnouncementBar />
          <Navbar />
          <main className="flex flex-1 flex-col">{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}