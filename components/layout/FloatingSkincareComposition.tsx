"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef } from "react";

export default function FloatingSkincareComposition() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const bottleYRaw = useTransform(scrollYProgress, [0, 1], [70, -70]);
  const jarYRaw = useTransform(scrollYProgress, [0, 1], [-10, 45]);
  const dropperYRaw = useTransform(scrollYProgress, [0, 1], [55, -55]);
  const leafYRaw = useTransform(scrollYProgress, [0, 1], [-25, 35]);
  const bottleRotateRaw = useTransform(scrollYProgress, [0, 1], [-2, 2]);
  const dropperRotateRaw = useTransform(scrollYProgress, [0, 1], [5, -5]);

  const bottleY = useSpring(bottleYRaw, {
    stiffness: 70,
    damping: 20,
  });

  const jarY = useSpring(jarYRaw, {
    stiffness: 60,
    damping: 22,
  });

  const dropperY = useSpring(dropperYRaw, {
    stiffness: 65,
    damping: 20,
  });

  const leafY = useSpring(leafYRaw, {
    stiffness: 55,
    damping: 24,
  });

  const bottleRotate = useSpring(bottleRotateRaw, {
    stiffness: 70,
    damping: 22,
  });

  const dropperRotate = useSpring(dropperRotateRaw, {
    stiffness: 70,
    damping: 22,
  });

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#FBF8F4] px-6 py-24 dark:bg-[#181512] sm:py-28 lg:py-32"
    >
      {/* Background glow */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-[-12%] top-[12%] h-[360px] w-[360px] rounded-full bg-[#B87B68]/10 blur-[90px] sm:h-[480px] sm:w-[480px]"
        animate={
          reduceMotion
            ? undefined
            : {
                scale: [1, 1.14, 1],
                opacity: [0.45, 0.8, 0.45],
              }
        }
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-18%] right-[-10%] h-[420px] w-[420px] rounded-full bg-[#D4B47A]/10 blur-[100px] sm:h-[540px] sm:w-[540px]"
        animate={
          reduceMotion
            ? undefined
            : {
                scale: [1, 1.18, 1],
                y: [0, -18, 0],
              }
        }
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Fine background grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage: `
            linear-gradient(rgba(184,123,104,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(184,123,104,0.035) 1px, transparent 1px)
          `,
          backgroundSize: "56px 56px",
        }}
      />

      <div className="relative mx-auto grid max-w-6xl gap-14 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
        {/* LEFT COPY */}
        <motion.div
          initial={{ opacity: 0, x: -45 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative z-20 max-w-xl"
        >
          <motion.span
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              delay: 0.1,
              duration: 0.5,
            }}
            className="text-xs font-semibold uppercase tracking-[0.22em] text-[#B87B68] dark:text-[#D4B47A]"
          >
            The Art of Everyday Care
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{
              delay: 0.15,
              duration: 0.75,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-5 text-4xl font-bold leading-tight text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-5xl lg:text-6xl"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Care in every detail.
          </motion.h2>

          <motion.div
            initial={{ width: 0, opacity: 0 }}
            whileInView={{ width: 76, opacity: 1 }}
            viewport={{ once: true }}
            transition={{
              delay: 0.35,
              duration: 0.9,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-6 h-px bg-[#B87B68]/60"
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              delay: 0.35,
              duration: 0.65,
            }}
            className="mt-6 text-base leading-7 text-[#884F38] dark:text-[#9D8D84] sm:text-lg"
          >
            Thoughtful rituals, gentle textures, and moments of care designed to
            feel as beautiful as they are intentional.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{
              delay: 0.55,
              duration: 0.6,
            }}
            className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-[#B87B68]/70 dark:text-[#D4B47A]/70"
          >
            Selenite Care
          </motion.p>
        </motion.div>

        {/* VISUAL COMPOSITION */}
        <div className="relative min-h-[520px] sm:min-h-[640px] lg:min-h-[720px]">
          {/* Orbital ring */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#B87B68]/15 sm:h-[480px] sm:w-[480px]"
            animate={reduceMotion ? undefined : { rotate: 360 }}
            transition={{
              duration: 32,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <span className="absolute left-1/2 top-[-5px] h-2.5 w-2.5 rounded-full bg-[#B87B68]/70" />
            <span className="absolute bottom-[12%] right-[8%] h-2 w-2 rounded-full bg-[#D4B47A]/70" />
          </motion.div>

          {/* Decorative leaf */}
          <motion.div
            aria-hidden="true"
            className="absolute left-[4%] top-[18%] hidden h-56 w-28 origin-bottom rounded-[100%_0_100%_0] border border-[#B87B68]/15 bg-gradient-to-br from-[#B87B68]/10 to-transparent sm:block"
            style={
              reduceMotion
                ? undefined
                : {
                    y: leafY,
                    rotate: -28,
                  }
            }
            animate={
              reduceMotion
                ? undefined
                : {
                    rotate: [-28, -24, -28],
                  }
            }
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Main serum bottle */}
          <motion.div
            initial={{
              opacity: 0,
              y: 70,
              scale: 0.88,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.9,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={
              reduceMotion
                ? undefined
                : {
                    y: bottleY,
                    rotate: bottleRotate,
                  }
            }
            className="absolute left-1/2 top-[18%] z-20 -translate-x-1/2"
          >
            <motion.div
              animate={
                reduceMotion
                  ? undefined
                  : {
                      y: [0, -10, 0],
                    }
              }
              transition={{
                duration: 5.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative"
            >
              {/* Cap */}
              <div className="mx-auto h-20 w-16 rounded-t-[20px] rounded-b-lg border border-[#B87B68]/30 bg-gradient-to-b from-[#E8C4B8] via-[#B87B68] to-[#7D4C3E] shadow-[0_8px_18px_rgba(90,65,30,0.12)]" />

              {/* Neck */}
              <div className="mx-auto -mt-1 h-6 w-11 rounded-b-lg bg-[#E6D6C7]/80 dark:bg-[#756B63]" />

              {/* Bottle body */}
              <div className="relative mx-auto h-72 w-44 overflow-hidden rounded-[34px] border border-white/60 bg-gradient-to-br from-white/70 via-[#F4E9E2]/65 to-[#E2C7BB]/45 shadow-[0_35px_70px_rgba(81,52,40,0.15)] backdrop-blur-xl dark:border-white/10 dark:from-[#3A312C]/80 dark:via-[#2B2521]/80 dark:to-[#1D1916]/80 sm:h-80 sm:w-48">
                {/* Glass sheen */}
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 w-16 -skew-x-12 bg-white/30 blur-lg"
                  animate={
                    reduceMotion
                      ? undefined
                      : {
                          left: ["-40%", "130%"],
                        }
                  }
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "easeInOut",
                  }}
                />

                <div className="absolute inset-x-5 top-1/2 -translate-y-1/2 rounded-2xl border border-[#B87B68]/10 bg-white/35 px-4 py-6 text-center backdrop-blur-sm dark:bg-white/5">
                  <p
                    className="text-2xl font-bold text-[#2B2B2B] dark:text-[#F0EDE8]"
                    style={{ fontFamily: "Playfair Display, serif" }}
                  >
                    Selenite
                  </p>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#B87B68] dark:text-[#D4B47A]">
                    Daily Serum
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Cream jar */}
          <motion.div
            initial={{
              opacity: 0,
              x: -40,
              y: 40,
              scale: 0.9,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
              y: 0,
              scale: 1,
            }}
            viewport={{ once: true }}
            transition={{
              duration: 0.8,
              delay: 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={
              reduceMotion
                ? undefined
                : {
                    y: jarY,
                  }
            }
            className="absolute bottom-[12%] left-[6%] z-30 sm:left-[10%]"
          >
            <motion.div
              animate={
                reduceMotion
                  ? undefined
                  : {
                      y: [0, 8, 0],
                      rotate: [-2, 1, -2],
                    }
              }
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Lid */}
              <div className="mx-auto h-10 w-36 rounded-t-3xl border border-[#B87B68]/25 bg-gradient-to-b from-[#E8C4B8] to-[#B87B68] shadow-sm sm:w-40" />

              {/* Jar */}
              <div className="relative h-28 w-40 overflow-hidden rounded-b-[34px] rounded-t-xl border border-white/60 bg-gradient-to-br from-white/80 to-[#EADDD4]/70 shadow-[0_25px_55px_rgba(81,52,40,0.12)] backdrop-blur-lg dark:border-white/10 dark:from-[#342D28] dark:to-[#211C19] sm:w-44">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <p
                    className="text-lg font-bold text-[#2B2B2B] dark:text-[#F0EDE8]"
                    style={{ fontFamily: "Playfair Display, serif" }}
                  >
                    Selenite
                  </p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.22em] text-[#B87B68] dark:text-[#D4B47A]">
                    Soft Cream
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Dropper / secondary bottle */}
          <motion.div
            initial={{
              opacity: 0,
              x: 40,
              y: -30,
              scale: 0.9,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
              y: 0,
              scale: 1,
            }}
            viewport={{ once: true }}
            transition={{
              duration: 0.85,
              delay: 0.28,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={
              reduceMotion
                ? undefined
                : {
                    y: dropperY,
                    rotate: dropperRotate,
                  }
            }
            className="absolute right-[3%] top-[18%] z-10 hidden sm:block"
          >
            <motion.div
              animate={
                reduceMotion
                  ? undefined
                  : {
                      y: [0, -12, 0],
                    }
              }
              transition={{
                duration: 6.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="mx-auto h-16 w-12 rounded-t-2xl bg-gradient-to-b from-[#38302C] to-[#1E1A18]" />
              <div className="mx-auto h-7 w-7 bg-[#E2C9BC]/70" />
              <div className="relative h-52 w-28 overflow-hidden rounded-[28px] border border-white/50 bg-gradient-to-br from-[#EACFC4]/65 via-[#D6AFA0]/45 to-[#B87B68]/35 shadow-[0_25px_60px_rgba(81,52,40,0.15)] backdrop-blur-xl dark:border-white/10 dark:from-[#3A2C27]/70 dark:to-[#211A17]/80">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#884F38]/75 dark:text-[#D4B47A]">
                    SC
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Floating bubbles */}
          <motion.span
            aria-hidden="true"
            className="absolute left-[18%] top-[9%] h-16 w-16 rounded-full border border-white/50 bg-white/25 backdrop-blur-md dark:border-white/10 dark:bg-white/5"
            animate={
              reduceMotion
                ? undefined
                : {
                    y: [0, -16, 0],
                    x: [0, 8, 0],
                  }
            }
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.span
            aria-hidden="true"
            className="absolute bottom-[8%] right-[16%] h-24 w-24 rounded-full border border-[#D4B47A]/15 bg-[#D4B47A]/5"
            animate={
              reduceMotion
                ? undefined
                : {
                    y: [0, 20, 0],
                    scale: [1, 1.08, 1],
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
            className="absolute right-[8%] top-[8%] h-5 w-5 rounded-full bg-[#B87B68]/30"
            animate={
              reduceMotion
                ? undefined
                : {
                    y: [0, -12, 0],
                    x: [0, -8, 0],
                    opacity: [0.4, 1, 0.4],
                  }
            }
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.span
            aria-hidden="true"
            className="absolute bottom-[28%] left-[2%] h-3 w-3 rounded-full bg-[#D4B47A]/60"
            animate={
              reduceMotion
                ? undefined
                : {
                    scale: [1, 1.8, 1],
                    opacity: [0.35, 1, 0.35],
                  }
            }
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Small sparkle */}
          <motion.div
            aria-hidden="true"
            className="absolute right-[28%] top-[12%] text-xl text-[#D4B47A]"
            animate={
              reduceMotion
                ? undefined
                : {
                    rotate: [0, 30, 0],
                    scale: [0.8, 1.25, 0.8],
                    opacity: [0.35, 1, 0.35],
                  }
            }
            transition={{
              duration: 3.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            ✦
          </motion.div>
        </div>
      </div>
    </section>
  );
}
