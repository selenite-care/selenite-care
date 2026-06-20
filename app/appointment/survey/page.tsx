"use client";

import Image from "next/image";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FileUploadButton from "@/components/ui/FileUploadButton";

const skinIssuesOptions = [
  "Excess Sebum",
  "Acne & Acne Scars",
  "Hyper Pigmentation",
  "Textured Skin",
  "Dehydrated & Dullness",
  "Fine Lines & Wrinkles",
  "Brown Spots & Freckles",
  "Melassma",
  "Redness and Sensitivity",
  "Suntan & Uneven Skin Tone",
  "Damaged Skin Barrier",
  "Other",
];

const currentProductsOptions = [
  "Makeup remover",
  "Cleansing Oil",
  "Anti-aging cream",
  "Eye cream",
  "Moisturizer",
  "Toner",
  "Lotion",
  "Cleanser",
  "Serum",
  "Other",
];

const allergicOptions = [
  "Vitamin C",
  "Hyaluronic Acid",
  "Niacinamide",
  "Aloe Vera",
  "Turmeric",
  "Cucumber",
  "Milk",
  "Others",
];

type SurveyFormState = {
  name: string;
  age: string;
  phone: string;
  email: string;
  skinType: string;
  usesKoreanProducts: string;
  facingSkinIssues: string;
  skinIssues: string[];
  skinIssueDuration: string;
  currentProducts: string[];
  allergicIngredients: string[];
  allergicIngredientsOther: string;
  doubleCleansePreference: string;
  sleepHours: string;
  waterIntake: string;
  appliesSunscreen: string;
  regularPeriodCycle: string;
  usedSteroidBasedNightCream: string;
  note: string;
  skinImages: string[];
};

function AppointmentSurveyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const doctorId = searchParams.get("doctorId") ?? "";
  const preferredDate = searchParams.get("date") ?? "";

  const [formState, setFormState] = useState<SurveyFormState>({
    name: "",
    age: "",
    phone: "",
    email: "",
    skinType: "",
    usesKoreanProducts: "no",
    facingSkinIssues: "no",
    skinIssues: [],
    skinIssueDuration: "",
    currentProducts: [],
    allergicIngredients: [],
    allergicIngredientsOther: "",
    doubleCleansePreference: "No",
    sleepHours: "6-8 Hours",
    waterIntake: "1-2 Litres",
    appliesSunscreen: "no",
    regularPeriodCycle: "no",
    usedSteroidBasedNightCream: "no",
    note: "",
    skinImages: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingSkinImage, setIsUploadingSkinImage] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/client/profile");

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          user?: {
            name?: string | null;
            email?: string | null;
            phone?: string | null;
          };
        };

        setFormState((current) => ({
          ...current,
          name: current.name || data.user?.name || "",
          email: current.email || data.user?.email || "",
          phone: current.phone || data.user?.phone || "",
        }));
      } catch {
        // keep form editable if prefill fails
      }
    }

    loadProfile();
  }, []);

  function updateField<K extends keyof SurveyFormState>(
    field: K,
    value: SurveyFormState[K],
  ) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  function toggleArrayField(
    field: "skinIssues" | "currentProducts" | "allergicIngredients",
    value: string,
  ) {
    setFormState((current) => {
      const currentValues = current[field];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      return { ...current, [field]: nextValues };
    });
  }

  async function handleSkinImageUpload(file: File) {
    setError("");
    if (formState.skinImages.length >= 4) {
      setError("You can upload up to 4 skin photos.");
      return;
    }

    setIsUploadingSkinImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/booking/upload-skin-image", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json().catch(() => null)) as
        | { secure_url?: string; error?: string }
        | null;

      if (!response.ok || !data?.secure_url) {
        throw new Error(data?.error ?? "Failed to upload skin image.");
      }

      setFormState((current) => ({
        ...current,
        skinImages: [...current.skinImages, data.secure_url as string].slice(0, 4),
      }));
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Failed to upload skin image.",
      );
    } finally {
      setIsUploadingSkinImage(false);
    }
  }

  function removeSkinImage(url: string) {
    setFormState((current) => ({
      ...current,
      skinImages: current.skinImages.filter((imageUrl) => imageUrl !== url),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!doctorId || !preferredDate) {
      setError("Doctor ID and preferred date are required.");
      setIsSubmitting(false);
      return;
    }

    const allergicIngredients = formState.allergicIngredients
      .filter((item) => item !== "Others")
      .concat(
        formState.allergicIngredients.includes("Others") &&
          formState.allergicIngredientsOther.trim()
          ? [formState.allergicIngredientsOther.trim()]
          : [],
      );

    const payload = {
      doctorId,
      preferredDate,
      name: formState.name,
      age: formState.age,
      phone: formState.phone,
      email: formState.email,
      skinType: formState.skinType,
      usesKoreanProducts: formState.usesKoreanProducts === "yes",
      facingSkinIssues: formState.facingSkinIssues === "yes",
      skinIssues: formState.skinIssues,
      skinIssueDuration: formState.skinIssueDuration,
      currentProducts: formState.currentProducts,
      allergicIngredients,
      doubleCleansePreference: formState.doubleCleansePreference,
      sleepHours: formState.sleepHours,
      waterIntake: formState.waterIntake,
      appliesSunscreen: formState.appliesSunscreen === "yes",
      regularPeriodCycle: formState.regularPeriodCycle === "yes",
      usedSteroidBasedNightCream:
        formState.usedSteroidBasedNightCream === "yes",
      note: formState.note,
      skinImages: formState.skinImages,
    };

    try {
      const response = await fetch("/api/appointment/submit-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; bookingToken?: string }
        | null;

      if (!response.ok) {
        setError(data?.error ?? "Failed to submit survey.");
        setIsSubmitting(false);
        return;
      }

      router.push(
        `/appointment/confirmation?bookingToken=${encodeURIComponent(
          data?.bookingToken ?? "",
        )}`,
      );
    } catch {
      setError("Failed to submit survey.");
      setIsSubmitting(false);
    }
  }

  return (
    <section
      className="flex min-h-screen flex-col bg-[#F8F5F0] px-6 py-16 dark:bg-[#1A1814]"
    >
      <div style={{ maxWidth: "48rem" }} className="mx-auto w-full">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8]"
            style={{
              fontFamily: "Playfair Display, serif",
            }}
          >
            Appointment Survey
          </h1>
          <p className="mt-2 text-sm text-[#B8A89A] dark:text-[#8A7D75]">
            Please fill out the form to help us prepare for your consultation.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="survey-form mt-6 space-y-6 rounded-xl border border-[#D8C7B5] bg-white p-4 dark:border-[#3D3530] dark:bg-[#242220] sm:p-6"
        >
          <style>{`
            .survey-form > div + div {
              border-top: 1px solid #F1E7DC;
              padding-top: 1.5rem;
            }

            .survey-form input:not([type="checkbox"]):not([type="radio"]):not([type="file"]),
            .survey-form textarea {
              width: 100%;
              min-height: 44px;
            }

            .survey-form label {
              width: 100%;
            }

            .survey-form label:has(input[type="checkbox"]),
            .survey-form label:has(input[type="radio"]) {
              display: flex;
              min-height: 44px;
              width: 100%;
              align-items: center;
              border: 1px solid #D8C7B5;
              border-radius: 8px;
              background: #FFFFFF;
              padding: 8px 10px;
              cursor: pointer;
            }

            .survey-form input[type="checkbox"],
            .survey-form input[type="radio"] {
              min-height: 20px;
              min-width: 20px;
            }

            @media (min-width: 640px) {
              .survey-form label:has(input[type="checkbox"]),
              .survey-form label:has(input[type="radio"]) {
                width: auto;
              }
            }

            .dark .survey-form > div + div {
              border-top-color: #3D3530;
            }

            .dark .survey-form label:has(input[type="checkbox"]),
            .dark .survey-form label:has(input[type="radio"]) {
              border-color: #3D3530;
              background: #1A1814;
            }
          `}</style>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                Name
              </label>
              <input
                value={formState.name}
                onChange={(event) => updateField("name", event.target.value)}
                required
                className="mt-2 h-11 rounded-md border border-[#D8C7B5] px-3 text-[#2B2B2B] focus:border-[#C6A56B] focus:outline-none focus:ring-1 focus:ring-[#C6A56B] dark:border-[#3D3530] dark:text-[#F0EDE8]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                Age
              </label>
              <input
                value={formState.age}
                onChange={(event) => updateField("age", event.target.value)}
                className="mt-2 h-11 rounded-md border border-[#D8C7B5] px-3 text-[#2B2B2B] focus:border-[#C6A56B] focus:outline-none focus:ring-1 focus:ring-[#C6A56B] dark:border-[#3D3530] dark:text-[#F0EDE8]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                Phone
              </label>
              <input
                type="tel"
                value={formState.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                required
                className="mt-2 h-11 rounded-md border border-[#D8C7B5] px-3 text-[#2B2B2B] focus:border-[#C6A56B] focus:outline-none focus:ring-1 focus:ring-[#C6A56B] dark:border-[#3D3530] dark:text-[#F0EDE8]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                Email
              </label>
              <input
                type="email"
                value={formState.email}
                onChange={(event) => updateField("email", event.target.value)}
                required
                className="mt-2 h-11 rounded-md border border-[#D8C7B5] px-3 text-[#2B2B2B] focus:border-[#C6A56B] focus:outline-none focus:ring-1 focus:ring-[#C6A56B] dark:border-[#3D3530] dark:text-[#F0EDE8]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                Skin Type
              </label>
              <input
                value={formState.skinType}
                onChange={(event) => updateField("skinType", event.target.value)}
                required
                className="mt-2 h-11 rounded-md border border-[#D8C7B5] px-3 text-[#2B2B2B] focus:border-[#C6A56B] focus:outline-none focus:ring-1 focus:ring-[#C6A56B] dark:border-[#3D3530] dark:text-[#F0EDE8]"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                Uses Korean Products
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {["yes", "no"].map((option) => (
                  <label key={option}>
                    <input
                      type="radio"
                      value={option}
                      checked={formState.usesKoreanProducts === option}
                      onChange={() => updateField("usesKoreanProducts", option)}
                      style={{ accentColor: "#C6A56B" }}
                      className="mr-2"
                    />
                    <span className="text-[#2B2B2B] dark:text-[#F0EDE8]">
                      {option === "yes" ? "Yes" : "No"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                Facing Skin Issues
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {["yes", "no"].map((option) => (
                  <label key={option}>
                    <input
                      type="radio"
                      value={option}
                      checked={formState.facingSkinIssues === option}
                      onChange={() => updateField("facingSkinIssues", option)}
                      style={{ accentColor: "#C6A56B" }}
                      className="mr-2"
                    />
                    <span className="text-[#2B2B2B] dark:text-[#F0EDE8]">
                      {option === "yes" ? "Yes" : "No"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <p className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
              Skin Issues
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {skinIssuesOptions.map((option) => (
                <label key={option}>
                  <input
                    type="checkbox"
                    checked={formState.skinIssues.includes(option)}
                    onChange={() => toggleArrayField("skinIssues", option)}
                    style={{ accentColor: "#C6A56B" }}
                    className="mr-2"
                  />
                  <span className="text-[#2B2B2B] dark:text-[#F0EDE8]">{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
              How long have you had these issues?
            </label>
            <input
              value={formState.skinIssueDuration}
              onChange={(event) =>
                updateField("skinIssueDuration", event.target.value)
              }
              className="mt-2 h-11 rounded-md border border-[#D8C7B5] px-3 text-[#2B2B2B] focus:border-[#C6A56B] focus:outline-none focus:ring-1 focus:ring-[#C6A56B] dark:border-[#3D3530] dark:text-[#F0EDE8]"
            />
          </div>

          <div>
            <p className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
              Current Products
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {currentProductsOptions.map((option) => (
                <label key={option}>
                  <input
                    type="checkbox"
                    checked={formState.currentProducts.includes(option)}
                    onChange={() => toggleArrayField("currentProducts", option)}
                    style={{ accentColor: "#C6A56B" }}
                    className="mr-2"
                  />
                  <span className="text-[#2B2B2B] dark:text-[#F0EDE8]">{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
              Allergic Ingredients
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {allergicOptions.map((option) => (
                <label key={option}>
                  <input
                    type="checkbox"
                    checked={formState.allergicIngredients.includes(option)}
                    onChange={() => toggleArrayField("allergicIngredients", option)}
                    style={{ accentColor: "#C6A56B" }}
                    className="mr-2"
                  />
                  <span className="text-[#2B2B2B] dark:text-[#F0EDE8]">{option}</span>
                </label>
              ))}
            </div>
            {formState.allergicIngredients.includes("Others") ? (
              <div className="mt-3">
                <label className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                  Other Allergic Ingredients
                </label>
                <input
                  value={formState.allergicIngredientsOther}
                  onChange={(event) =>
                    updateField("allergicIngredientsOther", event.target.value)
                  }
                  placeholder="Type custom allergic ingredients"
                  className="mt-2 h-11 rounded-md border border-[#D8C7B5] px-3 text-[#2B2B2B] focus:border-[#C6A56B] focus:outline-none focus:ring-1 focus:ring-[#C6A56B] dark:border-[#3D3530] dark:text-[#F0EDE8]"
                />
              </div>
            ) : null}
          </div>

          <div>
            <p className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
              Double Cleanse Preference
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {["No", "Cleansing Oil", "Cleansing Balm", "Micellar Water"].map(
                (option) => (
                  <label key={option}>
                    <input
                      type="radio"
                      checked={formState.doubleCleansePreference === option}
                      onChange={() =>
                        updateField("doubleCleansePreference", option)
                      }
                      style={{ accentColor: "#C6A56B" }}
                      className="mr-2"
                    />
                    <span className="text-[#2B2B2B] dark:text-[#F0EDE8]">{option}</span>
                  </label>
                ),
              )}
            </div>
          </div>

          <div>
            <p className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
              Sleep Hours
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {["Less than 5-6 Hours", "6-8 Hours", "More than 8 Hours"].map(
                (option) => (
                  <label key={option}>
                    <input
                      type="radio"
                      checked={formState.sleepHours === option}
                      onChange={() => updateField("sleepHours", option)}
                      style={{ accentColor: "#C6A56B" }}
                      className="mr-2"
                    />
                    <span className="text-[#2B2B2B] dark:text-[#F0EDE8]">{option}</span>
                  </label>
                ),
              )}
            </div>
          </div>

          <div>
            <p className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
              Water Intake
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {["Less than 1-2 Litres", "1-2 Litres", "More than 2 Litres"].map(
                (option) => (
                  <label key={option}>
                    <input
                      type="radio"
                      checked={formState.waterIntake === option}
                      onChange={() => updateField("waterIntake", option)}
                      style={{ accentColor: "#C6A56B" }}
                      className="mr-2"
                    />
                    <span className="text-[#2B2B2B] dark:text-[#F0EDE8]">{option}</span>
                  </label>
                ),
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                field: "appliesSunscreen" as const,
                label: "Applies Sunscreen",
              },
              {
                field: "regularPeriodCycle" as const,
                label: "Regular Period Cycle",
              },
              {
                field: "usedSteroidBasedNightCream" as const,
                label: "Used Steroid Based Night Cream",
              },
            ].map((item) => (
              <div key={item.field}>
                <p className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                  {item.label}
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {["yes", "no"].map((option) => (
                    <label key={option}>
                      <input
                        type="radio"
                        checked={formState[item.field] === option}
                        onChange={() => updateField(item.field, option)}
                        style={{ accentColor: "#C6A56B" }}
                        className="mr-2"
                      />
                      <span className="text-[#2B2B2B] dark:text-[#F0EDE8]">
                        {option === "yes" ? "Yes" : "No"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
              Additional Notes
            </label>
            <textarea
              value={formState.note}
              onChange={(event) => updateField("note", event.target.value)}
              placeholder="Any additional information..."
              rows={4}
              className="mt-2 rounded-md border border-[#D8C7B5] px-3 py-2 text-[#2B2B2B] focus:border-[#C6A56B] focus:outline-none focus:ring-1 focus:ring-[#C6A56B] dark:border-[#3D3530] dark:text-[#F0EDE8]"
            />
          </div>

          <div
            className="rounded-lg border border-[#D8C7B5] bg-[#F8F5F0] p-4 dark:border-[#3D3530] dark:bg-[#1A1814]"
          >
            <label className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
              Skin Photos
            </label>
            <p className="mt-2 text-sm leading-6 text-[#B8A89A] dark:text-[#8A7D75]">
              Uploading photos is optional. You can submit the survey without photos if you prefer.
            </p>

            <div className="mt-4">
              <FileUploadButton
                onFileSelected={(file) => {
                  if (isUploadingSkinImage || formState.skinImages.length >= 4) {
                    return;
                  }

                  void handleSkinImageUpload(file);
                }}
                label={isUploadingSkinImage ? "Uploading..." : "Upload Skin Photo"}
                accept="image/*"
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-sm">
              <span className="text-[#B8A89A] dark:text-[#8A7D75]">
                {formState.skinImages.length}/4 images uploaded
              </span>
              {isUploadingSkinImage ? (
                <span style={{ color: "#C6A56B" }}>Uploading...</span>
              ) : null}
            </div>

            {formState.skinImages.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {formState.skinImages.map((imageUrl) => (
                  <div
                    key={imageUrl}
                    className="overflow-hidden rounded-lg border border-[#D8C7B5] bg-white dark:border-[#3D3530] dark:bg-[#242220]"
                  >
                    <div className="relative h-40 w-full">
                      <Image
                        src={imageUrl}
                        alt="Uploaded skin concern"
                        fill
                        sizes="(min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSkinImage(imageUrl)}
                      className="w-full px-3 py-2 text-sm font-medium text-[#2B2B2B] hover:bg-[#F8F5F0] dark:text-[#F0EDE8] dark:hover:bg-[#1A1814]"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 pt-4 sm:flex-row">
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ backgroundColor: "#2B2B2B", color: "#F8F5F0" }}
              className="h-12 w-full rounded-md text-sm font-medium transition-colors duration-200 hover:bg-[#B8A89A] disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:flex-1"
            >
              {isSubmitting ? "Submitting..." : "Submit Survey"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function AppointmentSurveyLoadingFallback() {
  return (
    <section className="flex min-h-screen flex-col bg-[#F8F5F0] px-6 py-16 dark:bg-[#1A1814]">
      <div className="mx-auto w-full" style={{ maxWidth: "48rem" }}>
        <p className="text-sm text-[#B8A89A] dark:text-[#8A7D75]">
          Loading...
        </p>
      </div>
    </section>
  );
}

export default function AppointmentSurveyPage() {
  return (
    <Suspense fallback={<AppointmentSurveyLoadingFallback />}>
      <AppointmentSurveyPageContent />
    </Suspense>
  );
}
