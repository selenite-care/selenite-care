import { hkdf } from "@panva/hkdf"
import { base64url, calculateJwkThumbprint, jwtDecrypt, type JWTPayload } from "jose"
import { NextResponse, type NextRequest } from "next/server"

type SessionRole = "ADMIN" | "DOCTOR" | "CRM" | "CLIENT"

const SESSION_COOKIE_NAMES = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
] as const

const AUTH_PAGES = ["/login", "/register"] as const
const DEFAULT_REDIRECT_BY_ROLE: Record<SessionRole, string> = {
  ADMIN: "/admin",
  DOCTOR: "/doctor",
  CRM: "/crm",
  CLIENT: "/dashboard",
}

const AUTH_SECRET = process.env.AUTH_SECRET
const AUTH_ENCRYPTION_ALG = "dir"
const AUTH_CONTENT_ENCRYPTION_ALG = "A256CBC-HS512"

type SessionPayload = JWTPayload & {
  role?: SessionRole
}

async function getDerivedEncryptionKey(secret: string, salt: string) {
  return hkdf(
    "sha256",
    secret,
    salt,
    `Auth.js Generated Encryption Key (${salt})`,
    64,
  )
}

async function decodeSessionToken(
  token: string,
  salt: string,
  secret: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtDecrypt(
      token,
      async ({ kid, enc }) => {
        if (enc !== AUTH_CONTENT_ENCRYPTION_ALG && enc !== "A256GCM") {
          throw new Error("Unsupported JWT content encryption algorithm")
        }

        const encryptionSecret = await getDerivedEncryptionKey(secret, salt)

        if (!kid) {
          return encryptionSecret
        }

        const thumbprint = await calculateJwkThumbprint(
          {
            kty: "oct",
            k: base64url.encode(encryptionSecret),
          },
          "sha512",
        )

        if (kid === thumbprint) {
          return encryptionSecret
        }

        throw new Error("No matching decryption secret")
      },
      {
        clockTolerance: 15,
        keyManagementAlgorithms: [AUTH_ENCRYPTION_ALG],
        contentEncryptionAlgorithms: [AUTH_CONTENT_ENCRYPTION_ALG, "A256GCM"],
      },
    )

    return payload as SessionPayload
  } catch {
    return null
  }
}

async function getSessionFromRequest(request: NextRequest) {
  if (!AUTH_SECRET) {
    return null
  }

  for (const cookieName of SESSION_COOKIE_NAMES) {
    const token = request.cookies.get(cookieName)?.value

    if (!token) {
      continue
    }

    const payload = await decodeSessionToken(token, cookieName, AUTH_SECRET)

    if (payload) {
      return payload
    }
  }

  return null
}

function getRedirectForRole(role?: string) {
  if (role === "ADMIN" || role === "DOCTOR" || role === "CRM") {
    return DEFAULT_REDIRECT_BY_ROLE[role]
  }

  return DEFAULT_REDIRECT_BY_ROLE.CLIENT
}

function applyNoCacheHeaders(response: NextResponse) {
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  )
  response.headers.set("Pragma", "no-cache")
  response.headers.set("Expires", "0")
  return response
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await getSessionFromRequest(request)
  const role = session?.role
  const isAuthenticated = Boolean(session)

  if (AUTH_PAGES.includes(pathname as (typeof AUTH_PAGES)[number])) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(getRedirectForRole(role), request.url))
    }

    return applyNoCacheHeaders(NextResponse.next())
  }

  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (pathname.startsWith("/doctor") && role !== "DOCTOR" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (pathname.startsWith("/crm") && role !== "CRM" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return applyNoCacheHeaders(NextResponse.next())
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/dashboard/:path*",
    "/booking/:path*",
    "/payment/:path*",
    "/admin/:path*",
    "/doctor/:path*",
    "/crm/:path*",
  ],
}
