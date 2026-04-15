/* ── Image Assets ──────────────────────────────────────────── */
export const HERO_BG = "/images/about/hero_bg.png";
export const WHO_WE_ARE_IMG = "/images/about/who_we_are.png";

/* ── Team Data ─────────────────────────────────────────────── */
export interface TeamMember {
  name: string;
  role: string;
  description: string;
  toursLed: number;
  image: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Le Anh Thu",
    role: "Master Tigress",
    description:
      "Disciplined and fierce leader with unmatched strength and precision.",
    toursLed: 320,
    image: "/images/about/team_tigress.png",
  },
  {
    name: "Phong Thai",
    role: "Master Viper",
    description:
      "Graceful and agile, specializing in fluid movements and elegant techniques.",
    toursLed: 210,
    image: "/images/about/team_viper.png",
  },
  {
    name: "Nguyen The Hieu",
    role: "Master Crane",
    description:
      "Patient and wise, mastering aerial combat with extraordinary balance.",
    toursLed: 185,
    image: "/images/about/team_crane.png",
  },
  {
    name: "Ngo Quoc Huy",
    role: "Master Mantis",
    description:
      "Small but mighty, bringing quick reflexes and surprising power to every challenge.",
    toursLed: 143,
    image: "/images/about/team_mantis.png",
  },
  {
    name: "Gorner Robin",
    role: "Master Monkey",
    description:
      "Playful and energetic, combining humor with incredible acrobatic skills.",
    toursLed: 98,
    image: "/images/about/team_monkey.png",
  },
];

/* ── Timeline Data ─────────────────────────────────────────── */
export interface MilestoneItem {
  year: string;
  titleKey: string;
  descKey: string;
}

export const MILESTONES: MilestoneItem[] = [
  { year: "2010", titleKey: "founded", descKey: "foundedDesc" },
  { year: "2014", titleKey: "first10k", descKey: "first10kDesc" },
  { year: "2018", titleKey: "expanded60", descKey: "expanded60Desc" },
  { year: "2022", titleKey: "digitalFirst", descKey: "digitalFirstDesc" },
  { year: "2025", titleKey: "happy92k", descKey: "happy92kDesc" },
];

/* ── Stats Data ────────────────────────────────────────────── */
export const STATS = [
  {
    icon: "heroicons-outline:map-pin",
    value: "240+",
    labelKey: "destinations",
  },
  {
    icon: "heroicons-outline:users",
    value: "92K+",
    labelKey: "happyTravelers",
  },
  {
    icon: "heroicons-outline:globe-alt",
    value: "3,600+",
    labelKey: "toursOffered",
  },
  {
    icon: "heroicons-outline:heart",
    value: "98%",
    labelKey: "satisfactionRate",
  },
];

/* ── Values Data ───────────────────────────────────────────── */
export const VALUES = [
  {
    icon: "heroicons-outline:globe-alt",
    titleKey: "globalExpertise",
    descKey: "globalExpertiseDesc",
  },
  {
    icon: "heroicons-outline:shield-check",
    titleKey: "safeTrusted",
    descKey: "safeTrustedDesc",
  },
  {
    icon: "heroicons-outline:heart",
    titleKey: "tailoredForYou",
    descKey: "tailoredForYouDesc",
  },
  {
    icon: "heroicons-outline:bolt",
    titleKey: "seamlessExperience",
    descKey: "seamlessExperienceDesc",
  },
];
