"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
  "/hero/girl.jpeg",
  "/hero/consult.jpg",
  "/hero/products.jpg",
  "/hero/girl2.jpeg",
  "/hero/makeup.jpeg",
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0">
      {slides.map((slide, index) => (
        <Image
          key={slide}
          src={slide}
          alt=""
          fill
          priority={index === 0}
          className={`object-cover transition-opacity duration-1000 ${
            current === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      <div className="absolute inset-0 bg-black/45" />
    </div>
  );
}