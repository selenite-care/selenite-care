"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef } from "react";

export default function WereHereSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const yRaw = useTransform(scrollYProgress, [0, 1], [45, -45]);

  const contentY = useSpring(yRaw, {
    stiffness: 70,
    damping: 24,
  });

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[70vh] items-center overflow-hidden bg-[#F3E8E1] px-6 py-28 dark:bg-[#1C1815]"
    >
      {/* central glow */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 blur-[110px] dark:bg-[#D4B47A]/5"
        animate={
          reduceMotion
            ? undefined
            : {
                scale: [0.92, 1.08, 0.92],
                opacity: [0.35, 0.7, 0.35],
              }
        }
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* orbit */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[310px] w-[310px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#B87B68]/15 sm:h-[430px] sm:w-[430px]"
        animate={
          reduceMotion
            ? undefined
            : {
                rotate: 360,
              }
        }
        transition={{
          duration: 38,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <motion.span
          className="absolute left-1/2 top-[-5px] h-2.5 w-2.5 rounded-full bg-[#B87B68]/70"
          animate={
            reduceMotion
              ? undefined
              : {
                  scale: [1, 1.7, 1],
                  opacity: [0.4, 1, 0.4],
                }
          }
          transition={{
            duration: 3,
            repeat: Infinity,
          }}
        />
      </motion.div>

      {/* floating dots */}
      <motion.span
        aria-hidden="true"
        className="absolute left-[15%] top-[25%] h-3 w-3 rounded-full bg-[#B87B68]/30"
        animate={
          reduceMotion
            ? undefined
            : {
                y: [0, -18, 0],
                x: [0, 8, 0],
              }
        }
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.span
        aria-hidden="true"
        className="absolute bottom-[18%] right-[16%] h-5 w-5 rounded-full border border-white/50 bg-white/25"
        animate={
          reduceMotion
            ? undefined
            : {
                y: [0, 16, 0],
                scale: [1, 1.12, 1],
              }
        }
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.span
        aria-hidden="true"
        className="absolute right-[22%] top-[18%] text-lg text-[#D4B47A]/70"
        animate={
          reduceMotion
            ? undefined
            : {
                rotate: [0, 25, 0],
                scale: [0.8, 1.2, 0.8],
                opacity: [0.3, 1, 0.3],
              }
        }
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        ✦
      </motion.span>

      <motion.div
        style={{
          y: reduceMotion ? 0 : contentY,
        }}
        className="relative z-10 mx-auto max-w-3xl text-center"
      >
        <motion.span
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-xs font-semibold uppercase tracking-[0.3em] text-[#B87B68] dark:text-[#D4B47A]"
        >
          We&apos;re Here
        </motion.span>

        <motion.h2
          initial={{
            opacity: 0,
            y: 40,
            filter: "blur(10px)",
          }}
          whileInView={{
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
          }}
          viewport={{ once: true }}
          transition={{
            duration: 0.9,
            delay: 0.1,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mt-7 text-5xl font-bold leading-[1.08] text-[#342923] dark:text-[#F0EDE8] sm:text-6xl lg:text-7xl"
          style={{
            fontFamily: "Playfair Display, serif",
          }}
        >
          Questions are
          <br />
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{
              delay: 0.5,
              duration: 0.9,
            }}
            className="italic text-[#B87B68] dark:text-[#D4B47A]"
          >
            always welcome.
          </motion.span>
        </motion.h2>

        <motion.div
          initial={{ width: 0, opacity: 0 }}
          whileInView={{ width: 90, opacity: 1 }}
          viewport={{ once: true }}
          transition={{
            delay: 0.45,
            duration: 1,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mx-auto mt-8 h-px bg-[#B87B68]/60"
        />

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            delay: 0.45,
            duration: 0.75,
          }}
          className="mx-auto mt-8 max-w-xl text-base leading-8 text-[#74594C] dark:text-[#A6978E] sm:text-lg"
        >
          Big or small, simple or complicated, you don&apos;t have to figure
          everything out alone. We&apos;re here to help you find your next
          step.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{
            delay: 0.7,
            duration: 0.8,
          }}
          className="mx-auto mt-12 flex h-16 w-16 items-center justify-center rounded-full border border-[#B87B68]/20 bg-white/20 backdrop-blur-sm dark:border-[#D4B47A]/15 dark:bg-white/[0.03]"
        >
          <motion.span
            animate={
              reduceMotion
                ? undefined
                : {
                    scale: [0.8, 1.2, 0.8],
                    opacity: [0.45, 1, 0.45],
                  }
            }
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="text-lg text-[#B87B68] dark:text-[#D4B47A]"
          >
            ✦
          </motion.span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{
            delay: 0.9,
          }}
          className="mt-6 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#884F38]/50 dark:text-[#D4B47A]/50"
        >
          Selenite Care
        </motion.p>
      </motion.div>
    </section>
  );
}