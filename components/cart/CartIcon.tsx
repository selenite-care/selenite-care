"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";

type CartIconProps = {
  className?: string;
  onClick?: () => void;
};

export default function CartIcon({ className, onClick }: CartIconProps) {
  const { totalItems } = useCart();

  return (
    <Link
      href="/cart"
      onClick={onClick}
      className={className}
      aria-label={`Cart${totalItems > 0 ? ` with ${totalItems} items` : ""}`}
    >
      <span className="relative inline-flex">
        <ShoppingBag className="h-5 w-5" aria-hidden="true" />
        {totalItems > 0 ? (
          <span className="absolute -right-2 -top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#C6A56B] px-1 text-[10px] font-semibold leading-none text-[#141210] dark:bg-[#D4B47A]">
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
