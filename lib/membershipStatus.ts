import { db } from "@/lib/db";

export async function expirePastActiveMemberships() {
  return db.membership.updateMany({
    where: {
      status: "ACTIVE",
      expiresAt: {
        not: null,
        lt: new Date(),
      },
    },
    data: {
      status: "EXPIRED",
    },
  });
}
