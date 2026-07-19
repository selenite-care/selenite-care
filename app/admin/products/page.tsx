"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import FileUploadButton from "@/components/ui/FileUploadButton";
import Pagination from "@/components/ui/Pagination";

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
  ingredients: string | null;
  isVisible: boolean;
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
  skinType: string;
  description: string;
  ingredients: string;
  image: string;
};

const emptyForm: ProductFormState = {
  name: "",
  type: "",
  price: "",
  skinType: "",
  description: "",
  ingredients: "",
  image: "",
};

type ProductEditFormState = {
  id: string;
  name: string;
  type: string;
  price: string;
  skinType: string;
  description: string;
  ingredients: string;
  stockStatus: Product["stockStatus"];
  stockNote: string;
  image: string;
  isVisible: boolean;
};

type SaveStateMap = Record<string, "idle" | "saving" | "saved" | "error">;

const STOCK_STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "Available" },
  { value: "LIMITED", label: "Limited Stock" },
  { value: "OUT_OF_STOCK", label: "Out of Stock" },
] as const;
const ITEMS_PER_PAGE = 20;

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

function getNextStockStatus(status: Product["stockStatus"]): Product["stockStatus"] {
  switch (status) {
    case "AVAILABLE":
      return "LIMITED";
    case "LIMITED":
      return "OUT_OF_STOCK";
    case "OUT_OF_STOCK":
      return "AVAILABLE";
    default:
      return "AVAILABLE";
  }
}

function getQuickToggleLabel(status: Product["stockStatus"]) {
  switch (status) {
    case "AVAILABLE":
      return "Mark Limited";
    case "LIMITED":
      return "Mark Out";
    case "OUT_OF_STOCK":
      return "Mark Available";
    default:
      return "Update Status";
  }
}

