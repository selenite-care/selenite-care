"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";

const HIDDEN_ROUTE_PREFIXES = [
  "/cart",
  "/admin",
  "/crm",
  "/doctor",
  "/login",
  "/register",
];

function formatBdt(amount: number) {
  return `${Math.round(amount).toLocaleString("en-US")} BDT`;
}

export default function FloatingCartButton() {
  const pathname = usePathname();
  const {
    items,
    removeItem,
    totalAmount,
    totalItems,
    updateQuantity,
  } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const shouldHide =
    totalItems <= 0 ||
    HIDDEN_ROUTE_PREFIXES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    );

  useEffect(() => {
    if (totalItems <= 0) {
      setIsOpen(false);
    }
  }, [totalItems]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  if (shouldHide) {
    return null;
  }

  return (
    <>
      {isOpen ? (
        <div className="fixed inset-0 z-[70] md:flex md:items-end md:justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            aria-label="Close cart drawer"
            onClick={() => setIsOpen(false)}
          />
          <section
            className="absolute inset-x-3 bottom-20 max-h-[68vh] overflow-hidden rounded-2xl border border-[#EADDCD] bg-[#F8F5F0] shadow-2xl dark:border-[#3D3530] dark:bg-[#242220] md:bottom-6 md:left-auto md:right-6 md:w-[380px]"
            aria-label="Mini cart"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#EADDCD] px-4 py-3 dark:border-[#3D3530]">
              <div>
                <p
                  className="text-lg font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  Your Cart
                </p>
                <p className="text-xs text-[#884F38] dark:text-[#8A7D75]">
                  {totalItems} item{totalItems === 1 ? "" : "s"} selected
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#EADDCD] bg-white text-[#2B2B2B] transition-colors hover:bg-[#F8F5F0] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8]"
                aria-label="Close cart"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[38vh] space-y-3 overflow-y-auto px-4 py-4">
              {items.map((item) => (
                <article
                  key={item.productId}
                  className="rounded-xl border border-[#EADDCD] bg-white p-3 dark:border-[#3D3530] dark:bg-[#1A1814]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs text-[#884F38] dark:text-[#8A7D75]">
                        {item.type}
                      </p>
                      <p className="mt-2 text-sm font-bold text-[#B87B68]">
                        {formatBdt(item.price * item.quantity)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 transition-opacity hover:opacity-80 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="inline-flex items-center overflow-hidden rounded-full border border-[#EADDCD] dark:border-[#3D3530]">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        className="inline-flex h-8 w-8 items-center justify-center bg-[#F8F5F0] text-[#2B2B2B] dark:bg-[#242220] dark:text-[#F0EDE8]"
                        aria-label={`Decrease ${item.name} quantity`}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="inline-flex h-8 min-w-9 items-center justify-center bg-white px-2 text-sm font-semibold text-[#2B2B2B] dark:bg-[#1A1814] dark:text-[#F0EDE8]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        className="inline-flex h-8 w-8 items-center justify-center bg-[#F8F5F0] text-[#2B2B2B] dark:bg-[#242220] dark:text-[#F0EDE8]"
                        aria-label={`Increase ${item.name} quantity`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-[#884F38] dark:text-[#8A7D75]">
                      {formatBdt(item.price)} each
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <div className="border-t border-[#EADDCD] px-4 py-4 dark:border-[#3D3530]">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-[#884F38] dark:text-[#8A7D75]">
                  Subtotal
                </span>
                <span className="text-lg font-bold text-[#B87B68]">
                  {formatBdt(totalAmount)}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link
                  href="/cart"
                  className="inline-flex h-11 items-center justify-center rounded-md border border-[#EADDCD] bg-white px-4 text-sm font-semibold text-[#2B2B2B] transition-colors hover:bg-[#F8F5F0] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8]"
                >
                  View Cart
                </Link>
                <Link
                  href="/cart"
                  className="inline-flex h-11 items-center justify-center rounded-md bg-[#2B2B2B] px-4 text-sm font-semibold text-[#F8F5F0] transition-colors hover:bg-[#884F38] dark:bg-[#B87B68] dark:text-[#141210]"
                >
                  Checkout
                </Link>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={`Open mini cart with ${totalItems} item${
          totalItems === 1 ? "" : "s"
        }, subtotal ${formatBdt(totalAmount)}`}
        className="fixed bottom-24 right-1 z-[60] flex min-h-11 w-[120px] items-center justify-between gap-2 rounded-xl border border-[#B87B68]/40 bg-[#2B2B2B] px-3 py-2 text-[#F8F5F0] shadow-[0_18px_45px_rgba(43,43,43,0.25)] transition-all duration-300 hover:-translate-y-1 dark:bg-[#B87B68] dark:text-[#141210] sm:bottom-8 sm:right-1 sm:min-h-12 sm:w-[150px] sm:px-4"
      >
        <span className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#B87B68] text-[#141210] dark:bg-[#141210] dark:text-[#F8F5F0] sm:h-10 sm:w-10">
            <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#F8F5F0] px-1 text-[10px] font-bold leading-none text-[#2B2B2B] dark:bg-[#2B2B2B] dark:text-[#F8F5F0]">
              {totalItems > 99 ? "99+" : totalItems}
            </span>
          </span>
        </span>

        <span className="shrink-0 text-right text-[11px] font-bold text-[#B87B68] dark:text-[#141210] sm:text-sm">
          {formatBdt(totalAmount)}
        </span>
      </button>
    </>
  );
}
