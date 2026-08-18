"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef } from "react";

export default function AMomentForYou() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const yRaw = useTransform(
    scrollYProgress,
    [0, 1],
    [60, -60]
  );

  const textY = useSpring(yRaw, {
    stiffness: 70,
    damping: 24,
  });

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[80vh] items-center overflow-hidden bg-[#EEE2DA] px-6 py-28 dark:bg-[#1C1815] sm:min-h-[88vh]"
    >
      {/* large glow */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 blur-[110px] dark:bg-[#D4B47A]/5 sm:h-[700px] sm:w-[700px]"
        animate={
          reduceMotion
            ? undefined
            : {
                scale: [0.9, 1.08, 0.9],
                opacity: [0.35, 0.65, 0.35],
              }
        }
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* outer breathing ring */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#B87B68]/15 sm:h-[400px] sm:w-[400px]"
        animate={
          reduceMotion
            ? undefined
            : {
                scale: [0.9, 1.12, 0.9],
                opacity: [0.35, 0.7, 0.35],
              }
        }
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* second breathing ring */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#D4B47A]/20 sm:h-[310px] sm:w-[310px]"
        animate={
          reduceMotion
            ? undefined
            : {
                scale: [1, 1.16, 1],
                opacity: [0.6, 0.25, 0.6],
              }
        }
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* rotating orbit */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#B87B68]/10 sm:h-[470px] sm:w-[470px]"
        animate={
          reduceMotion
            ? undefined
            : {
                rotate: 360,
              }
        }
        transition={{
          duration: 45,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <motion.span
          className="absolute left-1/2 top-[-5px] h-2 w-2 rounded-full bg-[#B87B68]/60"
          animate={
            reduceMotion
              ? undefined
              : {
                  scale: [1, 1.8, 1],
                  opacity: [0.4, 1, 0.4],
                }
          }
          transition={{
            duration: 3,
            repeat: Infinity,
          }}
        />
      </motion.div>

      {/* floating particles */}
      <motion.span
        aria-hidden="true"
        className="absolute left-[15%] top-[25%] h-3 w-3 rounded-full bg-[#B87B68]/30"
        animate={
          reduceMotion
            ? undefined
            : {
                y: [0, -20, 0],
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
        className="absolute bottom-[22%] right-[14%] h-5 w-5 rounded-full border border-white/50 bg-white/20"
        animate={
          reduceMotion
            ? undefined
            : {
                y: [0, 18, 0],
                scale: [1, 1.15, 1],
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
        className="absolute right-[22%] top-[20%] text-lg text-[#D4B47A]/60"
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

      {/* central content */}
      <motion.div
        style={{
          y: reduceMotion ? 0 : textY,
        }}
        className="relative z-10 mx-auto max-w-3xl text-center"
      >
        <motion.span
          initial={{
            opacity: 0,
            y: 20,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{ once: true }}
          transition={{
            duration: 0.7,
          }}
          className="text-xs font-semibold uppercase tracking-[0.3em] text-[#B87B68] dark:text-[#D4B47A]"
        >
          A Moment for You
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
          viewport={{
            once: true,
            amount: 0.4,
          }}
          transition={{
            delay: 0.1,
            duration: 0.9,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mt-7 text-5xl font-bold leading-[1.08] text-[#342923] dark:text-[#F0EDE8] sm:text-6xl lg:text-7xl"
          style={{
            fontFamily: "Playfair Display, serif",
          }}
        >
          Slow down.
          <br />
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{
              delay: 0.5,
              duration: 1,
            }}
            className="italic text-[#B87B68] dark:text-[#D4B47A]"
          >
            Breathe.
          </motion.span>
        </motion.h2>

        <motion.p
          initial={{
            opacity: 0,
            y: 20,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{ once: true }}
          transition={{
            delay: 0.4,
            duration: 0.8,
          }}
          className="mx-auto mt-8 max-w-lg text-base leading-8 text-[#74594C] dark:text-[#A6978E] sm:text-lg"
        >
          Not every moment needs to be productive. Sometimes care begins with
          giving yourself permission to simply be.
        </motion.p>

        {/* breathing visual */}
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.8,
          }}
          whileInView={{
            opacity: 1,
            scale: 1,
          }}
          viewport={{ once: true }}
          transition={{
            delay: 0.65,
            duration: 0.8,
          }}
          className="mx-auto mt-12 flex h-20 w-20 items-center justify-center rounded-full border border-[#B87B68]/20 bg-white/20 backdrop-blur-md dark:border-[#D4B47A]/15 dark:bg-white/[0.03]"
        >
          <motion.div
            animate={
              reduceMotion
                ? undefined
                : {
                    scale: [0.7, 1.1, 0.7],
                    opacity: [0.5, 1, 0.5],
                  }
            }
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="h-3 w-3 rounded-full bg-[#B87B68] dark:bg-[#D4B47A]"
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{
            delay: 0.9,
            duration: 0.8,
          }}
          className="mt-6 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#884F38]/50 dark:text-[#D4B47A]/50"
        >
          Inhale · Exhale · Begin Again
        </motion.p>
      </motion.div>
    </section>
  );
}