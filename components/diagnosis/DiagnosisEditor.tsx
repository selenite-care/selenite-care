"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type DiagnosisEditorProps = {
  bookingId: string;
  canEdit: boolean;
};

type ProductSearchResult = {
  id: string;
  name: string;
  type: string;
  price: number;
  skinType: string | null;
};

type RecommendedProduct = ProductSearchResult & {
  note: string;
};

type DiagnosisResponse = {
  diagnosis: {
    id: string;
    problemIdentification: string | null;
    recommendations: Array<{
      id: string;
      note: string | null;
      product: ProductSearchResult;
    }>;
  } | null;
};

function isDiagnosisResponse(value: unknown): value is DiagnosisResponse {
  return typeof value === "object" && value !== null && "diagnosis" in value;
}

function mapDiagnosisProducts(diagnosis: DiagnosisResponse["diagnosis"]) {
  return (
    diagnosis?.recommendations.map((item: DiagnosisResponse["diagnosis"] extends infer T
      ? T extends { recommendations: infer R }
        ? R extends Array<infer U>
          ? U
          : never
        : never
      : never) => ({
        ...item.product,
        note: item.note ?? "",
      })) ?? []
  );
}

function formatPrice(price: number) {
  const normalized = Number.isInteger(price) ? price.toString() : price.toFixed(2);
  return `${normalized} BDT`;
}

function formatTimestamp(value: string | null) {
  if (!value) return "Not saved yet";
  return new Date(value).toLocaleString();
}

