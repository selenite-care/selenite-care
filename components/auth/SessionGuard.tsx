"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const PROTECTED_ROUTE_PREFIXES = [
  "/dashboard",
  "/payment",
  "/appointment",
  "/admin",
  "/doctor",
  "/crm",
] as const;

function isProtectedRoute(pathname: string) {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default function SessionGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();
  const shouldProtectRoute = isProtectedRoute(pathname);

  useEffect(() => {
    if (!shouldProtectRoute || status !== "unauthenticated") {
      return;
    }

    const callbackUrl = `${pathname}${window.location.search}`;

    router.replace(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }, [pathname, router, shouldProtectRoute, status]);

  if (shouldProtectRoute && status === "unauthenticated") {
    return null;
  }

  return children;
}
