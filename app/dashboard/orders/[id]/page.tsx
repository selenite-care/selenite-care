import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MessageCircle, Package } from "lucide-react";
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

function getDeliveryAreaLabel(deliveryArea: string) {
  switch (deliveryArea) {
    case "INSIDE_DHAKA":
      return "Inside Dhaka";
    case "SUB_DHAKA":
      return "Sub Dhaka";
    case "OUTSIDE_DHAKA":
      return "Outside Dhaka";
    default:
      return deliveryArea;
  }
}

function ProductImage({
  image,
  name,
}: {
  image: string | null;
  name: string;
}) {
  if (image) {
    return (
      <div className="relative h-[50px] w-[50px] shrink-0 overflow-hidden rounded-md border border-[#EADDCD] bg-[#F8F5F0] dark:border-[#3D3530] dark:bg-[#1A1814]">
        <Image
          src={image}
          alt={name}
          fill
          sizes="50px"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-md border border-[#EADDCD] bg-[#F8F5F0] dark:border-[#3D3530] dark:bg-[#1A1814]">
      <Package className="h-5 w-5 text-[#884F38] dark:text-[#8A7D75]" />
    </div>
  );
}

function getStepClasses(status: string, step: string) {
  const currentIndex = ORDER_STEPS.indexOf(status);
  const stepIndex = ORDER_STEPS.indexOf(step);

  if (status === "CANCELLED") {
    return step === "PENDING"
      ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-300"
      : "border-[#EADDCD] bg-[#F8F5F0] text-[#8C7967] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#8A7D75]";
  }

  if (stepIndex < currentIndex) {
    return "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-300";
  }

  if (stepIndex === currentIndex) {
    return "border-[#B87B68] bg-[#B87B68] text-[#2B2B2B]";
  }

  return "border-[#EADDCD] bg-[#F8F5F0] text-[#8C7967] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#8A7D75]";
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
      deliveryArea: true,
      deliveryCharge: true,
      deliveryAddress: true,
      estimatedDelivery: true,
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
              stockStatus: true,
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
    stockStatus: item.product.stockStatus,
  }));

  return (
    <section className="min-h-screen bg-[#F8F5F0] px-6 py-10 dark:bg-[#1A1814]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-sm text-[#B87B68]">{order.id}</p>
          <h1
            className="mt-2 text-3xl font-semibold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8]"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Order Details
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#884F38] dark:text-[#8A7D75]">
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

      <section className="mt-8 rounded-2xl border border-[#EADDCD] bg-white p-5 dark:border-[#3D3530] dark:bg-[#242220]">
        <h2 className="text-lg font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
          Order Status Timeline
        </h2>
        <div className="mt-6 flex flex-col md:grid md:grid-cols-5">
          {ORDER_STEPS.map((step, index) => (
            <div key={step} className="relative pb-8 last:pb-0 md:pb-0">
              {index < ORDER_STEPS.length - 1 ? (
                <>
                  <div className="absolute bottom-0 left-6 top-12 w-px bg-[#EADDCD] md:hidden dark:bg-[#3D3530]" />
                  <div className="absolute left-[calc(50%+24px)] right-0 top-6 hidden h-px bg-[#EADDCD] md:block dark:bg-[#3D3530]" />
                </>
              ) : null}
              {index > 0 ? (
                <div className="absolute left-0 right-[calc(50%+24px)] top-6 hidden h-px bg-[#EADDCD] md:block dark:bg-[#3D3530]" />
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
        <div className="space-y-6">
          <section className="rounded-2xl border border-[#EADDCD] bg-white p-6 dark:border-[#3D3530] dark:bg-[#242220]">
            <h2 className="text-lg font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
              Delivery Info
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-[#884F38] dark:text-[#8A7D75]">
                  Delivery Area
                </p>
                <p className="mt-1 text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                  {getDeliveryAreaLabel(order.deliveryArea)}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-[#884F38] dark:text-[#8A7D75]">
                  Delivery Address
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#2B2B2B] dark:text-[#F0EDE8]">
                  {order.deliveryAddress || "Not provided"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-[#884F38] dark:text-[#8A7D75]">
                  Estimated Delivery
                </p>
                <p className="mt-1 text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                  {order.estimatedDelivery || "Not set yet"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#EADDCD] bg-white p-6 dark:border-[#3D3530] dark:bg-[#242220]">
            <h2 className="text-lg font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
              Items
            </h2>
            <div className="mt-4 overflow-hidden rounded-xl border border-[#EADDCD] dark:border-[#3D3530]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className="bg-[#F8F5F0] text-[#2B2B2B] dark:bg-[#1A1814] dark:text-[#F0EDE8]">
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
                      <tr
                        key={item.id}
                        className="border-t border-[#EADDCD] dark:border-[#3D3530]"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <ProductImage
                              image={item.product.image}
                              name={item.product.name}
                            />
                            <Link
                              href={`/products?search=${encodeURIComponent(item.product.name)}`}
                              className="font-semibold text-[#2B2B2B] underline-offset-4 transition-opacity hover:opacity-80 hover:underline dark:text-[#F0EDE8]"
                            >
                              {item.product.name}
                            </Link>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-[#6E6257] dark:text-[#8A7D75]">
                          {item.product.type}
                        </td>
                        <td className="px-4 py-4 text-[#6E6257] dark:text-[#8A7D75]">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-4 text-[#6E6257] dark:text-[#8A7D75]">
                          {formatBdt(item.price)}
                        </td>
                        <td className="px-4 py-4 font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                          {formatBdt(item.quantity * item.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-[#EADDCD] bg-white p-6 dark:border-[#3D3530] dark:bg-[#242220]">
            <h2 className="text-lg font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
              Order Summary
            </h2>
            <div className="mt-4 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="font-medium text-[#884F38] dark:text-[#8A7D75]">
                  Items Subtotal
                </span>
                <span className="font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                  {formatBdt(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="font-medium text-[#884F38] dark:text-[#8A7D75]">
                  Delivery Charge
                </span>
                <span className="font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                  {formatBdt(order.deliveryCharge)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-[#EADDCD] pt-4 dark:border-[#3D3530]">
                <span className="font-medium text-[#884F38] dark:text-[#8A7D75]">
                  Total
                </span>
                <span className="text-xl font-bold text-[#B87B68]">
                  {formatBdt(order.totalAmount)}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#EADDCD] bg-white p-6 dark:border-[#3D3530] dark:bg-[#242220]">
            <h2 className="text-lg font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
              Payment Info
            </h2>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="font-medium text-[#884F38] dark:text-[#8A7D75]">
                  Method
                </p>
                <p className="mt-1 text-[#2B2B2B] dark:text-[#F0EDE8]">
                  {getPaymentMethodLabel(order.paymentMethod)}
                </p>
              </div>
              {order.transactionRef ? (
                <div>
                  <p className="font-medium text-[#884F38] dark:text-[#8A7D75]">
                    Transaction Reference
                  </p>
                  <p className="mt-1 break-words font-mono text-[#2B2B2B] dark:text-[#F0EDE8]">
                    {order.transactionRef}
                  </p>
                </div>
              ) : null}
              {order.proofImageUrl ? (
                <a
                  href={order.proofImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-sm font-medium text-[#B87B68] underline"
                >
                  View payment proof
                </a>
              ) : null}
            </div>
          </section>

          <BuyAgainButton items={buyAgainItems} />
        </aside>
      </div>

      <section className="mt-8 rounded-2xl border border-[#EADDCD] bg-[#2B2B2B] p-6 text-[#F8F5F0] dark:border-[#3D3530] dark:bg-[#0F0D0C]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              className="text-2xl font-semibold"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Need help with your order?
            </h2>
            <p className="mt-2 text-sm text-[#EADDCD]">
              Contact us on WhatsApp and our team will help you.
            </p>
          </div>
          <a
            href="https://wa.me/8801647660300"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#25D366] px-5 py-3 text-center text-sm font-semibold leading-5 text-white transition-opacity hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" />
            Need help with your order? Contact us on WhatsApp
          </a>
        </div>
      </section>
    </section>
  );
}
