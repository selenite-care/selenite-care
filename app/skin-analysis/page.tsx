"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Loader2,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

type AccessStatus = {
  freeRemaining: number;
  paidCredits: number;
  membershipTier: "SIGNATURE" | "CRYSTAL" | "PLATINUM" | null;
  pricePerAnalysis: number;
};

type AnalysisResult = {
  cached: boolean;
  analysisId: string;
  skinType: string | null;
  concerns: string[];
  fullAnalysis: string;
  summary: string;
  consultationNote: string;
  pdfUrl: string | null;
};

type SkinAnalysisResponse = Partial<AnalysisResult> & {
  error?: string;
  price?: number;
  message?: string;
};

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const PENDING_ANALYSIS_DB = "selenite-skin-analysis";
const PENDING_ANALYSIS_STORE = "pending-files";
const PENDING_ANALYSIS_KEY = "latest";
const EPS_PAYMENT_REDIRECT_FLAG = "selenite_skin_analysis_eps_redirect";

type ImagePosition = "front" | "left" | "right";
type SelectedImageFiles = Record<ImagePosition, File | null>;
type PreviewUrls = Record<ImagePosition, string>;

const IMAGE_POSITIONS = ["front", "left", "right"] as const;

function getSkinTypeClasses(skinType: string | null) {
  switch (skinType) {
    case "Oily":
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200";
    case "Dry":
      return "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-200";
    case "Combination":
      return "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-200";
    case "Sensitive":
      return "border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-900/50 dark:bg-pink-950/30 dark:text-pink-200";
    case "Normal":
    default:
      return "border-[#D4B47A] bg-[#FFF8E6] text-[#8A641D] dark:border-[#D4B47A]/60 dark:bg-[#3A3020] dark:text-[#F3DFA6]";
  }
}

function getTierLabel(tier: AccessStatus["membershipTier"]) {
  if (!tier) return "membership";

  return tier.charAt(0) + tier.slice(1).toLowerCase();
}

function splitParagraphs(text: string) {
  return text
    .split(/\n{2,}|\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function getPurchaseIssueFromParams(searchParams: URLSearchParams) {
  if (searchParams.get("purchase_cancelled") === "true") {
    return {
      title: "Payment cancelled",
      message:
        "No payment was taken and no credit was used. Your selected photo is still here, so you can try again whenever you are ready.",
      tone: "amber",
    } as const;
  }

  if (searchParams.get("purchase_failed") === "true") {
    return {
      title: "Payment was not completed",
      message:
        "Your skin analysis credit was not added because EPS did not confirm the payment. If money was deducted, please contact us and we will verify it for you.",
      tone: "red",
    } as const;
  }

  return null;
}

type PendingAnalysisFile = {
  blob: Blob;
  name: string;
  type: string;
  lastModified: number;
};

type PendingAnalysisFiles = Partial<
  Record<ImagePosition, PendingAnalysisFile>
>;

function openPendingAnalysisDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(PENDING_ANALYSIS_DB, 1);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(PENDING_ANALYSIS_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function serializePendingFile(file: File): PendingAnalysisFile {
  return {
    blob: file,
    name: file.name,
    type: file.type,
    lastModified: file.lastModified,
  };
}

function restorePendingFile(
  pending: PendingAnalysisFile | undefined,
  fallbackName: string,
) {
  if (!pending?.blob) return null;

  return new File([pending.blob], pending.name || fallbackName, {
    type: pending.type || pending.blob.type || "image/jpeg",
    lastModified: pending.lastModified || Date.now(),
  });
}

function isLegacyPendingFile(value: unknown): value is PendingAnalysisFile {
  return (
    typeof value === "object" &&
    value !== null &&
    "blob" in value &&
    value.blob instanceof Blob
  );
}

async function savePendingAnalysisFiles(files: SelectedImageFiles) {
  const db = await openPendingAnalysisDb();
  const pendingFiles: PendingAnalysisFiles = {};

  for (const position of IMAGE_POSITIONS) {
    const file = files[position];

    if (file) {
      pendingFiles[position] = serializePendingFile(file);
    }
  }

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(PENDING_ANALYSIS_STORE, "readwrite");
    transaction.objectStore(PENDING_ANALYSIS_STORE).put(
      pendingFiles,
      PENDING_ANALYSIS_KEY,
    );
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });

  db.close();
}

async function readPendingAnalysisFiles(): Promise<SelectedImageFiles | null> {
  const db = await openPendingAnalysisDb();
  const pending = await new Promise<unknown>(
    (resolve, reject) => {
      const transaction = db.transaction(PENDING_ANALYSIS_STORE, "readonly");
      const request = transaction
        .objectStore(PENDING_ANALYSIS_STORE)
        .get(PENDING_ANALYSIS_KEY);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    },
  );

  db.close();

  if (!pending) {
    return null;
  }

  if (isLegacyPendingFile(pending)) {
    return {
      front: restorePendingFile(pending, "front-face.jpg"),
      left: null,
      right: null,
    };
  }

  const pendingFiles = pending as PendingAnalysisFiles;
  const files: SelectedImageFiles = {
    front: restorePendingFile(pendingFiles.front, "front-face.jpg"),
    left: restorePendingFile(pendingFiles.left, "left-profile.jpg"),
    right: restorePendingFile(pendingFiles.right, "right-profile.jpg"),
  };

  return files.front || files.left || files.right ? files : null;
}

async function clearPendingAnalysisFile() {
  const db = await openPendingAnalysisDb();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(PENDING_ANALYSIS_STORE, "readwrite");
    transaction.objectStore(PENDING_ANALYSIS_STORE).delete(PENDING_ANALYSIS_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });

  db.close();
}

