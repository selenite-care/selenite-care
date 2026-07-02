"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
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

type SurveyProfileResponse = {
  surveyProfile?: {
    name?: string | null;
    age?: string | null;
    phone?: string | null;
    email?: string | null;
    skinType?: string | null;
    usesKoreanProducts?: boolean;
    facingSkinIssues?: boolean;
    skinIssues?: string[];
    skinIssueDuration?: string | null;
    currentProducts?: string[];
    allergicIngredients?: string[];
    doubleCleansePreference?: string | null;
    sleepHours?: string | null;
    waterIntake?: string | null;
    appliesSunscreen?: boolean;
    regularPeriodCycle?: boolean;
    usedSteroidBasedNightCream?: boolean;
    note?: string | null;
    skinImages?: string[];
  };
  error?: string;
};

function buildInitialState(): SurveyFormState {
  return {
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
  };
}

function splitAllergicIngredients(values: string[]) {
  const predefined = new Set(allergicOptions);
  const selected = values.filter((value) => predefined.has(value));
  const custom = values.filter((value) => !predefined.has(value));

  return {
    allergicIngredients: custom.length > 0 ? [...selected, "Others"] : selected,
    allergicIngredientsOther: custom.join(", "),
  };
}

export default function DashboardSurveyPage() {
  const [formState, setFormState] = useState<SurveyFormState>(buildInitialState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingSkinImage, setIsUploadingSkinImage] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadSurveyProfile() {
      try {
        const response = await fetch("/api/client/survey-profile");
        const data = (await response.json()) as SurveyProfileResponse;

        if (!response.ok || !data.surveyProfile) {
          throw new Error(data.error ?? "Unable to load your skin profile.");
        }

        const allergyData = splitAllergicIngredients(
          data.surveyProfile.allergicIngredients ?? [],
        );

        setFormState({
          name: data.surveyProfile.name ?? "",
          age: data.surveyProfile.age ?? "",
          phone: data.surveyProfile.phone ?? "",
          email: data.surveyProfile.email ?? "",
          skinType: data.surveyProfile.skinType ?? "",
          usesKoreanProducts: data.surveyProfile.usesKoreanProducts ? "yes" : "no",
          facingSkinIssues: data.surveyProfile.facingSkinIssues ? "yes" : "no",
          skinIssues: data.surveyProfile.skinIssues ?? [],
          skinIssueDuration: data.surveyProfile.skinIssueDuration ?? "",
          currentProducts: data.surveyProfile.currentProducts ?? [],
          allergicIngredients: allergyData.allergicIngredients,
          allergicIngredientsOther: allergyData.allergicIngredientsOther,
          doubleCleansePreference:
            data.surveyProfile.doubleCleansePreference ?? "No",
          sleepHours: data.surveyProfile.sleepHours ?? "6-8 Hours",
          waterIntake: data.surveyProfile.waterIntake ?? "1-2 Litres",
          appliesSunscreen: data.surveyProfile.appliesSunscreen ? "yes" : "no",
          regularPeriodCycle: data.surveyProfile.regularPeriodCycle ? "yes" : "no",
          usedSteroidBasedNightCream:
            data.surveyProfile.usedSteroidBasedNightCream ? "yes" : "no",
          note: data.surveyProfile.note ?? "",
          skinImages: data.surveyProfile.skinImages ?? [],
        });
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load your skin profile.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadSurveyProfile();
  }, []);

  function updateField<K extends keyof SurveyFormState>(
    field: K,
    value: SurveyFormState[K],
  ) {
    setFormState((current) => ({ ...current, [field]: value }));
    setSuccessMessage("");
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
    setSuccessMessage("");
  }

  async function handleSkinImageUpload(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    setError("");
    setSuccessMessage("");
    setIsUploadingSkinImage(true);

    const remainingSlots = 4 - formState.skinImages.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    try {
      for (const file of filesToUpload) {
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
      }
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
    setSuccessMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    const allergicIngredients = formState.allergicIngredients
      .filter((item) => item !== "Others")
      .concat(
        formState.allergicIngredients.includes("Others") &&
          formState.allergicIngredientsOther.trim()
          ? formState.allergicIngredientsOther
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
      );

    const payload = {
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
      const response = await fetch("/api/client/survey-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to save profile.");
      }

      setSuccessMessage("Skin profile updated successfully.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to save profile.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <section>
        <p className="text-muted text-sm">
          Loading...
        </p>
      </section>
    );
  }

  return (
    <section>
      <div>
        <p className="text-muted text-sm font-medium uppercase">
          Client Dashboard
        </p>
        <h1
          className="text-page mt-2 text-3xl font-semibold tracking-tight"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          My Skin Profile
        </h1>
        <p className="text-muted mt-3 text-sm leading-6">
          Keep your consultation details up to date so our team can support you better.
        </p>
      </div>

      <div
        className="bg-card border-themed text-muted mt-6 rounded-lg border p-4 text-sm leading-6"
      >
        Your skin profile is automatically updated when you submit an appointment
        survey. You can also update it manually anytime.
      </div>

      <form
        onSubmit={handleSubmit}
        className="survey-form bg-card border-themed mt-6 space-y-6 rounded-xl border p-4 sm:p-6"
      >
        <style>{`
          .survey-form > div + div {
            border-top: 1px solid var(--border);
            padding-top: 1.5rem;
          }

          .survey-form input:not([type="checkbox"]):not([type="radio"]):not([type="file"]),
          .survey-form textarea {
            width: 100%;
            min-height: 44px;
            background: var(--card);
            color: var(--foreground);
            border: 1px solid var(--border);
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
            border: 1px solid var(--border);
            border-radius: 8px;
            background: var(--card);
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
        `}</style>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div
            className="bg-card text-page rounded-lg border border-[var(--gold)] p-4 text-sm"
          >
            {successMessage}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-page block text-sm font-medium">
              Name
            </label>
            <input
              value={formState.name}
              onChange={(event) => updateField("name", event.target.value)}
              className="border-themed bg-card text-page mt-2 h-11 rounded-md border px-3 focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
            />
          </div>

          <div>
            <label className="text-page block text-sm font-medium">
              Age
            </label>
            <input
              value={formState.age}
              onChange={(event) => updateField("age", event.target.value)}
              className="border-themed bg-card text-page mt-2 h-11 rounded-md border px-3 focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
            />
          </div>

          <div>
            <label className="text-page block text-sm font-medium">
              Phone
            </label>
            <input
              type="tel"
              value={formState.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              className="border-themed bg-card text-page mt-2 h-11 rounded-md border px-3 focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
            />
          </div>

          <div>
            <label className="text-page block text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              value={formState.email}
              onChange={(event) => updateField("email", event.target.value)}
              className="border-themed bg-card text-page mt-2 h-11 rounded-md border px-3 focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-page block text-sm font-medium">
              Skin Type
            </label>
            <input
              value={formState.skinType}
              onChange={(event) => updateField("skinType", event.target.value)}
              className="border-themed bg-card text-page mt-2 h-11 rounded-md border px-3 focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-page block text-sm font-medium">
              Uses Korean Products
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {["yes", "no"].map((option) => (
                <label key={option}>
                  <input
                    type="radio"
                    checked={formState.usesKoreanProducts === option}
                    onChange={() => updateField("usesKoreanProducts", option)}
                    className="mr-2 accent-[#B87B68]"
                  />
                  <span className="text-page">
                    {option === "yes" ? "Yes" : "No"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-page block text-sm font-medium">
              Facing Skin Issues
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {["yes", "no"].map((option) => (
                <label key={option}>
                  <input
                    type="radio"
                    checked={formState.facingSkinIssues === option}
                    onChange={() => updateField("facingSkinIssues", option)}
                    className="mr-2 accent-[#B87B68]"
                  />
                  <span className="text-page">
                    {option === "yes" ? "Yes" : "No"}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="text-page block text-sm font-medium">
            Skin Issues
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {skinIssuesOptions.map((option) => (
              <label key={option}>
                <input
                  type="checkbox"
                  checked={formState.skinIssues.includes(option)}
                  onChange={() => toggleArrayField("skinIssues", option)}
                  className="mr-2 accent-[#B87B68]"
                />
                <span className="text-page">{option}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-page block text-sm font-medium">
            How long have you had these issues?
          </label>
          <input
            value={formState.skinIssueDuration}
            onChange={(event) =>
              updateField("skinIssueDuration", event.target.value)
            }
            className="border-themed bg-card text-page mt-2 h-11 rounded-md border px-3 focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
          />
        </div>

        <div>
          <p className="text-page block text-sm font-medium">
            Current Products
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {currentProductsOptions.map((option) => (
              <label key={option}>
                <input
                  type="checkbox"
                  checked={formState.currentProducts.includes(option)}
                  onChange={() => toggleArrayField("currentProducts", option)}
                  className="mr-2 accent-[#B87B68]"
                />
                <span className="text-page">{option}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-page block text-sm font-medium">
            Allergic Ingredients
          </p>
          <div className="mt-2 flex flex-col gap-2">
            {allergicOptions.map((option) => (
              <label key={option}>
                <input
                  type="checkbox"
                  checked={formState.allergicIngredients.includes(option)}
                  onChange={() => toggleArrayField("allergicIngredients", option)}
                  className="mr-2 accent-[#B87B68]"
                />
                <span className="text-page">{option}</span>
              </label>
            ))}
          </div>
          {formState.allergicIngredients.includes("Others") ? (
            <div className="mt-3">
              <label className="text-page block text-sm font-medium">
                Other Allergic Ingredients
              </label>
              <input
                value={formState.allergicIngredientsOther}
                onChange={(event) =>
                  updateField("allergicIngredientsOther", event.target.value)
                }
                placeholder="Type custom allergic ingredients"
                className="border-themed bg-card text-page mt-2 h-11 rounded-md border px-3 focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
              />
            </div>
          ) : null}
        </div>

        <div>
          <p className="text-page block text-sm font-medium">
            Double Cleanse Preference
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {["No", "Cleansing Oil", "Cleansing Balm", "Micellar Water"].map(
              (option) => (
                <label key={option}>
                  <input
                    type="radio"
                    checked={formState.doubleCleansePreference === option}
                    onChange={() => updateField("doubleCleansePreference", option)}
                    className="mr-2 accent-[#B87B68]"
                  />
                  <span className="text-page">{option}</span>
                </label>
              ),
            )}
          </div>
        </div>

        <div>
          <p className="text-page block text-sm font-medium">
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
                    className="mr-2 accent-[#B87B68]"
                  />
                  <span className="text-page">{option}</span>
                </label>
              ),
            )}
          </div>
        </div>

        <div>
          <p className="text-page block text-sm font-medium">
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
                    className="mr-2 accent-[#B87B68]"
                  />
                  <span className="text-page">{option}</span>
                </label>
              ),
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { field: "appliesSunscreen" as const, label: "Applies Sunscreen" },
            { field: "regularPeriodCycle" as const, label: "Regular Period Cycle" },
            {
              field: "usedSteroidBasedNightCream" as const,
              label: "Used Steroid Based Night Cream",
            },
          ].map((item) => (
            <div key={item.field}>
              <p className="text-page block text-sm font-medium">
                {item.label}
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {["yes", "no"].map((option) => (
                  <label key={option}>
                    <input
                      type="radio"
                      checked={formState[item.field] === option}
                      onChange={() => updateField(item.field, option)}
                      className="mr-2 accent-[#B87B68]"
                    />
                    <span className="text-page">
                      {option === "yes" ? "Yes" : "No"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className="text-page block text-sm font-medium">
            Additional Notes
          </label>
          <textarea
            value={formState.note}
            onChange={(event) => updateField("note", event.target.value)}
            placeholder="Any additional information..."
            rows={4}
            className="border-themed bg-card text-page mt-2 rounded-md border px-3 py-2 focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
          />
        </div>

        <div
          className="bg-card border-themed rounded-lg border p-4"
        >
          <label className="text-page block text-sm font-medium">
            Skin Photos
          </label>
          <p className="text-muted mt-2 text-sm leading-6">
            Uploading photos is optional. Add up to 4 images to keep your skin profile current.
          </p>

          <div className="mt-4">
            <FileUploadButton
              onFileSelected={(file) => {
                if (isUploadingSkinImage || formState.skinImages.length >= 4) {
                  return;
                }

                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                void handleSkinImageUpload(dataTransfer.files);
              }}
              label={isUploadingSkinImage ? "Uploading..." : "Upload Skin Photo"}
              accept="image/*"
            />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 text-sm">
            <span className="text-muted">
              {formState.skinImages.length}/4 images uploaded
            </span>
            {isUploadingSkinImage ? (
              <span className="text-[var(--gold)]">Uploading...</span>
            ) : null}
          </div>

          {formState.skinImages.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {formState.skinImages.map((imageUrl) => (
                <div
                  key={imageUrl}
                  className="bg-card border-themed overflow-hidden rounded-lg border"
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
                    className="text-page w-full px-3 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5"
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
            className="h-12 w-full rounded-md bg-[var(--sidebar)] text-sm font-medium text-[var(--sidebar-text)] transition-colors duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:flex-1"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </section>
  );
}
