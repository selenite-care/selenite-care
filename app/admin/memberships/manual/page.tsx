"use client";

import "react-phone-number-input/style.css";

import { FormEvent, useEffect, useMemo, useState } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";

type MembershipTier = "SIGNATURE" | "CRYSTAL" | "PLATINUM";
type PaymentMethod = "CASH" | "BKASH" | "BANK_TRANSFER";

type ManualMembershipFormState = {
  name: string;
  email: string;
  phone: string;
  age: string;
  gender: string;
  address: string;
  tier: MembershipTier;
  amountPaid: string;
  paymentMethod: PaymentMethod;
  purchaseDate: string;
};

type CredentialsModalState = {
  email: string;
  temporaryPassword: string;
};

type ManualMembershipResponse = {
  membership?: {
    id: string;
    membershipId: string;
    tier: MembershipTier;
    status: string;
  };
  userEmail?: string;
  temporaryPassword?: string | null;
  existingUser?: boolean;
  error?: string;
};

const TIER_PRICES: Record<MembershipTier, number> = {
  SIGNATURE: 490,
  CRYSTAL: 2900,
  PLATINUM: 6900,
};

const initialFormState: ManualMembershipFormState = {
  name: "",
  email: "",
  phone: "",
  age: "",
  gender: "Female",
  address: "",
  tier: "SIGNATURE",
  amountPaid: String(TIER_PRICES.SIGNATURE),
  paymentMethod: "CASH",
  purchaseDate: new Date().toISOString().slice(0, 10),
};

