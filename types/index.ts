import type {
  Product as PrismaProduct,
  Service as PrismaService,
} from "@prisma/client";

export type { Booking, Payment, User } from "@prisma/client";

export type Service = PrismaService & {
  originalPrice?: number;
  details?: string;
};

export type Product = Omit<PrismaProduct, "ingredients"> & {
  ingredients?: string;
};
