"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

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

function BookingSurveyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams?.get("serviceId") ?? "";
  const doctorId = searchParams?.get("doctorId") ?? "";
  const slot = searchParams?.get("slot") ?? "";
  const date = searchParams?.get("date") ?? "";

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
  const [isOnlineConsultation, setIsOnlineConsultation] = useState(false);
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
        // Leave the form editable even if profile prefill fails.
      }
    }

    loadProfile();
  }, []);

  useEffect(() => {
    async function loadSelectedService() {
      if (!serviceId) {
        return;
      }

      try {
        const response = await fetch("/api/services");

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          services?: Array<{ id: string; name: string }>;
        };
        const selectedService = data.services?.find((service) => service.id === serviceId);

        setIsOnlineConsultation(
          selectedService?.name.trim().toLowerCase() === "online consultation",
        );
      } catch {
        // Keep the form usable if service lookup fails.
      }
    }

    loadSelectedService();
  }, [serviceId]);

  function updateField<K extends keyof SurveyFormState>(field: K, value: SurveyFormState[K]) {
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

  async function handleSkinImageUpload(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    setError("");
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
        const data = (await response.json().catch(() => null)) as {
          secure_url?: string;
          error?: string;
        } | null;

        if (!response.ok || !data?.secure_url) {
          throw new Error(data?.error ?? "Failed to upload skin image.");
        }

        setFormState((current) => ({
          ...current,
          skinImages: [...current.skinImages, data.secure_url as string].slice(0, 4),
        }));
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload skin image.");
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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!serviceId) {
      setError("Service ID is required.");
      setIsSubmitting(false);
      return;
    }

    const allergicIngredients = formState.allergicIngredients
      .filter((item) => item !== "Others")
      .concat(
        formState.allergicIngredients.includes("Others") && formState.allergicIngredientsOther.trim()
          ? [formState.allergicIngredientsOther.trim()]
          : [],
      );

    const payload = {
      serviceId,
      doctorId,
      codeId: serviceId,
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
      usedSteroidBasedNightCream: formState.usedSteroidBasedNightCream === "yes",
      note: formState.note,
      skinImages: formState.skinImages,
    };

    try {
      const res = await fetch("/api/booking/submit-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => null)) as
typeof payload & { surveyId?: string; error?: string } | null;

      if (!res.ok || !data?.surveyId) {
        setError(data?.error ?? "Failed to submit survey.");
        setIsSubmitting(false);
        return;
      }

      router.push(
        `/payment?serviceId=${encodeURIComponent(serviceId)}&doctorId=${encodeURIComponent(doctorId)}&surveyId=${encodeURIComponent(data.surveyId)}&slot=${encodeURIComponent(slot)}&date=${encodeURIComponent(date)}`,
      );
    } catch {
      setError("Failed to submit survey.");
      setIsSubmitting(false);
    }
  }

  return (
    <section style={{ backgroundColor: "#F8F5F0" }} className="flex min-h-screen flex-col px-6 py-16">
      <div style={{ maxWidth: "48rem" }} className="mx-auto w-full">
        <div>
          <h1
            style={{
              fontFamily: "Playfair Display, serif",
              color: "#2B2B2B",
            }}
            className="text-3xl font-bold tracking-tight"
          >
            Consultation Survey
          </h1>
          <p style={{ color: "#B8A89A" }} className="mt-2 text-sm">
            Please fill out the form to help us prepare for your appointment.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: "#FFFFFF",
            borderColor: "#D8C7B5",
            borderWidth: "1px",
          }}
          className="survey-form mt-6 space-y-6 rounded-xl p-4 sm:p-6"
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
          `}</style>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                style={{ color: "#2B2B2B" }}
                className="block text-sm font-medium"
              >
                Name
              </label>
              <input
                name="name"
                value={formState.name}
                onChange={(event) => updateField("name", event.target.value)}
                required
                style={{
                  borderColor: "#D8C7B5",
                  color: "#2B2B2B",
                }}
                className="mt-2 h-11 w-full rounded-md border px-3 focus:outline-none focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
              />
            </div>

            <div>
              <label
                style={{ color: "#2B2B2B" }}
                className="block text-sm font-medium"
              >
                Age
              </label>
              <input
                name="age"
                value={formState.age}
                onChange={(event) => updateField("age", event.target.value)}
                style={{
                  borderColor: "#D8C7B5",
                  color: "#2B2B2B",
                }}
                className="mt-2 h-11 w-full rounded-md border px-3 focus:outline-none focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
              />
            </div>

            <div>
              <label
                style={{ color: "#2B2B2B" }}
                className="block text-sm font-medium"
              >
                Phone
              </label>
              <input
                name="phone"
                type="tel"
                value={formState.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                required
                style={{
                  borderColor: "#D8C7B5",
                  color: "#2B2B2B",
                }}
                className="mt-2 h-11 w-full rounded-md border px-3 focus:outline-none focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
              />
            </div>

            <div>
              <label
                style={{ color: "#2B2B2B" }}
                className="block text-sm font-medium"
              >
                Email
              </label>
              <input
                name="email"
                type="email"
                value={formState.email}
                onChange={(event) => updateField("email", event.target.value)}
                required
                style={{
                  borderColor: "#D8C7B5",
                  color: "#2B2B2B",
                }}
                className="mt-2 h-11 w-full rounded-md border px-3 focus:outline-none focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
              />
            </div>

            <div>
              <label
                style={{ color: "#2B2B2B" }}
                className="block text-sm font-medium"
              >
                Skin Type
              </label>
              <input
                name="skinType"
                value={formState.skinType}
                onChange={(event) => updateField("skinType", event.target.value)}
                style={{
                  borderColor: "#D8C7B5",
                  color: "#2B2B2B",
                }}
                className="mt-2 h-11 w-full rounded-md border px-3 focus:outline-none focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
              />
            </div>

            <div>
              <label
                style={{ color: "#2B2B2B" }}
                className="block text-sm font-medium"
              >
                Code ID (service token)
              </label>
              <input
                name="codeId"
                readOnly
                value={serviceId}
                style={{
                  borderColor: "#D8C7B5",
                  color: "#B8A89A",
                  backgroundColor: "#F8F5F0",
                }}
                className="mt-2 h-11 w-full rounded-md border px-3"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p
                style={{ color: "#2B2B2B" }}
                className="block text-sm font-medium"
              >
                Uses Korean Products
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="usesKoreanProducts"
                    value="yes"
                    checked={formState.usesKoreanProducts === "yes"}
                    onChange={() => updateField("usesKoreanProducts", "yes")}
                    style={{
                      accentColor: "#C6A56B",
                    }}
                    className="mr-2"
                  />
                  <span style={{ color: "#2B2B2B" }}>Yes</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="usesKoreanProducts"
                    value="no"
                    checked={formState.usesKoreanProducts === "no"}
                    onChange={() => updateField("usesKoreanProducts", "no")}
                    style={{
                      accentColor: "#C6A56B",
                    }}
                    className="mr-2"
                  />
                  <span style={{ color: "#2B2B2B" }}>No</span>
                </label>
              </div>
            </div>

            <div>
              <p
                style={{ color: "#2B2B2B" }}
                className="block text-sm font-medium"
              >
                Facing Skin Issues
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="facingSkinIssues"
                    value="yes"
                    checked={formState.facingSkinIssues === "yes"}
                    onChange={() => updateField("facingSkinIssues", "yes")}
                    style={{
                      accentColor: "#C6A56B",
                    }}
                    className="mr-2"
                  />
                  <span style={{ color: "#2B2B2B" }}>Yes</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="facingSkinIssues"
                    value="no"
                    checked={formState.facingSkinIssues === "no"}
                    onChange={() => updateField("facingSkinIssues", "no")}
                    style={{
                      accentColor: "#C6A56B",
                    }}
                    className="mr-2"
                  />
                  <span style={{ color: "#2B2B2B" }}>No</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <p
              style={{ color: "#2B2B2B" }}
              className="block text-sm font-medium"
            >
              Skin Issues (select all that apply)
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {skinIssuesOptions.map((opt) => (
                <label key={opt} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="skinIssues"
                    value={opt}
                    checked={formState.skinIssues.includes(opt)}
                    onChange={() => toggleArrayField("skinIssues", opt)}
                    style={{
                      accentColor: "#C6A56B",
                    }}
                    className="mr-2"
                  />
                  <span style={{ color: "#2B2B2B" }}>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label
              style={{ color: "#2B2B2B" }}
              className="block text-sm font-medium"
            >
              How long have you had these issues?
            </label>
            <input
              name="skinIssueDuration"
              value={formState.skinIssueDuration}
              onChange={(event) => updateField("skinIssueDuration", event.target.value)}
              style={{
                borderColor: "#D8C7B5",
                color: "#2B2B2B",
              }}
              className="mt-2 h-11 w-full rounded-md border px-3 focus:outline-none focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
            />
          </div>

          <div>
            <p
              style={{ color: "#2B2B2B" }}
              className="block text-sm font-medium"
            >
              Current Products (select all that apply)
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {currentProductsOptions.map((opt) => (
                <label key={opt} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="currentProducts"
                    value={opt}
                    checked={formState.currentProducts.includes(opt)}
                    onChange={() => toggleArrayField("currentProducts", opt)}
                    style={{
                      accentColor: "#C6A56B",
                    }}
                    className="mr-2"
                  />
                  <span style={{ color: "#2B2B2B" }}>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p
              style={{ color: "#2B2B2B" }}
              className="block text-sm font-medium"
            >
              Allergic Ingredients
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {allergicOptions.map((opt) => (
                <label key={opt} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="allergicIngredients"
                    value={opt}
                    checked={formState.allergicIngredients.includes(opt)}
                    onChange={() => toggleArrayField("allergicIngredients", opt)}
                    style={{
                      accentColor: "#C6A56B",
                    }}
                    className="mr-2"
                  />
                  <span style={{ color: "#2B2B2B" }}>{opt}</span>
                </label>
              ))}
            </div>
            {formState.allergicIngredients.includes("Others") ? (
              <div className="mt-3">
                <label
                  style={{ color: "#2B2B2B" }}
                  className="block text-sm font-medium"
                >
                  Other Allergic Ingredients
                </label>
                <input
                  name="allergicIngredientsOther"
                  value={formState.allergicIngredientsOther}
                  onChange={(event) => updateField("allergicIngredientsOther", event.target.value)}
                  placeholder="Type custom allergic ingredients"
                  style={{
                    borderColor: "#D8C7B5",
                    color: "#2B2B2B",
                  }}
                  className="mt-2 h-11 w-full rounded-md border px-3 focus:outline-none focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
                />
              </div>
            ) : null}
          </div>

          <div>
            <p
              style={{ color: "#2B2B2B" }}
              className="block text-sm font-medium"
            >
              Double Cleanse Preference
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {[
                "No",
                "Cleansing Oil",
                "Cleansing Balm",
                "Micellar Water",
              ].map((opt) => (
                <label key={opt} className="inline-flex items-center">
                  <input
                    type="radio"
                    name="doubleCleansePreference"
                    value={opt}
                    checked={formState.doubleCleansePreference === opt}
                    onChange={() => updateField("doubleCleansePreference", opt)}
                    style={{
                      accentColor: "#C6A56B",
                    }}
                    className="mr-2"
                  />
                  <span style={{ color: "#2B2B2B" }}>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p
              style={{ color: "#2B2B2B" }}
              className="block text-sm font-medium"
            >
              Sleep Hours
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {[
                "Less than 5-6 Hours",
                "6-8 Hours",
                "More than 8 Hours",
              ].map((opt) => (
                <label key={opt} className="inline-flex items-center">
                  <input
                    type="radio"
                    name="sleepHours"
                    value={opt}
                    checked={formState.sleepHours === opt}
                    onChange={() => updateField("sleepHours", opt)}
                    style={{
                      accentColor: "#C6A56B",
                    }}
                    className="mr-2"
                  />
                  <span style={{ color: "#2B2B2B" }}>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p
              style={{ color: "#2B2B2B" }}
              className="block text-sm font-medium"
            >
              Water Intake
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {[
                "Less than 1-2 Litres",
                "1-2 Litres",
                "More than 2 Litres",
              ].map((opt) => (
                <label key={opt} className="inline-flex items-center">
                  <input
                    type="radio"
                    name="waterIntake"
                    value={opt}
                    checked={formState.waterIntake === opt}
                    onChange={() => updateField("waterIntake", opt)}
                    style={{
                      accentColor: "#C6A56B",
                    }}
                    className="mr-2"
                  />
                  <span style={{ color: "#2B2B2B" }}>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p
                style={{ color: "#2B2B2B" }}
                className="block text-sm font-medium"
              >
                Applies Sunscreen
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="appliesSunscreen"
                    value="yes"
                    checked={formState.appliesSunscreen === "yes"}
                    onChange={() => updateField("appliesSunscreen", "yes")}
                    style={{
                      accentColor: "#C6A56B",
                    }}
                    className="mr-2"
                  />
                  <span style={{ color: "#2B2B2B" }}>Yes</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="appliesSunscreen"
                    value="no"
                    checked={formState.appliesSunscreen === "no"}
                    onChange={() => updateField("appliesSunscreen", "no")}
                    style={{
                      accentColor: "#C6A56B",
                    }}
                    className="mr-2"
                  />
                  <span style={{ color: "#2B2B2B" }}>No</span>
                </label>
              </div>
            </div>

            <div>
              <p
                style={{ color: "#2B2B2B" }}
                className="block text-sm font-medium"
              >
                Regular Period Cycle
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="regularPeriodCycle"
                    value="yes"
                    checked={formState.regularPeriodCycle === "yes"}
                    onChange={() => updateField("regularPeriodCycle", "yes")}
                    style={{
                      accentColor: "#C6A56B",
                    }}
                    className="mr-2"
                  />
                  <span style={{ color: "#2B2B2B" }}>Yes</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="regularPeriodCycle"
                    value="no"
                    checked={formState.regularPeriodCycle === "no"}
                    onChange={() => updateField("regularPeriodCycle", "no")}
                    style={{
                      accentColor: "#C6A56B",
                    }}
                    className="mr-2"
                  />
                  <span style={{ color: "#2B2B2B" }}>No</span>
                </label>
              </div>
            </div>

            <div>
              <p
                style={{ color: "#2B2B2B" }}
                className="block text-sm font-medium"
              >
                Used Steroid Based Night Cream
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="usedSteroidBasedNightCream"
                    value="yes"
                    checked={formState.usedSteroidBasedNightCream === "yes"}
                    onChange={() => updateField("usedSteroidBasedNightCream", "yes")}
                    style={{
                      accentColor: "#C6A56B",
                    }}
                    className="mr-2"
                  />
                  <span style={{ color: "#2B2B2B" }}>Yes</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="usedSteroidBasedNightCream"
                    value="no"
                    checked={formState.usedSteroidBasedNightCream === "no"}
                    onChange={() => updateField("usedSteroidBasedNightCream", "no")}
                    style={{
                      accentColor: "#C6A56B",
                    }}
                    className="mr-2"
                  />
                  <span style={{ color: "#2B2B2B" }}>No</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label
              style={{ color: "#2B2B2B" }}
              className="block text-sm font-medium"
            >
              Additional Notes
            </label>
            <textarea
              name="note"
              value={formState.note}
              onChange={(event) => updateField("note", event.target.value)}
              placeholder="Any additional information..."
              rows={4}
              style={{
                borderColor: "#D8C7B5",
                color: "#2B2B2B",
              }}
              className="mt-2 w-full rounded-md border px-3 py-2 focus:outline-none focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
            />
          </div>

          {isOnlineConsultation ? (
            <div
              style={{
                borderColor: "#D8C7B5",
                backgroundColor: "#F8F5F0",
              }}
              className="rounded-lg border p-4"
            >
              <label
                style={{ color: "#2B2B2B" }}
                className="block text-sm font-medium"
              >
                Skin Photos
              </label>
              <p style={{ color: "#B8A89A" }} className="mt-2 text-sm leading-6">
                Please upload clear photos of your skin concerns to help our doctor assess your condition remotely.
              </p>

              <input
                type="file"
                accept="image/*"
                multiple
                disabled={isUploadingSkinImage || formState.skinImages.length >= 4}
                onChange={(event) => {
                  void handleSkinImageUpload(event.target.files);
                  event.target.value = "";
                }}
                style={{
                  borderColor: "#D8C7B5",
                  color: "#2B2B2B",
                  backgroundColor: "#FFFFFF",
                }}
                className="mt-4 block w-full rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              />

              <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                <span style={{ color: "#B8A89A" }}>
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
                      style={{ borderColor: "#D8C7B5", backgroundColor: "#FFFFFF" }}
                      className="overflow-hidden rounded-lg border"
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
                        style={{ color: "#2B2B2B" }}
                        className="w-full px-3 py-2 text-sm font-medium hover:bg-[#F8F5F0]"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 pt-4 sm:flex-row">
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                backgroundColor: "#2B2B2B",
                color: "#F8F5F0",
              }}
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

function BookingSurveyLoadingFallback() {
  return (
    <section
      className="flex min-h-screen flex-col px-6 py-16"
      style={{ backgroundColor: "#F8F5F0" }}
    >
      <div className="mx-auto w-full" style={{ maxWidth: "48rem" }}>
        <p className="text-sm" style={{ color: "#B8A89A" }}>
          Loading...
        </p>
      </div>
    </section>
  );
}

export default function BookingSurveyPage() {
  return (
    <Suspense fallback={<BookingSurveyLoadingFallback />}>
      <BookingSurveyPageContent />
    </Suspense>
  );
}
