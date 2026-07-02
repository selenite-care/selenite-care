"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

export const dynamic = "force-dynamic";

type StockStatus = "AVAILABLE" | "LIMITED" | "OUT_OF_STOCK";

type Product = {
  id: string;
  name: string;
  type: string;
  price: number;
  skinType: string | null;
  stockStatus: StockStatus;
  stockNote: string | null;
  description: string | null;
  image: string | null;
};

type ProductsResponse = {
  products?: Product[];
  types?: string[];
  pagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
};

const PAGE_SIZE = 12;

const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  AVAILABLE: "In Stock",
  LIMITED: "Limited Stock",
  OUT_OF_STOCK: "Out of Stock",
};

const STOCK_STATUS_COLORS: Record<
  StockStatus,
  { bg: string; text: string; border: string; dot: string }
> = {
  AVAILABLE: {
    bg: "#EAF7EE",
    text: "#1F7A3D",
    border: "#BFE5CC",
    dot: "#2FAE5C",
  },
  LIMITED: {
    bg: "#FDF3E2",
    text: "#9A6A0C",
    border: "#F1DDB1",
    dot: "#E0A52E",
  },
  OUT_OF_STOCK: {
    bg: "#FBEAEA",
    text: "#A23636",
    border: "#F0CACA",
    dot: "#C24545",
  },
};

