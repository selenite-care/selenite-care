"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ShoppingBag, X } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { getProductDiscount } from "@/lib/membershipDiscounts";

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
  ingredients: string | null;
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

type ClientBooking = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  diagnosis?: {
    recommendations?: Array<{
      productId: string;
    }>;
  } | null;
};

type ClientMembership = {
  tier: "SIGNATURE" | "CRYSTAL" | "PLATINUM";
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  expiresAt: string | null;
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
  const [showDoctorRecommended, setShowDoctorRecommended] = useState(false);
  const [recommendedProductIds, setRecommendedProductIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [discountMembership, setDiscountMembership] =
    useState<ClientMembership | null>(null);
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [types, setTypes] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const productDiscountPercent = getProductDiscount(discountMembership?.tier);
  const hasProductDiscount =
    !!discountMembership &&
    discountMembership.status === "ACTIVE" &&
    productDiscountPercent > 0;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedType, showDoctorRecommended]);

  useEffect(() => {
    let isMounted = true;

    async function loadMembershipDiscount() {
      try {
        const response = await fetch("/api/client/membership", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json().catch(() => null)) as
          | { membership?: ClientMembership | null }
          | null;
        const membership = data?.membership ?? null;
        const isActiveDiscountMembership =
          membership?.status === "ACTIVE" &&
          !!membership.expiresAt &&
          new Date(membership.expiresAt).getTime() > Date.now() &&
          getProductDiscount(membership.tier) > 0;

        if (isMounted) {
          setDiscountMembership(isActiveDiscountMembership ? membership : null);
        }
      } catch {
        if (isMounted) {
          setDiscountMembership(null);
        }
      }
    }

    void loadMembershipDiscount();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadDoctorRecommendations() {
      try {
        const response = await fetch("/api/client/bookings", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json().catch(() => null)) as
          | { bookings?: ClientBooking[] }
          | null;
        const latestRelevantBooking = (data?.bookings ?? []).find((booking) =>
          booking.status === "COMPLETED" || booking.status === "CONFIRMED",
        );
        const ids = new Set(
          latestRelevantBooking?.diagnosis?.recommendations
            ?.map((recommendation) => recommendation.productId)
            .filter(Boolean) ?? [],
        );

        if (!isMounted) {
          return;
        }

        setRecommendedProductIds(ids);

        if (ids.size === 0) {
          setShowDoctorRecommended(false);
        }
      } catch {
        if (isMounted) {
          setRecommendedProductIds(new Set());
          setShowDoctorRecommended(false);
        }
      }
    }

    void loadDoctorRecommendations();

    return () => {
      isMounted = false;
    };
  }, []);

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

        if (showDoctorRecommended && recommendedProductIds.size > 0) {
          params.set("recommendedIds", Array.from(recommendedProductIds).join(","));
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
  }, [debouncedSearch, selectedType, page, showDoctorRecommended, recommendedProductIds]);

  useEffect(() => {
    if (!recentlyAddedId) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setRecentlyAddedId(null);
    }, 1600);

    return () => window.clearTimeout(timeout);
  }, [recentlyAddedId]);

  useEffect(() => {
    if (!selectedProduct) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedProduct(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedProduct]);

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

  function handleModalAddToCart(product: Product) {
    handleAddToCart(product);

    if (product.stockStatus !== "OUT_OF_STOCK") {
      setSelectedProduct(null);
    }
  }

  const selectedStatusColor = selectedProduct
    ? STOCK_STATUS_COLORS[selectedProduct.stockStatus]
    : STOCK_STATUS_COLORS.AVAILABLE;
  const selectedProductIsOutOfStock =
    selectedProduct?.stockStatus === "OUT_OF_STOCK";

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
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px_auto_auto] lg:items-end">
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

            {recommendedProductIds.size > 0 ? (
              <button
                type="button"
                onClick={() =>
                  setShowDoctorRecommended((current) => !current)
                }
                style={{
                  height: 46,
                  borderRadius: 12,
                  border: showDoctorRecommended
                    ? "1px solid #B87B68"
                    : "1px solid #E8DDD0",
                  background: showDoctorRecommended ? "#B87B68" : "#FBF9F6",
                  padding: "0 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: showDoctorRecommended ? "#F8F5F0" : "#8C7355",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease",
                }}
                className="dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8]"
              >
                Doctor Recommended
              </button>
            ) : null}

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

        {hasProductDiscount ? (
          <div className="mt-6 rounded-2xl border border-[#E8DDD0] border-l-4 border-l-[#B87B68] bg-[#FFF8EE] px-5 py-4 shadow-sm dark:border-[#3D3530] dark:border-l-[#D4B47A] dark:bg-[#242220]">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#B87B68]/15 text-[#B87B68] dark:bg-[#D4B47A]/15 dark:text-[#D4B47A]">
                <ShoppingBag className="h-5 w-5" />
              </span>
              <p className="text-sm font-medium leading-6 text-[#2B2B2B] dark:text-[#F0EDE8]">
                You have {productDiscountPercent}% off on all products with your{" "}
                {discountMembership.tier} Membership! Discount applied
                automatically at checkout.
              </p>
            </div>
          </div>
        ) : null}

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
          <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <SkeletonCard key={index} className="min-h-[180px] sm:min-h-[420px]" />
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
            <section className="mt-8 grid grid-cols-3 gap-2 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
              {products.map((product) => {
                const isOutOfStock = product.stockStatus === "OUT_OF_STOCK";
                const isLimited = product.stockStatus === "LIMITED";
                const statusColor = STOCK_STATUS_COLORS[product.stockStatus];
                const isDoctorRecommended = recommendedProductIds.has(product.id);

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
                      cursor: "pointer",
                    }}
                    className="product-card cursor-pointer dark:border-[#3D3530] dark:bg-[#242220]"
                    onClick={() => setSelectedProduct(product)}
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
                          className="product-sold-out-badge dark:bg-[#1A1814] dark:text-[#F0EDE8]"
                        >
                          Out of Stock
                        </span>
                      </div>
                    ) : null}

                    {isDoctorRecommended ? (
                      <span
                        style={{
                          position: "absolute",
                          top: 12,
                          left: 12,
                          zIndex: 12,
                          borderRadius: 99,
                          background: "#B87B68",
                          padding: "5px 11px",
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "#F8F5F0",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.14)",
                        }}
                        className="product-doctor-badge"
                      >
                        Recommended by Your Doctor
                      </span>
                    ) : null}

                    {hasProductDiscount ? (
                      <span
                        style={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          zIndex: 13,
                          borderRadius: 99,
                          background: "#DCFCE7",
                          border: "1px solid #BBF7D0",
                          padding: "5px 11px",
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "#15803D",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                        }}
                        className="product-discount-badge"
                      >
                        {productDiscountPercent}% OFF
                      </span>
                    ) : null}

                    <div
                      style={{
                        position: "relative",
                        height: 240,
                        width: "100%",
                        flexShrink: 0,
                        background: "#F2EBDF",
                      }}
                      className="product-card-media dark:bg-[#1A1814]"
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
                          left: isDoctorRecommended ? "auto" : 12,
                          right: isDoctorRecommended ? 12 : "auto",
                          transform:
                            hasProductDiscount && isDoctorRecommended
                              ? "translateY(34px)"
                              : "none",
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
                        className="product-type-badge"
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
                      className="product-card-body"
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
                          className="product-stock-badge"
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
                        className="product-card-title dark:text-[#F0EDE8]"
                      >
                        {product.name}
                      </h2>

                      <div
                        style={{ minHeight: 20, marginBottom: 8 }}
                        className="product-skin-type-row"
                      >
                        {product.skinType ? (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                              color: "#A8916F",
                            }}
                            className="product-skin-type"
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
                          className="product-card-divider"
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
                          className="product-card-price"
                        >
                          {formatBdt(product.price)}
                        </p>
                      </div>

                      <div
                        style={{ minHeight: 18, marginBottom: 10 }}
                        className="product-stock-note-row"
                      >
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
                        onClick={(event) => {
                          event.stopPropagation();
                          handleAddToCart(product);
                        }}
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
                        className="product-add-button"
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

      {selectedProduct ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 px-4 py-6"
          onClick={() => setSelectedProduct(null)}
          role="presentation"
        >
          <div
            className="relative max-h-[90vh] w-full max-w-[500px] overflow-y-auto rounded-2xl border border-[#E8DDD0] bg-white shadow-2xl dark:border-[#3D3530] dark:bg-[#242220]"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedProduct.name} product details`}
          >
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#2B2B2B] shadow-md transition-colors hover:bg-[#F8F5F0] dark:bg-[#1A1814]/95 dark:text-[#F0EDE8] dark:hover:bg-[#242220]"
              aria-label="Close product details"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative h-72 w-full bg-[#F2EBDF] dark:bg-[#1A1814]">
              {selectedProduct.image ? (
                <Image
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  fill
                  sizes="500px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span
                    className="text-5xl font-bold text-[#B87B68]"
                    style={{ fontFamily: "Playfair Display, serif" }}
                  >
                    {getInitials(selectedProduct.name)}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-5 p-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#EADDCD] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[#8C7355] dark:bg-[#3D3530] dark:text-[#D4B47A]">
                    {selectedProduct.type}
                  </span>
                  <span
                    style={{
                      background: selectedStatusColor.bg,
                      borderColor: selectedStatusColor.border,
                      color: selectedStatusColor.text,
                    }}
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em]"
                  >
                    <span
                      style={{ background: selectedStatusColor.dot }}
                      className="h-1.5 w-1.5 rounded-full"
                    />
                    {STOCK_STATUS_LABELS[selectedProduct.stockStatus]}
                  </span>
                </div>

                <h2
                  className="mt-4 text-3xl font-bold leading-tight text-[#2B2B2B] dark:text-[#F0EDE8]"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  {selectedProduct.name}
                </h2>

                <p
                  className="mt-3 text-3xl font-extrabold text-[#B87B68]"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  {formatBdt(selectedProduct.price)}
                </p>

                {selectedProduct.skinType ? (
                  <span className="mt-3 inline-flex rounded-full border border-[#E8DDD0] bg-[#FBF9F6] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#A8916F] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#D4B47A]">
                    For {selectedProduct.skinType} Skin
                  </span>
                ) : null}
              </div>

              {selectedProduct.description ? (
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[#2B2B2B] dark:text-[#F0EDE8]">
                    About this Product
                  </h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#8C7967] dark:text-[#8A7D75]">
                    {selectedProduct.description}
                  </p>
                </section>
              ) : null}

              {selectedProduct.ingredients ? (
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[#2B2B2B] dark:text-[#F0EDE8]">
                    Ingredients
                  </h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#8C7967] dark:text-[#8A7D75]">
                    {selectedProduct.ingredients}
                  </p>
                </section>
              ) : null}

              {selectedProduct.stockNote ? (
                <p className="rounded-xl border border-[#E8DDD0] bg-[#FBF9F6] px-4 py-3 text-sm text-[#8C7967] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#8A7D75]">
                  {selectedProduct.stockNote}
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => handleModalAddToCart(selectedProduct)}
                disabled={selectedProductIsOutOfStock}
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#2B2B2B] px-5 text-sm font-semibold text-[#F8F5F0] transition-colors hover:bg-[#B87B68] disabled:cursor-not-allowed disabled:bg-[#E8DDD0] disabled:text-[#A8916F] dark:bg-[#B87B68] dark:text-[#141210] dark:hover:bg-[#D4B47A] dark:disabled:bg-[#3D3530] dark:disabled:text-[#8A7D75]"
              >
                {selectedProductIsOutOfStock ? "Unavailable" : "Add to Cart"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style>{`
        @media (max-width: 639px) {
          .product-card {
            border-radius: 14px !important;
          }

          .product-card-media {
            height: 92px !important;
          }

          .product-card-body {
            padding: 8px !important;
          }

          .product-doctor-badge {
            top: 6px !important;
            left: 6px !important;
            max-width: calc(100% - 12px);
            padding: 3px 6px !important;
            font-size: 7px !important;
            line-height: 1.1 !important;
            letter-spacing: 0.04em !important;
            white-space: normal;
          }

          .product-type-badge {
            top: 6px !important;
            left: 6px !important;
            right: auto !important;
            max-width: calc(100% - 12px);
            padding: 2px 5px !important;
            font-size: 7px !important;
            line-height: 1.1 !important;
            letter-spacing: 0.04em !important;
          }

          .product-doctor-badge + .product-card-media .product-type-badge {
            display: none;
          }

          .product-discount-badge {
            top: 6px !important;
            right: 6px !important;
            padding: 3px 6px !important;
            font-size: 7px !important;
            line-height: 1.1 !important;
            letter-spacing: 0.04em !important;
          }

          .product-stock-badge {
            gap: 3px !important;
            padding: 2px 5px !important;
            font-size: 7px !important;
            line-height: 1 !important;
            letter-spacing: 0.03em !important;
          }

          .product-card-title {
            font-size: 11px !important;
            line-height: 1.2 !important;
            min-height: calc(1.2em * 2) !important;
            margin-bottom: 5px !important;
          }

          .product-skin-type-row {
            min-height: 0 !important;
            margin-bottom: 4px !important;
          }

          .product-skin-type {
            font-size: 7px !important;
            letter-spacing: 0.03em !important;
          }

          .product-card-divider {
            margin: 2px 0 7px !important;
          }

          .product-card-price {
            font-size: 13px !important;
            line-height: 1.1 !important;
          }

          .product-stock-note-row {
            display: none;
          }

          .product-add-button {
            height: 32px !important;
            border-radius: 8px !important;
            font-size: 10px !important;
          }

          .product-sold-out-badge {
            padding: 5px 8px !important;
            font-size: 9px !important;
          }
        }

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
