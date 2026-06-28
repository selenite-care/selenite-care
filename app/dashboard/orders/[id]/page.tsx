import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/dateUtils";
import BuyAgainButton from "./BuyAgainButton";

type DashboardOrderDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const ORDER_STEPS = ["PENDING", "VERIFIED", "PROCESSING", "SHIPPED", "DELIVERED"];

function formatBdt(amount: number) {
  return `${Math.round(amount)} BDT`;
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

function getStepClasses(status: string, step: string) {
  const currentIndex = ORDER_STEPS.indexOf(status);
  const stepIndex = ORDER_STEPS.indexOf(step);

  if (status === "CANCELLED") {
    return step === "PENDING"
      ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-300"
      : "border-[#D8C7B5] bg-[#F8F5F0] text-[#8C7967] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#8A7D75]";
  }

  if (stepIndex < currentIndex) {
    return "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-300";
  }

  if (stepIndex === currentIndex) {
    return "border-[#C6A56B] bg-[#C6A56B] text-[#2B2B2B]";
  }

  return "border-[#D8C7B5] bg-[#F8F5F0] text-[#8C7967] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#8A7D75]";
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
              id: true,
              name: true,
              type: true,
              image: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const subtotal = order.items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0,
  );
  const buyAgainItems = order.items.map((item) => ({
    productId: item.product.id,
    name: item.product.name,
    type: item.product.type,
    price: item.price,
    quantity: item.quantity,
  }));

  return (
    <section className="min-h-screen bg-[#F8F5F0] px-6 py-10 dark:bg-[#1A1814]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-sm text-[#C6A56B]">{order.id}</p>
          <h1
            className="mt-2 text-3xl font-semibold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8]"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Order Details
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#B8A89A] dark:text-[#8A7D75]">
            Placed on {formatDateTime(order.createdAt)}
          </p>
        </div>

        <Link
          href="/dashboard/orders"
          className="border-themed text-page inline-flex h-9 w-fit items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
        >
          Back
        </Link>
      </div>

      <section className="mt-8 rounded-2xl border border-[#D8C7B5] bg-white p-5 dark:border-[#3D3530] dark:bg-[#242220]">
        <h2 className="text-lg font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
          Order Status
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-5">
          {ORDER_STEPS.map((step, index) => (
            <div key={step} className="relative">
              {index < ORDER_STEPS.length - 1 ? (
                <div className="absolute left-6 top-6 hidden h-px w-full bg-[#D8C7B5] md:block dark:bg-[#3D3530]" />
              ) : null}
              <div className="relative flex items-center gap-3 md:flex-col md:text-center">
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${getStepClasses(
                    order.status,
                    step,
                  )}`}
                >
                  {index + 1}
                </span>
                <span className="text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                  {step}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="bg-card border-themed rounded-2xl border p-6">
          <h2 className="text-page text-lg font-semibold">Items</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-[#D8C7B5] dark:border-[#3D3530]">
            <div className="overflow-x-auto">
              <table className="table-themed w-full min-w-[820px] text-left text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Quantity</th>
                    <th className="px-4 py-3 font-medium">Unit Price</th>
                    <th className="px-4 py-3 font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-14 w-14 overflow-hidden rounded-lg border border-[#D8C7B5] bg-[#F8F5F0] dark:border-[#3D3530] dark:bg-[#1A1814]">
                            {item.product.image ? (
                              <Image
                                src={item.product.image}
                                alt={item.product.name}
                                fill
                                sizes="56px"
                                className="object-cover"
                              />
                            ) : null}
                          </div>
                          <span className="font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                            {item.product.name}
                          </span>
                        </div>
                      </td>
                      <td className="cell-muted px-4 py-4">{item.product.type}</td>
                      <td className="cell-muted px-4 py-4">{item.quantity}</td>
                      <td className="cell-muted px-4 py-4">{formatBdt(item.price)}</td>
                      <td className="cell-muted px-4 py-4">
                        {formatBdt(item.quantity * item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <aside className="bg-card border-themed h-fit rounded-2xl border p-6">
          <h2 className="text-page text-lg font-semibold">Order Summary</h2>
          <div className="mt-4 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted font-medium">Subtotal</span>
              <span className="text-page font-semibold">{formatBdt(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-[#D8C7B5] pt-4 dark:border-[#3D3530]">
              <span className="text-muted font-medium">Total</span>
              <span className="text-xl font-semibold text-[#C6A56B]">
                {formatBdt(order.totalAmount)}
              </span>
            </div>
            <div>
              <p className="text-muted font-medium">Payment Method</p>
              <p className="text-page mt-1">{getPaymentMethodLabel(order.paymentMethod)}</p>
            </div>
            <div>
              <p className="text-muted font-medium">Transaction Reference</p>
              <p className="text-page mt-1 break-words">
                {order.transactionRef || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-muted font-medium">Order Date</p>
              <p className="text-page mt-1">{formatDateTime(order.createdAt)}</p>
            </div>
            {order.note ? (
              <div>
                <p className="text-muted font-medium">Note</p>
                <p className="text-page mt-1 whitespace-pre-wrap">{order.note}</p>
              </div>
            ) : null}
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
            {order.status === "DELIVERED" ? (
              <BuyAgainButton items={buyAgainItems} />
            ) : null}
          </div>
        </aside>
      </div>

      <section className="mt-8 rounded-2xl border border-[#D8C7B5] bg-[#2B2B2B] p-6 text-[#F8F5F0] dark:border-[#3D3530] dark:bg-[#0F0D0C]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              className="text-2xl font-semibold"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Have an issue with your order?
            </h2>
            <p className="mt-2 text-sm text-[#D8C7B5]">Contact us for support.</p>
          </div>
          <a
            href="https://wa.me/8801647660300"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#25D366] px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </div>
      </section>
    </section>
  );
}
