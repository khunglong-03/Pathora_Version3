"use client";
import React from "react";
import { HeroBanner } from "./AboutHeroBanner";
import { StatsBar } from "./AboutStatsBar";
import { WhoWeAreSection } from "./AboutWhoWeAre";
import { ValuesSection } from "./AboutValuesSection";
import { TimelineSection } from "./AboutTimelineSection";
import { TeamSection } from "./AboutTeamSection";
import { CTABanner } from "./AboutCTABanner";
import { FloatingButtons } from "./AboutFloatingButtons";
import { LandingHeader } from "@/features/shared/components/LandingHeader";
import { LandingFooter } from "@/features/shared/components/LandingFooter";
import { useSiteContent } from "@/hooks/useSiteContent";
import {
  TEAM_MEMBERS,
  MILESTONES,
  STATS,
  VALUES,
  TeamMember,
  MilestoneItem,
} from "./AboutUsPageData";

/* ═══════════════════════════════════════════════════════════ */
/*  Main About Us Page with Dynamic Content                    */
/* ═══════════════════════════════════════════════════════════ */
export const AboutUsPage = () => {
  const { content, loading, error } = useSiteContent("about");

  // Parse dynamic content or use fallback to static data
  const teamMembers = (content?.["team-members"] as TeamMember[] | undefined) || TEAM_MEMBERS;
  const milestones = (content?.["milestones"] as MilestoneItem[] | undefined) || MILESTONES;
  const stats = (content?.["stats"] as typeof STATS | undefined) || STATS;
  const values = (content?.["values"] as typeof VALUES | undefined) || VALUES;

  if (error) {
    console.warn("Failed to load dynamic about content, using static fallback:", error);
  }

  void loading; // suppress unused warning if needed

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-screen overflow-x-hidden">
      {/* Header + Hero */}
      <div className="relative">
        <LandingHeader />
        <HeroBanner />
      </div>

      {/* Stats */}
      <StatsBar stats={stats} />

      {/* Who We Are */}
      <WhoWeAreSection />

      {/* Values */}
      <ValuesSection values={values} />

      {/* Timeline */}
      <TimelineSection milestones={milestones} />

      {/* Team */}
      <TeamSection teamMembers={teamMembers} />

      {/* CTA */}
      <CTABanner />

      {/* Floating Buttons */}
      <FloatingButtons />

      {/* Footer */}
      <LandingFooter />
    </main>
  );
};

export default AboutUsPage;
