"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const crmLinks = [
  { href: "/crm", label: "Overview" },
  { href: "/crm/clients", label: "All Clients" },
  { href: "/crm/bookings", label: "All Bookings" },
  { href: "/crm/memberships", label: "Memberships" },
  { href: "/crm/products", label: "Products" },
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
            className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-[color-mix(in_srgb,var(--gold)_12%,transparent)] text-[var(--gold)]"
                : "text-[var(--sidebar-text)]"
            }`}
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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--gold)] text-[var(--sidebar-text)]"
        aria-label="Open CRM navigation"
        aria-expanded={isOpen}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 h-full w-full bg-black/50"
            aria-label="Close CRM navigation"
            onClick={() => setIsOpen(false)}
          />
          <aside
            className="relative z-10 flex h-full w-80 max-w-[85vw] flex-col bg-[var(--sidebar)] px-6 py-6 text-[var(--sidebar-text)] shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase text-[var(--muted)]">
                  CRM Portal
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-[var(--sidebar-text)]">
                  Selenite Care
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--gold)] text-[var(--sidebar-text)]"
                aria-label="Close CRM navigation"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <nav className="mt-8 space-y-2">
              {crmLinks.map((link) => {
                const isActive = isActiveLink(pathname, link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`block rounded-md px-3 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[color-mix(in_srgb,var(--gold)_12%,transparent)] text-[var(--gold)]"
                        : "text-[var(--sidebar-text)]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      ) : null}
    </>
  );
}
