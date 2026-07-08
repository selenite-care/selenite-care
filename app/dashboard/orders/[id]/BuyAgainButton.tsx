"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";

type BuyAgainItem = {
  productId: string;
  name: string;
  type: string;
  price: number;
  quantity: number;
  stockStatus: "AVAILABLE" | "LIMITED" | "OUT_OF_STOCK";
};

export default function BuyAgainButton({ items }: { items: BuyAgainItem[] }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [warning, setWarning] = useState("");
  const [hasAddedWithWarning, setHasAddedWithWarning] = useState(false);

  function handleBuyAgain() {
    if (hasAddedWithWarning) {
      return;
    }

    const availableItems = items.filter(
      (item) => item.stockStatus !== "OUT_OF_STOCK",
    );
    const outOfStockCount = items.length - availableItems.length;

    for (const item of availableItems) {
      for (let count = 0; count < item.quantity; count += 1) {
        addItem({
          productId: item.productId,
          name: item.name,
          type: item.type,
          price: item.price,
        });
      }
    }

    if (outOfStockCount > 0) {
      setHasAddedWithWarning(true);
      setWarning(
        `${outOfStockCount} item${
          outOfStockCount === 1 ? " is" : "s are"
        } out of stock and were not added to cart. Available items were added to your cart.`,
      );
      return;
    }

    router.push("/cart");
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleBuyAgain}
        disabled={hasAddedWithWarning}
        className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-semibold text-[#F8F5F0] transition-colors hover:bg-[#3A3734] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#B87B68] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
      >
        {hasAddedWithWarning ? "Available Items Added" : "Order Again"}
      </button>

      {warning ? (
        <p
          className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300"
          aria-live="polite"
        >
          {warning}
        </p>
      ) : null}
    </div>
  );
}