function SkinAnalysisPageContent() {
  const searchParams = useSearchParams();
  const { status } = useSession();
  const frontInputRef = useRef<HTMLInputElement | null>(null);
  const leftInputRef = useRef<HTMLInputElement | null>(null);
  const rightInputRef = useRef<HTMLInputElement | null>(null);
  const [accessStatus, setAccessStatus] = useState<AccessStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [selectedImages, setSelectedImages] = useState<SelectedImageFiles>({
    front: null,
    left: null,
    right: null,
  });
  const [previewUrls, setPreviewUrls] = useState<PreviewUrls>({
    front: "",
    left: "",
    right: "",
  });
  const previewUrlsRef = useRef(previewUrls);
  const [error, setError] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentPrice, setPaymentPrice] = useState(25);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const [showPurchaseBanner, setShowPurchaseBanner] = useState(
    searchParams.get("purchased") === "true",
  );
  const [purchaseIssue, setPurchaseIssue] = useState(() =>
    getPurchaseIssueFromParams(searchParams),
  );
  const hasResumedPurchasedAnalysis = useRef(false);

  const isLoggedIn = status === "authenticated";
  const fullAnalysisParagraphs = useMemo(
    () => splitParagraphs(result?.fullAnalysis ?? ""),
    [result?.fullAnalysis],
  );
  const inputRefs = {
    front: frontInputRef,
    left: leftInputRef,
    right: rightInputRef,
  };
  const uploadZones = [
    {
      position: "front" as const,
      title: "Front Face",
      required: true,
      Icon: User,
    },
    {
      position: "left" as const,
      title: "Left Profile",
      required: false,
      Icon: ChevronLeft,
    },
    {
      position: "right" as const,
      title: "Right Profile",
      required: false,
      Icon: ChevronRight,
    },
  ];

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    let isMounted = true;

    async function loadStatus() {
      setIsLoadingStatus(true);

      try {
        const response = await fetch("/api/skin-analysis/status", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load analysis credits.");
        }

        const data = (await response.json()) as AccessStatus;

        if (isMounted) {
          setAccessStatus(data);
          setPaymentPrice(data.pricePerAnalysis);
        }
      } catch {
        if (isMounted) {
          setAccessStatus(null);
        }
      } finally {
        if (isMounted) {
          setIsLoadingStatus(false);
        }
      }
    }

    void loadStatus();

    return () => {
      isMounted = false;
    };
  }, [status]);

  useEffect(() => {
    function resetPurchasingState(event?: PageTransitionEvent) {
      setIsPurchasing(false);

      if (
        event?.persisted &&
        window.sessionStorage.getItem(EPS_PAYMENT_REDIRECT_FLAG) === "true"
      ) {
        window.sessionStorage.removeItem(EPS_PAYMENT_REDIRECT_FLAG);
        window.location.reload();
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        resetPurchasingState();
      }
    }

    window.addEventListener("pageshow", resetPurchasingState);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", resetPurchasingState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    previewUrlsRef.current = previewUrls;
  }, [previewUrls]);

  useEffect(() => {
    return () => {
      Object.values(previewUrlsRef.current).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  function handleSelectImage(position: ImagePosition, file: File) {
    setError("");
    setPaymentMessage("");
    setPurchaseIssue(null);
    setResult(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please upload a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Image must be under 10MB.");
      return;
    }

    if (previewUrls[position]) {
      URL.revokeObjectURL(previewUrls[position]);
    }

    setSelectedImages((current) => ({ ...current, [position]: file }));
    setPreviewUrls((current) => ({
      ...current,
      [position]: URL.createObjectURL(file),
    }));
  }

  function handleRemoveImage(position: ImagePosition) {
    if (previewUrls[position]) {
      URL.revokeObjectURL(previewUrls[position]);
    }

    setSelectedImages((current) => ({ ...current, [position]: null }));
    setPreviewUrls((current) => ({ ...current, [position]: "" }));
    setResult(null);
    setError("");
    setPaymentMessage("");
    setPurchaseIssue(null);
    const input = {
      front: frontInputRef.current,
      left: leftInputRef.current,
      right: rightInputRef.current,
    }[position];

    if (input) input.value = "";
  }

  async function refreshAccessStatus() {
    if (!isLoggedIn) return;

    const response = await fetch("/api/skin-analysis/status", {
      cache: "no-store",
    });

    if (response.ok) {
      setAccessStatus((await response.json()) as AccessStatus);
    }
  }

  async function analyzeFiles(files: SelectedImageFiles) {
    if (isAnalyzing) return;

    setIsAnalyzing(true);
    setError("");
    setPaymentMessage("");
    setCopyMessage("");

    try {
      const formData = new FormData();
      formData.append("frontImage", files.front!);

      if (files.left) {
        formData.append("leftImage", files.left);
      }

      if (files.right) {
        formData.append("rightImage", files.right);
      }

      const response = await fetch("/api/skin-analysis", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json().catch(() => null)) as
        | SkinAnalysisResponse
        | null;

      if (response.status === 402) {
        setPaymentPrice(data?.price ?? accessStatus?.pricePerAnalysis ?? 25);
        setPaymentMessage(
          data?.message ?? "Purchase an analysis credit to continue.",
        );
        return;
      }

      if (!response.ok || !data?.analysisId) {
        throw new Error(data?.error ?? "Unable to analyze this image.");
      }

      setResult({
        cached: Boolean(data.cached),
        analysisId: data.analysisId,
        skinType: data.skinType ?? null,
        concerns: data.concerns ?? [],
        fullAnalysis: data.fullAnalysis ?? "",
        summary: data.summary ?? "",
        consultationNote: data.consultationNote ?? "",
        pdfUrl: data.pdfUrl ?? null,
      });
      await clearPendingAnalysisFile().catch(() => undefined);
      await refreshAccessStatus();
    } catch (analysisError) {
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "Unable to analyze this image.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleAnalyze() {
    if (!selectedImages.front) return;

    await analyzeFiles(selectedImages);
  }

  async function handlePurchase(quantity = 1) {
    setIsPurchasing(true);
    setError("");
    setPurchaseIssue(null);

    try {
      if (selectedImages.front) {
        await savePendingAnalysisFiles(selectedImages);
      }

      if (!isLoggedIn) {
        const callbackUrl = `${window.location.pathname}${window.location.search}`;
        window.location.href = `/login?callbackUrl=${encodeURIComponent(
          callbackUrl || "/skin-analysis",
        )}`;
        return;
      }

      const response = await fetch("/api/skin-analysis/purchase/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
      });
      const data = (await response.json().catch(() => null)) as
        | { redirectUrl?: string; error?: string }
        | null;

      if (!response.ok || !data?.redirectUrl) {
        throw new Error(data?.error ?? "Unable to start payment.");
      }

      window.sessionStorage.setItem(EPS_PAYMENT_REDIRECT_FLAG, "true");
      window.location.href = data.redirectUrl;
    } catch (purchaseError) {
      setError(
        purchaseError instanceof Error
          ? purchaseError.message
          : "Unable to start payment.",
      );
      setIsPurchasing(false);
    }
  }

  useEffect(() => {
    const currentPurchaseIssue = getPurchaseIssueFromParams(searchParams);

    if (currentPurchaseIssue) {
      window.sessionStorage.removeItem(EPS_PAYMENT_REDIRECT_FLAG);

      async function restorePendingPhoto() {
        await refreshAccessStatus();
        const pendingFiles = await readPendingAnalysisFiles().catch(() => null);

        if (pendingFiles) {
          for (const position of IMAGE_POSITIONS) {
            const file = pendingFiles[position];
            if (file) handleSelectImage(position, file);
          }
        }

        setPurchaseIssue(currentPurchaseIssue);
      }

      void restorePendingPhoto();
      return;
    }

    if (
      searchParams.get("purchased") !== "true" ||
      hasResumedPurchasedAnalysis.current
    ) {
      return;
    }

    hasResumedPurchasedAnalysis.current = true;
    window.sessionStorage.removeItem(EPS_PAYMENT_REDIRECT_FLAG);

    async function restorePurchasedAnalysisPhoto() {
      try {
        const pendingFiles = await readPendingAnalysisFiles();

        if (!pendingFiles) {
          await refreshAccessStatus();
          return;
        }

        for (const position of IMAGE_POSITIONS) {
          const file = pendingFiles[position];
          if (file) handleSelectImage(position, file);
        }
        await refreshAccessStatus();
      } catch {
        setError(
          "Credits were added, but we could not restore the selected images. Please upload them again.",
        );
      }
    }

    void restorePurchasedAnalysisPhoto();
    // Resume should run only once for the current purchased redirect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function handleCopyLink() {
    const value = result?.pdfUrl || window.location.href;

    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage("Link copied.");
    } catch {
      setCopyMessage("Unable to copy link.");
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F5F0] px-4 py-10 text-[#2B2B2B] dark:bg-[#141210] dark:text-[#F0EDE8] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        {showPurchaseBanner ? (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-200">
            <span>
              Credits added successfully! Review your photo, then click Analyze
              My Skin.
            </span>
            <button
              type="button"
              onClick={() => setShowPurchaseBanner(false)}
              className="rounded p-1 transition-colors hover:bg-green-100 dark:hover:bg-green-900/40"
              aria-label="Dismiss purchase success"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {purchaseIssue ? (
          <div
            className={`mb-6 rounded-xl border px-4 py-4 text-sm ${
              purchaseIssue.tone === "amber"
                ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-100"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{purchaseIssue.title}</p>
                <p className="mt-1 leading-6">{purchaseIssue.message}</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handlePurchase(1)}
                    disabled={isPurchasing}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-[#2B2B2B] px-4 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#884F38] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPurchasing ? "Starting payment..." : "Try Payment Again"}
                  </button>
                  <a
                    href="https://wa.me/8801647660300"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center justify-center rounded-md border border-current px-4 text-sm font-medium transition-colors hover:bg-white/40 dark:hover:bg-white/10"
                  >
                    Contact Support
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPurchaseIssue(null)}
                className="rounded p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Dismiss payment message"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}

        <header className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#D4B47A]/60 bg-[#FFF8E6] text-[#C4A56B] dark:bg-[#33291C]">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1
            className="mt-5 text-3xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            AI Skin Analysis
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#884F38] dark:text-[#B8AAA0]">
            Upload a clear photo of your skin for an instant AI-powered
            assessment. Get accurate skin type identification and concern
            analysis.
          </p>
        </header>

        {isLoggedIn ? (
          <section className="mt-8 rounded-2xl border border-[#EADDCD] bg-white p-5 shadow-sm dark:border-[#3D3530] dark:bg-[#1F1B18]">
            {isLoadingStatus ? (
              <p className="text-sm text-[#6E6257] dark:text-[#B8AAA0]">
                Loading analysis credits...
              </p>
            ) : (
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  {accessStatus?.freeRemaining ? (
                    <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm font-medium text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-200">
                      {accessStatus.freeRemaining} free analysis remaining with
                      your {getTierLabel(accessStatus.membershipTier)} membership
                    </span>
                  ) : accessStatus?.paidCredits ? (
                    <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
                      {accessStatus.paidCredits} analysis credits remaining
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                      No credits - {accessStatus?.pricePerAnalysis ?? paymentPrice} BDT per
                      analysis
                    </span>
                  )}
                </div>

                {!accessStatus?.freeRemaining ? (
                  <button
                    type="button"
                    onClick={() => void handlePurchase(1)}
                    disabled={isPurchasing}
                    className="inline-flex h-11 items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#884F38] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#D4B47A] dark:text-[#141210] dark:hover:bg-[#C4A56B]"
                  >
                    {isPurchasing ? "Starting payment..." : "Buy Analysis Credits"}
                  </button>
                ) : null}
              </div>
            )}
          </section>
        ) : null}

        <section className="mt-6 rounded-2xl border border-[#EADDCD] bg-white dark:border-[#3D3530] dark:bg-[#1F1B18]">
          <button
            type="button"
            onClick={() => setShowTips((current) => !current)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
          >
            Tips for best results
            <ChevronDown
              className={`h-5 w-5 text-[#C4A56B] transition-transform ${
                showTips ? "rotate-180" : ""
              }`}
            />
          </button>
          {showTips ? (
            <div className="border-t border-[#EADDCD] px-5 py-4 dark:border-[#3D3530]">
              <ul className="grid gap-3 text-sm text-[#6E6257] dark:text-[#B8AAA0] sm:grid-cols-2">
                {[
                  "Clean face, no makeup",
                  "Good natural lighting",
                  "Face centered and close",
                  "Front facing",
                  "No filters or edits",
                ].map((tip) => (
                  <li key={tip} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#C4A56B]" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="mt-6">
          <div className="grid gap-5 md:grid-cols-3">
            {uploadZones.map(({ position, title, required, Icon }) => (
              <div key={position} className="min-w-0">
                <div className="mb-2 flex min-h-6 items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                    {title}
                  </h2>
                  {required ? (
                    <span className="rounded-full border border-[#D4B47A] bg-[#FFF8E6] px-2 py-0.5 text-[11px] font-semibold text-[#8A641D] dark:bg-[#33291C] dark:text-[#F3DFA6]">
                      Required
                    </span>
                  ) : (
                    <span className="text-xs text-[#8C7967] dark:text-[#8A7D75]">
                      Optional
                    </span>
                  )}
                </div>

                <div
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const file = event.dataTransfer.files[0];
                    if (file) handleSelectImage(position, file);
                  }}
                  className="relative aspect-square w-full overflow-hidden rounded-xl border-2 border-dashed border-[#D4B47A] bg-white transition-colors hover:bg-[#FFFDF8] dark:bg-[#1F1B18] dark:hover:bg-[#24201C]"
                >
                  <button
                    type="button"
                    onClick={() => inputRefs[position].current?.click()}
                    className="absolute inset-0 flex h-full w-full flex-col items-center justify-center p-5 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#B87B68]"
                    aria-label={`Upload ${title.toLowerCase()} photo`}
                  >
                    {previewUrls[position] ? (
                      <>
                        <Image
                          src={previewUrls[position]}
                          alt={`${title} preview`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <span className="absolute inset-x-0 bottom-0 bg-black/65 px-3 py-2 text-xs font-medium text-white">
                          Click to change
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#D4B47A]/60 bg-[#FFF8E6] text-[#C4A56B] dark:bg-[#33291C]">
                          <Icon className="h-7 w-7" aria-hidden="true" />
                        </span>
                        <span className="mt-4 text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                          Upload {title}
                        </span>
                        <span className="mt-2 text-xs text-[#884F38] dark:text-[#B8AAA0]">
                          Drop or click to browse
                        </span>
                        <span className="mt-3 text-[11px] text-[#6E6257] dark:text-[#8A7D75]">
                          JPG, PNG or WebP - Max 10MB
                        </span>
                      </>
                    )}
                  </button>

                  {previewUrls[position] ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(position)}
                      className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4B47A]"
                      aria-label={`Remove ${title.toLowerCase()} photo`}
                      title={`Remove ${title} photo`}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  ) : null}
                </div>

                <input
                  ref={inputRefs[position]}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleSelectImage(position, file);
                  }}
                />
              </div>
            ))}
          </div>

          <p className="mt-4 text-center text-sm leading-6 text-[#884F38] dark:text-[#B8AAA0]">
            Front photo is required. Adding side profiles significantly improves
            accuracy.
          </p>
        </section>

        {paymentMessage ? (
          <section className="mt-6 rounded-2xl border border-[#D4B47A] bg-[#FFF8E6] p-5 text-[#2B2B2B] dark:bg-[#33291C] dark:text-[#F0EDE8]">
            <h2 className="text-lg font-semibold">
              This analysis costs {paymentPrice} BDT
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#884F38] dark:text-[#B8AAA0]">
              {paymentMessage}
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void handlePurchase(1)}
                disabled={isPurchasing}
                className="inline-flex h-11 items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#884F38] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPurchasing ? "Starting payment..." : "Buy Membership to get 1 free analysis"}
              </button>
              <button
                type="button"
                onClick={() => void handlePurchase(1)}
                disabled={isPurchasing}
                className="inline-flex h-11 items-center justify-center rounded-md border border-[#D4B47A] px-5 text-sm font-medium text-[#2B2B2B] transition-colors hover:bg-[#F3E7C5] disabled:cursor-not-allowed disabled:opacity-60 dark:text-[#F0EDE8] dark:hover:bg-[#4A3B25]"
              >
                Proceed with Single Analysis
              </button>
            </div>
          </section>
        ) : null}

        {error ? (
          <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => void handleAnalyze()}
          disabled={!selectedImages.front || isAnalyzing}
          className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#2B2B2B] px-5 text-sm font-semibold text-[#F8F5F0] transition-colors hover:bg-[#884F38] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#D4B47A] dark:text-[#141210] dark:hover:bg-[#C4A56B]"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze My Skin"
          )}
        </button>

        {result ? (
          <section className="mt-10 animate-in fade-in duration-500">
            {result.cached ? (
              <p className="mb-4 rounded-xl border border-[#EADDCD] bg-white px-4 py-3 text-sm text-[#6E6257] dark:border-[#3D3530] dark:bg-[#1F1B18] dark:text-[#B8AAA0]">
                Previous analysis found for this image - showing cached result
              </p>
            ) : null}

            <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
              <div className="rounded-2xl border border-[#EADDCD] bg-white p-5 dark:border-[#3D3530] dark:bg-[#1F1B18]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B87B68]">
                  Skin Type
                </p>
                <span
                  className={`mt-4 inline-flex rounded-full border px-4 py-2 text-lg font-semibold ${getSkinTypeClasses(
                    result.skinType,
                  )}`}
                >
                  {result.skinType ?? "Unknown"}
                </span>
              </div>

              <div className="rounded-2xl border border-[#EADDCD] bg-white p-5 dark:border-[#3D3530] dark:bg-[#1F1B18]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B87B68]">
                  Identified Concerns
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {result.concerns.length > 0 ? (
                    result.concerns.map((concern) => (
                      <span
                        key={concern}
                        className="rounded-full border border-[#EADDCD] bg-[#F8F5F0] px-3 py-1 text-sm text-[#884F38] dark:border-[#3D3530] dark:bg-[#141210] dark:text-[#D9C9BD]"
                      >
                        {concern}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-[#6E6257] dark:text-[#B8AAA0]">
                      No specific concerns identified.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-[#EADDCD] bg-white p-5 dark:border-[#3D3530] dark:bg-[#1F1B18]">
              <h2
                className="text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Full Analysis
              </h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-[#5F524A] dark:text-[#D9C9BD]">
                {fullAnalysisParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>

            {result.consultationNote ? (
              <div className="mt-5 border-l-4 border-[#D4B47A] bg-[#FFF8E6] p-5 dark:bg-[#33291C]">
                <p className="text-sm leading-7 text-[#5F524A] dark:text-[#F0EDE8]">
                  {result.consultationNote}
                </p>
                <Link
                  href="/services"
                  className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-[#2B2B2B] px-4 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#884F38]"
                >
                  Book Consultation →
                </Link>
              </div>
            ) : null}

            <div className="mt-5 rounded-2xl border border-[#EADDCD] bg-white p-5 dark:border-[#3D3530] dark:bg-[#1F1B18]">
              <div className="flex flex-col gap-3 sm:flex-row">
                {result.pdfUrl ? (
                  <a
                    href={result.pdfUrl}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#884F38]"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => void handleCopyLink()}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#EADDCD] px-5 text-sm font-medium text-[#2B2B2B] transition-colors hover:bg-[#F8F5F0] dark:border-[#3D3530] dark:text-[#F0EDE8] dark:hover:bg-[#141210]"
                >
                  <Copy className="h-4 w-4" />
                  Copy Link
                </button>
              </div>
              {copyMessage ? (
                <p className="mt-3 text-sm text-[#6E6257] dark:text-[#B8AAA0]">
                  {copyMessage}
                </p>
              ) : null}
            </div>

            <section className="mt-5 animate-in fade-in duration-500 rounded-2xl border border-[#D4B47A] bg-[#2B2B2B] p-6 text-[#F8F5F0] shadow-lg dark:bg-[#141210]">
              <h2
                className="text-2xl font-semibold text-[#F8F5F0]"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Want Expert Guidance?
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#D9C9BD]">
                Our certified aestheticians can create a personalized skincare
                routine, recommend the right products, and guide you through
                your skin transformation journey.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-[#D4B47A]/40 bg-white/5 p-4">
                  <p className="text-sm leading-6 text-[#D9C9BD]">
                    Get a personalized consultation with our skin experts
                  </p>
                  <Link
                    href="/services"
                    className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-md bg-[#D4B47A] px-4 text-sm font-semibold text-[#2B2B2B] transition-colors hover:bg-[#C4A56B]"
                  >
                    Book a Consultation
                  </Link>
                </div>

                <div className="rounded-xl border border-[#D4B47A]/40 bg-white/5 p-4">
                  <p className="text-sm leading-6 text-[#D9C9BD]">
                    Chat with our team directly on Facebook
                  </p>
                  <a
                    href="https://www.facebook.com/care.selenite"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#1877F2] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1666d8]"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987H7.9v-2.89h2.538V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                    </svg>
                    Message Us on Facebook
                  </a>
                </div>

                <div className="rounded-xl border border-[#D4B47A]/40 bg-white/5 p-4">
                  <p className="text-sm leading-6 text-[#D9C9BD]">
                    Get quick answers on WhatsApp
                  </p>
                  <a
                    href="https://wa.me/8801647660300"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#25D366] px-4 text-sm font-semibold text-[#102A18] transition-colors hover:bg-[#20bd5a]"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp Us
                  </a>
                </div>
              </div>

              <p className="mt-5 text-xs leading-6 text-[#D9C9BD]">
                Your skin analysis results have been saved. Share them with our
                team for better personalized advice.
              </p>
            </section>

            {!isLoggedIn ? (
              <div className="mt-5 rounded-2xl border border-[#D4B47A] bg-white p-5 text-center dark:bg-[#1F1B18]">
                <h2 className="text-lg font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                  Save your analysis history and get free analyses with membership
                </h2>
                <Link
                  href="/register"
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#884F38]"
                >
                  Sign Up Free
                </Link>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}

export default function SkinAnalysisPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F8F5F0] dark:bg-[#141210]" />
      }
    >
      <SkinAnalysisPageContent />
    </Suspense>
  );
}
