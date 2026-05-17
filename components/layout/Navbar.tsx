"use client";

import Link from "next/link";
import { SessionProvider, signOut, useSession } from "next-auth/react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/booking", label: "Book Appointment" },
];

function NavbarContent() {
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";

  return (
    <header className="border-b border-black/10 bg-background px-6 py-4 dark:border-white/10">
      <nav className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Selenite Care
        </Link>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-foreground/70 transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}

          <span className="hidden h-4 w-px bg-black/10 dark:bg-white/10 sm:block" />

          {isLoggedIn ? (
            <>
              <Link
                href="/dashboard"
                className="font-medium text-foreground transition-colors hover:text-foreground/75"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="font-medium text-foreground/70 transition-colors hover:text-foreground"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="font-medium text-foreground transition-colors hover:text-foreground/75"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="font-medium text-foreground/70 transition-colors hover:text-foreground"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export function Navbar() {
  return (
    <SessionProvider>
      <NavbarContent />
    </SessionProvider>
  );
}