function formatBdt(amount: number) {
  return `${Math.round(amount).toLocaleString("en-US")} BDT`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function ProductsPage() {
  const { addItem } = useCart();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedType]);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        if (debouncedSearch) {
          params.set("q", debouncedSearch);
        }

        if (selectedType) {
          params.set("type", selectedType);
        }

        params.set("page", String(page));
        params.set("pageSize", String(PAGE_SIZE));

        const response = await fetch(
          `/api/products${params.toString() ? `?${params.toString()}` : ""}`,
        );
        const data = (await response.json().catch(() => null)) as
          | ProductsResponse
          | null;

        if (!response.ok) {
          throw new Error("Unable to load products.");
        }

        if (isMounted) {
          setProducts(data?.products ?? []);
          setTypes(data?.types ?? []);
          setTotalCount(data?.pagination?.totalCount ?? 0);
          setTotalPages(data?.pagination?.totalPages ?? 1);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load products.",
          );
          setProducts([]);
          setTotalCount(0);
          setTotalPages(1);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, selectedType, page]);

  useEffect(() => {
    if (!recentlyAddedId) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setRecentlyAddedId(null);
    }, 1600);

    return () => window.clearTimeout(timeout);
  }, [recentlyAddedId]);

  const productCountLabel = useMemo(() => {
    if (isLoading) {
      return "";
    }

    return `${totalCount} product${totalCount === 1 ? "" : "s"}`;
  }, [isLoading, totalCount]);

  const visiblePageNumbers = useMemo(() => {
    const maxVisiblePages = 5;
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    const adjustedStartPage = Math.max(1, endPage - maxVisiblePages + 1);

    return Array.from(
      { length: endPage - adjustedStartPage + 1 },
      (_, index) => adjustedStartPage + index,
    );
  }, [page, totalPages]);

  function handleAddToCart(product: Product) {
    if (product.stockStatus === "OUT_OF_STOCK") {
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      type: product.type,
    });
    setRecentlyAddedId(product.id);
  }

  return (
    <main
      style={{
        backgroundColor: "#F8F5F0",
        position: "relative",
        overflow: "hidden",
      }}
      className="min-h-screen px-6 py-16 text-[#2B2B2B] dark:bg-[#1A1814] dark:text-[#F0EDE8]"
    >
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -100,
          width: 380,
          height: 380,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(198,165,107,0.14) 0%, transparent 70%)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: -120,
          width: 320,
          height: 320,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(198,165,107,0.10) 0%, transparent 70%)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      <div className="relative mx-auto w-full max-w-7xl">
        <div className="max-w-3xl">
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(198,165,107,0.12)",
              border: "1px solid rgba(198,165,107,0.3)",
              borderRadius: 99,
              padding: "5px 14px",
              marginBottom: 16,
            }}
          >
            <span style={{ color: "#B87B68", fontSize: 13 }}>*</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#8C7355",
              }}
            >
              Curated Collection
            </span>
          </div>

          <h1
            style={{ fontFamily: "Playfair Display, serif", color: "#2B2B2B" }}
            className="text-4xl font-bold tracking-tight sm:text-5xl dark:text-[#F0EDE8]"
          >
            Our Products
          </h1>
          <p
            style={{ color: "#8C7967" }}
            className="mt-4 text-base leading-7 dark:text-[#8A7D75]"
          >
            Thoughtfully selected skincare, chosen to support your routine and
            your goals.
          </p>
        </div>

        <section
          style={{
            marginTop: 40,
            borderRadius: 24,
            border: "1px solid #E8DDD0",
            background: "#FFFFFF",
            boxShadow: "0 4px 24px rgba(198,165,107,0.08)",
            padding: 20,
          }}
          className="dark:border-[#3D3530] dark:bg-[#242220]"
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px_auto] lg:items-end">
            <div>
              <label
                htmlFor="product-search"
                style={{ color: "#2B2B2B" }}
                className="block text-sm font-medium dark:text-[#F0EDE8]"
              >
                Search
              </label>
              <div style={{ position: "relative", marginTop: 8 }}>
                <span
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#B87B68",
                    fontSize: 15,
                    pointerEvents: "none",
                  }}
                >
                  Q
                </span>
                <input
                  id="product-search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search by product name or category"
                  style={{
                    height: 46,
                    width: "100%",
                    borderRadius: 12,
                    border: "1px solid #E8DDD0",
                    background: "#FBF9F6",
                    paddingLeft: 38,
                    paddingRight: 14,
                    fontSize: 14,
                    color: "#2B2B2B",
                    outline: "none",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(event) => {
                    event.currentTarget.style.borderColor = "#B87B68";
                    event.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(198,165,107,0.12)";
                  }}
                  onBlur={(event) => {
                    event.currentTarget.style.borderColor = "#E8DDD0";
                    event.currentTarget.style.boxShadow = "none";
                  }}
                  className="dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8] dark:placeholder:text-[#8A7D75]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="product-type"
                style={{ color: "#2B2B2B" }}
                className="block text-sm font-medium dark:text-[#F0EDE8]"
              >
                Category
              </label>
              <select
                id="product-type"
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value)}
                style={{
                  height: 46,
                  width: "100%",
                  borderRadius: 12,
                  marginTop: 8,
                  border: "1px solid #E8DDD0",
                  background: "#FBF9F6",
                  padding: "0 14px",
                  fontSize: 14,
                  color: "#2B2B2B",
                  outline: "none",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                }}
                onFocus={(event) => {
                  event.currentTarget.style.borderColor = "#B87B68";
                }}
                onBlur={(event) => {
                  event.currentTarget.style.borderColor = "#E8DDD0";
                }}
                className="dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
              >
                <option value="">All Categories</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                borderRadius: 99,
                border: "1px solid #E8DDD0",
                background: "#FBF9F6",
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: 600,
                color: "#8C7355",
                whiteSpace: "nowrap",
                textAlign: "center",
              }}
              className="dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#8A7D75]"
            >
              {isLoading ? (
                <Skeleton className="mx-auto h-4 w-24" />
              ) : (
                productCountLabel
              )}
            </div>
          </div>
        </section>

        {error ? (
          <div
            style={{
              marginTop: 24,
              borderRadius: 16,
              border: "1px solid #F0CACA",
              background: "#FBEAEA",
              padding: "16px 20px",
              fontSize: 14,
              color: "#A23636",
            }}
            className="dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
          >
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <SkeletonCard key={index} className="min-h-[420px]" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div
            style={{
              marginTop: 32,
              borderRadius: 24,
              border: "1px solid #E8DDD0",
              background: "#FFFFFF",
              padding: "56px 24px",
              textAlign: "center",
            }}
            className="dark:border-[#3D3530] dark:bg-[#242220]"
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>?</div>
            <p
              style={{
                color: "#2B2B2B",
                fontSize: 16,
                fontWeight: 600,
                marginBottom: 6,
              }}
              className="dark:text-[#F0EDE8]"
            >
              No products match your filters
            </p>
            <p
              style={{ color: "#8C7967", fontSize: 14 }}
              className="dark:text-[#8A7D75]"
            >
              Try a different search term or category.
            </p>
          </div>
        ) : (
          <>
            <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {products.map((product) => {
                const isOutOfStock = product.stockStatus === "OUT_OF_STOCK";
                const isLimited = product.stockStatus === "LIMITED";
                const statusColor = STOCK_STATUS_COLORS[product.stockStatus];

                return (
                  <article
                    key={product.id}
                    style={{
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      borderRadius: 22,
                      border: "1px solid #E8DDD0",
                      background: "#FFFFFF",
                      overflow: "hidden",
                      boxShadow: "0 2px 12px rgba(198,165,107,0.06)",
                      opacity: isOutOfStock ? 0.85 : 1,
                      transition: "transform 0.25s ease, box-shadow 0.25s ease",
                    }}
                    className="dark:border-[#3D3530] dark:bg-[#242220]"
                    onMouseEnter={(event) => {
                      if (isOutOfStock) return;
                      event.currentTarget.style.transform = "translateY(-6px)";
                      event.currentTarget.style.boxShadow =
                        "0 16px 40px rgba(198,165,107,0.22)";
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.transform = "translateY(0)";
                      event.currentTarget.style.boxShadow =
                        "0 2px 12px rgba(198,165,107,0.06)";
                    }}
                  >
                    {isOutOfStock ? (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          zIndex: 10,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "rgba(43,43,43,0.55)",
                        }}
                      >
                        <span
                          style={{
                            borderRadius: 99,
                            background: "#FFFFFF",
                            padding: "8px 18px",
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#2B2B2B",
                          }}
                          className="dark:bg-[#1A1814] dark:text-[#F0EDE8]"
                        >
                          Out of Stock
                        </span>
                      </div>
                    ) : null}

                    <div
                      style={{
                        position: "relative",
                        height: 240,
                        width: "100%",
                        flexShrink: 0,
                        background: "#F2EBDF",
                      }}
                      className="dark:bg-[#1A1814]"
                    >
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            height: "100%",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 30,
                              fontWeight: 700,
                              color: "#B87B68",
                              letterSpacing: "0.02em",
                            }}
                          >
                            {getInitials(product.name)}
                          </span>
                        </div>
                      )}

                      <span
                        style={{
                          position: "absolute",
                          top: 12,
                          left: 12,
                          borderRadius: 99,
                          background: "rgba(255,255,255,0.95)",
                          padding: "4px 11px",
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "#8C7355",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        }}
                      >
                        {product.type}
                      </span>
                    </div>

                    <div
                      style={{
                        padding: 20,
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                      }}
                    >
                      <div style={{ marginBottom: 10 }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            borderRadius: 99,
                            background: statusColor.bg,
                            border: `1px solid ${statusColor.border}`,
                            padding: "3px 10px",
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: statusColor.text,
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: statusColor.dot,
                              display: "inline-block",
                            }}
                          />
                          {STOCK_STATUS_LABELS[product.stockStatus]}
                        </span>
                      </div>

                      <h2
                        style={{
                          fontFamily: "Playfair Display, serif",
                          color: "#2B2B2B",
                          fontSize: 18,
                          fontWeight: 700,
                          lineHeight: 1.35,
                          marginBottom: 8,
                          minHeight: "calc(1.35em * 2)",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                        className="dark:text-[#F0EDE8]"
                      >
                        {product.name}
                      </h2>

                      <div style={{ minHeight: 20, marginBottom: 8 }}>
                        {product.skinType ? (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                              color: "#A8916F",
                            }}
                          >
                            For {product.skinType} Skin
                          </span>
                        ) : null}
                      </div>

                      <div style={{ flex: 1 }} />

                      <div
                        style={{
                          height: 1,
                          background:
                            "linear-gradient(90deg, #E8DDD0, transparent)",
                          margin: "4px 0 14px",
                        }}
                      />

                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          justifyContent: "space-between",
                          marginBottom: 6,
                        }}
                      >
                        <p
                          style={{
                            fontSize: 24,
                            fontWeight: 800,
                            color: "#B87B68",
                            fontFamily: "Playfair Display, serif",
                            margin: 0,
                          }}
                        >
                          {formatBdt(product.price)}
                        </p>
                      </div>

                      <div style={{ minHeight: 18, marginBottom: 10 }}>
                        {product.stockNote ? (
                          <p
                            style={{
                              fontSize: 12,
                              lineHeight: 1.4,
                              margin: 0,
                              color: isLimited ? "#9A6A0C" : "#8C7967",
                            }}
                            className={
                              isLimited
                                ? "dark:text-amber-300"
                                : "dark:text-[#8A7D75]"
                            }
                          >
                            {product.stockNote}
                          </p>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        disabled={isOutOfStock}
                        style={{
                          height: 46,
                          width: "100%",
                          borderRadius: 10,
                          fontSize: 14,
                          fontWeight: 600,
                          border: "none",
                          cursor: isOutOfStock ? "not-allowed" : "pointer",
                          transition: "all 0.2s ease",
                          background: isOutOfStock
                            ? "#E8DDD0"
                            : recentlyAddedId === product.id
                              ? "#EADDCD"
                              : "#2B2B2B",
                          color: isOutOfStock
                            ? "#A8916F"
                            : recentlyAddedId === product.id
                              ? "#2B2B2B"
                              : "#F8F5F0",
                        }}
                        onMouseEnter={(event) => {
                          if (isOutOfStock || recentlyAddedId === product.id) {
                            return;
                          }

                          event.currentTarget.style.background = "#B87B68";
                        }}
                        onMouseLeave={(event) => {
                          if (isOutOfStock || recentlyAddedId === product.id) {
                            return;
                          }

                          event.currentTarget.style.background = "#2B2B2B";
                        }}
                      >
                        {recentlyAddedId === product.id
                          ? "Added to Cart"
                          : isOutOfStock
                            ? "Unavailable"
                            : "Add to Cart"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>

            {totalPages > 1 ? (
              <nav className="mt-10 flex flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="text-sm text-[#8C7967] dark:text-[#8A7D75]">
                  Page {page} of {totalPages}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page === 1}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-[#E8DDD0] bg-white px-4 text-sm font-medium text-[#2B2B2B] transition-colors hover:bg-[#F8F5F0] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#3D3530] dark:bg-[#242220] dark:text-[#F0EDE8] dark:hover:bg-[#1A1814]"
                  >
                    Previous
                  </button>

                  {visiblePageNumbers.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setPage(pageNumber)}
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium transition-colors ${
                        pageNumber === page
                          ? "border-[#B87B68] bg-[#B87B68] text-[#141210]"
                          : "border-[#E8DDD0] bg-white text-[#2B2B2B] hover:bg-[#F8F5F0] dark:border-[#3D3530] dark:bg-[#242220] dark:text-[#F0EDE8] dark:hover:bg-[#1A1814]"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                    disabled={page === totalPages}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-[#E8DDD0] bg-white px-4 text-sm font-medium text-[#2B2B2B] transition-colors hover:bg-[#F8F5F0] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#3D3530] dark:bg-[#242220] dark:text-[#F0EDE8] dark:hover:bg-[#1A1814]"
                  >
                    Next
                  </button>
                </div>
              </nav>
            ) : null}
          </>
        )}
      </div>

      <style>{`
        @keyframes shimmerLoad {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </main>
  );
}
