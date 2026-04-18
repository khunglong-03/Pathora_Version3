export const SUPPORTED_CONTINENT_CODES = [
  "Asia",
  "Europe",
  "Africa",
  "Americas",
  "Oceania",
  "Antarctica",
] as const;

export type SupportedContinentCode = (typeof SUPPORTED_CONTINENT_CODES)[number];

export const CONTINENT_TRANSLATION_KEYS: Record<SupportedContinentCode, string> = {
  Asia: "tourForm.continent.asia",
  Europe: "tourForm.continent.europe",
  Africa: "tourForm.continent.africa",
  Americas: "tourForm.continent.americas",
  Oceania: "tourForm.continent.oceania",
  Antarctica: "tourForm.continent.antarctica",
};
