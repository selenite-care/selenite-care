import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

type DashboardOrderDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatBdt(amount: number) {
  return `${Math.round(amount)} BDT`;
}

function getStatusBadgeClasses(status: string) {
  switch (status) {
    case "PENDING":
      return "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/50 dark:bg-yellow-950/20 dark:text-yellow-300";
    case "VERIFIED":
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-300";
    case "PROCESSING":
      return "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/50 dark:bg-purple-950/20 dark:text-purple-300";
    case "SHIPPED":
      return "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/20 dark:text-orange-300";
    case "DELIVERED":
      return "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-300";
    case "CANCELLED":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300";
    default:
      return "border-black/10 bg-zinc-50 text-foreground/70 dark:border-white/10 dark:bg-white/5";
  }
}

function getPaymentMethodLabel(paymentMethod: string) {
  switch (paymentMethod) {
    case "BKASH":
      return "bKash";
    case "BANK_TRANSFER":
      return "Bank Transfer";
    case "CASH":
      return "Cash on Delivery";
    case "STRIPE":
      return "Card";
    default:
      return paymentMethod;
  }
}

export default async function DashboardOrderDetailsPage(
  props: DashboardOrderDetailsPageProps,
) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await props.params;

  const order = await db.order.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    select: {
      id: true,
      createdAt: true,
      totalAmount: true,
      paymentMethod: true,
      status: true,
      transactionRef: true,
      proofImageUrl: true,
      note: true,
      items: {
        select: {
          id: true,
          quantity: true,
          price: true,
          product: {
            select: {
              name: true,
              type: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <section className="min-h-screen bg-[#F8F5F0] px-6 py-10 dark:bg-[#1A1814]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-semibold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8]"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Order Details
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#B8A89A] dark:text-[#8A7D75]">
            Review the products and payment details for this order.
          </p>
        </div>

        <Link
          href="/dashboard/orders"
          className="border-themed text-page inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
        >
          Back
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="bg-card border-themed rounded-lg border p-6">
          <h2 className="text-page text-lg font-semibold">Items</h2>
          <div className="mt-4 space-y-4">
            {order.items.map((item) => (
              <article
                key={item.id}
                className="rounded-lg border border-[#D8C7B5] bg-[#FCFAF7] p-4 dark:border-[#3D3530] dark:bg-[#1A1814]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-page font-medium">{item.product.name}</p>
                    <p className="text-muted mt-1 text-sm">{item.product.type}</p>
                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                      <p className="text-muted">
                        Quantity:{" "}
                        <span className="text-page font-medium">{item.quantity}</span>
                      </p>
                      <p className="text-muted">
                        Unit Price:{" "}
                        <span className="text-page font-medium">
                          {formatBdt(item.price)}
                        </span>
                      </p>
                      <p className="text-muted">
                        Subtotal:{" "}
                        <span className="text-page font-medium">
                          {formatBdt(item.quantity * item.price)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="bg-card border-themed h-fit rounded-lg border p-6">
          <h2 className="text-page text-lg font-semibold">Summary</h2>
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <p className="text-muted font-medium">Order ID</p>
              <p className="text-page mt-1 font-mono text-xs">{order.id}</p>
            </div>
            <div>
              <p className="text-muted font-medium">Date</p>
              <p className="text-page mt-1">
                {order.createdAt.toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-muted font-medium">Payment Method</p>
              <p className="text-page mt-1">{getPaymentMethodLabel(order.paymentMethod)}</p>
            </div>
            <div>
              <p className="text-muted font-medium">Status</p>
              <span
                className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusBadgeClasses(
                  order.status,
                )}`}
              >
                {order.status}
              </span>
            </div>
            {order.transactionRef ? (
              <div>
                <p className="text-muted font-medium">Transaction Reference</p>
                <p className="text-page mt-1">{order.transactionRef}</p>
              </div>
            ) : null}
            {order.note ? (
              <div>
                <p className="text-muted font-medium">Note</p>
                <p className="text-page mt-1 whitespace-pre-wrap">{order.note}</p>
              </div>
            ) : null}
            <div className="border-themed border-t pt-4">
              <p className="text-muted font-medium">Total Amount</p>
              <p className="mt-1 text-xl font-semibold text-[#C6A56B]">
                {formatBdt(order.totalAmount)}
              </p>
            </div>
            {order.proofImageUrl ? (
              <a
                href={order.proofImageUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-sm font-medium text-[#C6A56B] underline"
              >
                View payment proof
              </a>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  );
}
