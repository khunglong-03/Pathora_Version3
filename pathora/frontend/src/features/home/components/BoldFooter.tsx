"use client";
import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export const BoldFooter = () => {
  const { t } = useTranslation();

  const columns = [
    {
      title: "Pathora",
      links: [
        { label: t("landing.footer.about") || "About", href: "/about" },
        { label: t("landing.footer.tours") || "Tours", href: "/tours" },
        { label: t("landing.footer.blog") || "Blog", href: "#" },
        { label: t("landing.footer.careers") || "Careers", href: "#" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: t("landing.footer.help") || "Help Center", href: "#" },
        { label: t("landing.footer.contact") || "Contact", href: "#" },
        { label: t("landing.footer.faq") || "FAQ", href: "#" },
        { label: t("landing.footer.policies") || "Policies", href: "/policies" },
      ],
    },
    {
      title: t("landing.footer.destinations") || "Destinations",
      links: [
        { label: "Hanoi", href: "/tours?destination=Hanoi" },
        { label: "Ho Chi Minh City", href: "/tours?destination=HCMC" },
        { label: "Da Nang", href: "/tours?destination=DaNang" },
        { label: "Hue", href: "/tours?destination=Hue" },
      ],
    },
  ];

  return (
    <footer className="bg-[#050510] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div>
            <Link href="/home" className="inline-block mb-4">
              <span
                className="text-2xl font-bold text-white"
                style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
              >
                Pathora
              </span>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed mb-6">
              {t("landing.footer.tagline") || "Vietnam's premier travel platform. Discover hidden gems, curated tours, and unforgettable adventures."}
            </p>
            {/* Social */}
            <div className="flex gap-3">
              {["twitter", "facebook", "instagram", "youtube"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#fb8b02] hover:border-[#fb8b02]/30 transition-all"
                >
                  <span className="text-xs capitalize">{social[0]}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-white font-semibold text-sm mb-4">{col.title}</h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-white/40 hover:text-white text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">
              {t("landing.footer.newsletter") || "Stay Updated"}
            </h4>
            <p className="text-white/40 text-sm mb-4">
              {t("landing.footer.newsletterDesc") || "Get the latest travel deals and updates."}
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex gap-2"
            >
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 outline-none focus:border-[#fb8b02]/50 transition-colors"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#fb8b02] text-white text-sm font-semibold rounded-lg hover:bg-[#e67d00] transition-colors"
              >
                →
              </button>
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-sm">
            © {new Date().getFullYear()} Pathora. {t("landing.footer.copyright") || "All rights reserved."}
          </p>
          <div className="flex gap-6 text-white/30 text-sm">
            <a href="#" className="hover:text-white transition-colors">
              {t("landing.footer.privacy") || "Privacy"}
            </a>
            <a href="#" className="hover:text-white transition-colors">
              {t("landing.footer.terms") || "Terms"}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
