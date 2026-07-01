import type { DefaultSession, NextAuthConfig } from "next-auth";
import { CredentialsSignin } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { Role } from "@prisma/client";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { getToken } from "@auth/core/jwt";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { appendToSheet } from "@/lib/googleSheets";

class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}

class AccountInactiveError extends CredentialsSignin {
  code = "account_inactive";
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      phone?: string | null;
      image?: string | null;
      needsProfileCompletion?: boolean;
      rememberMe?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
    phone?: string | null;
    image?: string | null;
    rememberMe?: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    phone?: string | null;
    image?: string | null;
    needsProfileCompletion?: boolean;
    rememberMe?: boolean;
  }
}

const DEFAULT_SESSION_MAX_AGE = 60 * 30;
const REMEMBER_ME_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function isRememberMeValue(value: unknown) {
  return (
    value === "true" ||
    value === "1" ||
    value === "on" ||
    value === true
  );
}

async function getGoogleOAuthIntent() {
  try {
    const cookieStore = await cookies();
    const intent = cookieStore.get("selenite_google_oauth_intent")?.value;

    return intent === "register" ? "register" : "login";
  } catch {
    return "login";
  }
}

async function getGoogleOAuthSource() {
  try {
    const cookieStore = await cookies();
    const source = cookieStore.get("selenite_google_oauth_source")?.value;

    return source === "landing" ? "landing" : "website";
  } catch {
    return "website";
  }
}

async function resolveRememberMe(request?: NextRequest) {
  if (!request) {
    return false;
  }

  const isCredentialsCallback =
    request.method === "POST" &&
    request.nextUrl.pathname.includes("/callback/credentials");

  if (isCredentialsCallback) {
    const formData = await request.clone().formData();
    return isRememberMeValue(formData.get("rememberMe"));
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: request.nextUrl.protocol === "https:",
  });

  return token?.rememberMe === true;
}

function createAuthConfig(sessionMaxAge: number): NextAuthConfig {
  return {
    adapter: PrismaAdapter(db),
    session: {
      strategy: "jwt",
      maxAge: sessionMaxAge,
    },
    jwt: {
      maxAge: sessionMaxAge,
    },
    pages: {
      signIn: "/login",
      error: "/login",
    },
    providers: [
      Credentials({
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
          rememberMe: { label: "Remember Me", type: "text" },
        },
        async authorize(credentials) {
          const email =
            typeof credentials?.email === "string"
              ? credentials.email.trim().toLowerCase()
              : "";
          const password =
            typeof credentials?.password === "string"
              ? credentials.password
              : "";
          const rememberMe = isRememberMeValue(credentials?.rememberMe);

          if (!email || !password) {
            return null;
          }

          const user = await db.user.findUnique({
            where: { email },
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              image: true,
              password: true,
              emailVerified: true,
              isActive: true,
              role: true,
            },
          });

          if (!user?.password) {
            return null;
          }

          if (!user.emailVerified) {
            throw new EmailNotVerifiedError();
          }

          const isValidPassword = await bcrypt.compare(password, user.password);

          if (!isValidPassword) {
            return null;
          }

          if (!user.isActive) {
            throw new AccountInactiveError();
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            image: user.image,
            role: user.role,
            rememberMe,
          };
        },
      }),
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        allowDangerousEmailAccountLinking: true,
      }),
    ],
    callbacks: {
      async signIn({ user, account }) {
        if (account?.provider === "google") {
          const googleOAuthIntent = await getGoogleOAuthIntent();
          const googleOAuthSource = await getGoogleOAuthSource();
          const email =
            typeof user.email === "string" ? user.email.toLowerCase() : "";

          if (!email) {
            return "/login?error=GoogleProfileNotFound";
          }

          const existingUser = await db.user.findUnique({
            where: { email },
            select: {
              id: true,
              isActive: true,
            },
          });

          if (!existingUser && googleOAuthIntent !== "register") {
            return "/login?error=GoogleProfileNotFound";
          }

          if (existingUser && !existingUser.isActive) {
            return "/login?error=AccountInactive";
          }

          const existingGoogleAccount = await db.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
            select: { id: true },
          });

          if (!existingGoogleAccount) {
            try {
              await appendToSheet({
                name: user.name ?? "Google User",
                email,
                phone: "Not provided yet",
                dateOfBirth: null,
                source:
                  googleOAuthSource === "landing"
                    ? "Landing Page Google Sign-In"
                    : "Google Sign-In",
              });
            } catch (error) {
              console.error("Google sign-in sheet sync failed:", error);
            }
          }
        }

        return true;
      },
      async jwt({ token, user, account, trigger, session }) {
        if (trigger === "update" && session?.user) {
          const updatedUser = session.user as {
            phone?: unknown;
            image?: unknown;
            needsProfileCompletion?: unknown;
          };

          if ("phone" in updatedUser) {
            const phone =
              typeof updatedUser.phone === "string" ? updatedUser.phone : null;

            token.phone = phone;
            token.needsProfileCompletion = !phone?.trim();
          }

          if ("image" in updatedUser) {
            token.image =
              typeof updatedUser.image === "string" ? updatedUser.image : null;
          }

          if (typeof updatedUser.needsProfileCompletion === "boolean") {
            token.needsProfileCompletion = updatedUser.needsProfileCompletion;
          }
        }

        if (user) {
          token.id = user.id;
          token.phone = user.phone ?? null;
          token.image = user.image ?? token.picture ?? null;
          token.rememberMe = user.rememberMe === true;

          if (user.role) {
            token.role = user.role;
          } else if (user.id) {
            const dbUser = await db.user.findUnique({
              where: { id: user.id },
              select: {
                role: true,
                phone: true,
                image: true,
              },
            });

            token.role = dbUser?.role ?? "CLIENT";
            token.phone = dbUser?.phone ?? null;
            token.image = dbUser?.image ?? token.picture ?? null;
          } else {
            token.role = "CLIENT";
          }

          token.needsProfileCompletion =
            account?.provider === "google" && !token.phone?.trim();
        }

        if (token.id && !token.image) {
          const dbUser = await db.user.findUnique({
            where: { id: token.id },
            select: {
              image: true,
            },
          });

          token.image = dbUser?.image ?? token.picture ?? null;
        }

        return token;
      },
      session({ session, token }) {
        session.user.id = token.id ?? "";
        session.user.role = token.role ?? "CLIENT";
        session.user.name = token.name ?? null;
        session.user.email = token.email ?? "";
        session.user.phone = token.phone ?? null;
        session.user.image = token.image ?? null;
        session.user.needsProfileCompletion =
          token.needsProfileCompletion === true;
        session.user.rememberMe = token.rememberMe === true;

        return session;
      },
    },
  };
}

export const authConfig = createAuthConfig(DEFAULT_SESSION_MAX_AGE);

export async function getAuthConfig(request?: NextRequest) {
  const rememberMe = await resolveRememberMe(request);
  return createAuthConfig(
    rememberMe ? REMEMBER_ME_SESSION_MAX_AGE : DEFAULT_SESSION_MAX_AGE,
  );
}

export default authConfig;
