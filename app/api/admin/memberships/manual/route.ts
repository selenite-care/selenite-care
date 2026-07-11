import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { calculateExpiresAt } from "@/lib/membershipDiscounts";
import { sanitizeEmail, sanitizeName, sanitizePhone, sanitizeText } from "@/lib/sanitize";
import type { MembershipStatus, MembershipTier, PaymentMethod } from "@prisma/client";

export const runtime = "nodejs";

type ManualMembershipPayload = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  age?: unknown;
  dateOfBirth?: unknown;
  gender?: unknown;
  address?: unknown;
  tier?: unknown;
  amountPaid?: unknown;
  paymentMethod?: unknown;
  purchaseDate?: unknown;
};

const ALLOWED_PAYMENT_METHODS: PaymentMethod[] = [
  "CASH",
  "BKASH",
  "BANK_TRANSFER",
];

function generateTemporaryPassword(length = 10) {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(length);

  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

function parseString(value: unknown) {
  return typeof value === "string" ? sanitizeText(value) : "";
}

function parseTier(value: unknown): MembershipTier | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();

  if (
    normalized === "SIGNATURE" ||
    normalized === "CRYSTAL" ||
    normalized === "PLATINUM"
  ) {
    return normalized;
  }

  return null;
}

function parsePaymentMethod(value: unknown): PaymentMethod | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase() as PaymentMethod;
  return ALLOWED_PAYMENT_METHODS.includes(normalized) ? normalized : null;
}

function buildSurveyNote({
  gender,
  address,
}: {
  gender: string;
  address: string;
}) {
  const entries = [
    gender ? `Gender: ${gender}` : "",
    address ? `Address: ${address}` : "",
  ].filter(Boolean);

  return entries.length > 0 ? entries.join("\n") : null;
}

