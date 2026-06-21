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
      "60 Days of Unlimited Skincare Support",
      "Skin, Body & Hair Problem Analysis: Self-submitted photo review, Online skin assessment form",
      "Online and Offline Consultation with Skin Doctor / Aestheticians",
      "Personalized Product Recommendation List",
      "Skin Report Card",
      "Personalized Morning & Night Skincare Routine",
      "Before & After Consultation Support",
    ],
  },
  CRYSTAL: {
    name: "Crystal Membership",
    price: 3990,
    benefits: [
      "1 Year Specialist Support (Online & Offline)",
      "Specialist Access: Aesthetician Consultation, Nutritionist Consultation, Psychiatrist Consultation",
      "Personalized Support: 12 Months of Online Support",
      "Advanced Skin, Body & Hair Problem Assessment: Detailed Skin Analysis, Problem Identification & Concern Mapping covering Acne, Pigmentation, Dehydration, Sensitivity, Dullness, Other Skin Concerns",
      "Lifestyle Evaluation: Lifestyle & Skincare Habit Review",
      "Customized Care Plan: Personalized Product Recommendation List, Skin Report Card, Personalized Morning & Night Skincare Routine",
    ],
  },
  PLATINUM: {
    name: "Platinum Membership",
    price: 9990,
    benefits: [
      "3 Years Specialist Support on both Online & Offline",
      "5% off on Product Purchase for Validate Time of Membership",
      "Specialist Access: Aesthetician Consultation, Nutritionist Consultation, Psychiatrist Consultation",
      "Premium Support: 36 Months of Online Support",
      "Advanced Skin, Body & Hair Problem Mapping & Analysis: Deep Skin Concern Analysis, Trigger Identification, Skin Barrier Assessment",
      "Psychological Wellness Review: Stress Level Assessment, Lifestyle Impact Analysis",
      "Nutritional Assessment: Nutritional Value Analysis, Diet & Skin Health Evaluation",
      "Customized Care Plan: Personalized Product Recommendation List, Skin Report Card, Personalized Morning & Night Skincare Routine",
      "Skin Transformation Program: Skin Transformation Roadmap every 60 Days, Product Layering Strategy, Seasonal Skincare Adjustments",
      "Progress Monitoring: Professional Before-and-After Documentation, Monthly Skin Scoring, Routine Modifications Based on Skin Progress, Continuous Improvement Tracking",
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
      className="rounded-2xl border bg-white p-6 dark:bg-[#242220] dark:border-[#3D3530]"
      style={{ borderColor: "#D8C7B5" }}
    >
      <h2
        className="text-xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
        style={{
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
    <section className="rounded-2xl border border-[#D8C7B5] bg-white p-6 dark:border-[#3D3530] dark:bg-[#242220]">
      <h2
        className="text-xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
        style={{
          fontFamily: "Playfair Display, serif",
        }}
      >
        Pay with bKash
      </h2>

      <div className="mt-5 rounded-2xl border border-[#C6A56B] bg-[rgba(198,165,107,0.08)] px-5 py-5 dark:bg-[rgba(198,165,107,0.12)]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8C7967] dark:text-[#8A7D75]">
          bKash Merchant Number
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p
            className="text-3xl font-bold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-4xl"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            01810835553
          </p>
          <button
            type="button"
            onClick={handleCopyNumber}
            className="inline-flex h-11 items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors hover:opacity-90 dark:bg-[#C6A56B] dark:text-[#141210]"
          >
            {copied ? "Copied!" : "Copy Number"}
          </button>
        </div>
      </div>

      <ol className="mt-6 space-y-3 text-sm leading-7 text-[#6E6257] dark:text-[#8A7D75]">
        <li>1. Open your bKash app.</li>
        <li>2. Tap Payment (not Send Money).</li>
        <li>3. Enter the merchant number above: 01810835553.</li>
        <li>4. Enter the exact amount: {formatBdt(membership.price)}. or your membership won't be activated.</li>
        <li>5. Complete the payment using your bKash PIN.</li>
        <li>
          6. You will receive a Transaction ID (TrxID) via SMS confirmation -
          enter it below.
        </li>
        <li>
          7. You can include either the Transaction ID or a screenshot of your payment confirmation as proof of payment.
        </li>
      </ol>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="bkash-transaction-id"
            className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
          >
            bKash Transaction ID (TrxID)
          </label>
          <input
            id="bkash-transaction-id"
            type="text"
            value={transactionId}
            onChange={(event) => setTransactionId(event.target.value)}
            className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors placeholder:text-[#B8A89A] focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8] dark:placeholder:text-[#8A7D75]"
            placeholder="Enter your TrxID"
          />
        </div>

        <div>
          <label
            htmlFor="bkash-sender-number"
            className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
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
            className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
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
            <p className="mt-2 text-sm text-[#B8A89A] dark:text-[#8A7D75]">
              Uploading screenshot...
            </p>
          ) : null}
          {proofImageUrl ? (
            <a
              href={proofImageUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm text-[#C6A56B] underline"
            >
              View uploaded screenshot
            </a>
          ) : null}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting || uploadingProof}
          className={`inline-flex h-12 w-full items-center justify-center rounded-md px-5 text-sm font-medium transition-colors ${
            isSubmitting || uploadingProof
              ? "cursor-not-allowed bg-[#D8C7B5] text-[#F8F5F0] dark:bg-[#3D3530] dark:text-[#8A7D75]"
              : "bg-[#2B2B2B] text-[#F8F5F0] hover:opacity-90 dark:bg-[#C6A56B] dark:text-[#141210]"
          }`}
        >
          {isSubmitting ? "Submitting..." : "Submit bKash Payment"}
        </button>
      </form>

      <div className="mt-6 rounded-2xl border border-[#D8C7B5] bg-[#FCFAF7] dark:border-[#3D3530] dark:bg-[#1A1814]">
        <button
          type="button"
          onClick={() => setShowQr((current) => !current)}
          className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
        >
          <span>Prefer to scan a QR code instead? (Best if using a second device)</span>
          <span className="text-[#C6A56B]">{showQr ? "Hide" : "Show"}</span>
        </button>

        {showQr ? (
          <div className="border-t border-[#D8C7B5] px-5 py-5 dark:border-[#3D3530]">
            <div className="mx-auto max-w-xs overflow-hidden rounded-2xl border border-[#D8C7B5] bg-white p-3 dark:border-[#3D3530] dark:bg-[#242220]">
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
    <section className="rounded-2xl border border-[#D8C7B5] bg-white p-6 dark:border-[#3D3530] dark:bg-[#242220]">
      <h2
        className="text-xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
        style={{
          fontFamily: "Playfair Display, serif",
        }}
      >
        Bank Transfer
      </h2>

      <div className="mt-5 rounded-2xl border border-[#C6A56B] bg-[rgba(198,165,107,0.08)] px-5 py-5 dark:bg-[rgba(198,165,107,0.12)]">
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
                onClick={handleCopyAccountNumber}
                className="inline-flex h-11 items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors hover:opacity-90 dark:bg-[#C6A56B] dark:text-[#141210]"
              >
                {copied ? "Copied!" : "Copy Number"}
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

      <ol className="mt-6 space-y-3 text-sm leading-7 text-[#6E6257] dark:text-[#8A7D75]">
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
            className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
          >
            Transaction Reference Number
          </label>
          <input
            id="bank-transfer-ref"
            type="text"
            value={transactionRef}
            onChange={(event) => setTransactionRef(event.target.value)}
            className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors placeholder:text-[#B8A89A] focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8] dark:placeholder:text-[#8A7D75]"
            placeholder="Enter your transfer reference"
          />
        </div>

        <div>
          <label
            htmlFor="bank-transfer-proof"
            className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
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
            <p className="mt-2 text-sm text-[#B8A89A] dark:text-[#8A7D75]">
              Uploading screenshot...
            </p>
          ) : null}
          {proofImageUrl ? (
            <a
              href={proofImageUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm text-[#C6A56B] underline"
            >
              View uploaded screenshot
            </a>
          ) : null}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting || uploadingProof}
          className={`inline-flex h-12 w-full items-center justify-center rounded-md px-5 text-sm font-medium transition-colors ${
            isSubmitting || uploadingProof
              ? "cursor-not-allowed bg-[#D8C7B5] text-[#F8F5F0] dark:bg-[#3D3530] dark:text-[#8A7D75]"
              : "bg-[#2B2B2B] text-[#F8F5F0] hover:opacity-90 dark:bg-[#C6A56B] dark:text-[#141210]"
          }`}
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
        className="flex min-h-screen flex-1 bg-[#F8F5F0] px-6 py-16 dark:bg-[#1A1814]"
      >
        <div className="mx-auto w-full max-w-5xl">
          <h1
            className="text-3xl font-bold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-4xl"
            style={{
              fontFamily: "Playfair Display, serif",
            }}
          >
            Membership Payment
          </h1>
          <p className="mt-4 text-sm text-[#B8A89A] dark:text-[#8A7D75]">
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
      <section className="flex flex-1 bg-[#F8F5F0] px-6 py-16 dark:bg-[#1A1814]">
        <div className="mx-auto w-full max-w-4xl">
          <div className="rounded-2xl border border-[#D8C7B5] bg-white p-8 text-center dark:border-[#3D3530] dark:bg-[#242220]">
            <div className="mx-auto inline-flex rounded-full bg-[#2B2B2B] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F8F5F0] dark:bg-[#C6A56B] dark:text-[#141210]">
              Coming Soon
            </div>
            <h1
              className="mt-5 text-3xl font-bold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-4xl"
              style={{
                fontFamily: "Playfair Display, serif",
              }}
            >
              {membership.name} is not available yet
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#6E6257] dark:text-[#8A7D75] sm:text-base">
              We are preparing this membership for launch. Please sit tight - we will make it available soon.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="/services"
                className="inline-flex h-12 items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#B8A89A] dark:bg-[#C6A56B] dark:text-[#141210]"
              >
                Back to Memberships
              </a>
              <a
                href="/contact"
                className="inline-flex h-12 items-center justify-center rounded-md border bg-[#F8F5F0] px-5 text-sm font-medium text-[#2B2B2B] transition-colors dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8]"
                style={{
                  borderColor: "#D8C7B5",
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
    <section className="flex flex-1 bg-[#F8F5F0] px-6 py-16 dark:bg-[#1A1814]">
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-2xl">
          <h1
            className="text-3xl font-bold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-4xl"
            style={{
              fontFamily: "Playfair Display, serif",
            }}
          >
            Membership Payment
          </h1>
          <p className="mt-4 text-base leading-7 text-[#B8A89A] dark:text-[#8A7D75]">
            Complete your payment to secure your Selenite Care membership.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
          <div className="order-2 flex flex-col gap-6 lg:order-1">
            <div className="flex flex-wrap gap-2 rounded-2xl border border-[#D8C7B5] bg-white p-1 dark:border-[#3D3530] dark:bg-[#242220]">
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
                className={`h-11 rounded-xl px-5 text-sm font-medium transition-colors ${
                  paymentMethod === "bkash"
                    ? "bg-[#2B2B2B] text-[#F8F5F0] dark:bg-[#C6A56B] dark:text-[#141210]"
                    : "text-[#B8A89A] hover:bg-black/5 dark:text-[#8A7D75] dark:hover:bg-white/5"
                }`}
              >
                bKash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("bank")}
                className={`h-11 rounded-xl px-5 text-sm font-medium transition-colors ${
                  paymentMethod === "bank"
                    ? "bg-[#2B2B2B] text-[#F8F5F0] dark:bg-[#C6A56B] dark:text-[#141210]"
                    : "text-[#B8A89A] hover:bg-black/5 dark:text-[#8A7D75] dark:hover:bg-white/5"
                }`}
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

          <aside className="order-1 h-fit rounded-2xl border border-[#D8C7B5] bg-white p-6 dark:border-[#3D3530] dark:bg-[#242220] lg:order-2">
            <h2
              className="text-xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
              style={{
                fontFamily: "Playfair Display, serif",
              }}
            >
              Order Summary
            </h2>

            <div className="mt-5">
              <p className="text-base font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                {membership.name}
              </p>
              {tier === "SIGNATURE" && membership.originalPrice ? (
                <>
                  <div className="mt-3 inline-flex rounded-full bg-[#2B2B2B] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F8F5F0] dark:bg-[#C6A56B] dark:text-[#141210]">
                    LIMITED TIME - 51% OFF
                  </div>
                  <div className="mt-3 flex flex-wrap items-baseline gap-3">
                    <span className="text-sm font-semibold text-[#8C7967] line-through decoration-[1.5px] dark:text-[#8A7D75]">
                      {formatBdt(membership.originalPrice)}
                    </span>
                    <p
                      className="text-3xl font-semibold text-[#C6A56B]"
                      style={{
                        fontFamily: "Playfair Display, serif",
                      }}
                    >
                      {formatBdt(membership.price)}
                    </p>
                  </div>
                  <p className="mt-2 text-xs leading-6 text-[#8C7967] dark:text-[#8A7D75]">
                    Offer valid for a limited time and subject to change.
                  </p>
                </>
              ) : (
                <p
                  className="mt-3 text-2xl font-semibold text-[#C6A56B]"
                  style={{
                    fontFamily: "Playfair Display, serif",
                  }}
                >
                  {formatBdt(membership.price)}
                </p>
              )}
            </div>

            <div className="mt-6 border-t border-[#D8C7B5] pt-5 dark:border-[#3D3530]">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#8C7967] dark:text-[#8A7D75]">
                Benefits
              </p>
              <ul className="mt-4 space-y-3">
                {membership.benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex gap-2 text-sm leading-6 text-[#6E6257] dark:text-[#8A7D75]"
                  >
                    <span className="text-[#C6A56B]">*</span>
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
    <section className="flex min-h-screen flex-1 bg-[#F8F5F0] px-6 py-16 dark:bg-[#1A1814]">
      <div className="mx-auto w-full max-w-6xl">
        <p className="text-sm text-[#B8A89A] dark:text-[#8A7D75]">
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
