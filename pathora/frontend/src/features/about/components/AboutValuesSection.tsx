"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";
import { VALUES } from "./AboutUsPageData";
import { motion } from "framer-motion";

const ValuesSection = ({ values = VALUES }: { values?: typeof VALUES }) => {
  const { t } = useTranslation();
  return (
    <section className="bg-zinc-50 dark:bg-zinc-950 py-32 relative overflow-hidden">
      {/* Ambient backgrounds */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-zinc-200/50 dark:bg-zinc-900/50 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/4" />
      
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-20 max-w-2xl mx-auto"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#fa8b02] mb-4 flex justify-center items-center gap-3">
            <span className="w-8 h-px bg-[#fa8b02]/30" />
            {t("landing.aboutUs.whyChooseUs")}
            <span className="w-8 h-px bg-[#fa8b02]/30" />
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            {t("landing.aboutUs.valuesTitle")}
          </h2>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {values.map((v, i) => {
            // Asymmetrical grid styling logic
            const isWide = i === 0 || i === 3; // Make 1st and 4th items span 2 columns
            
            return (
              <motion.div
                key={v.titleKey}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 80, damping: 20, delay: i * 0.1 }}
                viewport={{ once: true, margin: "-50px" }}
                className={`group relative bg-white dark:bg-zinc-900/40 rounded-[2.5rem] p-8 md:p-10 border border-zinc-200/60 dark:border-white/5 shadow-xl shadow-zinc-200/20 dark:shadow-black/20 overflow-hidden ${
                  isWide ? "md:col-span-2" : "md:col-span-1"
                }`}
              >
                {/* Micro-interaction: Shimmering hover gradient border */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#fa8b02]/0 via-[#fa8b02]/0 to-[#fa8b02]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                
                {/* Floating Icon with continuous motion */}
                <motion.div 
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                  className="w-16 h-16 rounded-[1.25rem] bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center mb-8 shadow-sm group-hover:shadow-md transition-shadow relative z-10"
                >
                  <Icon icon={v.icon} className="w-7 h-7 text-[#fa8b02]" />
                </motion.div>
                
                <h3 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white mb-4 tracking-tight relative z-10">
                  {t(`landing.aboutUs.values.${v.titleKey}`)}
                </h3>
                <p className="text-base leading-relaxed text-zinc-500 dark:text-zinc-400 max-w-lg relative z-10">
                  {t(`landing.aboutUs.values.${v.descKey}`)}
                </p>
                
                {/* Decorative background element pushing out */}
                <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ duration: 40, ease: "linear", repeat: Infinity }}
                   className="absolute -bottom-8 -right-8 w-32 h-32 bg-zinc-100 dark:bg-zinc-800/50 rounded-[40%] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-0"
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export { ValuesSection };
