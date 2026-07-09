"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "@/components/cart/CartProvider";

type DeliveryArea = "INSIDE_DHAKA" | "SUB_DHAKA" | "OUTSIDE_DHAKA";

const DELIVERY_OPTIONS: Array<{
  value: DeliveryArea;
  label: string;
  charge: number;
}> = [
  { value: "INSIDE_DHAKA", label: "Inside Dhaka", charge: 80 },
  { value: "SUB_DHAKA", label: "Sub Dhaka", charge: 100 },
  { value: "OUTSIDE_DHAKA", label: "Outside Dhaka", charge: 150 },
];

type CreateOrderResponse = {
  orderId?: string;
  error?: string;
};

type EpsOrderInitiateResponse = {
  redirectUrl?: string;
  error?: string;
};

function formatBdt(amount: number) {
  return `${Math.round(amount)} BDT`;
}

function getPaymentErrorMessage(error: string | null, message: string | null) {
  if (!error) {
    return "";
  }

  if (error === "payment_failed") {
    return "Payment was unsuccessful. Please try again.";
  }

  if (error === "payment_cancelled") {
    return "Payment was cancelled. Your order has not been placed.";
  }

  return message || "Payment could not be completed. Please try again.";
}

function PaymentErrorNotice({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm dark:border-red-900/60 dark:bg-red-950/25 dark:text-red-300">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-0.5 h-5 w-5 shrink-0"
        aria-hidden="true"
      >
        <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
      <p className="min-w-0 flex-1 leading-6">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900/30"
      >
        Dismiss
      </button>
    </div>
  );
}

export const dynamic = "force-dynamic";

function CartPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { items, updateQuantity, removeItem, clearCart, totalAmount, totalItems } =
    useCart();
  const [deliveryArea, setDeliveryArea] = useState<DeliveryArea>("INSIDE_DHAKA");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [submittingMethod, setSubmittingMethod] = useState<"EPS" | "CASH" | null>(
    null,
  );
  const [error, setError] = useState("");
  const [dismissedPaymentError, setDismissedPaymentError] = useState(false);
  const paymentError = searchParams.get("error");
  const paymentMessage = searchParams.get("message");

  const deliveryCharge = useMemo(
    () =>
      DELIVERY_OPTIONS.find((option) => option.value === deliveryArea)?.charge ??
      80,
    [deliveryArea],
  );
  const orderTotal = totalAmount + deliveryCharge;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=%2Fcart");
    }
  }, [router, status]);

  useEffect(() => {
    setDismissedPaymentError(false);
  }, [paymentError, paymentMessage]);

  const paymentErrorMessage = dismissedPaymentError
    ? ""
    : getPaymentErrorMessage(paymentError, paymentMessage);

  function validateCheckout() {
    setError("");

    if (items.length === 0) {
      setError("Your cart is empty.");
      return false;
    }

    if (!deliveryAddress.trim()) {
      setError("Please enter your delivery address.");
      return false;
    }

    return true;
  }

  async function createOrder(paymentMethod: "BKASH" | "CASH") {
    const isEpsPlaceholder = paymentMethod === "BKASH";

    const response = await fetch("/api/orders/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        paymentMethod,
        transactionRef: isEpsPlaceholder ? "EPS_PENDING" : "",
        senderNumber: isEpsPlaceholder ? "EPS" : "",
        proofImageUrl: "",
        note: isEpsPlaceholder ? "EPS payment pending" : "",
        deliveryArea,
        deliveryCharge,
        deliveryAddress: deliveryAddress.trim(),
      }),
    });

    const data = (await response.json().catch(() => null)) as
      | CreateOrderResponse
      | null;

    if (!response.ok || !data?.orderId) {
      throw new Error(data?.error ?? "Unable to place your order.");
    }

    return data.orderId;
  }

  async function handleEpsCheckout() {
    if (submittingMethod || !validateCheckout()) {
      return;
    }

    setSubmittingMethod("EPS");

    try {
      const orderId = await createOrder("BKASH");
      const response = await fetch("/api/eps/order/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });
      const data = (await response.json().catch(() => null)) as
        | EpsOrderInitiateResponse
        | null;

      if (!response.ok || !data?.redirectUrl) {
        throw new Error(data?.error ?? "Unable to start EPS payment.");
      }

      window.location.href = data.redirectUrl;
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to start EPS payment.",
      );
      setSubmittingMethod(null);
    }
  }

  async function handleCashCheckout() {
    if (submittingMethod || !validateCheckout()) {
      return;
    }

    setSubmittingMethod("CASH");

    try {
      const orderId = await createOrder("CASH");
      clearCart();
      router.push(`/orders/confirmation?id=${encodeURIComponent(orderId)}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to place your order.",
      );
      setSubmittingMethod(null);
    }
  }

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-[#F8F5F0] px-6 py-16 dark:bg-[#1A1814]">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-[#884F38] dark:text-[#8A7D75]">
            Loading your cart...
          </p>
        </div>
      </main>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#F8F5F0] px-6 py-16 dark:bg-[#1A1814]">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <h1
            className="text-4xl font-bold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-5xl"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Your Cart
          </h1>
          <p className="mt-4 text-base leading-7 text-[#6E6257] dark:text-[#8A7D75]">
            Review your selected products and choose how you would like to pay.
          </p>
          {paymentErrorMessage ? (
            <PaymentErrorNotice
              message={paymentErrorMessage}
              onDismiss={() => setDismissedPaymentError(true)}
            />
          ) : null}
        </div>

        {items.length === 0 ? (
          <section className="mt-10 rounded-2xl border border-[#EADDCD] bg-white p-8 text-center dark:border-[#3D3530] dark:bg-[#242220]">
            <h2
              className="text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Your cart is empty
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#6E6257] dark:text-[#8A7D75]">
              Add a few products first, then come back here to place your order.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-md bg-[#2B2B2B] px-6 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#884F38] dark:bg-[#B87B68] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
            >
              Browse Products
            </Link>
          </section>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-[#EADDCD] bg-white p-6 dark:border-[#3D3530] dark:bg-[#242220]">
                <div className="flex items-center justify-between gap-4">
                  <h2
                    className="text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                    style={{ fontFamily: "Playfair Display, serif" }}
                  >
                    Cart Items
                  </h2>
                  <span className="text-sm text-[#8C7967] dark:text-[#8A7D75]">
                    {totalItems} item{totalItems === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="mt-6 space-y-4">
                  {items.map((item) => (
                    <article
                      key={item.productId}
                      className="rounded-2xl border border-[#EADDCD] bg-[#FCFAF7] p-4 dark:border-[#3D3530] dark:bg-[#1A1814]"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                            {item.name}
                          </h3>
                          <p className="mt-1 text-sm text-[#8C7967] dark:text-[#8A7D75]">
                            {item.type}
                          </p>
                          <p className="mt-3 text-sm text-[#6E6257] dark:text-[#8A7D75]">
                            {formatBdt(item.price)} each
                          </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:items-end">
                          <label className="text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(event) =>
                              updateQuantity(
                                item.productId,
                                Math.max(1, Number(event.target.value) || 1),
                              )
                            }
                            className="h-11 w-24 rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
                          />
                          <p className="text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                            Subtotal: {formatBdt(item.price * item.quantity)}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            className="text-sm font-medium text-red-600 transition-opacity hover:opacity-80 dark:text-red-400"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-[#EADDCD] bg-white p-6 dark:border-[#3D3530] dark:bg-[#242220]">
                <section className="mb-6 rounded-2xl border border-[#EADDCD] bg-[#FCFAF7] p-5 dark:border-[#3D3530] dark:bg-[#1A1814]">
                  <h2
                    className="text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                    style={{ fontFamily: "Playfair Display, serif" }}
                  >
                    Delivery Information
                  </h2>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {DELIVERY_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-4 transition-colors dark:bg-[#242220] ${
                          deliveryArea === option.value
                            ? "border-[#B87B68] ring-1 ring-[#B87B68]"
                            : "border-[#EADDCD] hover:border-[#B87B68]/70 dark:border-[#3D3530]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="deliveryArea"
                          value={option.value}
                          checked={deliveryArea === option.value}
                          onChange={() => setDeliveryArea(option.value)}
                          className="mt-1 h-4 w-4 accent-[#B87B68]"
                        />
                        <span>
                          <span className="block text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                            {option.label}
                          </span>
                          <span className="mt-1 block text-sm font-medium text-[#B87B68]">
                            {formatBdt(option.charge)}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="mt-5">
                    <label className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                      Delivery Address
                    </label>
                    <textarea
                      value={deliveryAddress}
                      onChange={(event) => setDeliveryAddress(event.target.value)}
                      rows={4}
                      required
                      className="mt-2 w-full rounded-md border border-[#EADDCD] bg-white px-3 py-3 text-sm text-[#2B2B2B] outline-none focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
                      placeholder="Enter your full delivery address"
                    />
                  </div>

                  <div className="mt-5 rounded-xl border border-[#B87B68] bg-white p-4 dark:bg-[#242220]">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-[#6E6257] dark:text-[#8A7D75]">
                          Subtotal
                        </span>
                        <span className="text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                          {formatBdt(totalAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-[#6E6257] dark:text-[#8A7D75]">
                          Delivery Charge
                        </span>
                        <span className="text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                          {formatBdt(deliveryCharge)}
                        </span>
                      </div>
                      <div className="border-t border-[#EADDCD] pt-3 dark:border-[#3D3530]">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-base font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                            Total
                          </span>
                          <span className="text-xl font-bold text-[#B87B68]">
                            {formatBdt(orderTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-[#EADDCD] bg-[#FCFAF7] p-5 dark:border-[#3D3530] dark:bg-[#1A1814]">
                  <h2
                    className="text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                    style={{ fontFamily: "Playfair Display, serif" }}
                  >
                    Secure Online Payment
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[#6E6257] dark:text-[#8A7D75]">
                    Pay securely through EPS using bKash, Nagad, cards, bank
                    channels and more.
                  </p>

                  <button
                    type="button"
                    onClick={() => void handleEpsCheckout()}
                    disabled={submittingMethod !== null}
                    className={`mt-5 inline-flex h-14 w-full items-center justify-center rounded-xl px-5 text-base font-semibold transition-colors ${
                      submittingMethod
                        ? "cursor-not-allowed bg-[#EADDCD] text-[#6E6257] dark:bg-[#3D3530] dark:text-[#8A7D75]"
                        : "bg-[#B87B68] text-[#141210] hover:bg-[#D4B47A]"
                    }`}
                  >
                    {submittingMethod === "EPS"
                      ? "Redirecting to payment..."
                      : "Pay with EPS - Secure Payment"}
                  </button>

                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    {["bKash", "Nagad", "Card", "Bank", "Wallet"].map(
                      (label) => (
                        <span
                          key={label}
                          className="rounded-full border border-[#EADDCD] bg-white px-3 py-1 text-xs font-semibold text-[#884F38] dark:border-[#3D3530] dark:bg-[#242220] dark:text-[#8A7D75]"
                        >
                          {label}
                        </span>
                      ),
                    )}
                  </div>

                  <p className="mt-4 text-center text-sm leading-6 text-[#6E6257] dark:text-[#8A7D75]">
                    Secured by EPS Payment Gateway - supports bKash, Nagad,
                    Card & more.
                  </p>
                </section>

                <section className="mt-6 rounded-2xl border border-[#EADDCD] bg-white p-5 dark:border-[#3D3530] dark:bg-[#242220]">
                  <h2
                    className="text-xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                    style={{ fontFamily: "Playfair Display, serif" }}
                  >
                    Prefer Cash on Delivery?
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[#6E6257] dark:text-[#8A7D75]">
                    Place the order now and pay when your products are
                    delivered. Delivery charge is included in the total above.
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleCashCheckout()}
                    disabled={submittingMethod !== null}
                    className={`mt-5 inline-flex h-12 w-full items-center justify-center rounded-md px-5 text-sm font-medium transition-colors ${
                      submittingMethod
                        ? "cursor-not-allowed bg-[#EADDCD] text-[#6E6257] dark:bg-[#3D3530] dark:text-[#8A7D75]"
                        : "bg-[#2B2B2B] text-[#F8F5F0] hover:bg-[#884F38] dark:bg-[#B87B68] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
                    }`}
                  >
                    {submittingMethod === "CASH"
                      ? "Placing Order..."
                      : "Place Order with Cash on Delivery"}
                  </button>
                </section>

                {error ? (
                  <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                  </div>
                ) : null}
              </section>
            </div>

            <aside className="h-fit rounded-2xl border border-[#EADDCD] bg-white p-6 dark:border-[#3D3530] dark:bg-[#242220]">
              <h2
                className="text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Order Summary
              </h2>

              <div className="mt-6 space-y-4">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-start justify-between gap-4 border-b border-[#EEE0D0] pb-4 last:border-b-0 dark:border-[#3D3530]"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs text-[#8C7967] dark:text-[#8A7D75]">
                        {item.quantity} x {formatBdt(item.price)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                      {formatBdt(item.quantity * item.price)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-[#EADDCD] pt-5 dark:border-[#3D3530]">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#8C7967] dark:text-[#8A7D75]">
                      Subtotal
                    </span>
                    <span className="text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                      {formatBdt(totalAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#8C7967] dark:text-[#8A7D75]">
                      Delivery Charge
                    </span>
                    <span className="text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                      {formatBdt(deliveryCharge)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#EADDCD] pt-4 dark:border-[#3D3530]">
                  <span className="text-sm text-[#8C7967] dark:text-[#8A7D75]">
                    Total
                  </span>
                  <span className="text-xl font-semibold text-[#B87B68]">
                    {formatBdt(orderTotal)}
                  </span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

function CartPageFallback() {
  return (
    <main className="min-h-screen bg-[#F8F5F0] px-6 py-16 dark:bg-[#1A1814]">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm text-[#884F38] dark:text-[#8A7D75]">
          Loading your cart...
        </p>
      </div>
    </main>
  );
}

export default function CartPage() {
  return (
    <Suspense fallback={<CartPageFallback />}>
      <CartPageContent />
    </Suspense>
  );
}
