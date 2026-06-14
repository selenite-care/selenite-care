"use client";

import { FormEvent, useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  type: string;
  price: number;
  skinType: string | null;
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
};

const emptyForm: ProductFormState = {
  name: "",
  type: "",
  price: "",
};

function formatBdt(amount: number) {
  const normalized = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  return `${normalized} BDT`;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadProducts(page, searchQuery);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [page, searchQuery]);

  async function loadProducts(targetPage: number, query: string) {
    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(targetPage),
      });

      if (query.trim()) {
        params.set("q", query.trim());
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
        }),
      });

      const data = (await response.json().catch(() => null)) as ProductResponse | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to add product.");
      }

      setForm(emptyForm);
      setPage(1);
      await loadProducts(1, searchQuery);
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

      const nextPage =
        products.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      await loadProducts(nextPage, searchQuery);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete product.",
      );
    }
  }

  return (
    <section>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Products
          </h1>
          <p className="mt-3 text-sm leading-6 text-foreground/70">
            Search, add, and manage product recommendations.
          </p>
        </div>

        <div className="w-full max-w-md">
          <label
            htmlFor="product-search"
            className="block text-sm font-medium"
            style={{ color: "#2B2B2B" }}
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
            className="mt-2 h-11 w-full rounded-md border bg-white px-3 text-sm outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
            style={{
              borderColor: "#D8C7B5",
              color: "#2B2B2B",
            }}
          />
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <div className="rounded-lg border border-black/10 bg-background dark:border-white/10">
          <div className="border-b border-black/10 px-5 py-4 dark:border-white/10">
            <p className="text-sm text-foreground/70">
              {totalCount} product{totalCount === 1 ? "" : "s"} found
            </p>
          </div>

          {isLoading ? (
            <p className="px-5 py-6 text-sm text-foreground/70">Loading products...</p>
          ) : products.length === 0 ? (
            <p className="px-5 py-6 text-sm text-foreground/70">No products found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-black/10 bg-zinc-50 text-foreground/70 dark:border-white/10 dark:bg-white/5">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-black/10 last:border-0 dark:border-white/10"
                    >
                      <td className="px-4 py-4 font-medium text-foreground">
                        {product.name}
                      </td>
                      <td className="px-4 py-4 text-foreground/70">
                        {product.type}
                      </td>
                      <td className="px-4 py-4 text-foreground/70">
                        {formatBdt(product.price)}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => handleDelete(product.id)}
                          className="inline-flex h-9 items-center justify-center rounded-md border border-red-200 px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/30"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-black/10 px-5 py-4 text-sm dark:border-white/10">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={page <= 1 || isLoading}
              className="inline-flex h-10 items-center justify-center rounded-md border px-4 font-medium transition-colors hover:bg-[#C6A56B]/10 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ borderColor: "#C6A56B", color: "#2B2B2B" }}
            >
              Previous
            </button>
            <span style={{ color: "#6E6257" }}>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(current + 1, totalPages))
              }
              disabled={page >= totalPages || isLoading}
              className="inline-flex h-10 items-center justify-center rounded-md border px-4 font-medium transition-colors hover:bg-[#C6A56B]/10 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ borderColor: "#C6A56B", color: "#2B2B2B" }}
            >
              Next
            </button>
          </div>
        </div>

        <section className="rounded-lg border border-black/10 bg-background p-6 dark:border-white/10">
          <h2
            className="text-xl font-semibold"
            style={{
              color: "#2B2B2B",
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
                className="block text-sm font-medium"
                style={{ color: "#2B2B2B" }}
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
                className="mt-2 h-11 w-full rounded-md border bg-white px-3 text-sm outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
                style={{ borderColor: "#D8C7B5", color: "#2B2B2B" }}
              />
            </div>

            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium"
                style={{ color: "#2B2B2B" }}
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
                className="mt-2 h-11 w-full rounded-md border bg-white px-3 text-sm outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
                style={{ borderColor: "#D8C7B5", color: "#2B2B2B" }}
              />
            </div>

            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium"
                style={{ color: "#2B2B2B" }}
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
                className="mt-2 h-11 w-full rounded-md border bg-white px-3 text-sm outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]"
                style={{ borderColor: "#D8C7B5", color: "#2B2B2B" }}
              />
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
