
"use client";

import {
  motion,
  useScroll,
  useTransform,
  useSpring,
} from "framer-motion";
import ViewportAnimatedSection from "@/components/ui/ViewportAnimatedSection";
import { FeatureCard } from "@/components/ui/MembershipCards";

const features = [
  {
    title: "Personalized Care",
    description: "Support shaped around your needs, schedule, and goals.",
    icon: "✦",
  },
  {
    title: "Simple Booking",
    description: "Choose a service, reserve a time, and get clear next steps.",
    icon: "◈",
  },
  {
    title: "Trusted Guidance",
    description:
      "Thoughtful consultations focused on practical wellness.",
    icon: "❋",
  },
];

const reassurancePoints = [
  "Professional guidance that feels personal",
  "Calm, easy-to-follow booking experience",
  "Support designed for steady long-term progress",
];

const trustHighlights = [
  {
    label: "Client-first",
    value: "Tailored care",
  },
  {
    label: "Clear process",
    value: "No guesswork",
  },
  {
    label: "Thoughtful follow-up",
    value: "Steady support",
  },
];

const easing = [0.22, 1, 0.36, 1] as const;

export default function WhyChooseUsSection() {
  const { scrollYProgress } = useScroll();

  const rawY = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const backgroundY = useSpring(rawY, {
    stiffness: 70,
    damping: 20,
    mass: 0.5,
  });

  const easing = [0.22, 1, 0.36, 1] as const;

  return (
    <section className="bg-card relative overflow-hidden px-6 py-20 sm:py-24">

      {/* ====================================================== */}
      {/* BACKGROUND DECORATION */}
      {/* ====================================================== */}

      {/* Grid */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          y: backgroundY,
          backgroundImage: `
            linear-gradient(rgba(198,165,107,0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(198,165,107,0.045) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Left floating glow */}
      <motion.div
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full blur-[90px]"
        style={{
          background: "rgba(184,123,104,0.13)",
        }}
        animate={{
          x: [0, 50, 20, 0],
          y: [0, -25, 30, 0],
          scale: [1, 1.2, 0.95, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Right floating glow */}
      <motion.div
        className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full blur-[100px]"
        style={{
          background: "rgba(212,180,122,0.14)",
        }}
        animate={{
          x: [0, -40, -15, 0],
          y: [0, 35, -20, 0],
          scale: [1, 0.95, 1.2, 1],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Decorative rotating ring */}
      <motion.div
        className="pointer-events-none absolute right-[8%] top-20 hidden h-40 w-40 rounded-full border border-[#B87B68]/10 lg:block"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <motion.span
          className="absolute -top-1 left-1/2 h-2 w-2 rounded-full bg-[#B87B68]/50"
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
      </motion.div>

      {/* Second ring */}
      <motion.div
        className="pointer-events-none absolute bottom-24 left-[5%] hidden h-24 w-24 rounded-full border border-[#D4B47A]/10 lg:block"
        animate={{
          rotate: -360,
        }}
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* ====================================================== */}
      {/* CONTENT */}
      {/* ====================================================== */}

      <div className="relative mx-auto w-full max-w-6xl">

        {/* Top grid */}
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">

          {/* ================================================== */}
          {/* LEFT */}
          {/* ================================================== */}

          <motion.div
            className="max-w-3xl"
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              amount: 0.3,
            }}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.13,
                },
              },
            }}
          >
            {/* Badge */}
            <motion.div
              variants={{
                hidden: {
                  opacity: 0,
                  x: -40,
                  filter: "blur(8px)",
                },
                visible: {
                  opacity: 1,
                  x: 0,
                  filter: "blur(0px)",
                  transition: {
                    duration: 0.65,
                    ease: easing,
                  },
                },
              }}
            >
              <motion.span
                className="relative inline-flex overflow-hidden rounded-full border border-[#884F38] bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#B87B68] dark:border-[#3D3530] dark:bg-[#242220] dark:text-[#D4B47A]"
                whileHover={{
                  scale: 1.04,
                }}
              >
                Why Clients Stay With Us

                {/* Badge shimmer */}
                <motion.span
                  className="pointer-events-none absolute inset-y-0 w-10 -skew-x-12 bg-white/40"
                  animate={{
                    left: ["-40%", "130%"],
                  }}
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "easeInOut",
                  }}
                />
              </motion.span>
            </motion.div>

            {/* Heading */}
            <motion.h2
              variants={{
                hidden: {
                  opacity: 0,
                  y: 45,
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
              style={{
                fontFamily: "Playfair Display, serif",
              }}
              className="horizontal-nudge text-page mt-5 text-4xl font-bold tracking-tight sm:text-5xl"
            >
              Why Choose Us
            </motion.h2>

            {/* Animated gold line */}
            <motion.div
              className="mt-5 h-[2px] rounded-full bg-[#B87B68]/50"
              initial={{
                width: 0,
                opacity: 0,
              }}
              whileInView={{
                width: 72,
                opacity: 1,
              }}
              viewport={{ once: true }}
              transition={{
                delay: 0.4,
                duration: 0.9,
                ease: easing,
              }}
            />

            {/* Description */}
            <motion.p
              variants={{
                hidden: {
                  opacity: 0,
                  y: 30,
                },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.7,
                    ease: easing,
                  },
                },
              }}
              className="mt-5 max-w-2xl text-base leading-7 text-[#884F38] dark:text-[#8A7D75] sm:text-lg"
            >
              We&apos;re building a skincare and wellness experience that feels
              warm, structured, and genuinely supportive from the first click
              to ongoing care.
            </motion.p>
          </motion.div>

          {/* ================================================== */}
          {/* EXPECTATION CARD */}
          {/* ================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              x: 70,
              rotateY: -8,
              scale: 0.94,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
              rotateY: 0,
              scale: 1,
            }}
            viewport={{
              once: true,
              amount: 0.3,
            }}
            transition={{
              duration: 0.9,
              ease: easing,
            }}
            whileHover={{
              y: -8,
              rotateX: 1,
              rotateY: -1,
              scale: 1.015,
              transition: {
                duration: 0.3,
              },
            }}
            className="border-themed bg-page relative overflow-hidden rounded-3xl border p-6 shadow-[0_18px_40px_rgba(43,43,43,0.06)] dark:shadow-none"
          >
            {/* Moving sheen */}
            <motion.div
              className="pointer-events-none absolute inset-y-0 w-20 -skew-x-12 bg-white/20 blur-lg"
              animate={{
                left: ["-30%", "130%"],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                repeatDelay: 2,
                ease: "easeInOut",
              }}
            />

            <div className="relative">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#B87B68] dark:text-[#D4B47A]">
                What You Can Expect
              </p>

              <motion.ul
                className="mt-5 space-y-4"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: 0.16,
                      delayChildren: 0.25,
                    },
                  },
                }}
              >
                {reassurancePoints.map((point, index) => (
                  <motion.li
                    key={point}
                    className="text-page flex items-start gap-3 text-sm leading-6"
                    variants={{
                      hidden: {
                        opacity: 0,
                        x: 30,
                      },
                      visible: {
                        opacity: 1,
                        x: 0,
                        transition: {
                          duration: 0.55,
                          ease: easing,
                        },
                      },
                    }}
                  >
                    {/* Animated bullet */}
                    <motion.span
                      className="relative mt-2 flex h-2 w-2 shrink-0 items-center justify-center rounded-full bg-[#B87B68] dark:bg-[#D4B47A]"
                      variants={{
                        hidden: {
                          scale: 0,
                        },
                        visible: {
                          scale: 1,
                          transition: {
                            type: "spring",
                            stiffness: 400,
                            damping: 14,
                          },
                        },
                      }}
                    >
                      <motion.span
                        className="absolute h-full w-full rounded-full bg-[#B87B68]/40"
                        animate={{
                          scale: [1, 2.5, 1],
                          opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                          duration: 2.5,
                          delay: index * 0.4,
                          repeat: Infinity,
                        }}
                      />
                    </motion.span>

                    <span className="text-[#884F38] dark:text-[#8A7D75]">
                      {point}
                    </span>
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          </motion.div>
        </div>

        {/* ====================================================== */}
        {/* FEATURES */}
        {/* ====================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: 60,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.15,
          }}
          transition={{
            duration: 0.9,
            ease: easing,
          }}
        >
          <ViewportAnimatedSection className="feature-card-trigger mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                feature={feature}
                index={index}
                total={features.length}
              />
            ))}
          </ViewportAnimatedSection>
        </motion.div>

        {/* ====================================================== */}
        {/* DECORATIVE CONNECTOR */}
        {/* ====================================================== */}

        <div className="relative mx-auto my-8 hidden h-10 max-w-4xl md:block">
          <motion.div
            className="absolute left-1/2 top-1/2 h-px -translate-x-1/2 bg-[#B87B68]/20"
            initial={{
              width: 0,
            }}
            whileInView={{
              width: "75%",
            }}
            viewport={{ once: true }}
            transition={{
              duration: 1.2,
              ease: easing,
            }}
          />

          <motion.span
            className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#B87B68]"
            animate={{
              scale: [1, 1.8, 1],
              boxShadow: [
                "0 0 0 0 rgba(184,123,104,0.3)",
                "0 0 0 10px rgba(184,123,104,0)",
                "0 0 0 0 rgba(184,123,104,0)",
              ],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
            }}
          />
        </div>
      </div>
    </section>
  );
}