export default function DiagnosisEditor({
  bookingId,
  canEdit,
}: DiagnosisEditorProps) {
  const [problemIdentification, setProblemIdentification] = useState("");
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>(
    [],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  const recommendedProductIds = useMemo(
    () => new Set(recommendedProducts.map((product) => product.id)),
    [recommendedProducts],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadDiagnosis() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/diagnosis/${bookingId}`, {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as
          | DiagnosisResponse
          | { error?: string }
          | null;

        if (!response.ok) {
          throw new Error(
            data && "error" in data && data.error
              ? data.error
              : "Unable to load diagnosis.",
          );
        }

        if (!isMounted) return;

        const diagnosis = isDiagnosisResponse(data) ? data.diagnosis : null;
        setProblemIdentification(diagnosis?.problemIdentification ?? "");
        setRecommendedProducts(mapDiagnosisProducts(diagnosis));
        setLastSavedAt(new Date().toISOString());
        setHasLoadedOnce(true);
      } catch (loadError) {
        if (!isMounted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load diagnosis.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDiagnosis();

    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  useEffect(() => {
    if (!canEdit) return;

    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/products/search?q=${encodeURIComponent(trimmed)}`,
          { cache: "no-store" },
        );
        const data = (await response.json().catch(() => null)) as
          | { products?: ProductSearchResult[]; error?: string }
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to search products.");
        }

        setSearchResults(data?.products ?? []);
      } catch (searchError) {
        setError(
          searchError instanceof Error
            ? searchError.message
            : "Unable to search products.",
        );
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [canEdit, searchQuery]);

  useEffect(() => {
    if (!canEdit) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(event.target as Node)
      ) {
        setSearchResults([]);
      }
    }

    window.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [canEdit]);

  async function saveDiagnosis(nextProducts?: RecommendedProduct[]) {
    if (!canEdit) return;

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/diagnosis/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          problemIdentification,
          productIds: (nextProducts ?? recommendedProducts).map((product) => ({
            productId: product.id,
            note: product.note.trim() || null,
          })),
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | DiagnosisResponse
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          data && "error" in data && data.error
            ? data.error
            : "Unable to save diagnosis.",
        );
      }

      const diagnosis = isDiagnosisResponse(data) ? data.diagnosis : null;
      setProblemIdentification(diagnosis?.problemIdentification ?? "");
      setRecommendedProducts(mapDiagnosisProducts(diagnosis));
      setLastSavedAt(new Date().toISOString());
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save diagnosis.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function addRecommendedProduct(product: ProductSearchResult) {
    if (recommendedProductIds.has(product.id)) return;

    const nextProducts = [...recommendedProducts, { ...product, note: "" }];
    setRecommendedProducts(nextProducts);
    setSearchQuery("");
    setSearchResults([]);
    void saveDiagnosis(nextProducts);
  }

  function removeRecommendedProduct(productId: string) {
    const nextProducts = recommendedProducts.filter(
      (product) => product.id !== productId,
    );
    setRecommendedProducts(nextProducts);
    void saveDiagnosis(nextProducts);
  }

  function updateProductNote(productId: string, note: string) {
    setRecommendedProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === productId ? { ...product, note } : product,
      ),
    );
  }

  function handleNoteBlur() {
    void saveDiagnosis();
  }

  if (isLoading && !hasLoadedOnce) {
    return (
      <section className="rounded-2xl border border-[#D8C7B5] bg-[#F8F5F0] p-6 dark:border-[#3D3530] dark:bg-[#242220]">
        <p className="text-[#6E6257] dark:text-[#8A7D75]">Loading diagnosis...</p>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-[#D8C7B5] bg-[#F8F5F0] p-6 dark:border-[#3D3530] dark:bg-[#242220]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C6A56B]">
              Section 1
            </p>
            <h2
              className="mt-2 text-2xl font-semibold"
              style={{
                color: "#2B2B2B",
                fontFamily: "Playfair Display, serif",
              }}
            >
              Problem Identification
            </h2>
          </div>

          {canEdit ? (
            <div className="text-sm text-[#6E6257] dark:text-[#8A7D75]">
              Last saved: {formatTimestamp(lastSavedAt)}
            </div>
          ) : null}
        </div>

        {canEdit ? (
          <div className="mt-5 space-y-4">
            <label
              htmlFor="problemIdentification"
              className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
            >
              Problem Identification
            </label>
            <textarea
              id="problemIdentification"
              value={problemIdentification}
              onChange={(event) => setProblemIdentification(event.target.value)}
              onBlur={() => void saveDiagnosis()}
              rows={6}
              className="w-full rounded-xl border bg-white px-4 py-3 text-sm leading-7 text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8] dark:placeholder-[#8A7D75]"
              placeholder="Write the diagnosis or identified concern here..."
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => void saveDiagnosis()}
                disabled={isSaving}
                className="inline-flex h-11 items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#B8A89A] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              {error ? (
                <p className="text-sm" style={{ color: "#C84B4B" }}>
                  {error}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <div
            className="mt-5 rounded-2xl border border-[#D8C7B5] bg-white px-4 py-4 text-sm leading-7 text-[#6E6257] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#8A7D75]"
          >
            {problemIdentification || "No problem identification added yet."}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[#D8C7B5] bg-[#F8F5F0] p-6 dark:border-[#3D3530] dark:bg-[#242220]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C6A56B]">
            Section 2
          </p>
          <h2
            className="mt-2 text-2xl font-semibold"
            style={{
              color: "#2B2B2B",
              fontFamily: "Playfair Display, serif",
            }}
          >
            Product Recommendations
          </h2>
        </div>

        {canEdit ? (
          <div className="mt-6 space-y-6">
            <div ref={searchBoxRef} className="relative">
              <label
                htmlFor="product-search"
                className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
              >
                Search products
              </label>
              <input
                id="product-search"
                type="text"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setError("");
                }}
                placeholder="Search by name, type, or skin type"
                className="mt-2 h-11 w-full rounded-xl border bg-white px-4 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8] dark:placeholder-[#8A7D75]"
                style={{ borderColor: "#D8C7B5" }}
              />

              {(isSearching || searchResults.length > 0) && searchQuery.trim() ? (
                <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-[#D8C7B5] bg-white p-2 shadow-lg dark:border-[#3D3530] dark:bg-[#242220]">
                  {isSearching ? (
                    <p className="px-3 py-3 text-sm text-[#6E6257] dark:text-[#8A7D75]">
                      Searching products...
                    </p>
                  ) : (
                    searchResults.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addRecommendedProduct(product)}
                        disabled={recommendedProductIds.has(product.id)}
                        className="flex w-full items-start justify-between rounded-xl px-3 py-3 text-left transition-colors hover:bg-[#F8F5F0] dark:hover:bg-[#1A1814] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                            {product.name}
                          </p>
                          <p className="mt-1 text-xs text-[#6E6257] dark:text-[#8A7D75]">
                            {product.type}
                            {product.skinType ? ` • ${product.skinType}` : ""}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-[#C6A56B]">
                          {formatPrice(product.price)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>

            <div className="grid gap-4">
              {recommendedProducts.length === 0 ? (
                <div
                  className="rounded-2xl border border-dashed bg-white px-4 py-5 text-sm text-[#6E6257] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#8A7D75]"
                >
                  No products recommended yet.
                </div>
              ) : (
                recommendedProducts.map((product) => (
                  <article
                    key={product.id}
                    className="rounded-2xl border bg-white p-4 dark:bg-[#242220] dark:border-[#3D3530]"
                    
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3
                          className="text-lg font-semibold"
                          style={{
                            color: "#2B2B2B",
                            fontFamily: "Playfair Display, serif",
                          }}
                        >
                          {product.name}
                        </h3>
                        <p className="mt-1 text-sm text-[#6E6257] dark:text-[#8A7D75]">
                          {product.type}
                          {product.skinType ? ` • ${product.skinType}` : ""}
                        </p>
                        <p className="mt-2 text-sm font-medium text-[#C6A56B]">
                          {formatPrice(product.price)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeRecommendedProduct(product.id)}
                        className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium text-[#2B2B2B] transition-colors hover:bg-[#F8F5F0] dark:border-[#3D3530] dark:text-[#F0EDE8] dark:hover:bg-[#1A1814]"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-4">
                      <label
                        htmlFor={`note-${product.id}`}
                        className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
                      >
                        Optional note
                      </label>
                      <textarea
                        id={`note-${product.id}`}
                        value={product.note}
                        onChange={(event) =>
                          updateProductNote(product.id, event.target.value)
                        }
                        onBlur={handleNoteBlur}
                        rows={3}
                        className="mt-2 w-full rounded-xl border bg-[#F8F5F0] px-4 py-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8] dark:placeholder-[#8A7D75]"
                        placeholder="Add usage notes or context..."
                      />
                    </div>
                  </article>
                ))
              )}
            </div>

            {error ? (
              <p className="text-sm" style={{ color: "#C84B4B" }}>
                {error}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {recommendedProducts.length === 0 ? (
                <div
                  className="rounded-2xl border border-dashed bg-white px-4 py-5 text-sm text-[#6E6257] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#8A7D75]"
                >
                No product recommendations added yet.
              </div>
            ) : (
              recommendedProducts.map((product) => (
                <article
                  key={product.id}
                  className="rounded-2xl border bg-white p-4 dark:bg-[#242220] dark:border-[#3D3530]"
                  
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3
                        className="text-lg font-semibold"
                        style={{
                          color: "#2B2B2B",
                          fontFamily: "Playfair Display, serif",
                        }}
                      >
                        {product.name}
                      </h3>
                      <p className="mt-1 text-sm text-[#6E6257] dark:text-[#8A7D75]">
                        {product.type}
                        {product.skinType ? ` • ${product.skinType}` : ""}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-[#C6A56B]">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                  {product.note ? (
                    <div
                      className="mt-4 rounded-xl border bg-[#F8F5F0] px-4 py-3 text-sm leading-7 text-[#6E6257] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#8A7D75]"
                    >
                      {product.note}
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
}
