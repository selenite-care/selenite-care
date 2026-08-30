"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  CreditCard,
  LayoutDashboard,
  Map,
  MessageCircle,
  Package,
  ScanFace,
  UserRound,
} from "lucide-react";
import MessagesBadge from "@/components/ui/MessagesBadge";

const dashboardLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/orders", label: "Orders", icon: Package },
  { href: "/dashboard/survey", label: "Skin", icon: ScanFace },
  { href: "/dashboard/journey", label: "Journey", icon: Map },
  { href: "/dashboard/messages", label: "Messages", icon: MessageCircle },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
];

function isActiveLink(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-8 space-y-2">
      {dashboardLinks.map((link) => {
        const isActive = isActiveLink(pathname, link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors"
            style={{
              backgroundColor: isActive
                ? "color-mix(in srgb, var(--gold) 12%, transparent)"
                : "transparent",
              color: isActive ? "var(--gold)" : "var(--sidebar-text)",
            }}
          >
            <span className="transition-colors">
              {link.label}
            </span>
            {link.href === "/dashboard/messages" ? (
              <span className="ml-auto">
                <MessagesBadge />
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t px-1 py-2 md:hidden"
      style={{
        backgroundColor: "var(--sidebar)",
        borderColor: "var(--gold)",
      }}
    >
      {dashboardLinks.map((link) => {
        const isActive = isActiveLink(pathname, link.href);
        const Icon = link.icon;

        return (
          <Link
            key={link.href}
            href={link.href}
            className="relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 py-1 text-[11px] font-medium transition-colors"
            style={{
              backgroundColor: isActive
                ? "color-mix(in srgb, var(--gold) 12%, transparent)"
                : "transparent",
              color: isActive ? "var(--gold)" : "var(--sidebar-text)",
            }}
          >
            <Icon aria-hidden="true" className="h-5 w-5" />
            {link.href === "/dashboard/messages" ? (
              <span className="absolute right-1 top-1">
                <MessagesBadge />
              </span>
            ) : null}
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
