"use client";

import "react-phone-number-input/style.css";

import Image from "next/image";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import { isMembershipAvailable } from "@/lib/membershipAvailability";
import { BRAC_BANK_DETAILS } from "@/lib/bankDetails";
import FileUploadButton from "@/components/ui/FileUploadButton";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null;

type MembershipTier = "SIGNATURE" | "CRYSTAL" | "PLATINUM";

type MembershipTierDetails = {
  name: string;
  price: number;
  originalPrice?: number;
  benefits: string[];
};

type CreateIntentResponse = {
  clientSecret?: string;
  amount?: number;
  error?: string;
};

type CreateMembershipResponse = {
  membershipId?: string;
  error?: string;
};

type ManualPaymentResponse = {
  membershipId?: string;
  error?: string;
};

const MEMBERSHIPS: Record<MembershipTier, MembershipTierDetails> = {
  SIGNATURE: {
    name: "Signature Membership",
    price: 490,
    originalPrice: 990,
    benefits: [
      "100% off on the 2nd consultation",
      "120 days of online support",
      "Digital skin analysis and personalized skincare routine",
    ],
  },
  CRYSTAL: {
    name: "Crystal Membership",
    price: 3990,
    benefits: [
      "5 complimentary follow-up consultations",
      "Specialist access with aesthetician, nutritionist, and psychiatrist support",
      "Advanced skin assessment with a customized care plan",
    ],
  },
  PLATINUM: {
    name: "Platinum Membership",
    price: 9990,
    benefits: [
      "30 complimentary follow-up consultations",
      "Extended specialist access and long-term online support",
      "Skin transformation roadmap with progress monitoring",
    ],
  },
};

function formatBdt(amount: number) {
  return `${Math.round(amount)} BDT`;
}

