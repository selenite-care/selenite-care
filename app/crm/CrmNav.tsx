"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import MessagesBadge from "@/components/ui/MessagesBadge";

const crmSections = [
  {
    heading: "Operations",
    links: [
      { href: "/crm", label: "Overview" },
      { href: "/crm/leads", label: "Leads" },
      { href: "/crm/clients", label: "All Clients" },
      { href: "/crm/bookings", label: "All Bookings" },
      { href: "/crm/one-time-consultations", label: "One-Time Consultations" },
      { href: "/crm/memberships", label: "Memberships" },
      { href: "/crm/products", label: "Products" },
      { href: "/crm/messages", label: "Messages" },
      { href: "/crm/blog", label: "Blog Posts" },
      { href: "/crm/profile", label: "My Profile" },
    ],
  },
  {
    heading: "AI Tools",
    links: [
      { href: "/crm/skin-analysis", label: "Skin Analysis" },
    ],
  },
] as const;

function isActiveLink(pathname: string, href: string) {
  if (href === "/crm") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

type TodayConsultationCountResponse = {
  todayCount?: number;
  error?: string;
};

function useTodayConsultationCount() {
  const [todayCount, setTodayCount] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTodayCount() {
      try {
        const response = await fetch(
          "/api/crm/one-time-consultations?summaryOnly=true",
          { cache: "no-store" },
        );
        const data = (await response.json().catch(() => null)) as
          | TodayConsultationCountResponse
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load consultation count.");
        }

        if (isMounted) setTodayCount(data?.todayCount ?? 0);
      } catch {
        if (isMounted) setTodayCount(null);
      }
    }

    void loadTodayCount();
    return () => {
      isMounted = false;
    };
  }, []);

  return todayCount;
}

export function CrmSidebarNav() {
  const pathname = usePathname();
  const todayConsultationCount = useTodayConsultationCount();

  return (
    <nav className="mt-8 space-y-6">
      {crmSections.map((section) => (
        <div key={section.heading}>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            {section.heading}
          </p>
          <div className="space-y-2">
            {section.links.map((link) => {
              const isActive = isActiveLink(pathname, link.href);
              const showConsultationBadge =
                link.href === "/crm/one-time-consultations" &&
                todayConsultationCount !== null &&
                todayConsultationCount > 0;

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
                  {showConsultationBadge ? (
                    <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[var(--gold)] px-2 py-0.5 text-[11px] font-semibold text-[var(--sidebar)]">
                      {todayConsultationCount}
                    </span>
                  ) : null}
                  {link.href === "/crm/messages" ? <MessagesBadge /> : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function CrmMobileNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const todayConsultationCount = useTodayConsultationCount();

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

            <nav className="mt-8 space-y-6">
              {crmSections.map((section) => (
                <div key={section.heading}>
                  <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {section.heading}
                  </p>
                  <div className="space-y-2">
                    {section.links.map((link) => {
                      const isActive = isActiveLink(pathname, link.href);
                      const showConsultationBadge =
                        link.href === "/crm/one-time-consultations" &&
                        todayConsultationCount !== null &&
                        todayConsultationCount > 0;

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
                          {showConsultationBadge ? (
                            <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[var(--gold)] px-2 py-0.5 text-[11px] font-semibold text-[var(--sidebar)]">
                              {todayConsultationCount}
                            </span>
                          ) : null}
                          {link.href === "/crm/messages" ? <MessagesBadge /> : null}
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
