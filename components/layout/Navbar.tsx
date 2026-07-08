"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Moon, Sun } from "lucide-react";
import CartIcon from "@/components/cart/CartIcon";
import { useTheme } from "@/components/providers/ThemeProvider";
import Avatar from "@/components/ui/Avatar";
import NotificationBell from "@/components/ui/NotificationBell";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Memberships" },
  { href: "/appointment", label: "Appointment" },
  // { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

type ProductsResponse = {
  types?: string[];
};

function NavbarContent() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsMenuOpen, setProductsMenuOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const { theme, toggleTheme } = useTheme();
  const productsMenuRef = useRef<HTMLDivElement | null>(null);
  const closeProductsMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
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
    setMobileProductsOpen(false);
  }

  function clearProductsMenuCloseTimeout() {
    if (!closeProductsMenuTimeoutRef.current) {
      return;
    }

    clearTimeout(closeProductsMenuTimeoutRef.current);
    closeProductsMenuTimeoutRef.current = null;
  }

  function openProductsMenu() {
    clearProductsMenuCloseTimeout();
    setProductsMenuOpen(true);
  }

  function scheduleProductsMenuClose() {
    clearProductsMenuCloseTimeout();
    closeProductsMenuTimeoutRef.current = setTimeout(() => {
      setProductsMenuOpen(false);
    }, 180);
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

  useEffect(() => {
    let isMounted = true;

    async function loadProductCategories() {
      try {
        const response = await fetch("/api/products", {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as
          | ProductsResponse
          | null;

        if (!response.ok || !data?.types) {
          return;
        }

        if (!isMounted) {
          return;
        }

        setProductCategories(data.types);
      } catch {
        if (!isMounted) {
          return;
        }

        setProductCategories([]);
      }
    }

    void loadProductCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!productsMenuRef.current) {
        return;
      }

      if (!productsMenuRef.current.contains(event.target as Node)) {
        setProductsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      clearProductsMenuCloseTimeout();
    };
  }, []);

  const productsMenuActive = useMemo(
    () => pathname === "/products" || pathname.startsWith("/products/"),
    [pathname],
  );

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
      style={{ borderBottom: "1px solid #B87B68", backgroundColor: "#F8F5F0" }}
      className="px-6 py-4"
    >
      <nav className="mx-auto flex w-full max-w-screen-2xl items-center justify-between">
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
    className="text-3xl font-semibold text-[#2B2B2B]"
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
              style={{ color: "#884F38" }}
              className="transition-colors duration-200 hover:text-[#B87B68]"
            >
              {link.label}
            </Link>
          ))}

          <div
            ref={productsMenuRef}
            className="relative"
            onMouseEnter={openProductsMenu}
            onMouseLeave={scheduleProductsMenuClose}
          >
            <button
              type="button"
              onClick={() => {
                clearProductsMenuCloseTimeout();
                setProductsMenuOpen((current) => !current);
              }}
              style={{ color: productsMenuActive ? "#B87B68" : "#884F38" }}
              className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm transition-colors duration-200 hover:bg-[#B87B68]/10 hover:text-[#B87B68]"
              aria-expanded={productsMenuOpen}
              aria-haspopup="menu"
            >
              Products
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  productsMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {productsMenuOpen ? (
              <div className="absolute left-0 top-full z-50 mt-3 w-[300px] overflow-hidden rounded-2xl border border-[#EADDCD] bg-[#F8F5F0] shadow-[0_22px_50px_rgba(43,43,43,0.14)] dark:border-[#3D3530] dark:bg-[#242220]">
                <div className="border-b border-[#EADDCD] bg-[#FCFAF7] px-4 py-4 dark:border-[#3D3530] dark:bg-[#1E1C1A]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B87B68]">
                    Skincare Shop
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                    Browse products by category
                  </p>
                </div>

                <div className="max-h-[320px] overflow-y-auto p-2">
                  <Link
                    href="/products"
                    className="mb-1 block rounded-xl border border-transparent px-3 py-3 text-sm font-semibold text-[#2B2B2B] transition-colors hover:border-[#EADDCD] hover:bg-[#B87B68]/10 hover:text-[#B87B68] dark:text-[#F0EDE8] dark:hover:border-[#3D3530] dark:hover:bg-[#B87B68]/15"
                    onClick={() => setProductsMenuOpen(false)}
                  >
                    All Products
                    <span className="mt-1 block text-xs font-normal text-[#8C7967] dark:text-[#8A7D75]">
                      View the full Selenite Care collection
                    </span>
                  </Link>

                  {productCategories.length > 0 ? (
                    <div className="space-y-1">
                      {productCategories.map((category) => (
                        <Link
                          key={category}
                          href={`/products?type=${encodeURIComponent(category)}`}
                          className="block rounded-xl border border-transparent px-3 py-3 text-sm text-[#2B2B2B] transition-colors hover:border-[#EADDCD] hover:bg-[#B87B68]/10 hover:text-[#B87B68] dark:text-[#F0EDE8] dark:hover:border-[#3D3530] dark:hover:bg-[#B87B68]/15"
                          onClick={() => setProductsMenuOpen(false)}
                        >
                          {category}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="px-3 py-3 text-sm text-[#8C7967] dark:text-[#8A7D75]">
                      Categories are loading...
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>

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

          <CartIcon className="inline-flex items-center justify-center text-[#B87B68] transition-opacity duration-200 hover:opacity-80" />

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
                style={{ color: "#2B2B2B" }}
                className="font-medium transition-colors duration-200 hover:text-[#B87B68]"
              >
                Login
              </Link>
              <Link
                href="/register"
                style={{ color: "#2B2B2B" }}
                className="font-medium transition-colors duration-200 hover:text-[#B87B68]"
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
                style={{ color: "#2B2B2B" }}
                className="font-medium transition-colors duration-200 hover:text-[#B87B68]"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                style={{ color: "#2B2B2B" }}
                className="font-medium transition-colors duration-200 hover:text-[#B87B68]"
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
          className="mt-4 flex w-full flex-col gap-1 border-t border-[#B87B68] px-4 py-4 md:hidden"
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

          <div className="rounded-md">
            <button
              type="button"
              onClick={() => setMobileProductsOpen((current) => !current)}
              className="flex w-full items-center justify-between rounded-xl border border-[#EADDCD]/25 bg-[#F8F5F0]/5 px-4 py-3 text-sm font-medium text-[#EADDCD] transition-colors duration-200 hover:bg-[#884F38]/20 hover:text-[#B87B68] dark:border-[#3D3530] dark:bg-white/5"
              aria-expanded={mobileProductsOpen}
            >
              <span className="text-left">
                <span className="block">Products</span>
                <span className="mt-1 block text-xs font-normal text-[#884F38]">
                  Browse by category
                </span>
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  mobileProductsOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {mobileProductsOpen ? (
              <div className="mt-2 rounded-xl border border-[#EADDCD]/30 bg-[#F8F5F0]/5 p-2 dark:border-[#3D3530] dark:bg-white/5">
                <Link
                  href="/products"
                  className="mb-1 block rounded-lg bg-[#B87B68]/10 px-3 py-3 text-sm font-semibold text-[#F8F5F0] transition-colors duration-200 hover:bg-[#B87B68]/20 hover:text-[#B87B68]"
                  onClick={closeMobileMenu}
                >
                  All Products
                </Link>
                <div className="max-h-60 space-y-1 overflow-y-auto pr-1">
                  {productCategories.length > 0 ? (
                    productCategories.map((category) => (
                      <Link
                        key={category}
                        href={`/products?type=${encodeURIComponent(category)}`}
                        className="block rounded-lg px-3 py-3 text-sm text-[#EADDCD] transition-colors duration-200 hover:bg-[#884F38]/20 hover:text-[#B87B68]"
                        onClick={closeMobileMenu}
                      >
                        {category}
                      </Link>
                    ))
                  ) : (
                    <p className="px-3 py-3 text-sm text-[#884F38]">
                      Categories are loading...
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>

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
                className="inline-flex items-center gap-2 rounded-md px-3 py-3 text-sm font-medium text-[#EADDCD] transition-colors duration-200 hover:bg-[#884F38]/20 hover:text-[#B87B68]"
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
