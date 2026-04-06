const SUPPORTED_LANGUAGES = new Set(["vi", "en"]);
const DEFAULT_LANGUAGE = "en";

export const normalizeLanguageForApi = (language?: string | null): string => {
  if (!language) {
    return DEFAULT_LANGUAGE;
  }

  const normalized = language.toLowerCase().split("-")[0];
  return SUPPORTED_LANGUAGES.has(normalized) ? normalized : DEFAULT_LANGUAGE;
};

export const getCurrentApiLanguage = (preferredLanguage?: string | null) => {
  if (preferredLanguage) {
    return normalizeLanguageForApi(preferredLanguage);
  }

  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  const fromStorage = window.localStorage?.getItem("i18nextLng");
  const fromNavigator = window.navigator?.language;
  return normalizeLanguageForApi(fromStorage ?? fromNavigator);
};
