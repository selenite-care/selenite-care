"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const ingredients = [
  {
    name: "Niacinamide",
    symbol: "N",
    label: "Balance & Clarity",
    description:
      "Supports a balanced-looking complexion and smoother appearance.",
  },
  {
    name: "Hyaluronic Acid",
    symbol: "HA",
    label: "Deep Hydration",
    description:
      "Helps the skin feel softer, plumper, and comfortably moisturized.",
  },
  {
    name: "Vitamin C",
    symbol: "C",
    label: "Radiance",
    description:
      "Supports a brighter, fresher, and more radiant-looking complexion.",
  },
  {
    name: "Ceramides",
    symbol: "CE",
    label: "Barrier Support",
    description:
      "Helps support moisture retention and a comfortable skin barrier.",
  },
];

export default function IngredientSpotlight() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % ingredients.length);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const activeIngredient = ingredients[activeIndex];

  return (
    <section className="relative overflow-hidden bg-[#F8F5F0] px-6 py-24 dark:bg-[#1A1814] sm:py-28">
      {/* Background glow */}
      <motion.div
        className="pointer-events-none absolute -left-32 top-16 h-96 w-96 rounded-full bg-[#B87B68]/10 blur-[90px]"
        animate={{
          scale: [1, 1.15, 1],
          x: [0, 25, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="pointer-events-none absolute -right-28 bottom-0 h-96 w-96 rounded-full bg-[#D4B47A]/10 blur-[100px]"
        animate={{
          scale: [1, 1.2, 1],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="relative mx-auto grid max-w-6xl gap-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        {/* LEFT */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xs font-semibold uppercase tracking-[0.22em] text-[#B87B68] dark:text-[#D4B47A]"
          >
            Ingredient Spotlight
          </motion.span>

          <h2
            className="mt-5 max-w-lg text-4xl font-bold leading-tight text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-5xl"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Ingredients With Purpose
          </h2>

          <p className="mt-6 max-w-xl text-base leading-7 text-[#884F38] dark:text-[#9D8D84]">
            Thoughtfully selected ingredients designed to support hydration,
            balance, clarity, and healthier-looking skin.
          </p>

          {/* Ingredient navigation */}
          <div className="mt-10 space-y-2">
            {ingredients.map((ingredient, index) => {
              const active = index === activeIndex;

              return (
                <motion.button
                  key={ingredient.name}
                  onClick={() => setActiveIndex(index)}
                  whileHover={{ x: 7 }}
                  className="relative flex w-full items-center justify-between overflow-hidden rounded-2xl px-5 py-4 text-left"
                >
                  {active && (
                    <motion.div
                      layoutId="activeIngredient"
                      className="absolute inset-0 rounded-2xl border border-[#E7D8CA] bg-white/70 shadow-[0_10px_30px_rgba(43,43,43,0.05)] dark:border-[#3D3530] dark:bg-[#242220]"
                      transition={{
                        type: "spring",
                        stiffness: 250,
                        damping: 25,
                      }}
                    />
                  )}

                  <div className="relative flex items-center gap-4">
                    <span
                      className={`text-xs font-semibold ${
                        active
                          ? "text-[#B87B68] dark:text-[#D4B47A]"
                          : "text-[#A5978F]"
                      }`}
                    >
                      0{index + 1}
                    </span>

                    <span
                      className={`text-base font-semibold transition-colors ${
                        active
                          ? "text-[#2B2B2B] dark:text-[#F0EDE8]"
                          : "text-[#884F38]/65 dark:text-[#8A7D75]"
                      }`}
                    >
                      {ingredient.name}
                    </span>
                  </div>

                  <motion.span
                    className="relative text-[#B87B68]"
                    animate={{
                      x: active ? [0, 5, 0] : 0,
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: active ? Infinity : 0,
                    }}
                  >
                    →
                  </motion.span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* RIGHT VISUAL */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{
            duration: 0.9,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative flex min-h-[520px] items-center justify-center"
        >
          {/* Outer orbit */}
          <motion.div
            className="absolute h-[390px] w-[390px] rounded-full border border-[#B87B68]/15 sm:h-[460px] sm:w-[460px]"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <span className="absolute left-1/2 top-[-5px] h-2.5 w-2.5 rounded-full bg-[#B87B68]" />

            <span className="absolute bottom-[15%] right-[7%] h-1.5 w-1.5 rounded-full bg-[#D4B47A]" />
          </motion.div>

          {/* Second orbit */}
          <motion.div
            className="absolute h-[310px] w-[310px] rounded-full border border-dashed border-[#D4B47A]/20 sm:h-[360px] sm:w-[360px]"
            animate={{
              rotate: -360,
            }}
            transition={{
              duration: 24,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* Floating bubbles */}
          <motion.span
            className="absolute left-[8%] top-[20%] h-12 w-12 rounded-full border border-white/50 bg-white/25 backdrop-blur-md dark:border-white/10 dark:bg-white/5"
            animate={{
              y: [0, -18, 0],
              x: [0, 8, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.span
            className="absolute bottom-[18%] right-[5%] h-20 w-20 rounded-full border border-[#D4B47A]/15 bg-[#D4B47A]/5"
            animate={{
              y: [0, 20, 0],
              scale: [1, 1.08, 1],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.span
            className="absolute right-[16%] top-[12%] h-5 w-5 rounded-full bg-[#B87B68]/20"
            animate={{
              y: [0, -12, 0],
              x: [0, -10, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Glow */}
          <motion.div
            className="absolute h-72 w-72 rounded-full bg-[#B87B68]/10 blur-[65px]"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.9, 0.5],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Main ingredient sphere */}
          <motion.div
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative z-10 flex h-64 w-64 items-center justify-center rounded-full border border-white/60 bg-white/45 shadow-[0_30px_80px_rgba(43,43,43,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-[#242220]/70 sm:h-72 sm:w-72"
          >
            {/* glass highlight */}
            <div className="pointer-events-none absolute inset-4 rounded-full border border-white/40 dark:border-white/5" />

            <AnimatePresence mode="wait">
              <motion.div
                key={activeIngredient.name}
                initial={{
                  opacity: 0,
                  y: 25,
                  scale: 0.85,
                  filter: "blur(8px)",
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  filter: "blur(0px)",
                }}
                exit={{
                  opacity: 0,
                  y: -20,
                  scale: 0.9,
                  filter: "blur(6px)",
                }}
                transition={{
                  duration: 0.55,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="relative z-10 text-center"
              >
                <motion.div
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 180,
                    damping: 14,
                  }}
                  className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-[#B87B68]/20 bg-[#F8F5F0]/80 text-3xl font-bold text-[#B87B68] shadow-inner dark:bg-[#1A1814]/60 dark:text-[#D4B47A]"
                  style={{
                    fontFamily: "Playfair Display, serif",
                  }}
                >
                  {activeIngredient.symbol}
                </motion.div>

                <h3
                  className="mt-5 text-2xl font-bold text-[#2B2B2B] dark:text-[#F0EDE8]"
                  style={{
                    fontFamily: "Playfair Display, serif",
                  }}
                >
                  {activeIngredient.name}
                </h3>

                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#B87B68] dark:text-[#D4B47A]">
                  {activeIngredient.label}
                </p>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Description floating card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeIngredient.name}-description`}
              initial={{
                opacity: 0,
                x: 25,
                y: 15,
              }}
              animate={{
                opacity: 1,
                x: 0,
                y: 0,
              }}
              exit={{
                opacity: 0,
                x: -20,
              }}
              transition={{
                duration: 0.45,
              }}
              className="absolute bottom-3 right-0 z-20 hidden max-w-[240px] rounded-2xl border border-[#E7D8CA] bg-white/75 p-4 shadow-[0_14px_40px_rgba(43,43,43,0.08)] backdrop-blur-lg dark:border-[#3D3530] dark:bg-[#242220]/85 sm:block"
            >
              <p className="text-sm leading-6 text-[#884F38] dark:text-[#9D8D84]">
                {activeIngredient.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Mobile description */}
        <AnimatePresence mode="wait">
          <motion.p
            key={`${activeIngredient.name}-mobile`}
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -10,
            }}
            className="text-center text-sm leading-6 text-[#884F38] dark:text-[#9D8D84] sm:hidden"
          >
            {activeIngredient.description}
          </motion.p>
        </AnimatePresence>
      </div>
    </section>
  );
}