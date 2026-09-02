"use client";

import { FormEvent, KeyboardEvent, useState } from "react";
import { useSession } from "next-auth/react";
import { Check, ChevronDown, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

const skinTypes = ["Oily", "Dry", "Combination", "Normal", "Sensitive", "Not Sure"];

const skinIssueOptions = [
  "Acne & Breakouts",
  "Acne Scars",
  "Hyperpigmentation",
  "PIE & PIH",
  "Melasma",
  "Uneven Skin Tone",
  "Sensitive Skin",
  "Dry & Dehydrated",
  "Oily Skin",
  "Aging Concerns",
  "Skin Barrier Damage",
];

const doubleCleanseOptions = ["Yes", "No", "Not Sure"];
const sleepHourOptions = ["Less than 6", "6-7", "7-8", "More than 8"];
const waterIntakeOptions = ["Less than 1L", "1-2L", "2-3L", "More than 3L"];
const yesNoOptions = ["Yes", "No"];
const periodCycleOptions = ["Yes", "No", "Prefer not to say"];
const steroidOptions = ["Yes", "No", "Not Sure"];

type FormState = {
  skinType: string;
  skinIssues: string[];
  currentProducts: string[];
  allergicIngredients: string[];
  doubleCleansePreference: string;
  sleepHours: string;
  waterIntake: string;
  appliesSunscreen: string;
  regularPeriodCycle: string;
  usedSteroidBasedNightCream: string;
  previousConsultation: string;
};

const initialFormState: FormState = {
  skinType: "",
  skinIssues: [],
  currentProducts: [],
  allergicIngredients: [],
  doubleCleansePreference: "",
  sleepHours: "",
  waterIntake: "",
  appliesSunscreen: "",
  regularPeriodCycle: "",
  usedSteroidBasedNightCream: "",
  previousConsultation: "",
};

function toBoolean(value: string) {
  return value === "Yes";
}

function toNullableBoolean(value: string) {
  if (value === "Yes") {
    return true;
  }

  if (value === "No") {
    return false;
  }

  return null;
}

function FieldLabel({ children }: { children: string }) {
  return (
    <label className="text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
      {children}
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative mt-2">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full appearance-none rounded-xl border border-[#EADDCD] bg-white px-4 pr-10 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8]"
        >
          <option value="">Select an option</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B87B68]"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

function TagInput({
  label,
  placeholder,
  tags,
  onAdd,
  onRemove,
}: {
  label: string;
  placeholder: string;
  tags: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
}) {
  const [value, setValue] = useState("");

  function addTag() {
    const trimmed = value.trim();

    if (!trimmed) {
      return;
    }

    onAdd(trimmed);
    setValue("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      addTag();
    }
  }

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder={placeholder}
        className="mt-2 h-12 w-full rounded-xl border border-[#EADDCD] bg-white px-4 text-sm text-[#2B2B2B] outline-none transition-colors placeholder:text-[#8C7967] focus:border-[#B87B68] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8] dark:placeholder:text-[#8A7D75]"
      />
      {tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-2 rounded-full bg-[#EADDCD] px-3 py-1 text-xs font-semibold text-[#884F38] dark:bg-[#3D3530] dark:text-[#D4B47A]"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="text-[#884F38] hover:text-[#B87B68] dark:text-[#D4B47A]"
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function SetupSkinProfilePage() {
  const { update } = useSession();
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [submitIntent, setSubmitIntent] = useState<"save" | "skip" | null>(null);
  const isSubmitting = submitIntent !== null;

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  function toggleSkinIssue(issue: string) {
    setFormState((current) => ({
      ...current,
      skinIssues: current.skinIssues.includes(issue)
        ? current.skinIssues.filter((item) => item !== issue)
        : [...current.skinIssues, issue],
    }));
  }

  function addTag(field: "currentProducts" | "allergicIngredients", value: string) {
    setFormState((current) => {
      if (current[field].includes(value)) {
        return current;
      }

      return {
        ...current,
        [field]: [...current[field], value],
      };
    });
  }

  function removeTag(field: "currentProducts" | "allergicIngredients", value: string) {
    setFormState((current) => ({
      ...current,
      [field]: current[field].filter((item) => item !== value),
    }));
  }

  async function saveSkinProfile(
    nextFormState: FormState,
    intent: "save" | "skip",
  ) {
    setSubmitIntent(intent);
    let isRedirecting = false;

    try {
      const response = await fetch("/api/client/survey-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          skinType: nextFormState.skinType,
          skinIssues: nextFormState.skinIssues,
          currentProducts: nextFormState.currentProducts,
          allergicIngredients: nextFormState.allergicIngredients,
          doubleCleansePreference: nextFormState.doubleCleansePreference,
          sleepHours: nextFormState.sleepHours,
          waterIntake: nextFormState.waterIntake,
          appliesSunscreen: toBoolean(nextFormState.appliesSunscreen),
          regularPeriodCycle: toBoolean(nextFormState.regularPeriodCycle),
          usedSteroidBasedNightCream: toBoolean(
            nextFormState.usedSteroidBasedNightCream,
          ),
          previousConsultation: toNullableBoolean(nextFormState.previousConsultation),
          facingSkinIssues: nextFormState.skinIssues.length > 0,
          usesKoreanProducts: nextFormState.currentProducts.length > 0,
          skinImages: [],
          currentProductsImage: null,
          note: null,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to save your skin profile.");
      }

      toast.success("Skin profile saved.");
      await update({
        user: {
          skinProfileComplete: true,
        },
        skinProfileComplete: true,
      });
      isRedirecting = true;
      window.location.assign("/dashboard");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save your skin profile.";
      toast.error("Unable to save your skin profile.", {
        description: message,
      });
    } finally {
      if (!isRedirecting) {
        setSubmitIntent(null);
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveSkinProfile(formState, "save");
  }

  return (
    <main className="min-h-screen bg-[#F8F5F0] px-4 py-10 dark:bg-[#141210] sm:px-6 lg:py-14">
      <form
        onSubmit={handleSubmit}
        className="mx-auto w-full max-w-5xl overflow-hidden rounded-[28px] border border-[#EADDCD] bg-white shadow-[0_24px_70px_rgba(43,43,43,0.08)] dark:border-[#3D3530] dark:bg-[#242220]"
      >
        <header className="border-b border-[#EADDCD] bg-[linear-gradient(135deg,#FCFAF7_0%,#F1E5DA_100%)] px-5 py-7 dark:border-[#3D3530] dark:bg-[linear-gradient(135deg,#242220_0%,#1A1814_100%)] sm:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#B87B68]/30 bg-white/70 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#B87B68] dark:bg-[#1A1814]/70 dark:text-[#D4B47A]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Step 2 of 2 - Skin Profile
          </div>
          <h1
            className="mt-5 text-4xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-5xl"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Set Up Your Skin Profile
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#884F38] dark:text-[#8A7D75] sm:text-base">
            Tell us about your skin so we can provide personalized guidance. You
            only need to do this once - you can update it anytime.
          </p>
        </header>

        <div className="grid gap-8 px-5 py-7 sm:px-8 lg:grid-cols-2">
          <SelectField
            label="Skin Type"
            value={formState.skinType}
            options={skinTypes}
            onChange={(value) => updateField("skinType", value)}
          />

          <SelectField
            label="Double Cleanse Preference"
            value={formState.doubleCleansePreference}
            options={doubleCleanseOptions}
            onChange={(value) => updateField("doubleCleansePreference", value)}
          />

          <div className="lg:col-span-2">
            <FieldLabel>Skin Issues</FieldLabel>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {skinIssueOptions.map((issue) => {
                const isSelected = formState.skinIssues.includes(issue);

                return (
                  <button
                    key={issue}
                    type="button"
                    onClick={() => toggleSkinIssue(issue)}
                    className={`flex min-h-12 items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                      isSelected
                        ? "border-[#B87B68] bg-[#B87B68]/12 text-[#2B2B2B] dark:bg-[#B87B68]/20 dark:text-[#F0EDE8]"
                        : "border-[#EADDCD] bg-[#F8F5F0] text-[#6E6257] hover:border-[#B87B68]/60 dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#8A7D75]"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        isSelected
                          ? "border-[#B87B68] bg-[#B87B68] text-white"
                          : "border-[#D8C7B5] text-transparent"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    {issue}
                  </button>
                );
              })}
            </div>
          </div>

          <TagInput
            label="Current Products"
            placeholder="Type a product and press Enter"
            tags={formState.currentProducts}
            onAdd={(value) => addTag("currentProducts", value)}
            onRemove={(value) => removeTag("currentProducts", value)}
          />

          <TagInput
            label="Allergic Ingredients"
            placeholder="Type an ingredient and press Enter"
            tags={formState.allergicIngredients}
            onAdd={(value) => addTag("allergicIngredients", value)}
            onRemove={(value) => removeTag("allergicIngredients", value)}
          />

          <SelectField
            label="Sleep Hours"
            value={formState.sleepHours}
            options={sleepHourOptions}
            onChange={(value) => updateField("sleepHours", value)}
          />

          <SelectField
            label="Water Intake"
            value={formState.waterIntake}
            options={waterIntakeOptions}
            onChange={(value) => updateField("waterIntake", value)}
          />

          <SelectField
            label="Applies Sunscreen"
            value={formState.appliesSunscreen}
            options={yesNoOptions}
            onChange={(value) => updateField("appliesSunscreen", value)}
          />

          <SelectField
            label="Regular Period Cycle"
            value={formState.regularPeriodCycle}
            options={periodCycleOptions}
            onChange={(value) => updateField("regularPeriodCycle", value)}
          />

          <SelectField
            label="Used Steroid Based Night Cream"
            value={formState.usedSteroidBasedNightCream}
            options={steroidOptions}
            onChange={(value) => updateField("usedSteroidBasedNightCream", value)}
          />

          <SelectField
            label="Previous Consultation with Selenite Care"
            value={formState.previousConsultation}
            options={yesNoOptions}
            onChange={(value) => updateField("previousConsultation", value)}
          />
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-[#EADDCD] bg-[#FCFAF7] px-5 py-5 dark:border-[#3D3530] dark:bg-[#1A1814] sm:flex-row sm:justify-end sm:px-8">
          <button
            type="button"
            onClick={() => void saveSkinProfile(initialFormState, "skip")}
            disabled={isSubmitting}
            className="inline-flex h-12 items-center justify-center rounded-full border border-[#D8C7B5] px-6 text-sm font-semibold text-[#884F38] transition-colors hover:border-[#B87B68] hover:text-[#B87B68] dark:border-[#3D3530] dark:text-[#8A7D75] dark:hover:text-[#D4B47A]"
          >
            {submitIntent === "skip" ? "Skipping..." : "Skip for Now"}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-12 items-center justify-center rounded-full bg-[#2B2B2B] px-7 text-sm font-semibold text-[#F8F5F0] transition-colors hover:bg-[#3A3734] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#B87B68] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
          >
            {submitIntent === "save" ? "Saving..." : "Save & Continue"}
          </button>
        </footer>
      </form>
    </main>
  );
}
