import type { Service as PrismaService } from "@prisma/client";

export type { Booking, Payment, User } from "@prisma/client";

export type Service = PrismaService & {
  originalPrice?: number;
  details?: string;
};