function createEditFormState(product: Product): ProductEditFormState {
  return {
    id: product.id,
    name: product.name,
    type: product.type,
    price: String(product.price),
    skinType: product.skinType ?? "",
    description: product.description ?? "",
    ingredients: product.ingredients ?? "",
    stockStatus: product.stockStatus,
    stockNote: product.stockNote ?? "",
    image: product.image ?? "",
    isVisible: product.isVisible,
  };
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ProductEditFormState | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [saveStates, setSaveStates] = useState<SaveStateMap>({});
  const [uploadingProductId, setUploadingProductId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadProducts(page, searchQuery, stockFilter);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [page, searchQuery, stockFilter]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage("");
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  async function loadProducts(targetPage: number, query: string, statusFilter: string) {
    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        limit: String(ITEMS_PER_PAGE),
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
    payload: Partial<Pick<Product, "stockStatus" | "stockNote" | "image" | "description" | "ingredients">>,
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
      setSuccessMessage("Product updated successfully.");
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

  function openEditModal(product: Product) {
    setEditForm(createEditFormState(product));
    setEditingProductId(product.id);
    setIsEditModalOpen(true);
    setError("");
  }

  function closeEditModal() {
    if (isEditSubmitting) {
      return;
    }

    setIsEditModalOpen(false);
    setEditingProductId(null);
    setEditForm(null);
  }

  async function handleEditImageUpload(file: File) {
    if (!editForm) {
      return;
    }

    setUploadingProductId(editForm.id);
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
        throw new Error(data?.error ?? "Unable to upload product image.");
      }

      const updateResponse = await fetch(`/api/admin/products/${editForm.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: data.secure_url,
        }),
      });
      const updateData = (await updateResponse.json().catch(() => null)) as
        | { error?: string; product?: Product }
        | null;

      if (!updateResponse.ok || !updateData?.product) {
        throw new Error(updateData?.error ?? "Unable to save product image.");
      }

      setEditForm((current) =>
        current ? { ...current, image: data.secure_url ?? "" } : current,
      );
      setProducts((current) =>
        current.map((product) =>
          product.id === updateData.product!.id ? updateData.product! : product,
        ),
      );
      setSuccessMessage("Product image updated successfully.");
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

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editForm || isEditSubmitting) {
      return;
    }

    setIsEditSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/products/${editForm.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editForm.name,
          type: editForm.type,
          price: Number(editForm.price),
          skinType: editForm.skinType,
          description: editForm.description,
          ingredients: editForm.ingredients,
          stockStatus: editForm.stockStatus,
          stockNote: editForm.stockNote,
          image: editForm.image || null,
          isVisible: editForm.isVisible,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string; product?: Product }
        | null;

      if (!response.ok || !data?.product) {
        throw new Error(data?.error ?? "Unable to update product.");
      }

      setProducts((current) =>
        current.map((product) =>
          product.id === data.product!.id ? data.product! : product,
        ),
      );
      setSuccessMessage("Product updated successfully.");
      setIsEditModalOpen(false);
      setEditingProductId(null);
      setEditForm(null);
      await loadProducts(page, searchQuery, stockFilter);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to update product.",
      );
    } finally {
      setIsEditSubmitting(false);
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
          ingredients: form.ingredients,
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
          <p className="mt-3 text-sm leading-6 text-[#884F38] dark:text-[#8A7D75]">
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
            className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8] dark:placeholder-[#8A7D75]"
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
              className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
            >
              <option value="ALL">All Stock Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="LIMITED">Limited Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {successMessage ? (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-300">
          {successMessage}
        </div>
      ) : null}

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
            <>
              <div className="hidden md:block">
                <table className="table-themed w-full table-fixed text-left text-sm">
                  <thead>
                    <tr>
                      <th className="w-[30%] px-4 py-3 font-medium">Product Name</th>
                      <th className="w-[18%] px-4 py-3 font-medium">Type</th>
                      <th className="w-[16%] px-4 py-3 font-medium">Price</th>
                      <th className="w-[16%] px-4 py-3 font-medium">Stock Status</th>
                      <th className="w-[20%] px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const nextStockStatus = getNextStockStatus(product.stockStatus);
                      const quickToggleLabel = getQuickToggleLabel(product.stockStatus);

                      return (
                        <tr key={product.id}>
                          <td className="px-4 py-4">
                            <div className="min-w-0">
                              <p className="truncate font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                                {product.name}
                              </p>
                              {!product.isVisible ? (
                                <p className="mt-1 text-xs text-[#884F38] dark:text-[#8A7D75]">
                                  Hidden from clients
                                </p>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="line-clamp-2 text-[#6E6257] dark:text-[#8A7D75]">
                              {product.type}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-[#6E6257] dark:text-[#8A7D75]">
                            {formatBdt(product.price)}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium ${getStockBadgeClasses(
                                product.stockStatus,
                              )}`}
                            >
                              {STOCK_STATUS_OPTIONS.find(
                                (option) => option.value === product.stockStatus,
                              )?.label ?? product.stockStatus}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => openEditModal(product)}
                                className="inline-flex h-9 items-center justify-center rounded-md border border-[#B87B68] px-3 text-sm font-medium text-[#2B2B2B] transition-colors hover:bg-[#B87B68]/10 dark:text-[#F0EDE8]"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  updateProductDraft(
                                    product.id,
                                    "stockStatus",
                                    nextStockStatus,
                                  );
                                  void patchProduct(product.id, {
                                    stockStatus: nextStockStatus,
                                    stockNote: product.stockNote,
                                  });
                                }}
                                className="inline-flex h-9 items-center justify-center rounded-md border border-[#EADDCD] px-3 text-sm font-medium text-[#2B2B2B] transition-colors hover:bg-black/5 dark:border-[#3D3530] dark:text-[#F0EDE8] dark:hover:bg-white/5"
                              >
                                {quickToggleLabel}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(product.id)}
                                className="inline-flex h-9 items-center justify-center rounded-md border border-red-200 px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/30"
                              >
                                Delete
                              </button>
                            </div>
                            <span className="mt-2 block text-xs text-muted">
                              {saveStates[product.id] === "saving"
                                ? "Saving..."
                                : saveStates[product.id] === "saved"
                                  ? "Saved"
                                  : saveStates[product.id] === "error"
                                    ? "Error"
                                    : ""}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 p-4 md:hidden">
                {products.map((product) => {
                  const nextStockStatus = getNextStockStatus(product.stockStatus);
                  const quickToggleLabel = getQuickToggleLabel(product.stockStatus);

                  return (
                    <article
                      key={product.id}
                      className="rounded-xl border border-[#EADDCD] bg-white p-4 dark:border-[#3D3530] dark:bg-[#242220]"
                    >
                      <div className="flex items-start gap-4">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-themed bg-[#FCFAF7] dark:bg-[#1A1814]">
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

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                            {product.name}
                          </p>
                          <p className="mt-1 text-sm text-[#6E6257] dark:text-[#8A7D75]">
                            {product.type}
                          </p>
                          <p className="mt-2 text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                            {formatBdt(product.price)}
                          </p>
                          {!product.isVisible ? (
                            <p className="mt-1 text-xs text-[#884F38] dark:text-[#8A7D75]">
                              Hidden from clients
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4">
                        <span
                          className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium ${getStockBadgeClasses(
                            product.stockStatus,
                          )}`}
                        >
                          {STOCK_STATUS_OPTIONS.find(
                            (option) => option.value === product.stockStatus,
                          )?.label ?? product.stockStatus}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-3">
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          className="inline-flex h-10 items-center justify-center rounded-md border border-[#B87B68] px-3 text-sm font-medium text-[#2B2B2B] transition-colors hover:bg-[#B87B68]/10 dark:text-[#F0EDE8]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            updateProductDraft(
                              product.id,
                              "stockStatus",
                              nextStockStatus,
                            );
                            void patchProduct(product.id, {
                              stockStatus: nextStockStatus,
                              stockNote: product.stockNote,
                            });
                          }}
                          className="inline-flex h-10 items-center justify-center rounded-md border border-[#EADDCD] px-3 text-sm font-medium text-[#2B2B2B] transition-colors hover:bg-black/5 dark:border-[#3D3530] dark:text-[#F0EDE8] dark:hover:bg-white/5"
                        >
                          {quickToggleLabel}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product.id)}
                          className="inline-flex h-10 items-center justify-center rounded-md border border-red-200 px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/30"
                        >
                          Delete
                        </button>
                      </div>

                      <span className="mt-3 block text-xs text-muted">
                        {saveStates[product.id] === "saving"
                          ? "Saving..."
                          : saveStates[product.id] === "saved"
                            ? "Saved"
                            : saveStates[product.id] === "error"
                              ? "Error"
                              : ""}
                      </span>
                    </article>
                  );
                })}
              </div>
            </>
          )}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalCount}
            itemsPerPage={ITEMS_PER_PAGE}
          />
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
                className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
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
                className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
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
                className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
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
                className="mt-2 w-full rounded-md border border-[#EADDCD] bg-white px-3 py-2 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
              />
            </div>

            <div>
              <label
                htmlFor="ingredients"
                className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
              >
                Ingredients
              </label>
              <textarea
                id="ingredients"
                rows={4}
                value={form.ingredients}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    ingredients: event.target.value,
                  }))
                }
                placeholder="List product ingredients separated by commas..."
                className="mt-2 w-full rounded-md border border-[#EADDCD] bg-white px-3 py-2 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8] dark:placeholder-[#8A7D75]"
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

      {isEditModalOpen && editForm ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"
          onClick={closeEditModal}
        >
          <div
            className="modal-card w-full max-w-2xl rounded-2xl border border-[#EADDCD] bg-white p-6 shadow-2xl dark:border-[#3D3530] dark:bg-[#242220]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  className="text-2xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  Edit Product
                </h2>
                <p className="mt-2 text-sm text-[#884F38] dark:text-[#8A7D75]">
                  Update product details, stock visibility, and image.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#EADDCD] text-lg text-[#2B2B2B] transition-colors hover:bg-black/5 dark:border-[#3D3530] dark:text-[#F0EDE8] dark:hover:bg-white/5"
              >
                x
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                    Name
                  </label>
                  <input
                    value={editForm.name}
                    onChange={(event) =>
                      setEditForm((current) =>
                        current ? { ...current, name: event.target.value } : current,
                      )
                    }
                    required
                    className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                    Type
                  </label>
                  <input
                    value={editForm.type}
                    onChange={(event) =>
                      setEditForm((current) =>
                        current ? { ...current, type: event.target.value } : current,
                      )
                    }
                    required
                    className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                    Price (BDT)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.price}
                    onChange={(event) =>
                      setEditForm((current) =>
                        current ? { ...current, price: event.target.value } : current,
                      )
                    }
                    required
                    className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
                  />
                </div>
                {/* skin type issue fixed */}
                <div>
                  <label className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                    Skin Type
                  </label>
                  <input
                    value={editForm.skinType}
                    onChange={(event) =>
                      setEditForm((current) =>
                        current
                          ? { ...current, skinType: event.target.value }
                          : current,
                      )
                    }
                    placeholder="Dry, oily, sensitive..."
                    className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8] dark:placeholder-[#8A7D75]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                    Stock Status
                  </label>
                  <select
                    value={editForm.stockStatus}
                    onChange={(event) =>
                      setEditForm((current) =>
                        current
                          ? {
                              ...current,
                              stockStatus: event.target.value as Product["stockStatus"],
                            }
                          : current,
                      )
                    }
                    className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
                  >
                    {STOCK_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                    Stock Note
                  </label>
                  <input
                    value={editForm.stockNote}
                    onChange={(event) =>
                      setEditForm((current) =>
                        current ? { ...current, stockNote: event.target.value } : current,
                      )
                    }
                    placeholder="Only 3 left"
                    className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8] dark:placeholder-[#8A7D75]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current ? { ...current, description: event.target.value } : current,
                    )
                  }
                  className="mt-2 w-full rounded-md border border-[#EADDCD] bg-white px-3 py-2 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                  Ingredients
                </label>
                <textarea
                  rows={4}
                  value={editForm.ingredients}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current ? { ...current, ingredients: event.target.value } : current,
                    )
                  }
                  placeholder="List product ingredients separated by commas..."
                  className="mt-2 w-full rounded-md border border-[#EADDCD] bg-white px-3 py-2 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8] dark:placeholder-[#8A7D75]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                  Product Image
                </label>
                <div className="mt-2">
                  <FileUploadButton
                    onFileSelected={(file) => {
                      void handleEditImageUpload(file);
                    }}
                    label={
                      uploadingProductId === editForm.id
                        ? "Uploading..."
                        : "Upload New Image"
                    }
                    accept="image/*"
                    currentPreviewUrl={editForm.image || undefined}
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                <input
                  type="checkbox"
                  checked={editForm.isVisible}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current
                        ? { ...current, isVisible: event.target.checked }
                        : current,
                    )
                  }
                  className="h-4 w-4 rounded border border-[#EADDCD] dark:border-[#3D3530]"
                  style={{ accentColor: "#B87B68" }}
                />
                Visible to clients
              </label>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="inline-flex h-11 items-center justify-center rounded-md border border-[#EADDCD] px-5 text-sm font-medium text-[#2B2B2B] transition-colors hover:bg-black/5 dark:border-[#3D3530] dark:text-[#F0EDE8] dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting || uploadingProductId === editForm.id}
                  className="inline-flex h-11 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/85 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isEditSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
