"use client";

import Image from "next/image";
import Link from "next/link";

type ProductSlide = {
  id: string;
  name: string;
  type: string;
  price: number;
  skinType: string | null;
  image: string | null;
};

type ProductSlideshowProps = {
  products: ProductSlide[];
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

export default function ProductSlideshow({ products }: ProductSlideshowProps) {
  if (products.length === 0) {
    return null;
  }

  const slideshowProducts =
    products.length >= 5 ? [...products, ...products] : products;
  const animationDuration = `${Math.max(products.length * 4.5, 28)}s`;

  return (
    <section className="overflow-hidden bg-[#F8F5F0] px-6 py-14 dark:bg-[#141210] sm:py-16">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B87B68] dark:text-[#D4B47A]">
              Selenite Picks
            </p>
            <h2
              className="mt-3 text-3xl font-bold text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-4xl"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Explore Our Skincare Products
            </h2>
          </div>

          <Link
            href="/products"
            className="inline-flex h-10 items-center justify-center rounded-md border border-[#B87B68] px-4 text-sm font-semibold text-[#B87B68] transition-colors hover:bg-[#B87B68]/10 dark:text-[#D4B47A]"
          >
            View all products
          </Link>
        </div>

        <div className="mt-8 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
          <div
            className="flex w-max gap-4 hover:[animation-play-state:paused]"
            style={{
              animation:
                products.length >= 5
                  ? `home-product-slideshow ${animationDuration} linear infinite`
                  : undefined,
            }}
          >
            {slideshowProducts.map((product, index) => (
              <Link
                key={`${product.id}-${index}`}
                href={`/products?search=${encodeURIComponent(product.name)}`}
                className="group flex w-[230px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[#EADDCD] bg-white shadow-[0_10px_28px_rgba(43,43,43,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(184,123,104,0.16)] dark:border-[#3D3530] dark:bg-[#242220] sm:w-[250px]"
              >
                <div className="relative h-40 bg-[#EFE7DC] dark:bg-[#1A1814]">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="250px"
                      className="object-contain p-3"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span
                        className="text-3xl font-bold text-[#B87B68]"
                        style={{ fontFamily: "Playfair Display, serif" }}
                      >
                        {getInitials(product.name)}
                      </span>
                    </div>
                  )}

                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#8C7355] shadow-sm dark:bg-[#1A1814]/90 dark:text-[#D4B47A]">
                    {product.type}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <h3
                    className="line-clamp-2 min-h-[3rem] text-base font-bold leading-6 text-[#2B2B2B] dark:text-[#F0EDE8]"
                    style={{ fontFamily: "Playfair Display, serif" }}
                  >
                    {product.name}
                  </h3>

                  {product.skinType ? (
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#A8916F] dark:text-[#8A7D75]">
                      For {product.skinType} Skin
                    </p>
                  ) : (
                    <div className="mt-2 h-4" />
                  )}

                  <p
                    className="mt-4 text-xl font-extrabold text-[#B87B68]"
                    style={{ fontFamily: "Playfair Display, serif" }}
                  >
                    {formatBdt(product.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes home-product-slideshow {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(calc(-50% - 8px));
          }
        }
      `}</style>
    </section>
  );
}
