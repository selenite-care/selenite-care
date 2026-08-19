"use client";

import Image from "next/image";
import { motion } from "framer-motion";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  image: string | null;
  description: string;
};

type AnimatedTeamSectionProps = {
  team: TeamMember[];
};

export default function AnimatedTeamSection({
  team,
}: AnimatedTeamSectionProps) {
  return (
    <section className="bg-page px-6 py-16">
      <div className="mx-auto w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{
            duration: 0.75,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="max-w-2xl"
        >
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            whileInView={{ width: 64, opacity: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mb-5 h-1 rounded-full bg-[#B87B68]"
          />

          <h2
            className="text-3xl font-semibold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8] sm:text-4xl"
            style={{
              fontFamily: "Playfair Display, serif",
            }}
          >
            Meet the Team
          </h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              delay: 0.15,
              duration: 0.6,
            }}
            className="mt-4 text-base leading-7 text-[#6E6257] dark:text-[#8A7D75]"
          >
            The people behind Selenite Care are here to make every interaction
            feel supportive, informed, and beautifully human.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.16,
              },
            },
          }}
          className="mt-10 grid gap-5 md:grid-cols-3"
        >
          {team.map((member) => (
            <motion.article
              key={member.id}
              variants={{
                hidden: {
                  opacity: 0,
                  y: 40,
                  scale: 0.97,
                },
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    duration: 0.7,
                    ease: [0.22, 1, 0.36, 1],
                  },
                },
              }}
              whileHover={{
                y: -6,
              }}
              className="group relative overflow-hidden rounded-2xl border border-[#EADDCD] bg-white p-6 shadow-[0_12px_35px_rgba(43,43,43,0.04)] transition-shadow duration-300 hover:shadow-[0_22px_55px_rgba(43,43,43,0.08)] dark:border-[#3D3530] dark:bg-[#242220] dark:shadow-none"
            >
              {/* subtle hover glow */}
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[#B87B68]/10 blur-[45px]"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />

              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <motion.div
                    initial={{
                      opacity: 0,
                      scale: 0.88,
                    }}
                    whileInView={{
                      opacity: 1,
                      scale: 1,
                    }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.65,
                      delay: 0.12,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="relative h-24 w-24 overflow-hidden rounded-2xl border border-[#EADDCD] bg-[#F8F5F0] dark:border-[#3D3530] dark:bg-[#1A1814]"
                  >
                    {member.image ? (
                      <motion.div
                        className="absolute inset-0"
                        whileHover={{
                          scale: 1.06,
                        }}
                        transition={{
                          duration: 0.45,
                          ease: "easeOut",
                        }}
                      >
                        <Image
                          src={member.image}
                          alt={member.name}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      </motion.div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#B87B68] text-lg font-semibold text-[#F8F5F0]">
                        {member.name
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")}
                      </div>
                    )}

                    {/* image sheen */}
                    <motion.div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 w-10 -skew-x-12 bg-white/20 blur-md"
                      animate={{
                        left: ["-50%", "140%"],
                      }}
                      transition={{
                        duration: 3.5,
                        repeat: Infinity,
                        repeatDelay: 5,
                        ease: "easeInOut",
                      }}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    whileInView={{ scaleX: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.85,
                      delay: 0.25,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="mt-12 h-px flex-1 origin-left bg-[#B87B68]/45"
                  />
                </div>

                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={{
                    hidden: {},
                    visible: {
                      transition: {
                        staggerChildren: 0.09,
                        delayChildren: 0.2,
                      },
                    },
                  }}
                >
                  <motion.h3
                    variants={{
                      hidden: {
                        opacity: 0,
                        y: 14,
                      },
                      visible: {
                        opacity: 1,
                        y: 0,
                      },
                    }}
                    className="mt-5 text-lg font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                    style={{
                      fontFamily: "Playfair Display, serif",
                    }}
                  >
                    {member.name}
                  </motion.h3>

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
                    className="mt-1 text-sm font-medium text-[#B87B68] dark:text-[#D4B47A]"
                  >
                    {member.role}
                  </motion.p>

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
                    className="mt-4 text-sm leading-6 text-[#6E6257] dark:text-[#8A7D75]"
                  >
                    {member.description}
                  </motion.p>
                </motion.div>

                {/* bottom accent */}
                <motion.div
                  className="mt-6 h-px bg-gradient-to-r from-[#B87B68]/35 via-[#D4B47A]/20 to-transparent"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.8,
                    delay: 0.35,
                  }}
                  style={{
                    transformOrigin: "left",
                  }}
                />
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}