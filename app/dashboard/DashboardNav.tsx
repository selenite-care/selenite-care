"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const dashboardLinks = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/bookings", label: "My Bookings" },
  { href: "/dashboard/payments", label: "Payment History" },
  { href: "/dashboard/profile", label: "My Profile" },
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
              backgroundColor: isActive ? "rgba(198, 165, 107, 0.12)" : "transparent",
              color: isActive ? "#C6A56B" : "#D8C7B5",
            }}
          >
            <span className="transition-colors hover:text-[#B8A89A]">
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
    <nav className="mt-3 flex flex-wrap gap-2 text-sm">
      {dashboardLinks.map((link) => {
        const isActive = isActiveLink(pathname, link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-md px-3 py-2 font-medium transition-colors hover:text-[#B8A89A]"
            style={{
              backgroundColor: isActive ? "rgba(198, 165, 107, 0.12)" : "transparent",
              color: isActive ? "#C6A56B" : "#D8C7B5",
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
