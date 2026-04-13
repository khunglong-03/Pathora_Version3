import i18n, { InitOptions } from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslations from "./locales/en.json";
import viTranslations from "./locales/vi.json";

const SUPPORTED_LANGUAGES = ["en", "vi"] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
const DEFAULT_LANGUAGE: SupportedLanguage = "en";

const normalizeLanguageCode = (value?: string): SupportedLanguage => {
  if (!value) return DEFAULT_LANGUAGE;
  const normalized = value.toLowerCase().split("-")[0];
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(normalized)
    ? (normalized as SupportedLanguage)
    : DEFAULT_LANGUAGE;
};

const getLanguageFromCookie = (): SupportedLanguage => {
  // Always return DEFAULT_LANGUAGE initially to ensure SSR matches the first Client render
  // and prevent React hydration mismatches. The actual preferred language is applied 
  // inside AppProviders.tsx after the component mounts.
  return DEFAULT_LANGUAGE;
};

const resources = {
  en: {
    translation: enTranslations,
  },
  vi: {
    translation: viTranslations,
  },
} as const;

const i18nConfig: InitOptions = {
  resources,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: [...SUPPORTED_LANGUAGES],
  nonExplicitSupportedLngs: true,
  load: "languageOnly",
  debug: false,
  interpolation: {
    escapeValue: false,
  },
  // NOTE: `lng` is injected below at init time from the middleware cookie.
};

const syncHtmlLanguage = (language: string) => {
  if (typeof document === "undefined") return;
  document.documentElement.lang = normalizeLanguageCode(language);
};
const mergeResources = () => {
  SUPPORTED_LANGUAGES.forEach((language) => {
    i18n.addResourceBundle(
      language,
      "translation",
      resources[language].translation,
      true,
      true,
    );
  });
};
const handleLanguageChanged = (language: string) => {
  const normalizedLanguage = normalizeLanguageCode(language);
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    console.debug("[i18n] languageChanged", {
      language,
      normalizedLanguage,
      beforeStorage: window.localStorage.getItem("i18nextLng"),
    });
  }
  syncHtmlLanguage(normalizedLanguage);
  if (typeof window !== "undefined") {
    localStorage.setItem("i18nextLng", normalizedLanguage);
  }
};

// Detect language from the cookie (set by middleware) to match SSR.
const detectedLanguage = getLanguageFromCookie();

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({ ...i18nConfig, lng: detectedLanguage });
} else {
  // In dev HMR, i18n instance may stay alive with stale resources.
  mergeResources();
  const normalizedLanguage = normalizeLanguageCode(
    i18n.resolvedLanguage || i18n.language,
  );
  if (normalizedLanguage !== i18n.language) {
    i18n.changeLanguage(normalizedLanguage);
  }
}

syncHtmlLanguage(i18n.language || "en");
i18n.off("languageChanged", handleLanguageChanged);
i18n.on("languageChanged", handleLanguageChanged);

export default i18n;
