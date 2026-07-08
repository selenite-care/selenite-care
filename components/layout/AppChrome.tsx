"use client";

import { usePathname } from "next/navigation";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import FloatingCartButton from "@/components/cart/FloatingCartButton";

const CHROMELESS_ROUTES = ["/landing"];

export default function AppChrome({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isChromelessRoute = CHROMELESS_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isChromelessRoute) {
    return <main className="flex flex-1 flex-col">{children}</main>;
  }

  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
      <FloatingCartButton />
    </>
  );
}
