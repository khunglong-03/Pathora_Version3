export interface TourTranslationFormValues {
  tourName: string;
  shortDescription: string;
  longDescription: string;
  seoTitle: string;
  seoDescription: string;
}

export interface TourTranslationsPayload {
  vi: TourTranslationFormValues;
  en?: TourTranslationFormValues;
}

const hasTranslationContent = (value: TourTranslationFormValues) => {
  return (
    value.tourName.trim().length > 0 ||
    value.shortDescription.trim().length > 0 ||
    value.longDescription.trim().length > 0 ||
    value.seoTitle.trim().length > 0 ||
    value.seoDescription.trim().length > 0
  );
};

export const buildTourTranslationsPayload = (
  vietnamese: TourTranslationFormValues,
  english: TourTranslationFormValues,
): TourTranslationsPayload => {
  const payload: TourTranslationsPayload = {
    vi: vietnamese,
  };

  if (hasTranslationContent(english)) {
    payload.en = english;
  }

  return payload;
};
