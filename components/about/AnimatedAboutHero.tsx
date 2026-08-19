"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

const stats = [
  {
    value: "1000+",
    label: "Consultations",
  },
  {
    value: "99%",
    label: "Satisfaction",
  },
  {
    value: "24/7",
    label: "Support",
  },
];

const highlights = [
  {
    label: "Personalize",
    value: "Care Plans",
  },
  {
    label: "Thoughtful",
    value: "Support",
  },
  {
    label: "Long-Term",
    value: "Progress",
  },
];

const easing = [0.22, 1, 0.36, 1] as const;

export default function AnimatedAboutHero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden px-6 py-20 sm:py-24">
      {/* BACKGROUND DECORATION */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-64 w-64 rounded-full blur-3xl"
        style={{
          backgroundColor: "rgba(198, 165, 107, 0.16)",
        }}
        animate={
          reduceMotion
            ? undefined
            : {
                x: [0, 25, 0],
                y: [0, -15, 0],
                scale: [1, 1.12, 1],
              }
        }
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full blur-3xl"
        style={{
          backgroundColor: "rgba(216, 199, 181, 0.24)",
        }}
        animate={
          reduceMotion
            ? undefined
            : {
                x: [0, -20, 0],
                y: [0, 18, 0],
                scale: [1, 1.15, 1],
              }
        }
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* tiny decorative particle */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute left-[7%] top-[30%] hidden h-2 w-2 rounded-full bg-[#B87B68]/35 lg:block"
        animate={
          reduceMotion
            ? undefined
            : {
                y: [0, -15, 0],
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.4, 1],
              }
        }
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="relative mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        {/* LEFT SIDE */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.11,
                delayChildren: 0.1,
              },
            },
          }}
        >
          {/* BADGE */}
          <motion.div
            variants={{
              hidden: {
                opacity: 0,
                y: 15,
                scale: 0.96,
              },
              visible: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  duration: 0.55,
                  ease: easing,
                },
              },
            }}
            className="mb-5 inline-flex rounded-full border border-[#EADDCD] bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#B87B68] dark:border-[#3D3530] dark:bg-[#242220]/80 dark:text-[#D4B47A]"
          >
            About Selenite Care
          </motion.div>

          {/* HEADING */}
          <motion.h1
            variants={{
              hidden: {
                opacity: 0,
                y: 35,
                filter: "blur(10px)",
              },
              visible: {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                transition: {
                  duration: 0.8,
                  ease: easing,
                },
              },
            }}
            className="max-w-3xl text-4xl font-semibold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-5xl lg:text-6xl"
            style={{
              fontFamily: "Playfair Display, serif",
            }}
          >
            A calmer, more personal way to care for skin and self.
          </motion.h1>

          {/* DESCRIPTION */}
          <motion.p
            variants={{
              hidden: {
                opacity: 0,
                y: 22,
              },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.65,
                  ease: easing,
                },
              },
            }}
            className="text-muted mt-6 max-w-2xl text-lg leading-8"
          >
            Selenite Care is a professional skincare consultation platform
            dedicated to addressing acne, dark spots, pigmentation, and other
            skin concerns through personalized guidance from certified
            aestheticians. Our mission is to help every client achieve
            healthier, clearer, and more confident skin with expert care and
            customized solutions.
          </motion.p>

          {/* DIVIDER */}
          <motion.div
            variants={{
              hidden: {
                scaleX: 0,
                opacity: 0,
              },
              visible: {
                scaleX: 1,
                opacity: 1,
                transition: {
                  duration: 0.9,
                  ease: easing,
                },
              },
            }}
            className="mt-8 h-px w-full origin-left bg-[#EADDCD] dark:bg-[#3D3530]"
          />

          {/* FOUNDED */}
          <motion.div
            variants={{
              hidden: {
                opacity: 0,
                x: -20,
              },
              visible: {
                opacity: 1,
                x: 0,
                transition: {
                  duration: 0.6,
                  ease: easing,
                },
              },
            }}
            className="mt-8 flex items-center gap-4"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 48 }}
              transition={{
                delay: 0.9,
                duration: 0.8,
                ease: easing,
              }}
              className="h-px bg-[#B87B68]"
            />

            <span className="text-sm uppercase tracking-[0.2em] text-[#B87B68] dark:text-[#D4B47A]">
              Founded in 2024
            </span>
          </motion.div>

          {/* BUTTONS */}
          <motion.div
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.08,
                },
              },
            }}
            className="mt-8 flex flex-col gap-4 sm:flex-row"
          >
            <motion.div
              variants={{
                hidden: {
                  opacity: 0,
                  y: 15,
                },
                visible: {
                  opacity: 1,
                  y: 0,
                },
              }}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href="/services"
                className="inline-flex h-12 items-center justify-center rounded-md bg-[var(--sidebar)] px-6 text-sm font-medium text-[var(--sidebar-text)] transition-opacity hover:opacity-90"
              >
                Explore Memberships
              </Link>
            </motion.div>

            <motion.div
              variants={{
                hidden: {
                  opacity: 0,
                  y: 15,
                },
                visible: {
                  opacity: 1,
                  y: 0,
                },
              }}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href="/contact"
                className="border-themed text-page inline-flex h-12 items-center justify-center rounded-md border px-6 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              >
                Contact Us
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* RIGHT SIDE / MISSION */}
        <motion.div
          initial={{
            opacity: 0,
            x: 45,
            y: 20,
            scale: 0.96,
          }}
          animate={{
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
          }}
          transition={{
            delay: 0.25,
            duration: 0.9,
            ease: easing,
          }}
          className="relative"
        >
          {/* glow behind card */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -left-4 top-8 h-24 w-24 rounded-full blur-2xl"
            style={{
              backgroundColor: "rgba(198, 165, 107, 0.2)",
            }}
            animate={
              reduceMotion
                ? undefined
                : {
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                  }
            }
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.div
            whileHover={
              reduceMotion
                ? undefined
                : {
                    y: -5,
                  }
            }
            transition={{
              duration: 0.3,
            }}
            className="relative overflow-hidden rounded-[28px] border border-[#EADDCD] p-6 dark:border-[#3D3530] sm:p-8"
            style={{
              background:
                "linear-gradient(155deg, rgba(255,255,255,0.95) 0%, rgba(245,236,224,0.9) 100%)",
              boxShadow: "0 18px 50px rgba(43, 43, 43, 0.1)",
            }}
          >
            {/* very subtle shine */}
            {!reduceMotion && (
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 z-20 w-20 -skew-x-12 bg-white/25 blur-xl"
                animate={{
                  left: ["-30%", "130%"],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatDelay: 6,
                  ease: "easeInOut",
                }}
              />
            )}

            {/* LOGO + MISSION */}
            <div className="relative grid gap-6 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.85,
                  rotate: -3,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotate: 0,
                }}
                transition={{
                  delay: 0.65,
                  duration: 0.7,
                  ease: easing,
                }}
                className="mx-auto flex h-36 w-36 items-center justify-center rounded-[24px] border border-[#EADDCD] bg-white p-4 dark:border-[#3D3530] dark:bg-[#242220] sm:mx-0"
              >
                <motion.div
                  animate={
                    reduceMotion
                      ? undefined
                      : {
                          y: [0, -3, 0],
                      }
                  }
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Image
                    src="/final_logo.png"
                    alt="Selenite Care logo"
                    width={112}
                    height={112}
                    className="h-auto w-full object-contain"
                    priority
                  />
                </motion.div>
              </motion.div>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      delayChildren: 0.65,
                      staggerChildren: 0.12,
                    },
                  },
                }}
              >
                <motion.p
                  variants={{
                    hidden: {
                      opacity: 0,
                      y: 10,
                    },
                    visible: {
                      opacity: 1,
                      y: 0,
                    },
                  }}
                  className="text-sm font-semibold uppercase tracking-[0.18em] text-[#B87B68] dark:text-[#D4B47A]"
                >
                  Our Mission
                </motion.p>

                <motion.p
                  variants={{
                    hidden: {
                      opacity: 0,
                      y: 18,
                    },
                    visible: {
                      opacity: 1,
                      y: 0,
                    },
                  }}
                  className="mt-3 text-2xl font-semibold leading-9 text-[#2B2B2B] dark:text-[#F0EDE8]"
                  style={{
                    fontFamily: "Playfair Display, serif",
                  }}
                >
                  To make compassionate skincare and wellness consultations
                  simple to access and meaningful to experience.
                </motion.p>
              </motion.div>
            </div>

            {/* STATS */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    delayChildren: 0.85,
                    staggerChildren: 0.1,
                  },
                },
              }}
              className="relative mt-8 grid grid-cols-3 gap-4"
            >
              {stats.map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={{
                    hidden: {
                      opacity: 0,
                      y: 20,
                      scale: 0.92,
                    },
                    visible: {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: {
                        duration: 0.55,
                        ease: easing,
                      },
                    },
                  }}
                  className="text-center"
                >
                  <motion.p
                    whileHover={{
                      scale: 1.08,
                    }}
                    className="text-3xl font-bold text-[#B87B68] dark:text-[#D4B47A]"
                    style={{
                      fontFamily: "Playfair Display, serif",
                    }}
                  >
                    {stat.value}
                  </motion.p>

                  <p className="mt-1 text-xs uppercase tracking-wider text-[#884F38] dark:text-[#8A7D75]">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* HIGHLIGHTS */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    delayChildren: 1,
                    staggerChildren: 0.1,
                  },
                },
              }}
              className="relative mt-8 grid gap-4 sm:grid-cols-3"
            >
              {highlights.map((item) => (
                <motion.div
                  key={item.value}
                  variants={{
                    hidden: {
                      opacity: 0,
                      y: 22,
                    },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: 0.55,
                        ease: easing,
                      },
                    },
                  }}
                  whileHover={{
                    y: -4,
                    scale: 1.02,
                  }}
                  className="rounded-2xl border border-[#EADDCD] bg-white/70 px-4 py-4 text-center dark:border-[#3D3530] dark:bg-[#1A1814]/80"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#884F38] dark:text-[#8A7D75]">
                    {item.label}
                  </p>

                  <p
                    className="mt-2 text-lg font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                    style={{
                      fontFamily: "Playfair Display, serif",
                    }}
                  >
                    {item.value}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}