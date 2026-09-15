"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeDollarSign,
  ChartNoAxesCombined,
  LayoutDashboard,
  UserRound,
} from "lucide-react";

const influencerLinks = [
  { href: "/influencer", label: "Overview", icon: LayoutDashboard },
  {
    href: "/influencer/referrals",
    label: "My Referrals",
    icon: ChartNoAxesCombined,
  },
  { href: "/influencer/earnings", label: "Earnings", icon: BadgeDollarSign },
  { href: "/influencer/profile", label: "Profile", icon: UserRound },
];

function isActiveLink(pathname: string, href: string) {
  if (href === "/influencer") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function InfluencerSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-8 space-y-2">
      {influencerLinks.map((link) => {
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
            <span className="transition-colors">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function InfluencerMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t px-1 py-2 md:hidden"
      style={{
        backgroundColor: "var(--sidebar)",
        borderColor: "var(--gold)",
      }}
    >
      {influencerLinks.map((link) => {
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
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