function parseTier(value: string | null): MembershipTier | null {
  if (!value) {
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

function MembershipPaymentForm({
  tier,
  membership,
}: {
  tier: MembershipTier;
  membership: MembershipTierDetails;
}) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!stripe || !elements) {
      setError("Payment form is still loading.");
      setIsSubmitting(false);
      return;
    }

    const card = elements.getElement(CardElement);

    if (!card) {
      setError("Card details are required.");
      setIsSubmitting(false);
      return;
    }

    const intentResponse = await fetch("/api/membership/create-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tier }),
    });

    const intentData = (await intentResponse.json()) as CreateIntentResponse;

    if (!intentResponse.ok || !intentData.clientSecret) {
      setError(intentData.error ?? "Unable to start payment.");
      setIsSubmitting(false);
      return;
    }

    const { error: paymentError, paymentIntent } =
      await stripe.confirmCardPayment(intentData.clientSecret, {
        payment_method: {
          card,
        },
      });

    if (paymentError || paymentIntent?.status !== "succeeded") {
      setError(paymentError?.message ?? "Payment was not completed.");
      setIsSubmitting(false);
      return;
    }

    const membershipResponse = await fetch("/api/membership/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tier,
        stripePaymentId: paymentIntent.id,
      }),
    });

    const membershipData =
      (await membershipResponse.json().catch(() => null)) as
        | CreateMembershipResponse
        | null;

    if (!membershipResponse.ok || !membershipData?.membershipId) {
      setError(
        membershipData?.error ??
          "Payment succeeded, but membership creation failed.",
      );
      setIsSubmitting(false);
      return;
    }

    router.push(
      `/membership/welcome?id=${encodeURIComponent(membershipData.membershipId)}`,
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border bg-white p-6"
      style={{ borderColor: "#D8C7B5" }}
    >
      <h2
        className="text-xl font-semibold"
        style={{
          color: "#2B2B2B",
          fontFamily: "Playfair Display, serif",
        }}
      >
        Card Payment
      </h2>

      <div
        className="mt-5 rounded-xl border-2 p-4"
        style={{ borderColor: "#D8C7B5" }}
      >
        <CardElement
          options={{
            hidePostalCode: true,
            style: {
              base: {
                color: "#2B2B2B",
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: "16px",
                "::placeholder": {
                  color: "#B8A89A",
                },
              },
            },
          }}
        />
      </div>

      {error ? (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={!stripe || isSubmitting}
        className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-md px-5 text-sm font-medium transition-colors"
        style={{
          backgroundColor: !stripe || isSubmitting ? "#D8C7B5" : "#2B2B2B",
          color: "#F8F5F0",
          cursor: !stripe || isSubmitting ? "not-allowed" : "pointer",
        }}
      >
        {isSubmitting ? "Processing..." : `Pay ${formatBdt(membership.price)}`}
      </button>
    </form>
  );
}

function BkashManualPaymentForm({
  tier,
  membership,
}: {
  tier: MembershipTier;
  membership: MembershipTierDetails;
}) {
  const router = useRouter();
  const [transactionId, setTransactionId] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [proofImageUrl, setProofImageUrl] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function handleCopyNumber() {
    try {
      await navigator.clipboard.writeText("01810835553");
      setCopied(true);
    } catch {
      setError("Unable to copy the merchant number right now.");
    }
  }

  async function handleProofUpload(file: File) {
    setUploadingProof(true);
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
      setUploadingProof(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!transactionId.trim() && !proofImageUrl.trim()) {
      setError(
        "Please provide either a Transaction ID or a payment confirmation screenshot.",
      );
      return;
    }

    if (!senderNumber || !isValidPhoneNumber(senderNumber)) {
      setError("Please enter a valid bKash number with country code.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/membership/manual-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tier,
          paymentMethod: "BKASH",
          transactionRef: transactionId.trim(),
          senderNumber,
          proofImageUrl: proofImageUrl.trim() || null,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | ManualPaymentResponse
        | null;

      if (!response.ok || !data?.membershipId) {
        throw new Error(data?.error ?? "Unable to submit your payment.");
      }

      router.push(
        `/membership/pending-verification?id=${encodeURIComponent(
          data.membershipId,
        )}`,
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit your payment.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      className="rounded-2xl border bg-white p-6"
      style={{ borderColor: "#D8C7B5" }}
    >
      <h2
        className="text-xl font-semibold"
        style={{
          color: "#2B2B2B",
          fontFamily: "Playfair Display, serif",
        }}
      >
        Pay with bKash
      </h2>

      <div
        className="mt-5 rounded-2xl border px-5 py-5"
        style={{
          borderColor: "#C6A56B",
          backgroundColor: "rgba(198, 165, 107, 0.08)",
        }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-[0.16em]"
          style={{ color: "#8C7967" }}
        >
          bKash Merchant Number
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p
            className="text-3xl font-bold sm:text-4xl"
            style={{ color: "#2B2B2B", fontFamily: "Playfair Display, serif" }}
          >
            01810835553
          </p>
          <button
            type="button"
            onClick={handleCopyNumber}
            className="inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-medium transition-colors"
            style={{ backgroundColor: "#2B2B2B", color: "#F8F5F0" }}
          >
            {copied ? "Copied!" : "Copy Number"}
          </button>
        </div>
      </div>

      <ol className="mt-6 space-y-3 text-sm leading-7" style={{ color: "#6E6257" }}>
        <li>1. Open your bKash app.</li>
        <li>2. Tap Payment (not Send Money).</li>
        <li>3. Enter the merchant number above: 01810835553.</li>
        <li>4. Enter the exact amount: {formatBdt(membership.price)}.</li>
        <li>5. Complete the payment using your bKash PIN.</li>
        <li>
          6. You will receive a Transaction ID (TrxID) via SMS confirmation -
          enter it below.
        </li>
      </ol>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="bkash-transaction-id"
            className="block text-sm font-medium"
            style={{ color: "#2B2B2B" }}
          >
            bKash Transaction ID (TrxID)
          </label>
          <input
            id="bkash-transaction-id"
            type="text"
            value={transactionId}
            onChange={(event) => setTransactionId(event.target.value)}
            className="mt-2 h-11 w-full rounded-md border bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors placeholder:text-[#B8A89A] focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
            style={{ borderColor: "#D8C7B5" }}
            placeholder="Enter your TrxID"
          />
        </div>

        <div>
          <label
            htmlFor="bkash-sender-number"
            className="block text-sm font-medium"
            style={{ color: "#2B2B2B" }}
          >
            The bKash number you paid from
          </label>
          <div className="brand-phone-input-wrapper mt-2">
            <PhoneInput
              id="bkash-sender-number"
              international
              countryCallingCodeEditable={false}
              defaultCountry="BD"
              value={senderNumber}
              onChange={(value) => setSenderNumber(value ?? "")}
              className="brand-phone-input"
              numberInputProps={{
                required: true,
                autoComplete: "tel",
              }}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="bkash-proof"
            className="block text-sm font-medium"
            style={{ color: "#2B2B2B" }}
          >
            Upload payment confirmation screenshot (optional but recommended)
          </label>
          <div className="mt-2">
            <FileUploadButton
              onFileSelected={(file) => {
                if (uploadingProof || isSubmitting) {
                  return;
                }

                void handleProofUpload(file);
              }}
              label={uploadingProof ? "Uploading..." : "Choose Screenshot"}
              accept="image/*"
              currentPreviewUrl={proofImageUrl || undefined}
            />
          </div>
          {uploadingProof ? (
            <p className="mt-2 text-sm" style={{ color: "#B8A89A" }}>
              Uploading screenshot...
            </p>
          ) : null}
          {proofImageUrl ? (
            <a
              href={proofImageUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm underline"
              style={{ color: "#C6A56B" }}
            >
              View uploaded screenshot
            </a>
          ) : null}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting || uploadingProof}
          className="inline-flex h-12 w-full items-center justify-center rounded-md px-5 text-sm font-medium transition-colors"
          style={{
            backgroundColor:
              isSubmitting || uploadingProof ? "#D8C7B5" : "#2B2B2B",
            color: "#F8F5F0",
            cursor:
              isSubmitting || uploadingProof ? "not-allowed" : "pointer",
          }}
        >
          {isSubmitting ? "Submitting..." : "Submit bKash Payment"}
        </button>
      </form>

      <div
        className="mt-6 rounded-2xl border"
        style={{ borderColor: "#D8C7B5", backgroundColor: "#FCFAF7" }}
      >
        <button
          type="button"
          onClick={() => setShowQr((current) => !current)}
          className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium"
          style={{ color: "#2B2B2B" }}
        >
          <span>Prefer to scan a QR code instead? (Best if using a second device)</span>
          <span style={{ color: "#C6A56B" }}>{showQr ? "Hide" : "Show"}</span>
        </button>

        {showQr ? (
          <div className="border-t px-5 py-5" style={{ borderColor: "#D8C7B5" }}>
            <div className="mx-auto max-w-xs overflow-hidden rounded-2xl border bg-white p-3" style={{ borderColor: "#D8C7B5" }}>
              <div className="relative aspect-square w-full">
                <Image
                  src="/images/bkash-qr.jpeg"
                  alt="bKash QR code"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        ) : null}
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
      `}</style>
    </section>
  );
}

function BankTransferManualPaymentForm({
  tier,
  membership,
}: {
  tier: MembershipTier;
  membership: MembershipTierDetails;
}) {
  const router = useRouter();
  const [transactionRef, setTransactionRef] = useState("");
  const [proofImageUrl, setProofImageUrl] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function handleCopyAccountNumber() {
    try {
      await navigator.clipboard.writeText(BRAC_BANK_DETAILS.accountNumber);
      setCopied(true);
    } catch {
      setError("Unable to copy the account number right now.");
    }
  }

  async function handleProofUpload(file: File) {
    setUploadingProof(true);
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
      setUploadingProof(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!transactionRef.trim() && !proofImageUrl.trim()) {
      setError(
        "Please provide either a Transaction ID or a payment confirmation screenshot.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/membership/manual-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tier,
          paymentMethod: "BANK_TRANSFER",
          transactionRef: transactionRef.trim(),
          proofImageUrl: proofImageUrl.trim() || null,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | ManualPaymentResponse
        | null;

      if (!response.ok || !data?.membershipId) {
        throw new Error(data?.error ?? "Unable to submit your payment.");
      }

      router.push(
        `/membership/pending-verification?id=${encodeURIComponent(
          data.membershipId,
        )}`,
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit your payment.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      className="rounded-2xl border bg-white p-6"
      style={{ borderColor: "#D8C7B5" }}
    >
      <h2
        className="text-xl font-semibold"
        style={{
          color: "#2B2B2B",
          fontFamily: "Playfair Display, serif",
        }}
      >
        Bank Transfer
      </h2>

      <div
        className="mt-5 rounded-2xl border px-5 py-5"
        style={{
          borderColor: "#C6A56B",
          backgroundColor: "rgba(198, 165, 107, 0.08)",
        }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-[0.16em]"
          style={{ color: "#8C7967" }}
        >
          BRAC Bank Account Details
        </p>

        <div className="mt-4 space-y-4 text-sm" style={{ color: "#2B2B2B" }}>
          <div>
            <p className="font-medium" style={{ color: "#8C7967" }}>
              Bank Name
            </p>
            <p className="mt-1 text-base font-semibold">
              {BRAC_BANK_DETAILS.bankName}
            </p>
          </div>

          <div>
            <p className="font-medium" style={{ color: "#8C7967" }}>
              Account Name
            </p>
            <p className="mt-1 text-base font-semibold">
              {BRAC_BANK_DETAILS.accountName}
            </p>
          </div>

          <div>
            <p className="font-medium" style={{ color: "#8C7967" }}>
              Account Number
            </p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p
                className="text-2xl font-bold sm:text-3xl"
                style={{
                  color: "#2B2B2B",
                  fontFamily: "Playfair Display, serif",
                }}
              >
                {BRAC_BANK_DETAILS.accountNumber}
              </p>
              <button
                type="button"
                onClick={handleCopyAccountNumber}
                className="inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-medium transition-colors"
                style={{ backgroundColor: "#2B2B2B", color: "#F8F5F0" }}
              >
                {copied ? "Copied!" : "Copy Number"}
              </button>
            </div>
          </div>

          <div>
            <p className="font-medium" style={{ color: "#8C7967" }}>
              Branch
            </p>
            <p className="mt-1 text-base font-semibold">
              {BRAC_BANK_DETAILS.branchName}
            </p>
          </div>
        </div>
      </div>

      <ol className="mt-6 space-y-3 text-sm leading-7" style={{ color: "#6E6257" }}>
        <li>
          1. Transfer the exact membership amount to the account above via
          your bank app or branch visit.
        </li>
        <li>2. Note down your transaction reference number.</li>
        <li>3. Enter the details below.</li>
      </ol>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="bank-transfer-ref"
            className="block text-sm font-medium"
            style={{ color: "#2B2B2B" }}
          >
            Transaction Reference Number
          </label>
          <input
            id="bank-transfer-ref"
            type="text"
            value={transactionRef}
            onChange={(event) => setTransactionRef(event.target.value)}
            className="mt-2 h-11 w-full rounded-md border bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors placeholder:text-[#B8A89A] focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
            style={{ borderColor: "#D8C7B5" }}
            placeholder="Enter your transfer reference"
          />
        </div>

        <div>
          <label
            htmlFor="bank-transfer-proof"
            className="block text-sm font-medium"
            style={{ color: "#2B2B2B" }}
          >
            Upload payment confirmation screenshot (optional but recommended)
          </label>
          <div className="mt-2">
            <FileUploadButton
              onFileSelected={(file) => {
                if (uploadingProof || isSubmitting) {
                  return;
                }

                void handleProofUpload(file);
              }}
              label={uploadingProof ? "Uploading..." : "Choose Screenshot"}
              accept="image/*"
              currentPreviewUrl={proofImageUrl || undefined}
            />
          </div>
          {uploadingProof ? (
            <p className="mt-2 text-sm" style={{ color: "#B8A89A" }}>
              Uploading screenshot...
            </p>
          ) : null}
          {proofImageUrl ? (
            <a
              href={proofImageUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm underline"
              style={{ color: "#C6A56B" }}
            >
              View uploaded screenshot
            </a>
          ) : null}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting || uploadingProof}
          className="inline-flex h-12 w-full items-center justify-center rounded-md px-5 text-sm font-medium transition-colors"
          style={{
            backgroundColor:
              isSubmitting || uploadingProof ? "#D8C7B5" : "#2B2B2B",
            color: "#F8F5F0",
            cursor:
              isSubmitting || uploadingProof ? "not-allowed" : "pointer",
          }}
        >
          {isSubmitting ? "Submitting..." : "Submit Bank Transfer"}
        </button>
      </form>
    </section>
  );
}

function MembershipPaymentPageContent() {
  const searchParams = useSearchParams();
  const tier = useMemo(
    () => parseTier(searchParams.get("tier")),
    [searchParams],
  );
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bkash" | "bank">(
    "bkash",
  );

  if (!tier) {
    return (
      <section
        className="flex min-h-screen flex-1 bg-[#F8F5F0] px-6 py-16"
      >
        <div className="mx-auto w-full max-w-5xl">
          <h1
            className="text-3xl font-bold sm:text-4xl"
            style={{
              color: "#2B2B2B",
              fontFamily: "Playfair Display, serif",
            }}
          >
            Membership Payment
          </h1>
          <p className="mt-4 text-sm" style={{ color: "#B8A89A" }}>
            A valid membership tier is required to continue.
          </p>
        </div>
      </section>
    );
  }

  const membership = MEMBERSHIPS[tier];
  const isTierAvailable = isMembershipAvailable(tier);

  const cardPaymentsAvailable = Boolean(stripePublishableKey && stripePromise);

  if (!isTierAvailable) {
    return (
      <section className="flex flex-1 bg-[#F8F5F0] px-6 py-16">
        <div className="mx-auto w-full max-w-4xl">
          <div
            className="rounded-2xl border bg-white p-8 text-center"
            style={{ borderColor: "#D8C7B5" }}
          >
            <div
              className="mx-auto inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{
                backgroundColor: "#2B2B2B",
                color: "#F8F5F0",
              }}
            >
              Coming Soon
            </div>
            <h1
              className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl"
              style={{
                color: "#2B2B2B",
                fontFamily: "Playfair Display, serif",
              }}
            >
              {membership.name} is not available yet
            </h1>
            <p
              className="mx-auto mt-4 max-w-2xl text-sm leading-7 sm:text-base"
              style={{ color: "#6E6257" }}
            >
              We are preparing this membership for launch. Please sit tight — we will make it available soon.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="/services"
                className="inline-flex h-12 items-center justify-center rounded-md px-5 text-sm font-medium transition-colors hover:bg-[#B8A89A]"
                style={{
                  backgroundColor: "#2B2B2B",
                  color: "#F8F5F0",
                }}
              >
                Back to Memberships
              </a>
              <a
                href="/contact"
                className="inline-flex h-12 items-center justify-center rounded-md border px-5 text-sm font-medium transition-colors"
                style={{
                  borderColor: "#D8C7B5",
                  backgroundColor: "#F8F5F0",
                  color: "#2B2B2B",
                }}
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-1 bg-[#F8F5F0] px-6 py-16">
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-2xl">
          <h1
            className="text-3xl font-bold tracking-tight sm:text-4xl"
            style={{
              color: "#2B2B2B",
              fontFamily: "Playfair Display, serif",
            }}
          >
            Membership Payment
          </h1>
          <p className="mt-4 text-base leading-7" style={{ color: "#B8A89A" }}>
            Complete your payment to secure your Selenite Care membership.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
          <div className="order-2 flex flex-col gap-6 lg:order-1">
            <div
              className="flex flex-wrap gap-2 rounded-2xl border bg-white p-1"
              style={{ borderColor: "#D8C7B5" }}
            >
              {/*
                Card payments are temporarily unavailable.
                Re-enable this tab button when Stripe card checkout is ready again.
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                disabled={!cardPaymentsAvailable}
                className="h-11 rounded-xl px-5 text-sm font-medium transition-colors"
                style={{
                  backgroundColor:
                    paymentMethod === "card" ? "#2B2B2B" : "transparent",
                  color: paymentMethod === "card" ? "#F8F5F0" : "#B8A89A",
                  cursor: !cardPaymentsAvailable ? "not-allowed" : "pointer",
                  opacity: !cardPaymentsAvailable ? 0.5 : 1,
                }}
              >
                Pay with Card
              </button>
              */}
              <button
                type="button"
                onClick={() => setPaymentMethod("bkash")}
                className="h-11 rounded-xl px-5 text-sm font-medium transition-colors"
                style={{
                  backgroundColor:
                    paymentMethod === "bkash" ? "#2B2B2B" : "transparent",
                  color: paymentMethod === "bkash" ? "#F8F5F0" : "#B8A89A",
                }}
              >
                bKash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("bank")}
                className="h-11 rounded-xl px-5 text-sm font-medium transition-colors"
                style={{
                  backgroundColor:
                    paymentMethod === "bank" ? "#2B2B2B" : "transparent",
                  color: paymentMethod === "bank" ? "#F8F5F0" : "#B8A89A",
                }}
              >
                Bank Transfer
              </button>
            </div>

            {/*
              Card payments are temporarily unavailable.
              Re-enable this content block when Stripe card checkout is ready again.
            {paymentMethod === "card" ? (
              cardPaymentsAvailable ? (
                <MembershipPaymentForm tier={tier} membership={membership} />
              ) : (
                <section
                  className="rounded-2xl border bg-white p-6"
                  style={{ borderColor: "#D8C7B5" }}
                >
                  <h2
                    className="text-xl font-semibold"
                    style={{
                      color: "#2B2B2B",
                      fontFamily: "Playfair Display, serif",
                    }}
                  >
                    Card Payment
                  </h2>
                  <p
                    className="mt-4 text-sm leading-6"
                    style={{ color: "#B8A89A" }}
                  >
                    Card payment is currently unavailable. Please use the bKash
                    option below.
                  </p>
                </section>
              )
            ) : paymentMethod === "bkash" ? (
              <BkashManualPaymentForm tier={tier} membership={membership} />
            ) : (
              <BankTransferManualPaymentForm tier={tier} membership={membership} />
            )}
            */}

            {paymentMethod === "bkash" ? (
              <BkashManualPaymentForm tier={tier} membership={membership} />
            ) : (
              <BankTransferManualPaymentForm tier={tier} membership={membership} />
            )}
          </div>

          <aside
            className="order-1 h-fit rounded-2xl border bg-white p-6 lg:order-2"
            style={{ borderColor: "#D8C7B5" }}
          >
            <h2
              className="text-xl font-semibold"
              style={{
                color: "#2B2B2B",
                fontFamily: "Playfair Display, serif",
              }}
            >
              Order Summary
            </h2>

            <div className="mt-5">
              <p className="text-base font-semibold" style={{ color: "#2B2B2B" }}>
                {membership.name}
              </p>
              {tier === "SIGNATURE" && membership.originalPrice ? (
                <>
                  <div
                    className="mt-3 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
                    style={{
                      backgroundColor: "#2B2B2B",
                      color: "#F8F5F0",
                    }}
                  >
                    LIMITED TIME - 51% OFF
                  </div>
                  <div className="mt-3 flex flex-wrap items-baseline gap-3">
                    <span
                      className="text-sm font-semibold"
                      style={{
                        color: "#8C7967",
                        textDecoration: "line-through",
                        textDecorationThickness: "1.5px",
                      }}
                    >
                      {formatBdt(membership.originalPrice)}
                    </span>
                    <p
                      className="text-3xl font-semibold"
                      style={{
                        color: "#C6A56B",
                        fontFamily: "Playfair Display, serif",
                      }}
                    >
                      {formatBdt(membership.price)}
                    </p>
                  </div>
                  <p className="mt-2 text-xs leading-6" style={{ color: "#8C7967" }}>
                    Offer valid for a limited time and subject to change.
                  </p>
                </>
              ) : (
                <p
                  className="mt-3 text-2xl font-semibold"
                  style={{
                    color: "#C6A56B",
                    fontFamily: "Playfair Display, serif",
                  }}
                >
                  {formatBdt(membership.price)}
                </p>
              )}
            </div>

            <div className="mt-6 border-t pt-5" style={{ borderColor: "#D8C7B5" }}>
              <p
                className="text-sm font-semibold uppercase tracking-[0.12em]"
                style={{ color: "#8C7967" }}
              >
                Benefits
              </p>
              <ul className="mt-4 space-y-3">
                {membership.benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex gap-2 text-sm leading-6"
                    style={{ color: "#6E6257" }}
                  >
                    <span style={{ color: "#C6A56B" }}>•</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function MembershipPaymentLoadingFallback() {
  return (
    <section className="flex min-h-screen flex-1 bg-[#F8F5F0] px-6 py-16">
      <div className="mx-auto w-full max-w-6xl">
        <p className="text-sm" style={{ color: "#B8A89A" }}>
          Loading...
        </p>
      </div>
    </section>
  );
}

export default function MembershipPaymentPage() {
  const content = (
    <Suspense fallback={<MembershipPaymentLoadingFallback />}>
      <MembershipPaymentPageContent />
    </Suspense>
  );

  if (!stripePublishableKey || !stripePromise) {
    return content;
  }

  return <Elements stripe={stripePromise}>{content}</Elements>;
}
