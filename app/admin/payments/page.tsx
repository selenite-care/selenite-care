"use client";

import { useEffect, useState } from "react";

type AdminPayment = {
  id: string;
  bookingId: string;
  stripePaymentId: string;
  amount: number;
  status: string;
  createdAt: string;
  booking: {
    user: {
      name: string | null;
      email: string;
    };
  };
};

function formatBdt(amount: number) {
  return `${Math.round(amount)} BDT`;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPayments() {
      try {
        const response = await fetch("/api/admin/payments");

        if (!response.ok) {
          throw new Error("Unable to load payments.");
        }

        const data = (await response.json()) as { payments?: AdminPayment[] };
        setPayments(data.payments ?? []);
      } catch {
        setError("Payments are not available right now.");
      } finally {
        setIsLoading(false);
      }
    }

    loadPayments();
  }, []);

  return (
    <section>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Payments
        </h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Review payment records connected to bookings.
        </p>
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-foreground/70">Loading payments...</p>
      ) : null}

      {error ? <p className="mt-8 text-sm text-red-600">{error}</p> : null}

      {!isLoading && !error && payments.length === 0 ? (
        <p className="mt-8 text-sm text-foreground/70">
          No payments found.
        </p>
      ) : null}

      {!isLoading && !error && payments.length > 0 ? (
        <div className="mt-8 overflow-hidden rounded-lg border border-black/10 bg-background dark:border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-black/10 bg-zinc-50 text-foreground/70 dark:border-white/10 dark:bg-white/5">
                <tr>
                  <th className="px-4 py-3 font-medium">Booking Token</th>
                  <th className="px-4 py-3 font-medium">Client Name</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Payment Status</th>
                  <th className="px-4 py-3 font-medium">Stripe Payment ID</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-black/10 last:border-0 dark:border-white/10"
                  >
                    <td className="px-4 py-4 font-mono text-xs text-foreground/70">
                      {payment.bookingId}
                    </td>
                    <td className="px-4 py-4 text-foreground">
                      {payment.booking.user.name ?? payment.booking.user.email}
                    </td>
                    <td className="px-4 py-4 text-foreground/70">
                      {formatBdt(payment.amount)}
                    </td>
                    <td className="px-4 py-4 text-foreground/70">
                      {payment.status}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-foreground/70">
                      {payment.stripePaymentId}
                    </td>
                    <td className="px-4 py-4 text-foreground/70">
                      {new Date(payment.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
