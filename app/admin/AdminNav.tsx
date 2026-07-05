"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

const adminSections = [
  {
    heading: "Operations",
    links: [
      { href: "/admin", label: "Dashboard Overview" },
      { href: "/admin/bookings", label: "All Bookings" },
      { href: "/admin/memberships", label: "Memberships" },
      { href: "/admin/memberships/manual", label: "Add Manual Membership" },
      { href: "/admin/memberships/pending", label: "Pending Verifications" },
      { href: "/admin/users", label: "All Users" },
      { href: "/admin/products", label: "Products" },
      { href: "/admin/orders", label: "Orders" },
      // { href: "/admin/services", label: "Services Management" },
      { href: "/admin/doctors", label: "Manage Doctors" },
      { href: "/admin/payments", label: "Membership Payments" },
    ],
  },
  {
    heading: "Marketing",
    links: [
      { href: "/admin/leads", label: "Leads" },
      { href: "/admin/blog", label: "Blog Posts" },
    ],
  },
] as const;

function isActiveLink(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href || pathname === "/admin/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

type PendingMembershipCountResponse = {
  memberships?: Array<{ id: string }>;
  error?: string;
};

function usePendingVerificationCount() {
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPendingCount() {
      try {
        const response = await fetch("/api/admin/memberships/pending", {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as
          | PendingMembershipCountResponse
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load pending count.");
        }

        if (!isMounted) {
          return;
        }

        setPendingCount(data?.memberships?.length ?? 0);
      } catch {
        if (!isMounted) {
          return;
        }

        setPendingCount(null);
      }
    }

    void loadPendingCount();

    return () => {
      isMounted = false;
    };
  }, []);

  return pendingCount;
}

export function AdminSidebarNav() {
  const pathname = usePathname();
  const pendingCount = usePendingVerificationCount();

  return (
    <nav className="mt-8 space-y-6">
      {adminSections.map((section) => (
        <div key={section.heading}>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            {section.heading}
          </p>
          <div className="space-y-2">
            {section.links.map((link) => {
              const isActive = isActiveLink(pathname, link.href);
              const showPendingBadge =
                link.href === "/admin/memberships/pending" &&
                pendingCount !== null &&
                pendingCount > 0;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[color-mix(in_srgb,var(--gold)_12%,transparent)] text-[var(--gold)]"
                      : "text-[var(--sidebar-text)]"
                  }`}
                >
                  <span>{link.label}</span>
                  {showPendingBadge ? (
                    <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[var(--gold)] px-2 py-0.5 text-[11px] font-semibold text-[var(--sidebar)]">
                      {pendingCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AdminMobileNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const pendingCount = usePendingVerificationCount();

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--gold)] text-[var(--sidebar-text)]"
        aria-label="Open admin navigation"
        aria-expanded={isOpen}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 h-full w-full bg-black/50"
            aria-label="Close admin navigation"
            onClick={() => setIsOpen(false)}
          />
          <aside
            className="relative z-10 flex h-full w-80 max-w-[85vw] flex-col bg-[var(--sidebar)] px-6 py-6 text-[var(--sidebar-text)] shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase text-[var(--muted)]">
                  Admin
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-[var(--sidebar-text)]">
                  Selenite Care
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--gold)] text-[var(--sidebar-text)]"
                aria-label="Close admin navigation"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <nav className="mt-8 space-y-6">
              {adminSections.map((section) => (
                <div key={section.heading}>
                  <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {section.heading}
                  </p>
                  <div className="space-y-2">
                    {section.links.map((link) => {
                      const isActive = isActiveLink(pathname, link.href);
                      const showPendingBadge =
                        link.href === "/admin/memberships/pending" &&
                        pendingCount !== null &&
                        pendingCount > 0;

                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center justify-between rounded-md px-3 py-3 text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-[color-mix(in_srgb,var(--gold)_12%,transparent)] text-[var(--gold)]"
                              : "text-[var(--sidebar-text)]"
                          }`}
                        >
                          <span>{link.label}</span>
                          {showPendingBadge ? (
                            <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[var(--gold)] px-2 py-0.5 text-[11px] font-semibold text-[var(--sidebar)]">
                              {pendingCount}
                            </span>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>
        </div>
      ) : null}
    </>
  );
}