export default function AdminManualMembershipPage() {
  const [form, setForm] = useState<ManualMembershipFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [credentialsModal, setCredentialsModal] =
    useState<CredentialsModalState | null>(null);
  const [isPasswordCopied, setIsPasswordCopied] = useState(false);

  const suggestedAmount = useMemo(
    () => TIER_PRICES[form.tier],
    [form.tier],
  );

  useEffect(() => {
    setForm((current) => ({
      ...current,
      amountPaid: String(TIER_PRICES[current.tier]),
    }));
  }, [form.tier]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!form.phone || !isValidPhoneNumber(form.phone)) {
      setError("Please enter a valid phone number.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/memberships/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          age: form.age,
          gender: form.gender,
          address: form.address,
          tier: form.tier,
          amountPaid: Number(form.amountPaid),
          paymentMethod: form.paymentMethod,
          purchaseDate: form.purchaseDate,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | ManualMembershipResponse
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to create manual membership.");
      }

      if (data?.temporaryPassword && data.userEmail) {
        setCredentialsModal({
          email: data.userEmail,
          temporaryPassword: data.temporaryPassword,
        });
        setIsPasswordCopied(false);
      } else {
        setSuccessMessage("Membership added to existing account.");
      }

      setForm({
        ...initialFormState,
        purchaseDate: new Date().toISOString().slice(0, 10),
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create manual membership.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopyPassword() {
    if (!credentialsModal?.temporaryPassword) {
      return;
    }

    try {
      await navigator.clipboard.writeText(credentialsModal.temporaryPassword);
      setIsPasswordCopied(true);
    } catch {
      setError("Unable to copy password. Please copy it manually.");
    }
  }

  return (
    <section className="space-y-8">
      {credentialsModal ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="manual-membership-created-title"
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
          style={{ backgroundColor: "rgba(43, 43, 43, 0.72)" }}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border p-6 shadow-2xl"
            style={{
              backgroundColor: "#FFFFFF",
              borderColor: "#D8C7B5",
              boxShadow: "0 24px 80px rgba(43, 43, 43, 0.28)",
            }}
          >
            <h2
              id="manual-membership-created-title"
              className="text-xl font-semibold"
              style={{
                color: "#2B2B2B",
                fontFamily: "Playfair Display, serif",
              }}
            >
              Membership Created Successfully
            </h2>
            <p className="mt-3 text-sm leading-6" style={{ color: "#B8A89A" }}>
              Share these credentials with the customer over phone. This
              password will not be shown again.
            </p>

            <div
              className="mt-5 space-y-4 rounded-lg border p-4"
              style={{
                backgroundColor: "#F8F5F0",
                borderColor: "#D8C7B5",
              }}
            >
              <div>
                <p
                  className="text-xs font-medium uppercase tracking-wide"
                  style={{ color: "#B8A89A" }}
                >
                  Email
                </p>
                <p
                  className="mt-1 break-all font-mono text-sm"
                  style={{ color: "#2B2B2B" }}
                >
                  {credentialsModal.email}
                </p>
              </div>

              <div>
                <p
                  className="text-xs font-medium uppercase tracking-wide"
                  style={{ color: "#B8A89A" }}
                >
                  Temporary Password
                </p>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <code
                    className="flex-1 rounded-md border bg-white px-3 py-2 text-sm font-semibold"
                    style={{
                      borderColor: "#D8C7B5",
                      color: "#2B2B2B",
                    }}
                  >
                    {credentialsModal.temporaryPassword}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors hover:opacity-90"
                    style={{
                      backgroundColor: "#2B2B2B",
                      color: "#F8F5F0",
                    }}
                  >
                    {isPasswordCopied ? "Copied" : "Copy Password"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setCredentialsModal(null)}
                className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors hover:bg-[#C6A56B]/10"
                style={{
                  borderColor: "#C6A56B",
                  color: "#2B2B2B",
                  backgroundColor: "#FFFFFF",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Add Membership
        </h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Add a membership manually for walk-in customers or verified offline
          payments.
        </p>
      </div>

      <div
        className="rounded-lg border bg-white p-6"
        style={{ borderColor: "#D8C7B5" }}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-[#2B2B2B]"
              >
                Full Name
              </label>
              <input
                id="name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                required
                className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#2B2B2B]"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                required
                className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-[#2B2B2B]"
              >
                Phone
              </label>
              <div className="brand-phone-input-wrapper mt-2">
                <PhoneInput
                  id="phone"
                  international
                  countryCallingCodeEditable={false}
                  defaultCountry="BD"
                  value={form.phone}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      phone: value ?? "",
                    }))
                  }
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
                htmlFor="age"
                className="block text-sm font-medium text-[#2B2B2B]"
              >
                Age
              </label>
              <input
                id="age"
                value={form.age}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    age: event.target.value,
                  }))
                }
                className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
              />
            </div>

            <div>
              <label
                htmlFor="gender"
                className="block text-sm font-medium text-[#2B2B2B]"
              >
                Gender
              </label>
              <select
                id="gender"
                value={form.gender}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    gender: event.target.value,
                  }))
                }
                className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="purchaseDate"
                className="block text-sm font-medium text-[#2B2B2B]"
              >
                Purchase Date
              </label>
              <input
                id="purchaseDate"
                type="date"
                value={form.purchaseDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    purchaseDate: event.target.value,
                  }))
                }
                required
                className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-[#2B2B2B]"
            >
              Address
            </label>
            <textarea
              id="address"
              value={form.address}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  address: event.target.value,
                }))
              }
              rows={4}
              className="mt-2 w-full resize-none rounded-md border border-[#D8C7B5] bg-white px-3 py-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <label
                htmlFor="tier"
                className="block text-sm font-medium text-[#2B2B2B]"
              >
                Membership Tier
              </label>
              <select
                id="tier"
                value={form.tier}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    tier: event.target.value as MembershipTier,
                  }))
                }
                className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
              >
                <option value="SIGNATURE">Signature</option>
                <option value="CRYSTAL">Crystal</option>
                <option value="PLATINUM">Platinum</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="amountPaid"
                className="block text-sm font-medium text-[#2B2B2B]"
              >
                Amount Paid in BDT
              </label>
              <input
                id="amountPaid"
                type="number"
                min="0"
                step="1"
                value={form.amountPaid}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    amountPaid: event.target.value,
                  }))
                }
                required
                className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
              />
              <p className="mt-2 text-xs" style={{ color: "#B8A89A" }}>
                Suggested amount: {suggestedAmount} BDT
              </p>
            </div>

            <div>
              <label
                htmlFor="paymentMethod"
                className="block text-sm font-medium text-[#2B2B2B]"
              >
                Payment Method
              </label>
              <select
                id="paymentMethod"
                value={form.paymentMethod}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    paymentMethod: event.target.value as PaymentMethod,
                  }))
                }
                className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
              >
                <option value="CASH">Cash</option>
                <option value="BKASH">bKash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {successMessage ? (
            <div
              className="rounded-md border px-4 py-3 text-sm"
              style={{
                borderColor: "#C6A56B",
                backgroundColor: "rgba(198, 165, 107, 0.08)",
                color: "#2B2B2B",
              }}
            >
              {successMessage}
            </div>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                backgroundColor: "#2B2B2B",
                color: "#F8F5F0",
              }}
            >
              {isSubmitting ? "Saving..." : "Add Membership"}
            </button>
          </div>
        </form>
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
