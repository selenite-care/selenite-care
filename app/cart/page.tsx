"use client";

import "react-phone-number-input/style.css";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import { BRAC_BANK_DETAILS } from "@/lib/bankDetails";
import { useCart } from "@/components/cart/CartProvider";
import FileUploadButton from "@/components/ui/FileUploadButton";

type PaymentTab = "BKASH" | "BANK_TRANSFER" | "CASH";

type CreateOrderResponse = {
  orderId?: string;
  error?: string;
};

function formatBdt(amount: number) {
  return `${Math.round(amount)} BDT`;
}

export const dynamic = "force-dynamic";

export default function CartPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, updateQuantity, removeItem, clearCart, totalAmount, totalItems } =
    useCart();
  const [paymentMethod, setPaymentMethod] = useState<PaymentTab>("BKASH");
  const [transactionRef, setTransactionRef] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [proofImageUrl, setProofImageUrl] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"bkash" | "bank" | null>(null);

  const requiresTransactionOrProof = useMemo(
    () => paymentMethod === "BKASH" || paymentMethod === "BANK_TRANSFER",
    [paymentMethod],
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=%2Fcart");
    }
  }, [router, status]);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => setCopied(null), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function handleProofUpload(file: File) {
    setIsUploadingProof(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/membership/upload-proof", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json().catch(() => null)) as
        | { secure_url?: string; error?: string }
        | null;

      if (!response.ok || !data?.secure_url) {
        throw new Error(data?.error ?? "Unable to upload payment proof.");
      }

      setProofImageUrl(data.secure_url);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload payment proof.",
      );
    } finally {
      setIsUploadingProof(false);
    }
  }

  async function handleCopy(value: string, source: "bkash" | "bank") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(source);
    } catch {
      setError("Unable to copy right now.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (paymentMethod === "BKASH") {
      if (!senderNumber || !isValidPhoneNumber(senderNumber)) {
        setError("Please enter a valid bKash number with country code.");
        return;
      }

      if (!transactionRef.trim() && !proofImageUrl.trim()) {
        setError(
          "Please provide either a Transaction ID or a payment confirmation screenshot.",
        );
        return;
      }
    }

    if (paymentMethod === "BANK_TRANSFER" && !transactionRef.trim() && !proofImageUrl.trim()) {
      setError(
        "Please provide either a Transaction ID or a payment confirmation screenshot.",
      );
      return;
    }

    if (paymentMethod === "CASH" && !deliveryAddress.trim()) {
      setError("Please enter your delivery address.");
      return;
    }

    setIsSubmitting(true);

    try {
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
          transactionRef: transactionRef.trim(),
          senderNumber: paymentMethod === "BKASH" ? senderNumber : "",
          proofImageUrl: proofImageUrl.trim(),
          deliveryAddress: paymentMethod === "CASH" ? deliveryAddress.trim() : "",
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | CreateOrderResponse
        | null;

      if (!response.ok || !data?.orderId) {
        throw new Error(data?.error ?? "Unable to place your order.");
      }

      clearCart();
      router.push(`/orders/confirmation?id=${encodeURIComponent(data.orderId)}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to place your order.",
      );
    } finally {
      setIsSubmitting(false);
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

              <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-[#EADDCD] bg-white p-6 dark:border-[#3D3530] dark:bg-[#242220]"
              >
                <div className="flex flex-wrap gap-2 rounded-2xl border border-[#EADDCD] bg-[#FCFAF7] p-1 dark:border-[#3D3530] dark:bg-[#1A1814]">
                  {[
                    { value: "BKASH" as const, label: "bKash" },
                    { value: "BANK_TRANSFER" as const, label: "Bank Transfer" },
                    { value: "CASH" as const, label: "Cash on Delivery" },
                  ].map((tab) => (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(tab.value);
                        setError("");
                      }}
                      className={`h-11 rounded-xl px-5 text-sm font-medium transition-colors ${
                        paymentMethod === tab.value
                          ? "bg-[#2B2B2B] text-[#F8F5F0] dark:bg-[#B87B68] dark:text-[#141210]"
                          : "text-[#8C7967] hover:bg-black/5 dark:text-[#8A7D75] dark:hover:bg-white/5"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {paymentMethod === "BKASH" ? (
                  <div className="mt-6 space-y-5">
                    <div className="rounded-2xl border border-[#B87B68] bg-[rgba(198,165,107,0.08)] px-5 py-5 dark:bg-[rgba(198,165,107,0.12)]">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8C7967] dark:text-[#8A7D75]">
                        bKash Merchant Number
                      </p>
                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p
                          className="text-3xl font-bold text-[#2B2B2B] dark:text-[#F0EDE8]"
                          style={{ fontFamily: "Playfair Display, serif" }}
                        >
                          01810835553
                        </p>
                        <button
                          type="button"
                          onClick={() => void handleCopy("01810835553", "bkash")}
                          className="inline-flex h-11 items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors hover:opacity-90 dark:bg-[#B87B68] dark:text-[#141210]"
                        >
                          {copied === "bkash" ? "Copied!" : "Copy Number"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                        bKash Transaction ID (TrxID)
                      </label>
                      <input
                        type="text"
                        value={transactionRef}
                        onChange={(event) => setTransactionRef(event.target.value)}
                        className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
                        placeholder="Enter your TrxID"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                        The bKash number you paid from
                      </label>
                      <div className="brand-phone-input-wrapper mt-2">
                        <PhoneInput
                          international
                          countryCallingCodeEditable={false}
                          defaultCountry="BD"
                          value={senderNumber}
                          onChange={(value) => setSenderNumber(value ?? "")}
                          className="brand-phone-input"
                          numberInputProps={{
                            autoComplete: "tel",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : null}

                {paymentMethod === "BANK_TRANSFER" ? (
                  <div className="mt-6 space-y-5">
                    <div className="rounded-2xl border border-[#B87B68] bg-[rgba(198,165,107,0.08)] px-5 py-5 dark:bg-[rgba(198,165,107,0.12)]">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8C7967] dark:text-[#8A7D75]">
                        BRAC Bank Account Details
                      </p>
                      <div className="mt-4 space-y-4 text-sm text-[#2B2B2B] dark:text-[#F0EDE8]">
                        <div>
                          <p className="font-medium text-[#8C7967] dark:text-[#8A7D75]">
                            Bank Name
                          </p>
                          <p className="mt-1 text-base font-semibold">
                            {BRAC_BANK_DETAILS.bankName}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-[#8C7967] dark:text-[#8A7D75]">
                            Account Name
                          </p>
                          <p className="mt-1 text-base font-semibold">
                            {BRAC_BANK_DETAILS.accountName}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-[#8C7967] dark:text-[#8A7D75]">
                            Account Number
                          </p>
                          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p
                              className="text-2xl font-bold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-3xl"
                              style={{ fontFamily: "Playfair Display, serif" }}
                            >
                              {BRAC_BANK_DETAILS.accountNumber}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                void handleCopy(BRAC_BANK_DETAILS.accountNumber, "bank")
                              }
                              className="inline-flex h-11 items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors hover:opacity-90 dark:bg-[#B87B68] dark:text-[#141210]"
                            >
                              {copied === "bank" ? "Copied!" : "Copy Number"}
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-[#8C7967] dark:text-[#8A7D75]">
                            Branch
                          </p>
                          <p className="mt-1 text-base font-semibold">
                            {BRAC_BANK_DETAILS.branchName}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                        Transaction Reference Number
                      </label>
                      <input
                        type="text"
                        value={transactionRef}
                        onChange={(event) => setTransactionRef(event.target.value)}
                        className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
                        placeholder="Enter your transfer reference"
                      />
                    </div>
                  </div>
                ) : null}

                {paymentMethod === "CASH" ? (
                  <div className="mt-6 space-y-5">
                    <div className="rounded-2xl border border-[#EADDCD] bg-[#FCFAF7] px-5 py-5 dark:border-[#3D3530] dark:bg-[#1A1814]">
                      <p className="text-sm leading-7 text-[#6E6257] dark:text-[#8A7D75]">
                        Pay when your order is delivered. Available for Dhaka
                        delivery only.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                        Delivery Address
                      </label>
                      <textarea
                        value={deliveryAddress}
                        onChange={(event) => setDeliveryAddress(event.target.value)}
                        rows={4}
                        className="mt-2 w-full rounded-md border border-[#EADDCD] bg-white px-3 py-3 text-sm text-[#2B2B2B] outline-none focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
                        placeholder="Enter your full delivery address"
                      />
                    </div>
                  </div>
                ) : null}

                {requiresTransactionOrProof ? (
                  <div className="mt-5">
                    <label className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                      Upload payment confirmation screenshot
                    </label>
                    <div className="mt-2">
                      <FileUploadButton
                        onFileSelected={(file) => {
                          if (isUploadingProof || isSubmitting) {
                            return;
                          }

                          void handleProofUpload(file);
                        }}
                        label={isUploadingProof ? "Uploading..." : "Choose Screenshot"}
                        accept="image/*"
                        currentPreviewUrl={proofImageUrl || undefined}
                      />
                    </div>
                    {proofImageUrl ? (
                      <a
                        href={proofImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-sm text-[#B87B68] underline"
                      >
                        View uploaded screenshot
                      </a>
                    ) : null}
                  </div>
                ) : null}

                {error ? (
                  <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingProof}
                  className={`mt-6 inline-flex h-12 w-full items-center justify-center rounded-md px-5 text-sm font-medium transition-colors ${
                    isSubmitting || isUploadingProof
                      ? "cursor-not-allowed bg-[#EADDCD] text-[#F8F5F0] dark:bg-[#3D3530] dark:text-[#8A7D75]"
                      : "bg-[#2B2B2B] text-[#F8F5F0] hover:bg-[#884F38] dark:bg-[#B87B68] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
                  }`}
                >
                  {isSubmitting ? "Placing Order..." : "Place Order"}
                </button>
              </form>
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
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#8C7967] dark:text-[#8A7D75]">
                    Total
                  </span>
                  <span className="text-xl font-semibold text-[#B87B68]">
                    {formatBdt(totalAmount)}
                  </span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      <style jsx global>{`
        .brand-phone-input-wrapper .PhoneInput {
          display: flex;
          align-items: center;
          gap: 10px;
          height: 44px;
          width: 100%;
          border-radius: 8px;
          border: 1px solid #d8c7b5;
          background-color: #ffffff;
          padding: 0 12px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .brand-phone-input-wrapper .PhoneInput:focus-within {
          border-color: #c6a56b;
          box-shadow: 0 0 0 1px #c6a56b;
        }

        .brand-phone-input-wrapper .PhoneInputCountry {
          margin-right: 0;
        }

        .brand-phone-input-wrapper .PhoneInputCountrySelect {
          cursor: pointer;
        }

        .brand-phone-input-wrapper .PhoneInputCountryIcon {
          box-shadow: none;
        }

        .brand-phone-input-wrapper .PhoneInputCountrySelectArrow {
          color: #b8a89a;
          opacity: 1;
        }

        .brand-phone-input-wrapper .PhoneInputInput {
          height: 100%;
          width: 100%;
          border: 0;
          background: transparent;
          color: #2b2b2b;
          font-size: 14px;
          outline: none;
          box-shadow: none;
        }

        .brand-phone-input-wrapper .PhoneInputInput::placeholder {
          color: #b8a89a;
        }

        .dark .brand-phone-input-wrapper .PhoneInput {
          border-color: #3d3530;
          background-color: #1e1c1a;
        }

        .dark .brand-phone-input-wrapper .PhoneInputCountrySelectArrow {
          color: #8a7d75;
        }

        .dark .brand-phone-input-wrapper .PhoneInputInput {
          color: #f0ede8;
        }

        .dark .brand-phone-input-wrapper .PhoneInputInput::placeholder {
          color: #8a7d75;
        }
      `}</style>
    </main>
  );
}
