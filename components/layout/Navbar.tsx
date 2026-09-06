"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { ChevronRight, Headphones, Moon, Sun, UserRound, X } from "lucide-react";
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

type ProductsResponse = {
  types?: string[];
};

const mobileMenuLinks = [
  { href: "/products", label: "Products", hasArrow: true },
  { href: "/appointment", label: "Appointment", hasArrow: false },
  { href: "/services", label: "Membership", hasArrow: false },
  { href: "/about", label: "About", hasArrow: false },
  { href: "/contact", label: "Contact", hasArrow: false },
  { href: "/blog", label: "Blog", hasArrow: false },
];

const socialLinks = [
  { href: "https://www.facebook.com/care.selenite", label: "Facebook", icon: "facebook" },
  { href: "https://www.instagram.com/_selenite_care_/", label: "Instagram", icon: "instagram" },
  { href: "https://wa.me/8801647660300", label: "WhatsApp", icon: "whatsapp" },
];

function SocialIcon({ icon }: { icon: (typeof socialLinks)[number]["icon"] }) {
  if (icon === "facebook") {
    return (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987H7.9v-2.89h2.538V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
      </svg>
    );
  }

  if (icon === "instagram") {
    return (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7.75 2h8.5A5.75 5.75 0 0122 7.75v8.5A5.75 5.75 0 0116.25 22h-8.5A5.75 5.75 0 012 16.25v-8.5A5.75 5.75 0 017.75 2zm0 1.75A4 4 0 003.75 7.75v8.5a4 4 0 004 4h8.5a4 4 0 004-4v-8.5a4 4 0 00-4-4h-8.5zm8.875 1.312a1.063 1.063 0 110 2.126 1.063 1.063 0 010-2.126zM12 7a5 5 0 110 10 5 5 0 010-10zm0 1.75A3.25 3.25 0 1015.25 12 3.254 3.254 0 0012 8.75z" />
      </svg>
    );
  }

  return (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function NavbarContent() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuClosing, setMobileMenuClosing] = useState(false);
  const [mobileMenuActive, setMobileMenuActive] = useState(false);
  const [productCategoriesOpen, setProductCategoriesOpen] = useState(false);
  const [mobileProductCategoriesOpen, setMobileProductCategoriesOpen] =
    useState(false);
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const productCategoriesCloseTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const { theme, toggleTheme } = useTheme();
  const role = session?.user?.role;
  const shouldRenderMobileMenu = mobileMenuOpen || mobileMenuClosing;

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
    if (!shouldRenderMobileMenu) {
      return;
    }

    setMobileMenuActive(false);
    setMobileMenuOpen(false);
    setMobileMenuClosing(true);
    setMobileProductCategoriesOpen(false);
  }

  function openMobileMenu() {
    setMobileMenuActive(false);
    setMobileMenuClosing(false);
    setMobileMenuOpen(true);
  }

  function clearProductCategoriesCloseTimeout() {
    if (!productCategoriesCloseTimeoutRef.current) {
      return;
    }

    clearTimeout(productCategoriesCloseTimeoutRef.current);
    productCategoriesCloseTimeoutRef.current = null;
  }

  function openProductCategories() {
    clearProductCategoriesCloseTimeout();
    setProductCategoriesOpen(true);
  }

  function scheduleProductCategoriesClose() {
    clearProductCategoriesCloseTimeout();
    productCategoriesCloseTimeoutRef.current = setTimeout(() => {
      setProductCategoriesOpen(false);
    }, 180);
  }

  useEffect(() => {
    if (!mobileMenuOpen || mobileMenuClosing) {
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      setMobileMenuActive(true);
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [mobileMenuClosing, mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuClosing) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setMobileMenuClosing(false);
      setMobileMenuActive(false);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [mobileMenuClosing]);

  useEffect(() => {
    if (!shouldRenderMobileMenu) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMobileMenu();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMobileMenu, shouldRenderMobileMenu]);

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

        if (!response.ok || !data?.types || !isMounted) {
          return;
        }

        setProductCategories(data.types);
      } catch {
        if (isMounted) {
          setProductCategories([]);
        }
      }
    }

    void loadProductCategories();

    return () => {
      isMounted = false;
      clearProductCategoriesCloseTimeout();
    };
  }, []);

  const categoryColumnCount = Math.min(
    4,
    Math.max(1, Math.ceil(productCategories.length / 5)),
  );
  const productCategoryColumns = Array.from(
    { length: categoryColumnCount },
    (_, columnIndex) =>
      productCategories.filter((_, index) => index % categoryColumnCount === columnIndex),
  );

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
      onMouseLeave={scheduleProductCategoriesClose}
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
          onClick={() => {
            if (mobileMenuOpen) {
              closeMobileMenu();
              return;
            }

            openMobileMenu();
          }}
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
              transform: mobileMenuActive
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
              opacity: mobileMenuActive ? 0 : 1,
            }}
          />
          <span
            style={{
              display: "block",
              width: "24px",
              height: "2px",
              backgroundColor: "var(--foreground)",
              transition: "all 0.3s",
              transform: mobileMenuActive
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

          <button
            type="button"
            onClick={() => router.push("/products")}
            onFocus={openProductCategories}
            onMouseEnter={openProductCategories}
            style={{
              color: isActiveLink("/products") ? "var(--gold)" : "var(--muted)",
            }}
            className={`${desktopNavLinkClass} items-center gap-1 rounded-full px-3 hover:bg-[#B87B68]/10`}
            aria-expanded={productCategoriesOpen}
            aria-controls="desktop-product-categories"
          >
            Products
            <ChevronRight
              className={`h-4 w-4 transition-transform duration-200 ${
                productCategoriesOpen ? "rotate-90" : ""
              }`}
              aria-hidden="true"
            />
          </button>

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

      <div
        id="desktop-product-categories"
        onMouseEnter={openProductCategories}
        onMouseLeave={scheduleProductCategoriesClose}
        className={`absolute left-0 top-full hidden w-full overflow-hidden border-t bg-[#FCFAF7]/95 shadow-[0_28px_70px_rgba(43,43,43,0.12)] backdrop-blur-md transition-[max-height,opacity,transform,border-color] duration-300 ease-out dark:bg-[#141210]/95 md:block ${
          productCategoriesOpen
            ? "pointer-events-auto max-h-[70vh] translate-y-0 border-[#EADDCD]/80 opacity-100 dark:border-[#3D3530]"
            : "pointer-events-none max-h-0 -translate-y-3 border-transparent opacity-0"
        }`}
      >
        <div
          className={`mx-auto grid max-h-[70vh] w-full max-w-screen-2xl gap-8 overflow-y-auto px-8 py-8 text-sm [scrollbar-color:#B87B68_#F8F5F0] [scrollbar-width:thin] dark:[scrollbar-color:#D4B47A_#242220] lg:grid-cols-[220px_1fr] transition-opacity duration-200 ${
            productCategoriesOpen ? "opacity-100 delay-75" : "opacity-0"
          }`}
        >
          <div>
            <Link
              href="/products"
              onClick={() => setProductCategoriesOpen(false)}
              className="inline-flex h-10 items-center rounded-full border border-[#B87B68] bg-[#B87B68] px-5 text-xs font-semibold uppercase tracking-[0.14em] text-[#F8F5F0] shadow-sm hover:bg-[#884F38]"
            >
              All Products
            </Link>
            {/* <p className="mt-4 max-w-[180px] text-xs leading-6 text-[#8C7967] dark:text-[#8A7D75]">
              Browse Selenite Care products by category.
            </p> */}
          </div>

          {productCategories.length > 0 ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {productCategoryColumns.map((column, columnIndex) => (
                <div key={columnIndex}>
                  <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.24em] text-[#8C7967] dark:text-[#8A7D75]">
                    {columnIndex === 0 ? "By Category" : "Collections"}
                  </p>
                  <div className="grid gap-3">
                    {column.map((category) => (
                      <Link
                        key={category}
                        href={`/products?type=${encodeURIComponent(category)}`}
                        onClick={() => setProductCategoriesOpen(false)}
                        className="text-sm font-medium text-[#344356] transition-colors hover:text-[#B87B68] dark:text-[#F0EDE8] dark:hover:text-[#D4B47A]"
                      >
                        {category}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-[#8C7967] dark:text-[#8A7D75]">
                Categories are loading...
              </span>
          )}
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {shouldRenderMobileMenu ? (
        <div className="fixed inset-0 z-[80] md:hidden" role="presentation">
          <button
            type="button"
            className={`absolute inset-0 bg-[#141210]/55 backdrop-blur-[1px] transition-opacity duration-300 ease-in-out ${
              mobileMenuActive && !mobileMenuClosing ? "opacity-100" : "opacity-0"
            }`}
            aria-label="Close menu overlay"
            onClick={closeMobileMenu}
          />

          <aside
            className={`relative flex h-[100svh] w-[91vw] max-w-[385px] flex-col overflow-hidden border-r border-[#EADDCD] bg-[#FCFAF7] text-[#344356] shadow-2xl transition-transform duration-300 ease-in-out dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8] ${
              mobileMenuActive && !mobileMenuClosing ? "translate-x-0" : "-translate-x-full"
            }`}
            aria-label="Mobile navigation"
          >
            <div className="flex h-14 items-center justify-between border-b border-[#EADDCD] px-4 dark:border-[#3D3530]">
              <button
                type="button"
                onClick={closeMobileMenu}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#EDF0F0] text-[#344356] hover:bg-[#EADDCD] dark:bg-[#242220] dark:text-[#F0EDE8] dark:hover:bg-[#3D3530]"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>

              <div className="flex items-center gap-3">
                <CartIcon
                  onClick={closeMobileMenu}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#344356] hover:scale-110 dark:text-[#F0EDE8]"
                />
                {status === "authenticated" ? <NotificationBell /> : null}
                {renderThemeToggle("inline-flex h-9 w-9 items-center justify-center rounded-full")}
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-2">
              {mobileMenuLinks.map((link) => {
                const isActive = isActiveLink(link.href);

                if (link.href === "/products") {
                  return (
                    <div key={link.href} className="border-b border-[#E3E0DC] dark:border-[#3D3530]">
                      <button
                        type="button"
                        onClick={() =>
                          setMobileProductCategoriesOpen((current) => !current)
                        }
                        className={`flex min-h-[52px] w-full items-center justify-between text-sm font-medium uppercase tracking-[0.04em] transition-colors hover:text-[#B87B68] ${
                          isActive
                            ? "text-[#B87B68] dark:text-[#D4B47A]"
                            : "text-[#344356] dark:text-[#F0EDE8]"
                        }`}
                        aria-expanded={mobileProductCategoriesOpen}
                      >
                        <span>{link.label}</span>
                        <ChevronRight
                          className={`h-4 w-4 transition-transform duration-200 ${
                            mobileProductCategoriesOpen ? "rotate-90" : ""
                          }`}
                          aria-hidden="true"
                        />
                      </button>

                      <div
                        className={`grid gap-2 pr-1 transition-[max-height,opacity,padding-bottom] duration-300 ease-out [scrollbar-color:#B87B68_#F8F5F0] [scrollbar-width:thin] dark:[scrollbar-color:#D4B47A_#242220] ${
                          mobileProductCategoriesOpen
                            ? "max-h-[50svh] overflow-y-auto pb-4 opacity-100"
                            : "max-h-0 overflow-hidden pb-0 opacity-0"
                        }`}
                      >
                          <Link
                            href="/products"
                            onClick={closeMobileMenu}
                            className="rounded-full bg-[#B87B68] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#F8F5F0]"
                          >
                            All Products
                          </Link>
                          {productCategories.length > 0 ? (
                            productCategories.map((category) => (
                              <Link
                                key={category}
                                href={`/products?type=${encodeURIComponent(category)}`}
                                onClick={closeMobileMenu}
                                className="rounded-full border border-[#EADDCD] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#344356] hover:border-[#B87B68] hover:text-[#B87B68] dark:border-[#3D3530] dark:bg-[#242220] dark:text-[#F0EDE8]"
                              >
                                {category}
                              </Link>
                            ))
                          ) : (
                            <span className="px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-[#8C7967] dark:text-[#8A7D75]">
                              Categories are loading...
                            </span>
                          )}
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMobileMenu}
                    className={`flex min-h-[52px] items-center justify-between border-b border-[#E3E0DC] text-sm font-medium uppercase tracking-[0.04em] transition-colors hover:text-[#B87B68] dark:border-[#3D3530] ${
                      isActive
                        ? "text-[#B87B68] dark:text-[#D4B47A]"
                        : "text-[#344356] dark:text-[#F0EDE8]"
                    }`}
                  >
                    <span>{link.label}</span>
                    {link.hasArrow ? (
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-[#E3E0DC] bg-white/75 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4 dark:border-[#3D3530] dark:bg-[#141210]/80">
              {status === "loading" ? (
                <div className="flex items-center gap-3">
                  <span className="h-8 w-8 animate-pulse rounded-full bg-[#EADDCD]" />
                  <span className="h-4 w-20 animate-pulse rounded bg-[#EADDCD]" />
                </div>
              ) : status === "unauthenticated" ? (
                <div className="flex items-center justify-between gap-3">
                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#344356] hover:text-[#B87B68] dark:text-[#F0EDE8]"
                  >
                    <UserRound className="h-4 w-4" aria-hidden="true" />
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    onClick={closeMobileMenu}
                    className="inline-flex h-9 items-center justify-center rounded-full bg-[#2B2B2B] px-4 text-xs font-semibold uppercase tracking-[0.08em] text-[#F8F5F0] hover:bg-[#884F38] dark:bg-[#B87B68] dark:text-[#141210]"
                  >
                    Register
                  </Link>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <Link
                    href={dashboardHref}
                    onClick={closeMobileMenu}
                    className="flex min-w-0 items-center gap-3 text-[#344356] hover:text-[#B87B68] dark:text-[#F0EDE8]"
                  >
                    <Avatar
                      imageUrl={session?.user?.image ?? null}
                      name={session?.user?.name ?? null}
                      size="sm"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {session?.user?.name ?? "Dashboard"}
                      </span>
                      <span className="mt-0.5 block text-xs uppercase tracking-[0.12em] text-[#B87B68]">
                        Dashboard
                      </span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      closeMobileMenu();
                      await handleLogout();
                    }}
                    className="text-xs font-semibold uppercase tracking-[0.12em] text-[#884F38] hover:text-[#B87B68] dark:text-[#8A7D75] dark:hover:text-[#D4B47A]"
                  >
                    Logout
                  </button>
                </div>
              )}

              <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-[#F8F5F0] px-3 py-2 shadow-sm dark:bg-[#242220]">
                <div className="flex items-center gap-3 text-sm font-semibold text-[#344356] dark:text-[#F0EDE8]">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#EADDCD] bg-white text-[#344356] transition-transform hover:scale-110 hover:border-[#B87B68] hover:bg-[#B87B68] hover:text-[#F8F5F0] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8] dark:hover:border-[#D4B47A] dark:hover:bg-[#D4B47A] dark:hover:text-[#141210]"
                      aria-label={social.label}
                    >
                      <SocialIcon icon={social.icon} />
                    </a>
                  ))}
                </div>

                <a
                  href="tel:+8801647660300"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#344356] shadow-[0_8px_24px_rgba(43,43,43,0.14)] hover:scale-105 hover:text-[#B87B68] dark:bg-[#242220] dark:text-[#F0EDE8]"
                  aria-label="Call Selenite Care"
                >
                  <Headphones className="h-5 w-5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </header>
  );
}

export function Navbar() {
  return <NavbarContent />;
}
