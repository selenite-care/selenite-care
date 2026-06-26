import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { CartProvider } from "@/components/cart/CartProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SessionProvider } from "next-auth/react"
import AppChrome from "@/components/layout/AppChrome";
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
          <CartProvider>
            <ThemeProvider>
              <AppChrome>{children}</AppChrome>
            </ThemeProvider>
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
