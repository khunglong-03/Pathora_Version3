/* ── Image Assets ──────────────────────────────────────────── */
export const HERO_BG =
  "https://www.figma.com/api/mcp/asset/41ced469-52d1-417a-aae6-f3ba4905b182";
export const WHO_WE_ARE_IMG =
  "https://www.figma.com/api/mcp/asset/dc585a8e-217d-4dde-9bf8-8bce83b11c29";

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
    image:
      "https://www.figma.com/api/mcp/asset/0ea21104-3b97-48ed-b725-d3fcf0ee6486",
  },
  {
    name: "Phong Thai",
    role: "Master Viper",
    description:
      "Graceful and agile, specializing in fluid movements and elegant techniques.",
    toursLed: 210,
    image:
      "https://www.figma.com/api/mcp/asset/a3caa128-9842-4560-81e6-0a73263c6152",
  },
  {
    name: "Nguyen The Hieu",
    role: "Master Crane",
    description:
      "Patient and wise, mastering aerial combat with extraordinary balance.",
    toursLed: 185,
    image:
      "https://www.figma.com/api/mcp/asset/db143d75-3a2b-4cba-9cb2-834ab9468540",
  },
  {
    name: "Ngo Quoc Huy",
    role: "Master Mantis",
    description:
      "Small but mighty, bringing quick reflexes and surprising power to every challenge.",
    toursLed: 143,
    image:
      "https://www.figma.com/api/mcp/asset/8c5b96f4-4b7a-40f9-8c8e-c9bc23b4fdaa",
  },
  {
    name: "Gorner Robin",
    role: "Master Monkey",
    description:
      "Playful and energetic, combining humor with incredible acrobatic skills.",
    toursLed: 98,
    image:
      "https://www.figma.com/api/mcp/asset/691b9bfd-c838-429e-a825-46288f09bdfd",
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
