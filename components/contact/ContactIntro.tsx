"use client";

import { motion } from "framer-motion";

const details = [
  {
    label: "Email",
    value: "careselenite@gmail.com",
  },
  {
    label: "Phone",
    value: "+88 01647-660300",
  },
  {
    label: "Location",
    value: (
      <>
        Level-6, Building-1, Golden Shower,
        <br />
        Mazar Road, Dhaka-1216, Bangladesh.
      </>
    ),
  },
];

export default function ContactIntro() {
  return (
    <>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.12,
            },
          },
        }}
        className="max-w-2xl"
      >
        <motion.div
          variants={{
            hidden: {
              width: 0,
              opacity: 0,
            },
            visible: {
              width: 64,
              opacity: 1,
              transition: {
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
              },
            },
          }}
          className="mb-5 h-1 rounded-full bg-[var(--gold)]"
        />

        <motion.h1
          variants={{
            hidden: {
              opacity: 0,
              y: 30,
              filter: "blur(8px)",
            },
            visible: {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              transition: {
                duration: 0.75,
                ease: [0.22, 1, 0.36, 1],
              },
            },
          }}
          className="text-page text-3xl font-semibold tracking-tight sm:text-4xl"
          style={{
            fontFamily: "Playfair Display, serif",
          }}
        >
          Contact Us
        </motion.h1>

        <motion.p
          variants={{
            hidden: {
              opacity: 0,
              y: 18,
            },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.6,
              },
            },
          }}
          className="text-muted mt-4 text-base leading-7"
        >
          Send us a message and the Selenite Care team will follow up with you.
        </motion.p>
      </motion.div>
    </>
  );
}

export function ContactDetailsCard() {
  return (
    <motion.aside
      initial={{
        opacity: 0,
        x: 45,
        scale: 0.96,
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        scale: 1,
      }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{
        y: -6,
      }}
      className="bg-card border-themed relative h-fit overflow-hidden rounded-2xl border p-6 shadow-[0_18px_50px_rgba(43,43,43,0.06)]"
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#B87B68]/10 blur-[50px]"
        animate={{
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="relative">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: 56 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.8,
          }}
          className="mb-4 h-1 rounded-full bg-[var(--gold)]"
        />

        <h2
          className="text-page text-lg font-semibold"
          style={{
            fontFamily: "Playfair Display, serif",
          }}
        >
          Contact Details
        </h2>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.14,
                delayChildren: 0.15,
              },
            },
          }}
          className="mt-6 space-y-5 text-sm"
        >
          {details.map((detail) => (
            <motion.div
              key={detail.label}
              variants={{
                hidden: {
                  opacity: 0,
                  x: 18,
                },
                visible: {
                  opacity: 1,
                  x: 0,
                  transition: {
                    duration: 0.5,
                  },
                },
              }}
            >
              <p className="text-page font-medium">{detail.label}</p>

              <p className="text-muted mt-1">{detail.value}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.aside>
  );
}