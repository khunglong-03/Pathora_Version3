"use client";
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";
import { STATS } from "./AboutUsPageData";
import { motion, useInView, useSpring, useTransform } from "framer-motion";

const CountUp = ({ to }: { to: number }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const spring = useSpring(0, { stiffness: 50, damping: 20 });
  const display = useTransform(spring, (current) => Math.round(current));
  
  useEffect(() => {
    if (inView) {
      spring.set(to);
    }
  }, [inView, spring, to]);

  return <motion.span ref={ref}>{display}</motion.span>;
};

const StatsBar = ({ stats = STATS }: { stats?: typeof STATS }) => {
  const { t } = useTranslation();
  return (
    <section className="bg-white dark:bg-zinc-950 px-6 lg:px-12 py-16 relative overflow-hidden">
      {/* Background glow motion */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.05, 0.15, 0.05]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[#fa8b02]/10 blur-[120px] pointer-events-none rounded-full"
      />

      <div className="max-w-[1400px] mx-auto relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => {
          // Parse number from value if possible, fallback to string
          const numValue = parseInt(stat.value.replace(/[^0-9]/g, ''), 10);
          const hasSuffix = stat.value.includes('+');
          const hasK = stat.value.includes('K');
          
          return (
            <motion.div
              key={stat.labelKey}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20, delay: i * 0.1 }}
              viewport={{ once: true, margin: "-50px" }}
              className="flex flex-col items-center gap-3 text-center p-8 rounded-[2rem] bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 backdrop-blur-xl relative group hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors duration-500 shadow-xl shadow-zinc-200/40 dark:shadow-none"
            >
              {/* Perpetual status dot */}
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                className="absolute top-6 right-6 w-1.5 h-1.5 rounded-full bg-[#fa8b02]"
              />

              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/5 shadow-inner flex items-center justify-center mb-2 group-hover:-translate-y-1 transition-transform duration-500 ease-out shadow-sm dark:shadow-inner">
                <Icon icon={stat.icon} className="w-6 h-6 text-zinc-500 group-hover:text-[#fa8b02] transition-colors duration-300" />
              </div>
              <p className="text-4xl lg:text-5xl font-extrabold tracking-tighter text-zinc-900 dark:text-white font-mono flex items-baseline">
                {numValue ? <CountUp to={numValue} /> : stat.value}
                {hasK && "K"}
                {hasSuffix && <span className="text-[#fa8b02] ml-1">+</span>}
              </p>
              <p className="text-sm font-semibold text-zinc-500 tracking-wide mt-1">
                {t(`landing.aboutUs.stats.${stat.labelKey}`)}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export { StatsBar };