async function generateMembershipId(purchaseDate: Date) {
  const yearSuffix = purchaseDate.getFullYear().toString().slice(-2);
  const prefix = `SCM${yearSuffix}`;

  const latestMembership = await db.membership.findFirst({
    where: {
      membershipId: {
        startsWith: prefix,
      },
    },
    orderBy: {
      membershipId: "desc",
    },
    select: {
      membershipId: true,
    },
  });

  const latestSerial = latestMembership
    ? Number(latestMembership.membershipId.slice(-4))
    : 0;

  return `${prefix}${String(latestSerial + 1).padStart(4, "0")}`;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = (await request.json()) as ManualMembershipPayload;

  const name = typeof body.name === "string" ? sanitizeName(body.name) : "";
  const email = typeof body.email === "string" ? sanitizeEmail(body.email) : "";
  const phone = typeof body.phone === "string" ? sanitizePhone(body.phone) : "";
  const age = parseString(body.age);
  const dateOfBirthValue = parseString(body.dateOfBirth);
  const gender = parseString(body.gender);
  const address = parseString(body.address);
  const tier = parseTier(body.tier);
  const paymentMethod = parsePaymentMethod(body.paymentMethod);
  const amountPaid =
    typeof body.amountPaid === "number"
      ? body.amountPaid
      : typeof body.amountPaid === "string"
        ? Number(body.amountPaid)
        : Number.NaN;
  const purchaseDateValue = parseString(body.purchaseDate);
  const purchaseDate = purchaseDateValue ? new Date(purchaseDateValue) : null;
  const dateOfBirth = dateOfBirthValue ? new Date(dateOfBirthValue) : null;

  if (!name || !email || !phone || !tier || !paymentMethod || !purchaseDate) {
    return Response.json(
      {
        error:
          "Name, email, phone, tier, paymentMethod, and purchaseDate are required.",
      },
      { status: 400 },
    );
  }

  if (!email.includes("@")) {
    return Response.json({ error: "A valid email is required." }, { status: 400 });
  }

  if (!Number.isFinite(amountPaid) || amountPaid <= 0) {
    return Response.json(
      { error: "amountPaid must be a valid positive number." },
      { status: 400 },
    );
  }

  if (Number.isNaN(purchaseDate.getTime())) {
    return Response.json(
      { error: "purchaseDate must be a valid date." },
      { status: 400 },
    );
  }

  if (dateOfBirth && Number.isNaN(dateOfBirth.getTime())) {
    return Response.json(
      { error: "dateOfBirth must be a valid date." },
      { status: 400 },
    );
  }

  const expiresAt = calculateExpiresAt(tier, purchaseDate);

  const status: MembershipStatus =
    expiresAt.getTime() < Date.now() ? "EXPIRED" : "ACTIVE";

  try {
    const existingUser = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
      },
    });

    if (existingUser) {
      const existingMembership = await db.membership.findFirst({
        where: {
          userId: existingUser.id,
          status: {
            in: ["ACTIVE", "PENDING"],
          },
        },
        select: {
          id: true,
          status: true,
          membershipId: true,
        },
      });

      if (existingMembership) {
        return Response.json(
          {
            error:
              "This client already has an active or pending membership. Please check their membership status before adding a new one. If you want to add a new membership, cancel or expire the existing one first.",
          },
          { status: 409 },
        );
      }
    }

    const membershipId = await generateMembershipId(purchaseDate);
    const temporaryPassword = existingUser ? null : generateTemporaryPassword();
    const hashedPassword = temporaryPassword
      ? await bcrypt.hash(temporaryPassword, 10)
      : null;
    const surveyNote = buildSurveyNote({ gender, address });

    const result = await db.$transaction(async (tx) => {
      const user = existingUser
        ? await tx.user.update({
            where: { email },
            data: {
              name,
              phone: phone || null,
              age: age || null,
              dateOfBirth,
              gender: gender || null,
              address: address || null,
              emailVerified: new Date(),
            },
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              age: true,
              dateOfBirth: true,
              gender: true,
              address: true,
              role: true,
              createdAt: true,
            },
          })
        : await tx.user.create({
            data: {
              name,
              email,
              phone: phone || null,
              age: age || null,
              dateOfBirth,
              gender: gender || null,
              address: address || null,
              password: hashedPassword,
              role: "CLIENT",
              isTemporaryPassword: true,
              emailVerified: new Date(),
            },
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              age: true,
              dateOfBirth: true,
              gender: true,
              address: true,
              role: true,
              createdAt: true,
            },
          });

      await tx.surveyProfile.upsert({
        where: {
          userId: user.id,
        },
        update: {
          name,
          age: age || null,
          phone: phone || null,
          email,
          note: surveyNote,
        },
        create: {
          userId: user.id,
          name,
          age: age || null,
          phone: phone || null,
          email,
          note: surveyNote,
          skinIssues: [],
          currentProducts: [],
          allergicIngredients: [],
          skinImages: [],
        },
      });

      const membership = await tx.membership.create({
        data: {
          membershipId,
          userId: user.id,
          tier,
          status,
          createdAt: purchaseDate,
          expiresAt,
        },
        select: {
          id: true,
          membershipId: true,
          userId: true,
          tier: true,
          status: true,
          createdAt: true,
          expiresAt: true,
        },
      });

      const payment = await tx.membershipPayment.create({
        data: {
          membershipId: membership.id,
          paymentMethod,
          amount: amountPaid,
          status: "PAID",
          createdAt: purchaseDate,
        },
        select: {
          id: true,
          paymentMethod: true,
          amount: true,
          status: true,
          createdAt: true,
        },
      });

      return { user, membership, payment };
    });

    return Response.json(
      {
        membership: {
          ...result.membership,
          payment: result.payment,
        },
        userEmail: result.user.email,
        temporaryPassword,
        existingUser: Boolean(existingUser),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create manual membership", error);
    return Response.json(
      { error: "Failed to create manual membership." },
      { status: 500 },
    );
  }
}
