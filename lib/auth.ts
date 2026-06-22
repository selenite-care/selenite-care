import type { DefaultSession, NextAuthConfig } from "next-auth";
import { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Role } from "@prisma/client";
import type { NextRequest } from "next/server";
import { getToken } from "@auth/core/jwt";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

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
      rememberMe?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    rememberMe?: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
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
    session: {
      strategy: "jwt",
      maxAge: sessionMaxAge,
    },
    jwt: {
      maxAge: sessionMaxAge,
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
            role: user.role,
            rememberMe,
          };
        },
      }),
    ],
    callbacks: {
      jwt({ token, user }) {
        if (user) {
          token.id = user.id;
          token.role = user.role;
          token.rememberMe = user.rememberMe === true;
        }

        return token;
      },
      session({ session, token }) {
        session.user.id = token.id ?? "";
        session.user.role = token.role ?? "CLIENT";
        session.user.name = token.name ?? null;
        session.user.email = token.email ?? "";
        session.user.rememberMe = token.rememberMe === true;

        return session;
      },
    },
  };
}

export const authConfig = async (request?: NextRequest) => {
  const rememberMe = await resolveRememberMe(request);
  return createAuthConfig(
    rememberMe ? REMEMBER_ME_SESSION_MAX_AGE : DEFAULT_SESSION_MAX_AGE,
  );
};

export default authConfig;
