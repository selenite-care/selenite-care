"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function NavbarContent() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const role = session?.user?.role;

  let dashboardHref = "/dashboard";
  if (role === "ADMIN") dashboardHref = "/admin";
  else if (role === "DOCTOR") dashboardHref = "/doctor";
  else if (role === "CRM") dashboardHref = "/crm";

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
    src="/logo1.png"
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
          className="flex flex-col gap-1 sm:hidden"
          aria-label="Toggle menu"
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
        <div className="hidden sm:flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
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
            Book Appointment
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
          style={{ backgroundColor: "#F8F5F0" }}
          className="mt-4 flex flex-col gap-4 border-t border-[#C6A56B] pt-4 sm:hidden"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{ color: "#B8A89A" }}
              className="transition-colors duration-200 hover:text-[#C6A56B]"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/booking"
            style={{ color: "#C6A56B", borderColor: "#C6A56B" }}
            className="border px-4 py-2 font-medium rounded transition-all duration-200 hover:bg-[#C6A56B] hover:text-[#F8F5F0] inline-block w-fit"
            onClick={() => setMobileMenuOpen(false)}
          >
            Book Appointment
          </Link>

          <div
            style={{ borderTop: "1px solid #C6A56B" }}
            className="pt-4"
          >
            {status === "loading" ? (
              <div className="flex flex-col gap-3">
                <span className="h-8 w-20 rounded bg-neutral-200 animate-pulse" />
                <span className="h-8 w-20 rounded bg-neutral-200 animate-pulse" />
              </div>
            ) : status === "unauthenticated" ? (
              <div className="flex flex-col gap-3">
                <Link
                  href="/login"
                  style={{ color: "#2B2B2B" }}
                  className="font-medium transition-colors duration-200 hover:text-[#C6A56B]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  style={{ color: "#2B2B2B" }}
                  className="font-medium transition-colors duration-200 hover:text-[#C6A56B]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Link
                  href={dashboardHref}
                  style={{ color: "#2B2B2B" }}
                  className="font-medium transition-colors duration-200 hover:text-[#C6A56B]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    signOut({ callbackUrl: "/" });
                    setMobileMenuOpen(false);
                  }}
                  style={{ color: "#2B2B2B" }}
                  className="font-medium transition-colors duration-200 hover:text-[#C6A56B] text-left"
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