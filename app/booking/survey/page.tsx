"use client";

import { FormEvent, useState } from "react";
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
  allergicIngredients: string;
  doubleCleansePreference: string;
  sleepHours: string;
  waterIntake: string[];
  wantsConsultation: string;
  appliesSunscreen: string;
  regularPeriodCycle: string;
  usedIndoPakNightCream: string;
  note: string;
};

export default function BookingSurveyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams?.get("serviceId") ?? "";
  const doctorId = searchParams?.get("doctorId") ?? "";

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
    allergicIngredients: "",
    doubleCleansePreference: "No",
    sleepHours: "6-8 Hours",
    waterIntake: [],
    wantsConsultation: "no",
    appliesSunscreen: "no",
    regularPeriodCycle: "no",
    usedIndoPakNightCream: "no",
    note: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  function updateField<K extends keyof SurveyFormState>(field: K, value: SurveyFormState[K]) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  function toggleArrayField(field: "skinIssues" | "currentProducts" | "waterIntake", value: string) {
    setFormState((current) => {
      const currentValues = current[field];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      return { ...current, [field]: nextValues };
    });
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
      allergicIngredients: formState.allergicIngredients,
      doubleCleansePreference: formState.doubleCleansePreference,
      sleepHours: formState.sleepHours,
      waterIntake: formState.waterIntake,
      wantsConsultation: formState.wantsConsultation === "yes",
      appliesSunscreen: formState.appliesSunscreen === "yes",
      regularPeriodCycle: formState.regularPeriodCycle === "yes",
      usedIndoPakNightCream: formState.usedIndoPakNightCream === "yes",
      note: formState.note,
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
        `/payment?serviceId=${encodeURIComponent(serviceId)}&doctorId=${encodeURIComponent(doctorId)}&surveyId=${encodeURIComponent(data.surveyId)}`,
      );
    } catch {
      setError("Failed to submit survey.");
      setIsSubmitting(false);
    }
  }

  return (
    <section>
        <center>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Consultation Survey</h1>
        <p className="mt-2 text-sm text-foreground/70">Please fill out the form to help us prepare for your appointment.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6 max-w-3xl">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground">Name</label>
            <input
              name="name"
              value={formState.name}
              onChange={(event) => updateField("name", event.target.value)}
              required
              className="mt-2 h-11 w-full rounded-md border border-black/10 px-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Age</label>
            <input
              name="age"
              value={formState.age}
              onChange={(event) => updateField("age", event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-black/10 px-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Phone</label>
            <input
              name="phone"
              type="tel"
              value={formState.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              required
              className="mt-2 h-11 w-full rounded-md border border-black/10 px-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Email</label>
            <input
              name="email"
              type="email"
              value={formState.email}
              onChange={(event) => updateField("email", event.target.value)}
              required
              className="mt-2 h-11 w-full rounded-md border border-black/10 px-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Skin Type</label>
            <input
              name="skinType"
              value={formState.skinType}
              onChange={(event) => updateField("skinType", event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-black/10 px-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Code ID (service token)</label>
            <input
              name="codeId"
              readOnly
              value={serviceId}
              className="mt-2 h-11 w-full rounded-md border border-black/10 px-3 bg-gray-50"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground">Uses Korean Products</label>
            <div className="mt-2 flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="usesKoreanProducts"
                  value="yes"
                  checked={formState.usesKoreanProducts === "yes"}
                  onChange={() => updateField("usesKoreanProducts", "yes")}
                />
                <span className="ml-2">Yes</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="usesKoreanProducts"
                  value="no"
                  checked={formState.usesKoreanProducts === "no"}
                  onChange={() => updateField("usesKoreanProducts", "no")}
                />
                <span className="ml-2">No</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Facing Skin Issues</label>
            <div className="mt-2 flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="facingSkinIssues"
                  value="yes"
                  checked={formState.facingSkinIssues === "yes"}
                  onChange={() => updateField("facingSkinIssues", "yes")}
                />
                <span className="ml-2">Yes</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="facingSkinIssues"
                  value="no"
                  checked={formState.facingSkinIssues === "no"}
                  onChange={() => updateField("facingSkinIssues", "no")}
                />
                <span className="ml-2">No</span>
              </label>
            </div>
          </div>
        </div>

        <div>
          <p className="block text-sm font-medium text-foreground">Skin Issues (select all that apply)</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {skinIssuesOptions.map((opt) => (
              <label key={opt} className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="skinIssues"
                  value={opt}
                  checked={formState.skinIssues.includes(opt)}
                  onChange={() => toggleArrayField("skinIssues", opt)}
                  className="mr-2"
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground">How long have you had these issues?</label>
          <input
            name="skinIssueDuration"
            value={formState.skinIssueDuration}
            onChange={(event) => updateField("skinIssueDuration", event.target.value)}
            className="mt-2 h-11 w-full rounded-md border border-black/10 px-3"
          />
        </div>

        <div>
          <p className="block text-sm font-medium text-foreground">Current Products (select all that apply)</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {currentProductsOptions.map((opt) => (
              <label key={opt} className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="currentProducts"
                  value={opt}
                  checked={formState.currentProducts.includes(opt)}
                  onChange={() => toggleArrayField("currentProducts", opt)}
                  className="mr-2"
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="block text-sm font-medium text-foreground">Allergic Ingredients</p>
          <div className="mt-2 flex flex-col gap-2">
            {allergicOptions.map((opt) => (
              <label key={opt} className="inline-flex items-center">
                <input
                  type="radio"
                  name="allergicIngredients"
                  value={opt}
                  checked={formState.allergicIngredients === opt}
                  onChange={() => updateField("allergicIngredients", opt)}
                  className="mr-2"
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="block text-sm font-medium text-foreground">Double Cleanse Preference</p>
          <div className="mt-2 flex gap-4 flex-wrap">
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
                  className="mr-2"
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="block text-sm font-medium text-foreground">Sleep Hours</p>
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
                  className="mr-2"
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="block text-sm font-medium text-foreground">Water Intake</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {[
              "Less than 1-2 Litres",
              "1-2 Litres",
              "More than 2 Litres",
            ].map((opt) => (
              <label key={opt} className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="waterIntake"
                  value={opt}
                  checked={formState.waterIntake.includes(opt)}
                  onChange={() => toggleArrayField("waterIntake", opt)}
                  className="mr-2"
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground">Wants Consultation</label>
            <div className="mt-2 flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="wantsConsultation"
                  value="yes"
                  checked={formState.wantsConsultation === "yes"}
                  onChange={() => updateField("wantsConsultation", "yes")}
                  className="mr-2"
                />
                <span className="ml-2">Yes</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="wantsConsultation"
                  value="no"
                  checked={formState.wantsConsultation === "no"}
                  onChange={() => updateField("wantsConsultation", "no")}
                  className="mr-2"
                />
                <span className="ml-2">No</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Applies Sunscreen</label>
            <div className="mt-2 flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="appliesSunscreen"
                  value="yes"
                  checked={formState.appliesSunscreen === "yes"}
                  onChange={() => updateField("appliesSunscreen", "yes")}
                  className="mr-2"
                />
                <span className="ml-2">Yes</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="appliesSunscreen"
                  value="no"
                  checked={formState.appliesSunscreen === "no"}
                  onChange={() => updateField("appliesSunscreen", "no")}
                  className="mr-2"
                />
                <span className="ml-2">No</span>
              </label>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground">Regular Period Cycle</label>
            <div className="mt-2 flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="regularPeriodCycle"
                  value="yes"
                  checked={formState.regularPeriodCycle === "yes"}
                  onChange={() => updateField("regularPeriodCycle", "yes")}
                  className="mr-2"
                />
                <span className="ml-2">Yes</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="regularPeriodCycle"
                  value="no"
                  checked={formState.regularPeriodCycle === "no"}
                  onChange={() => updateField("regularPeriodCycle", "no")}
                  className="mr-2"
                />
                <span className="ml-2">No</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Used IndoPak Night Cream</label>
            <div className="mt-2 flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="usedIndoPakNightCream"
                  value="yes"
                  checked={formState.usedIndoPakNightCream === "yes"}
                  onChange={() => updateField("usedIndoPakNightCream", "yes")}
                  className="mr-2"
                />
                <span className="ml-2">Yes</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="usedIndoPakNightCream"
                  value="no"
                  checked={formState.usedIndoPakNightCream === "no"}
                  onChange={() => updateField("usedIndoPakNightCream", "no")}
                  className="mr-2"
                />
                <span className="ml-2">No</span>
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground">Additional Notes</label>
          <textarea
            name="note"
            rows={4}
            value={formState.note}
            onChange={(event) => updateField("note", event.target.value)}
            className="mt-2 w-full rounded-md border border-black/10 px-3 py-2"
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button type="submit" disabled={isSubmitting} className="inline-flex h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background">
          {isSubmitting ? "Submitting..." : "Submit Survey"}
        </button>
      </form>
      </center>
    </section>
  );
}
