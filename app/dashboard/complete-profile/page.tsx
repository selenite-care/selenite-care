"use client";

import "react-phone-number-input/style.css";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";

type ProfileResponse = {
  user?: {
    phone: string | null;
    dateOfBirth?: string | null;
    gender?: string | null;
  };
  error?: string;
};

const genderOptions = ["", "Male", "Female", "Other", "Prefer not to say"];

export default function CompleteProfilePage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/dashboard/complete-profile");
      return;
    }

    if (session?.user?.phone) {
      router.replace("/dashboard");
      return;
    }

    async function checkProfile() {
      try {
        const response = await fetch("/api/client/profile");
        const data = (await response.json().catch(() => null)) as
          | ProfileResponse
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load your profile.");
        }

        if (data?.user?.phone) {
          await update({
            user: {
              phone: data.user.phone,
              needsProfileCompletion: false,
            },
          });
          router.replace("/dashboard");
          return;
        }
      } catch (profileError) {
        setError(
          profileError instanceof Error
            ? profileError.message
            : "Unable to load your profile.",
        );
      } finally {
        setIsCheckingProfile(false);
      }
    }

    checkProfile();
  }, [router, session?.user?.phone, status, update]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!phone || !isValidPhoneNumber(phone)) {
      setError("Please enter a valid phone number.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/client/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, dateOfBirth, gender }),
      });
      const data = (await response.json().catch(() => null)) as
        | ProfileResponse
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to save your phone number.");
      }

      const savedPhone = data?.user?.phone ?? phone;

      await update({
        user: {
          phone: savedPhone,
          needsProfileCompletion: false,
        },
      });
      router.refresh();
      router.replace("/dashboard");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save your phone number.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === "loading" || isCheckingProfile) {
    return (
      <section className="bg-page flex min-h-screen flex-1 items-center justify-center px-4">
        <p className="text-muted text-sm">Loading profile...</p>
      </section>
    );
  }

  return (
    <section className="bg-page flex min-h-screen flex-1 items-center justify-center px-4 py-16">
      <div className="mx-auto w-full max-w-md">
        <div className="border-themed bg-card rounded-xl border p-6 shadow-[0_18px_44px_rgba(43,43,43,0.08)] dark:shadow-none sm:p-7">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-[#C6A56B] bg-[#F8F5F0] text-2xl font-semibold text-[#C6A56B] dark:bg-[#1E1C1A]">
              {session?.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name ?? "Google profile"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>
                  {(session?.user?.name ?? session?.user?.email ?? "SC")
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              )}
            </div>
            {session?.user?.name ? (
              <p className="text-page mb-4 text-sm font-medium">
                Welcome, {session.user.name}
              </p>
            ) : null}
            <div className="mx-auto mb-5 h-1 w-16 rounded-full bg-[#C6A56B]" />
            <h1
              className="text-page text-3xl font-semibold tracking-tight sm:text-4xl"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              Complete Your Profile
            </h1>
            <p className="text-muted mt-4 text-sm leading-7">
              Just a few more details to get started.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="phone"
                className="text-page mb-2 block text-sm font-medium"
              >
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="brand-phone-input-wrapper">
                <PhoneInput
                  id="phone"
                  international
                  countryCallingCodeEditable={false}
                  defaultCountry="BD"
                  value={phone}
                  onChange={(value) => setPhone(value ?? "")}
                  className="brand-phone-input"
                  numberInputProps={{
                    autoComplete: "tel",
                    required: true,
                  }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="dateOfBirth"
                className="text-page mb-2 block text-sm font-medium"
              >
                Date of Birth <span className="text-muted">(optional)</span>
              </label>
              <input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(event) => setDateOfBirth(event.target.value)}
                className="h-11 w-full rounded-lg border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
              />
            </div>

            <div>
              <label
                htmlFor="gender"
                className="text-page mb-2 block text-sm font-medium"
              >
                Gender <span className="text-muted">(optional)</span>
              </label>
              <select
                id="gender"
                value={gender}
                onChange={(event) => setGender(event.target.value)}
                className="h-11 w-full rounded-lg border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
              >
                {genderOptions.map((option) => (
                  <option key={option || "empty"} value={option}>
                    {option || "Select gender"}
                  </option>
                ))}
              </select>
            </div>

            {error ? (
              <p className="text-sm leading-6 text-red-600 dark:text-red-400">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex h-11 w-full items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors ${
                isSubmitting
                  ? "cursor-not-allowed bg-[#D8C7B5] text-[#8A7D75] dark:bg-[#3D3530]"
                  : "bg-[#2B2B2B] text-[#F8F5F0] hover:bg-[#3A3734] dark:bg-[#C6A56B] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
              }`}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </form>
        </div>
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
