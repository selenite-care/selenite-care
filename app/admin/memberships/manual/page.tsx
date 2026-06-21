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
  dateOfBirth: string;
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
  CRYSTAL: 3990,
  PLATINUM: 9990,
};

const initialFormState: ManualMembershipFormState = {
  name: "",
  email: "",
  phone: "",
  age: "",
  dateOfBirth: "",
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
  const [errorVariant, setErrorVariant] = useState<"error" | "warning">("error");
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
    setErrorVariant("error");
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
          dateOfBirth: form.dateOfBirth,
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
        const message = data?.error ?? "Unable to create manual membership.";

        if (response.status === 409) {
          setErrorVariant("warning");
        }

        throw new Error(message);
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
    <section className="space-y-8 bg-[#F8F5F0] dark:bg-[#1A1814]">
      {credentialsModal ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="manual-membership-created-title"
          className="modal-overlay fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
          style={{ backgroundColor: "rgba(43, 43, 43, 0.72)" }}
        >
          <div
            className="modal-card max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-[#D8C7B5] bg-white p-6 shadow-2xl dark:border-[#3D3530] dark:bg-[#242220]"
            style={{
              boxShadow: "0 24px 80px rgba(43, 43, 43, 0.28)",
            }}
          >
            <h2
              id="manual-membership-created-title"
              className="text-xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
              style={{
                fontFamily: "Playfair Display, serif",
              }}
            >
              Membership Created Successfully
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#B8A89A] dark:text-[#8A7D75]">
              Share these credentials with the customer over phone. This
              password will not be shown again.
            </p>

            <div
              className="mt-5 space-y-4 rounded-lg border border-[#D8C7B5] bg-[#F8F5F0] p-4 dark:border-[#3D3530] dark:bg-[#2A2724]"
            >
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#B8A89A] dark:text-[#8A7D75]">
                  Email
                </p>
                <p className="mt-1 break-all font-mono text-sm text-[#2B2B2B] dark:text-[#F0EDE8]">
                  {credentialsModal.email}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#B8A89A] dark:text-[#8A7D75]">
                  Temporary Password
                </p>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <code className="flex-1 rounded-md border border-[#D8C7B5] bg-white px-3 py-2 text-sm font-semibold text-[#2B2B2B] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]">
                    {credentialsModal.temporaryPassword}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-[#2B2B2B] px-4 text-sm font-medium text-[#F8F5F0] transition-colors hover:opacity-90 dark:bg-[#C6A56B] dark:text-[#141210]"
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
                className="inline-flex h-10 items-center justify-center rounded-md border border-[#C6A56B] bg-white px-4 text-sm font-medium text-[#2B2B2B] transition-colors hover:bg-[#C6A56B]/10 dark:bg-[#242220] dark:text-[#F0EDE8]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div>
        <h1
          className="text-3xl font-semibold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8]"
          style={{
            fontFamily: "Playfair Display, serif",
          }}
        >
          Add Membership
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#B8A89A] dark:text-[#8A7D75]">
          Add a membership manually for walk-in customers or verified offline
          payments.
        </p>
      </div>

      <div className="rounded-lg border border-[#D8C7B5] bg-white p-6 dark:border-[#3D3530] dark:bg-[#242220]">
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
                htmlFor="dateOfBirth"
                className="block text-sm font-medium text-[#2B2B2B]"
              >
                Date of Birth
              </label>
              <input
                id="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    dateOfBirth: event.target.value,
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
              <p className="mt-2 text-xs text-[#B8A89A] dark:text-[#8A7D75]">
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

          {error ? (
            <div
              className={`rounded-md border px-4 py-3 text-sm leading-6 ${
                errorVariant === "warning"
                  ? "border-[#C6A56B] bg-[rgba(198,165,107,0.10)] text-[#2B2B2B] dark:text-[#F0EDE8]"
                  : "border-red-200 bg-red-50 text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
              }`}
            >
              {error}
            </div>
          ) : null}
          {successMessage ? (
            <div
              className="rounded-md border border-[#C6A56B] bg-[rgba(198,165,107,0.08)] px-4 py-3 text-sm text-[#2B2B2B] dark:text-[#F0EDE8]"
            >
              {successMessage}
            </div>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#C6A56B] dark:text-[#141210]"
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
