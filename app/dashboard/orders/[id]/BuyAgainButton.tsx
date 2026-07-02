"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";

type BuyAgainItem = {
  productId: string;
  name: string;
  type: string;
  price: number;
  quantity: number;
};

export default function BuyAgainButton({ items }: { items: BuyAgainItem[] }) {
  const router = useRouter();
  const { addItem } = useCart();

  function handleBuyAgain() {
    for (const item of items) {
      for (let count = 0; count < item.quantity; count += 1) {
        addItem({
          productId: item.productId,
          name: item.name,
          type: item.type,
          price: item.price,
        });
      }
    }

    router.push("/cart");
  }

  return (
    <button
      type="button"
      onClick={handleBuyAgain}
      className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-semibold text-[#F8F5F0] transition-colors hover:bg-[#3A3734] dark:bg-[#B87B68] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
    >
      Buy Again
    </button>
  );
}
