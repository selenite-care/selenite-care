"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import FileUploadButton from "@/components/ui/FileUploadButton";

type Product = {
  id: string;
  name: string;
  type: string;
  price: number;
  skinType: string | null;
  stockStatus: "AVAILABLE" | "LIMITED" | "OUT_OF_STOCK";
  stockNote: string | null;
  image: string | null;
  description: string | null;
  createdAt: string;
};

type ProductResponse = {
  products?: Product[];
  pagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  error?: string;
};

type ProductFormState = {
  name: string;
  type: string;
  price: string;
  description: string;
  image: string;
};

const emptyForm: ProductFormState = {
  name: "",
  type: "",
  price: "",
  description: "",
  image: "",
};

type SaveStateMap = Record<string, "idle" | "saving" | "saved" | "error">;

const STOCK_STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "Available" },
  { value: "LIMITED", label: "Limited Stock" },
  { value: "OUT_OF_STOCK", label: "Out of Stock" },
] as const;

function formatBdt(amount: number) {
  const normalized = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  return `${normalized} BDT`;
}

function getStockBadgeClasses(status: Product["stockStatus"]) {
  switch (status) {
    case "AVAILABLE":
      return "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-300";
    case "LIMITED":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300";
    case "OUT_OF_STOCK":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300";
    default:
      return "border-black/10 bg-zinc-50 text-foreground/70 dark:border-white/10 dark:bg-white/5";
  }
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStates, setSaveStates] = useState<SaveStateMap>({});
  const [uploadingProductId, setUploadingProductId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const saveTimeouts = useRef<Record<string, number>>({});

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadProducts(page, searchQuery, stockFilter);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [page, searchQuery, stockFilter]);

  async function loadProducts(targetPage: number, query: string, statusFilter: string) {
    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(targetPage),
      });

      if (query.trim()) {
        params.set("q", query.trim());
      }

      if (statusFilter !== "ALL") {
        params.set("stockStatus", statusFilter);
      }

      const response = await fetch(`/api/admin/products?${params.toString()}`, {
        cache: "no-store",
      });
      const data = (await response.json().catch(() => null)) as ProductResponse | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to load products.");
      }

      setProducts(data?.products ?? []);
      setTotalPages(data?.pagination?.totalPages ?? 1);
      setTotalCount(data?.pagination?.totalCount ?? 0);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Unable to load products.",
      );
      setProducts([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }

  async function patchProduct(
    productId: string,
    payload: Partial<Pick<Product, "stockStatus" | "stockNote" | "image" | "description">>,
  ) {
    setSaveStates((current) => ({ ...current, [productId]: "saving" }));

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string; product?: Product }
        | null;

      if (!response.ok || !data?.product) {
        throw new Error(data?.error ?? "Unable to update product.");
      }

      setProducts((current) =>
        current.map((product) =>
          product.id === productId ? data.product! : product,
        ),
      );
      setSaveStates((current) => ({ ...current, [productId]: "saved" }));
      window.setTimeout(() => {
        setSaveStates((current) =>
          current[productId] === "saved" ? { ...current, [productId]: "idle" } : current,
        );
      }, 1200);
    } catch (patchError) {
      setSaveStates((current) => ({ ...current, [productId]: "error" }));
      setError(
        patchError instanceof Error
          ? patchError.message
          : "Unable to update product.",
      );
    }
  }

  function schedulePatch(
    productId: string,
    payload: Partial<Pick<Product, "stockStatus" | "stockNote" | "image" | "description">>,
  ) {
    const existingTimeout = saveTimeouts.current[productId];

    if (existingTimeout) {
      window.clearTimeout(existingTimeout);
    }

    saveTimeouts.current[productId] = window.setTimeout(() => {
      void patchProduct(productId, payload);
      delete saveTimeouts.current[productId];
    }, 500);
  }

  function updateProductDraft<K extends keyof Product>(
    productId: string,
    field: K,
    value: Product[K],
  ) {
    setProducts((current) =>
      current.map((product) =>
        product.id === productId ? { ...product, [field]: value } : product,
      ),
    );
  }

  async function handleImageUpload(productId: string, file: File) {
    setUploadingProductId(productId);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = (await uploadResponse.json().catch(() => null)) as
        | { secure_url?: string; error?: string }
        | null;

      if (!uploadResponse.ok || !uploadData?.secure_url) {
        throw new Error(uploadData?.error ?? "Unable to upload product image.");
      }

      updateProductDraft(productId, "image", uploadData.secure_url);
      await patchProduct(productId, { image: uploadData.secure_url });
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload product image.",
      );
    } finally {
      setUploadingProductId(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          price: Number(form.price),
          description: form.description,
          image: form.image || null,
        }),
      });

      const data = (await response.json().catch(() => null)) as ProductResponse | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to add product.");
      }

      setForm(emptyForm);
      setPage(1);
      await loadProducts(1, searchQuery, stockFilter);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unable to add product.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(productId: string) {
    setError("");

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });

      const data = (await response.json().catch(() => null)) as ProductResponse | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to delete product.");
      }

      const nextPage = products.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      await loadProducts(nextPage, searchQuery, stockFilter);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Unable to delete product.",
      );
    }
  }

  return (
    <section className="min-h-screen bg-[#F8F5F0] px-6 py-10 dark:bg-[#1A1814]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8]"
          style={{
            fontFamily: "Playfair Display, serif",
          }}>
            Products
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#B8A89A] dark:text-[#8A7D75]">
            Search, add, and manage product recommendations.
          </p>
        </div>

        <div className="grid w-full gap-4 md:max-w-3xl md:grid-cols-[minmax(0,1fr)_220px]">
          <div>
          <label
            htmlFor="product-search"
            className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
          >
            Search Products
          </label>
          <input
            id="product-search"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search by name, type, or skin type"
            className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8] dark:placeholder-[#8A7D75]"
          />
        </div>
          <div>
            <label
              htmlFor="stock-filter"
              className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
            >
              Stock Status
            </label>
            <select
              id="stock-filter"
              value={stockFilter}
              onChange={(event) => {
                setStockFilter(event.target.value);
                setPage(1);
              }}
              className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
            >
              <option value="ALL">All Stock Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="LIMITED">Limited Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <div className="rounded-lg border border-themed bg-card">
          <div className="border-b border-themed px-5 py-4">
            <p className="text-sm text-muted">
              {totalCount} product{totalCount === 1 ? "" : "s"} found
            </p>
          </div>

          {isLoading ? (
            <p className="px-5 py-6 text-sm text-muted">Loading products...</p>
          ) : products.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">No products found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-themed w-full min-w-[1280px] text-left text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3 font-medium">Image</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="px-4 py-3 font-medium">Stock Status</th>
                    <th className="px-4 py-3 font-medium">Stock Note</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-4 py-4">
                        <div className="flex min-w-[140px] flex-col gap-3">
                          <div className="relative h-16 w-16 overflow-hidden rounded-md border border-themed bg-[#FCFAF7] dark:bg-[#1A1814]">
                            {product.image ? (
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-muted">
                                No image
                              </div>
                            )}
                          </div>
                          <FileUploadButton
                            onFileSelected={(file) => {
                              void handleImageUpload(product.id, file);
                            }}
                            label={
                              uploadingProductId === product.id
                                ? "Uploading..."
                                : "Upload Image"
                            }
                            accept="image/*"
                            currentPreviewUrl={product.image ?? undefined}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4 font-medium">{product.name}</td>
                      <td className="cell-muted px-4 py-4">{product.type}</td>
                      <td className="cell-muted px-4 py-4">{formatBdt(product.price)}</td>
                      <td className="px-4 py-4">
                        <div className="flex min-w-[180px] flex-col gap-3">
                          <span
                            className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium ${getStockBadgeClasses(
                              product.stockStatus,
                            )}`}
                          >
                            {STOCK_STATUS_OPTIONS.find(
                              (option) => option.value === product.stockStatus,
                            )?.label ?? product.stockStatus}
                          </span>
                          <select
                            value={product.stockStatus}
                            onChange={(event) => {
                              const nextValue = event.target
                                .value as Product["stockStatus"];
                              updateProductDraft(product.id, "stockStatus", nextValue);
                              void patchProduct(product.id, {
                                stockStatus: nextValue,
                                stockNote: product.stockNote,
                              });
                            }}
                            className="h-10 rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
                          >
                            {STOCK_STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="min-w-[220px]">
                          <input
                            value={product.stockNote ?? ""}
                            onChange={(event) => {
                              const nextValue = event.target.value;
                              updateProductDraft(product.id, "stockNote", nextValue);
                              schedulePatch(product.id, {
                                stockStatus: product.stockStatus,
                                stockNote: nextValue,
                              });
                            }}
                            placeholder="Only 3 left"
                            className="h-10 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8] dark:placeholder-[#8A7D75]"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="min-w-[260px]">
                          <textarea
                            value={product.description ?? ""}
                            onChange={(event) => {
                              const nextValue = event.target.value;
                              updateProductDraft(product.id, "description", nextValue);
                              schedulePatch(product.id, {
                                description: nextValue,
                              });
                            }}
                            rows={3}
                            placeholder="Product description"
                            className="w-full rounded-md border border-[#D8C7B5] bg-white px-3 py-2 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8] dark:placeholder-[#8A7D75]"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex min-w-[110px] flex-col gap-3">
                          <span className="text-xs text-muted">
                            {saveStates[product.id] === "saving"
                              ? "Saving..."
                              : saveStates[product.id] === "saved"
                                ? "Saved"
                                : saveStates[product.id] === "error"
                                  ? "Error"
                                  : ""}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDelete(product.id)}
                            className="inline-flex h-9 items-center justify-center rounded-md border border-red-200 px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/30"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-themed px-5 py-4 text-sm">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={page <= 1 || isLoading}
              className="inline-flex h-10 items-center justify-center rounded-md border border-[#C6A56B] px-4 font-medium text-[#2B2B2B] transition-colors hover:bg-[#C6A56B]/10 disabled:cursor-not-allowed disabled:opacity-60 dark:text-[#F0EDE8]"
            >
              Previous
            </button>
            <span className="text-[#B8A89A] dark:text-[#8A7D75]">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(current + 1, totalPages))
              }
              disabled={page >= totalPages || isLoading}
              className="inline-flex h-10 items-center justify-center rounded-md border border-[#C6A56B] px-4 font-medium text-[#2B2B2B] transition-colors hover:bg-[#C6A56B]/10 disabled:cursor-not-allowed disabled:opacity-60 dark:text-[#F0EDE8]"
            >
              Next
            </button>
          </div>
        </div>

        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2
            className="text-xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
            style={{
              fontFamily: "Playfair Display, serif",
            }}
          >
            Add Product
          </h2>
          <p className="mt-2 text-sm leading-6 text-foreground/70">
            Create a new product entry for diagnosis recommendations.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
              >
                Name
              </label>
              <input
                id="name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                required
                className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
              />
            </div>

            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
              >
                Type
              </label>
              <input
                id="type"
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({ ...current, type: event.target.value }))
                }
                required
                className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
              />
            </div>

            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
              >
                Price
              </label>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) =>
                  setForm((current) => ({ ...current, price: event.target.value }))
                }
                required
                className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
              >
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-md border border-[#D8C7B5] bg-white px-3 py-2 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                Product Image
              </label>
              <div className="mt-2">
                <FileUploadButton
                  onFileSelected={async (file) => {
                    setError("");

                    try {
                      const formData = new FormData();
                      formData.append("file", file);

                      const response = await fetch("/api/admin/upload", {
                        method: "POST",
                        body: formData,
                      });

                      const data = (await response.json().catch(() => null)) as
                        | { secure_url?: string; error?: string }
                        | null;

                      if (!response.ok || !data?.secure_url) {
                        throw new Error(data?.error ?? "Unable to upload image.");
                      }

                      setForm((current) => ({ ...current, image: data.secure_url! }));
                    } catch (uploadError) {
                      setError(
                        uploadError instanceof Error
                          ? uploadError.message
                          : "Unable to upload image.",
                      );
                    }
                  }}
                  label="Upload Product Image"
                  accept="image/*"
                  currentPreviewUrl={form.image || undefined}
                />
              </div>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/85 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Adding..." : "Add Product"}
            </button>
          </form>
        </section>
      </div>
    </section>
  );
}
