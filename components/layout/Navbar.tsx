"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import CartIcon from "@/components/cart/CartIcon";
import { useTheme } from "@/components/providers/ThemeProvider";
import Avatar from "@/components/ui/Avatar";
import NotificationBell from "@/components/ui/NotificationBell";

const navLinks = [
  { href: "/", label: "Home" },
  // { href: "/services", label: "Memberships" },
  { href: "/appointment", label: "Appointment" },
  // { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const desktopNavLinkClass =
  "relative inline-flex py-2 transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-[#B87B68] after:transition-all after:duration-200 hover:text-[#B87B68] hover:after:w-full";

function NavbarContent() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
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

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
    } catch {
      // Fall through to NextAuth signOut so logout still proceeds.
    }

    router.refresh();
    await signOut({ redirect: false });
    window.location.replace("/login");
  }

  const ThemeIcon = theme === "dark" ? Sun : Moon;

  function renderThemeToggle(className?: string) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={
          theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
        }
        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        className={className}
        style={{
          background: "none",
          border: "none",
          color: "#B87B68",
          transition: "opacity 0.2s ease",
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.opacity = "0.8";
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.opacity = "1";
        }}
      >
        <ThemeIcon className="h-5 w-5" aria-hidden="true" />
      </button>
    );
  }

  return (
    <header
      className="sticky top-0 z-50 border-b border-[#B87B68] bg-[#F8F5F0]/90 px-6 backdrop-blur-md transition-colors duration-200 dark:bg-[#1A1814]/90"
    >
      <nav className="mx-auto flex h-16 w-full max-w-screen-2xl items-center justify-between">
        {/* Logo */}
        <Link
        href="/"
        className="flex items-center gap-1 transition-opacity hover:opacity-80"
        >
        <Image
    className="object-contain"
    src="/final_logo.png"
    alt="Selenite Care Logo"
    width={40}
    height={40}
    priority
  />

  <span
    style={{
      fontFamily: "Playfair Display, serif",
    }}
    className="text-xl font-semibold tracking-[0.03em] text-[var(--foreground)] sm:text-2xl"
  >
    Selenite Care
  </span>
</Link>

        {/* Hamburger Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-10 w-10 flex-col items-center justify-center gap-1 rounded-md border border-[#B87B68] md:hidden"
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <span
            style={{
              display: "block",
              width: "24px",
              height: "2px",
              backgroundColor: "var(--foreground)",
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
              backgroundColor: "var(--foreground)",
              transition: "all 0.3s",
              opacity: mobileMenuOpen ? 0 : 1,
            }}
          />
          <span
            style={{
              display: "block",
              width: "24px",
              height: "2px",
              backgroundColor: "var(--foreground)",
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
              style={{ color: "var(--muted)" }}
              className={desktopNavLinkClass}
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/products"
            style={{
              color: isActiveLink("/products") ? "var(--gold)" : "var(--muted)",
            }}
            className={`${desktopNavLinkClass} rounded-full px-3 hover:bg-[#B87B68]/10`}
          >
            Products
          </Link>

          <Link
            href="/services"
            style={{ color: "#B87B68", borderColor: "#B87B68" }}
            className="border px-4 py-2 font-medium rounded transition-all duration-200 hover:bg-[#000000] hover:text-[#F8F5F0]"
          >
            Get Membership
          </Link>

          <span
            style={{ backgroundColor: "#B87B68" }}
            className="h-4 w-px"
          />

          <CartIcon className="inline-flex items-center justify-center text-[#B87B68] transition-transform duration-200 hover:scale-110" />

          {renderThemeToggle("inline-flex items-center justify-center")}

          {status === "loading" ? (
            <div className="flex items-center gap-3">
              <span className="h-8 w-20 rounded bg-neutral-200 animate-pulse" />
              <span className="h-8 w-20 rounded bg-neutral-200 animate-pulse" />
            </div>
          ) : status === "unauthenticated" ? (
            <>
              <Link
                href="/login"
                style={{ color: "var(--foreground)" }}
                className={`${desktopNavLinkClass} font-medium`}
              >
                Login
              </Link>
              <Link
                href="/register"
                style={{ color: "var(--foreground)" }}
                className={`${desktopNavLinkClass} font-medium`}
              >
                Register
              </Link>
            </>
          ) : (
            <>
              <NotificationBell />
              <Avatar
                imageUrl={session?.user?.image ?? null}
                name={session?.user?.name ?? null}
                size="sm"
              />
              <Link
                href={dashboardHref}
                style={{ color: "var(--foreground)" }}
                className={`${desktopNavLinkClass} font-medium`}
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                style={{ color: "var(--foreground)" }}
                className={`${desktopNavLinkClass} font-medium`}
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
          className="mobile-menu-slide mt-4 flex w-full flex-col gap-1 border-t border-[#B87B68] px-4 py-4 md:hidden"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{ color: isActiveLink(link.href) ? "#B87B68" : "#EADDCD" }}
              className="rounded-md px-3 py-3 text-sm font-medium transition-colors duration-200 hover:bg-[#884F38]/20 hover:text-[#B87B68]"
              onClick={closeMobileMenu}
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/products"
            style={{ color: isActiveLink("/products") ? "#B87B68" : "#EADDCD" }}
            className="rounded-md px-3 py-3 text-sm font-medium transition-colors duration-200 hover:bg-[#884F38]/20 hover:text-[#B87B68]"
            onClick={closeMobileMenu}
          >
            Products
          </Link>

          <Link
            href="/services"
            style={{
              color: isActiveLink("/services") ? "#B87B68" : "#EADDCD",
              borderColor: "#B87B68",
            }}
            className="mt-2 rounded-md border px-3 py-3 text-sm font-medium transition-all duration-200 hover:bg-[#B87B68] hover:text-[#F8F5F0]"
            onClick={closeMobileMenu}
          >
            Get Membership
          </Link>

          <div
            style={{ borderTop: "1px solid #B87B68" }}
            className="pt-4"
          >
            <div className="mb-3 flex items-center justify-start gap-2">
              <CartIcon
                onClick={closeMobileMenu}
                className="inline-flex items-center gap-2 rounded-md px-3 py-3 text-sm font-medium text-[#EADDCD] transition-transform duration-200 hover:scale-110 hover:bg-[#884F38]/20 hover:text-[#B87B68]"
              />
              {renderThemeToggle(
                "inline-flex items-center gap-2 rounded-md px-3 py-3 text-sm font-medium",
              )}
              {status === "authenticated" ? <NotificationBell /> : null}
            </div>

            {status === "loading" ? (
              <div className="flex flex-col gap-3">
                <span className="h-9 w-24 rounded bg-[#EADDCD]/30 animate-pulse" />
                <span className="h-9 w-24 rounded bg-[#EADDCD]/30 animate-pulse" />
              </div>
            ) : status === "unauthenticated" ? (
              <div className="flex flex-col gap-1">
                <Link
                  href="/login"
                  style={{ color: isActiveLink("/login") ? "#B87B68" : "#EADDCD" }}
                  className="rounded-md px-3 py-3 text-sm font-medium transition-colors duration-200 hover:bg-[#884F38]/20 hover:text-[#B87B68]"
                  onClick={closeMobileMenu}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  style={{ color: isActiveLink("/register") ? "#B87B68" : "#EADDCD" }}
                  className="rounded-md px-3 py-3 text-sm font-medium transition-colors duration-200 hover:bg-[#884F38]/20 hover:text-[#B87B68]"
                  onClick={closeMobileMenu}
                >
                  Register
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3 rounded-md px-3 py-3">
                  <Avatar
                    imageUrl={session?.user?.image ?? null}
                    name={session?.user?.name ?? null}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#F8F5F0]">
                      {session?.user?.name ?? "Selenite Care User"}
                    </p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-[#B87B68]">
                      {session?.user?.role ?? "CLIENT"}
                    </p>
                  </div>
                </div>
                <Link
                  href={dashboardHref}
                  style={{ color: isActiveLink(dashboardHref) ? "#B87B68" : "#EADDCD" }}
                  className="rounded-md px-3 py-3 text-sm font-medium transition-colors duration-200 hover:bg-[#884F38]/20 hover:text-[#B87B68]"
                  onClick={closeMobileMenu}
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    closeMobileMenu();
                    await handleLogout();
                  }}
                  style={{ color: "#EADDCD" }}
                  className="rounded-md px-3 py-3 text-left text-sm font-medium transition-colors duration-200 hover:bg-[#884F38]/20 hover:text-[#B87B68]"
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
