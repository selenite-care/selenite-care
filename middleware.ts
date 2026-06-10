import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const token = req.auth

  if (!token) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = token.user?.role

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (pathname.startsWith("/doctor") && role !== "DOCTOR" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (pathname.startsWith("/crm") && role !== "CRM" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  const response = NextResponse.next()
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  )
  response.headers.set("Pragma", "no-cache")
  response.headers.set("Expires", "0")

  return response
})

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/booking/:path*",
    "/payment/:path*",
    "/admin/:path*",
    "/doctor/:path*",
    "/crm/:path*",
  ],
}
