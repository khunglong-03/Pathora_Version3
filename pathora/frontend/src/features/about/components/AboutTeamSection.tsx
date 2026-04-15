"use client";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";

import Image from "@/features/shared/components/LandingImage";
import { Icon } from "@/components/ui";
import { TEAM_MEMBERS, TeamMember } from "./AboutUsPageData";
import { motion } from "framer-motion";

const TeamSection = ({ teamMembers = TEAM_MEMBERS }: { teamMembers?: TeamMember[] }) => {
  const { t } = useTranslation();

  return (
    <section className="bg-zinc-50 dark:bg-zinc-950 py-32 relative">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-xl mb-24"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#fa8b02] mb-4 flex items-center gap-3">
            <span className="w-8 h-px bg-[#fa8b02]/30" />
            {t("landing.aboutUs.teamSubtitle")}
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            {t("landing.aboutUs.teamTitle")}
          </h2>
        </motion.div>

        {/* Team Cards - Assymetric Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-16">
          {teamMembers.map((member, i) => {
            return (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 80, damping: 20, delay: i * 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
                className="group flex flex-col"
              >
                {/* Photo with Liquid Glass frame */}
                <div className="relative rounded-[2rem] overflow-hidden mb-6 aspect-[4/5] bg-zinc-200 dark:bg-zinc-800">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full h-full"
                  >
                    <Image
                      src={member.image}
                      alt={member.name}
                      width={400}
                      height={500}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                    />
                  </motion.div>
                  {/* Inner Refraction */}
                  <div className="absolute inset-0 rounded-[2rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] pointer-events-none" />
                  
                  {/* Hover Info Overlay */}
                  <div className="absolute inset-x-4 bottom-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="flex items-center justify-center gap-1.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-xl py-2 px-4 shadow-lg border border-white/20">
                      <Icon
                        icon="heroicons-outline:trophy"
                        className="w-4 h-4 text-[#fa8b02]"
                      />
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">
                        {member.toursLed} <span className="font-medium text-zinc-500">{t("landing.aboutUs.toursLed")}</span>
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Info Text */}
                <div className="flex flex-col">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                    {member.name}
                  </h3>
                  <p className="text-sm font-semibold text-[#fa8b02] mt-1 tracking-wide">
                    {member.role}
                  </p>
                  <div className="w-8 h-px bg-zinc-300 dark:bg-zinc-800 my-4 group-hover:w-full transition-all duration-500" />
                  <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {member.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export { TeamSection };
