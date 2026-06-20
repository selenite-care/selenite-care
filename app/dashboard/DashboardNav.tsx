"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, CreditCard, LayoutDashboard, ScanFace, UserRound } from "lucide-react";

const dashboardLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/survey", label: "My Skin Profile", icon: ScanFace },
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
            className="block rounded-md px-3 py-2 text-sm font-medium transition-colors"
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
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t px-2 py-2 md:hidden"
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
            className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors"
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
