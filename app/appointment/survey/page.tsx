"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FileUploadButton from "@/components/ui/FileUploadButton";

const MAX_SKIN_IMAGES = 2;

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
  currentProductsImage: string;
  previousConsultation: boolean | null;
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
    currentProductsImage?: string | null;
    previousConsultation?: boolean | null;
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
    currentProductsImage: "",
    previousConsultation: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingSkinImage, setIsUploadingSkinImage] = useState(false);
  const [isUploadingProductImage, setIsUploadingProductImage] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const [profileResponse, surveyProfileResponse] = await Promise.all([
          fetch("/api/client/profile"),
          fetch("/api/client/survey-profile"),
        ]);

        if (!profileResponse.ok) {
          return;
        }

        const profileData = (await profileResponse.json()) as {
          user?: {
            name?: string | null;
            email?: string | null;
            phone?: string | null;
          };
        };
        const surveyProfileData = surveyProfileResponse.ok
          ? ((await surveyProfileResponse.json().catch(() => null)) as
              | SurveyProfileResponse
              | null)
          : null;
        const surveyProfile = surveyProfileData?.surveyProfile;

        setFormState((current) => ({
          ...current,
          name: current.name || surveyProfile?.name || profileData.user?.name || "",
          age: current.age || surveyProfile?.age || "",
          phone:
            current.phone || surveyProfile?.phone || profileData.user?.phone || "",
          email:
            current.email || surveyProfile?.email || profileData.user?.email || "",
          skinType: current.skinType || surveyProfile?.skinType || "",
          usesKoreanProducts: surveyProfile?.usesKoreanProducts ? "yes" : "no",
          facingSkinIssues: surveyProfile?.facingSkinIssues ? "yes" : "no",
          skinIssues: surveyProfile?.skinIssues ?? [],
          skinIssueDuration: surveyProfile?.skinIssueDuration ?? "",
          currentProducts: surveyProfile?.currentProducts ?? [],
          allergicIngredients: surveyProfile?.allergicIngredients ?? [],
          doubleCleansePreference:
            surveyProfile?.doubleCleansePreference ?? "No",
          sleepHours: surveyProfile?.sleepHours ?? "6-8 Hours",
          waterIntake: surveyProfile?.waterIntake ?? "1-2 Litres",
          appliesSunscreen: surveyProfile?.appliesSunscreen ? "yes" : "no",
          regularPeriodCycle: surveyProfile?.regularPeriodCycle ? "yes" : "no",
          usedSteroidBasedNightCream: surveyProfile?.usedSteroidBasedNightCream
            ? "yes"
            : "no",
          previousConsultation: surveyProfile?.previousConsultation ?? null,
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

  async function handleSkinImageUpload(file: File) {
    setError("");
    if (formState.skinImages.length >= MAX_SKIN_IMAGES) {
      setError(`You can upload up to ${MAX_SKIN_IMAGES} skin photos.`);
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
        skinImages: [...current.skinImages, data.secure_url as string].slice(0, MAX_SKIN_IMAGES),
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

  async function handleCurrentProductsImageUpload(file: File) {
    setError("");
    setIsUploadingProductImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/client/upload-product-image", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json().catch(() => null)) as
        | { secure_url?: string; error?: string }
        | null;

      if (!response.ok || !data?.secure_url) {
        throw new Error(data?.error ?? "Failed to upload product photo.");
      }

      setFormState((current) => ({
        ...current,
        currentProductsImage: data.secure_url as string,
      }));
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Failed to upload product photo.",
      );
    } finally {
      setIsUploadingProductImage(false);
    }
  }

  function removeCurrentProductsImage() {
    setFormState((current) => ({
      ...current,
      currentProductsImage: "",
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
      currentProductsImage: formState.currentProductsImage || null,
      previousConsultation: formState.previousConsultation,
      allergicIngredients: formState.allergicIngredients,
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
          <p className="mt-2 text-sm text-[#884F38] dark:text-[#8A7D75]">
            Share today's photos and notes so your doctor can prepare for your consultation.
          </p>
          <p className="mt-2 text-sm font-medium text-[#B87B68] dark:text-[#D4B47A]">
            All fields are optional - you can submit without uploading any photos.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="survey-form mt-6 space-y-6 rounded-xl border border-[#EADDCD] bg-white p-4 dark:border-[#3D3530] dark:bg-[#242220] sm:p-6"
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

            .dark .survey-form > div + div {
              border-top-color: #3D3530;
            }
          `}</style>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="rounded-xl border border-[#EADDCD] bg-[#F8F5F0] p-4 dark:border-[#3D3530] dark:bg-[#1A1814]">
            <p className="text-sm leading-6 text-[#884F38] dark:text-[#8A7D75]">
              Your skin profile is already saved! Just add your current skin photos and any notes for your doctor.
            </p>
            <Link
              href="/dashboard/survey"
              className="mt-3 inline-flex text-sm font-semibold text-[#B87B68] transition-colors hover:text-[#884F38] dark:text-[#D4B47A]"
            >
              Update your skin profile -&gt;
            </Link>
          </div>

          <div
            className="rounded-lg border border-[#EADDCD] bg-[#F8F5F0] p-4 dark:border-[#3D3530] dark:bg-[#1A1814]"
          >
            <label className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
              Current Skin Photos (Optional)
            </label>
            <p className="mt-2 text-sm leading-6 text-[#884F38] dark:text-[#8A7D75]">
              Upload up to {MAX_SKIN_IMAGES} skin photos. For best results, use clear, makeup-free photos in good lighting.
            </p>

            <div className="mt-4">
              <FileUploadButton
                onFileSelected={(file) => {
                  if (isUploadingSkinImage || formState.skinImages.length >= MAX_SKIN_IMAGES) {
                    return;
                  }

                  void handleSkinImageUpload(file);
                }}
                label={isUploadingSkinImage ? "Uploading..." : "Upload Skin Photo"}
                accept="image/*,.heic,.heif"
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-sm">
              <span className="text-[#884F38] dark:text-[#8A7D75]">
                {formState.skinImages.length}/{MAX_SKIN_IMAGES} images uploaded
              </span>
              {isUploadingSkinImage ? (
                <span style={{ color: "#B87B68" }}>Uploading...</span>
              ) : null}
            </div>

            {formState.skinImages.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {formState.skinImages.map((imageUrl) => (
                  <div
                    key={imageUrl}
                    className="overflow-hidden rounded-lg border border-[#EADDCD] bg-white dark:border-[#3D3530] dark:bg-[#242220]"
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

          <div className="rounded-lg border border-[#EADDCD] bg-[#F8F5F0] p-4 dark:border-[#3D3530] dark:bg-[#1A1814]">
            <p className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
              Photo of Your Current Products (Optional)
            </p>
            <p className="mt-2 text-sm leading-6 text-[#884F38] dark:text-[#8A7D75]">
              Take a photo of all your current skincare products together and upload it here. This helps our doctors understand your routine better.
            </p>

            <div className="mt-4">
              <FileUploadButton
                onFileSelected={(file) => {
                  if (isUploadingProductImage) {
                    return;
                  }

                  void handleCurrentProductsImageUpload(file);
                }}
                label={isUploadingProductImage ? "Uploading..." : "Upload Product Photo"}
                accept="image/*,.heic,.heif"
                currentPreviewUrl={formState.currentProductsImage}
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-sm">
              <span className="text-[#884F38] dark:text-[#8A7D75]">
                {formState.currentProductsImage ? "1/1 image uploaded" : "0/1 image uploaded"}
              </span>
              {isUploadingProductImage ? (
                <span style={{ color: "#B87B68" }}>Uploading...</span>
              ) : null}
            </div>

            {formState.currentProductsImage ? (
              <div className="mt-4 max-w-sm overflow-hidden rounded-lg border border-[#EADDCD] bg-white dark:border-[#3D3530] dark:bg-[#242220]">
                <div className="relative h-48 w-full">
                  <Image
                    src={formState.currentProductsImage}
                    alt="Uploaded current skincare products"
                    fill
                    sizes="(min-width: 640px) 384px, 100vw"
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={removeCurrentProductsImage}
                  className="w-full px-3 py-2 text-sm font-medium text-[#2B2B2B] hover:bg-[#F8F5F0] dark:text-[#F0EDE8] dark:hover:bg-[#1A1814]"
                >
                  Remove
                </button>
              </div>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
              Notes for Your Doctor (Optional)
            </label>
            <textarea
              value={formState.note}
              onChange={(event) => updateField("note", event.target.value)}
              placeholder="Any specific concerns or questions for today's consultation..."
              rows={4}
              className="mt-2 rounded-md border border-[#EADDCD] px-3 py-2 text-[#2B2B2B] focus:border-[#B87B68] focus:outline-none focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:text-[#F0EDE8]"
            />
          </div>

          <div className="flex flex-col gap-3 pt-4 sm:flex-row">
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ backgroundColor: "#2B2B2B", color: "#F8F5F0" }}
              className="h-12 w-full rounded-md text-sm font-medium transition-colors duration-200 hover:bg-[#884F38] disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:flex-1"
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
        <p className="text-sm text-[#884F38] dark:text-[#8A7D75]">
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
