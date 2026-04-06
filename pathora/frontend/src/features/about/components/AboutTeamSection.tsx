"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import Image from "@/features/shared/components/LandingImage";
import { Icon } from "@/components/ui";
import { TEAM_MEMBERS, TeamMember } from "./AboutUsPageData";

const TeamSection = ({ teamMembers = TEAM_MEMBERS }: { teamMembers?: TeamMember[] }) => {
  const { t } = useTranslation();
  return (
    <section className="bg-[#f9fafb] py-16">
      <div className="max-w-[72rem] mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-[1.2px] text-[#fa8b02] mb-2">
            {t("landing.aboutUs.teamSubtitle")}
          </p>
          <h2 className="text-4xl font-bold text-[#05073c]">
            {t("landing.aboutUs.teamTitle")}
          </h2>
        </div>

        {/* Team Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {teamMembers.map((member) => (
            <div
              key={member.name}
              className="bg-white rounded-2xl border border-[#f3f4f6] shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Photo */}
              <div className="h-44 overflow-hidden">
                <Image
                  src={member.image}
                  alt={member.name}
                  width={200}
                  height={176}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Info */}
              <div className="p-4 text-center">
                <h3 className="text-sm font-bold text-[#05073c]">
                  {member.name}
                </h3>
                <p className="text-xs font-semibold text-[#fa8b02] mt-0.5">
                  {member.role}
                </p>
                <p className="text-xs leading-[1.21875rem] text-[#6a7282] mt-3">
                  {member.description}
                </p>
                {/* Tours badge */}
                <div className="mt-4 flex items-center justify-center gap-1.5 bg-[#fff7ed] rounded-[14px] py-1.5 px-3">
                  <Icon
                    icon="heroicons-outline:trophy"
                    className="w-3 h-3 text-[#fa8b02]"
                  />
                  <span className="text-xs font-semibold text-[#fa8b02]">
                    {member.toursLed} {t("landing.aboutUs.toursLed")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export { TeamSection };
