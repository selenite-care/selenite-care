"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/appointment", label: "Appointment" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function NavbarContent() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const role = session?.user?.role;

  let dashboardHref = "/dashboard";
  if (role === "ADMIN") dashboardHref = "/admin";
  else if (role === "DOCTOR") dashboardHref = "/doctor";
  else if (role === "CRM") dashboardHref = "/crm";

  function isActiveLink(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <header
      style={{ borderBottom: "1px solid #C6A56B", backgroundColor: "#F8F5F0" }}
      className="px-6 py-4"
    >
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between">
        {/* Logo */}
        <Link
        href="/"
        className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
        <Image
    className="object-contain"
    src="/log.png"
    alt="Selenite Care Logo"
    width={40}
    height={40}
    priority
  />

  <span
    style={{
      fontFamily: "Playfair Display, serif",
    }}
    className="text-3xl font-semibold text-[#2B2B2B]"
  >
    Selenite Care
  </span>
</Link>

        {/* Hamburger Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-10 w-10 flex-col items-center justify-center gap-1 rounded-md border border-[#C6A56B] md:hidden"
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <span
            style={{
              display: "block",
              width: "24px",
              height: "2px",
              backgroundColor: "#2B2B2B",
              transition: "all 0.3s",
              transform: mobileMenuOpen
                ? "rotate(45deg) translate(8px, 8px)"
                : "rotate(0)",
            }}
          />
          <span
            style={{
              display: "block",
              width: "24px",
              height: "2px",
              backgroundColor: "#2B2B2B",
              transition: "all 0.3s",
              opacity: mobileMenuOpen ? 0 : 1,
            }}
          />
          <span
            style={{
              display: "block",
              width: "24px",
              height: "2px",
              backgroundColor: "#2B2B2B",
              transition: "all 0.3s",
              transform: mobileMenuOpen
                ? "rotate(-45deg) translate(7px, -7px)"
                : "rotate(0)",
            }}
          />
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{ color: "#B8A89A" }}
              className="transition-colors duration-200 hover:text-[#C6A56B]"
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/services"
            style={{ color: "#C6A56B", borderColor: "#C6A56B" }}
            className="border px-4 py-2 font-medium rounded transition-all duration-200 hover:bg-[#000000] hover:text-[#F8F5F0]"
          >
            Get Membership
          </Link>

          <span
            style={{ backgroundColor: "#C6A56B" }}
            className="h-4 w-px"
          />

          {status === "loading" ? (
            <div className="flex items-center gap-3">
              <span className="h-8 w-20 rounded bg-neutral-200 animate-pulse" />
              <span className="h-8 w-20 rounded bg-neutral-200 animate-pulse" />
            </div>
          ) : status === "unauthenticated" ? (
            <>
              <Link
                href="/login"
                style={{ color: "#2B2B2B" }}
                className="font-medium transition-colors duration-200 hover:text-[#C6A56B]"
              >
                Login
              </Link>
              <Link
                href="/register"
                style={{ color: "#2B2B2B" }}
                className="font-medium transition-colors duration-200 hover:text-[#C6A56B]"
              >
                Register
              </Link>
            </>
          ) : (
            <>
              <Link
                href={dashboardHref}
                style={{ color: "#2B2B2B" }}
                className="font-medium transition-colors duration-200 hover:text-[#C6A56B]"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                style={{ color: "#2B2B2B" }}
                className="font-medium transition-colors duration-200 hover:text-[#C6A56B]"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <nav
          style={{ backgroundColor: "#2B2B2B" }}
          className="mt-4 flex w-full flex-col gap-1 border-t border-[#C6A56B] px-4 py-4 md:hidden"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{ color: isActiveLink(link.href) ? "#C6A56B" : "#D8C7B5" }}
              className="rounded-md px-3 py-3 text-sm font-medium transition-colors duration-200 hover:bg-[#B8A89A]/20 hover:text-[#C6A56B]"
              onClick={closeMobileMenu}
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/services"
            style={{
              color: isActiveLink("/services") ? "#C6A56B" : "#D8C7B5",
              borderColor: "#C6A56B",
            }}
            className="mt-2 rounded-md border px-3 py-3 text-sm font-medium transition-all duration-200 hover:bg-[#C6A56B] hover:text-[#F8F5F0]"
            onClick={closeMobileMenu}
          >
            Get Membership
          </Link>

          <div
            style={{ borderTop: "1px solid #C6A56B" }}
            className="pt-4"
          >
            {status === "loading" ? (
              <div className="flex flex-col gap-3">
                <span className="h-9 w-24 rounded bg-[#D8C7B5]/30 animate-pulse" />
                <span className="h-9 w-24 rounded bg-[#D8C7B5]/30 animate-pulse" />
              </div>
            ) : status === "unauthenticated" ? (
              <div className="flex flex-col gap-1">
                <Link
                  href="/login"
                  style={{ color: isActiveLink("/login") ? "#C6A56B" : "#D8C7B5" }}
                  className="rounded-md px-3 py-3 text-sm font-medium transition-colors duration-200 hover:bg-[#B8A89A]/20 hover:text-[#C6A56B]"
                  onClick={closeMobileMenu}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  style={{ color: isActiveLink("/register") ? "#C6A56B" : "#D8C7B5" }}
                  className="rounded-md px-3 py-3 text-sm font-medium transition-colors duration-200 hover:bg-[#B8A89A]/20 hover:text-[#C6A56B]"
                  onClick={closeMobileMenu}
                >
                  Register
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <Link
                  href={dashboardHref}
                  style={{ color: isActiveLink(dashboardHref) ? "#C6A56B" : "#D8C7B5" }}
                  className="rounded-md px-3 py-3 text-sm font-medium transition-colors duration-200 hover:bg-[#B8A89A]/20 hover:text-[#C6A56B]"
                  onClick={closeMobileMenu}
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    signOut({ callbackUrl: "/" });
                    closeMobileMenu();
                  }}
                  style={{ color: "#D8C7B5" }}
                  className="rounded-md px-3 py-3 text-left text-sm font-medium transition-colors duration-200 hover:bg-[#B8A89A]/20 hover:text-[#C6A56B]"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

export function Navbar() {
  return <NavbarContent />;
}
