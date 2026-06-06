"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const crmLinks = [
  { href: "/crm", label: "Overview" },
  { href: "/crm/clients", label: "All Clients" },
  { href: "/crm/bookings", label: "All Bookings" },
  { href: "/crm/profile", label: "My Profile" },
];

function isActiveLink(pathname: string, href: string) {
  if (href === "/crm") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CrmSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-8 space-y-2">
      {crmLinks.map((link) => {
        const isActive = isActiveLink(pathname, link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className="block rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-[#B8A89A]"
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

export function CrmMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-3 flex flex-wrap gap-2 text-sm">
      {crmLinks.map((link) => {
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
