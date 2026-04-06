namespace Domain.Entities.Translations;

public static class TranslationResolutionExtensions
{
    private const string DefaultLanguage = "vi";

    public static TourTranslationData ResolveTranslation(this TourEntity entity, string? language)
    {
        var (requested, fallback) = ResolveCandidates(entity.Translations, language);
        return new TourTranslationData
        {
            TourName = requested?.TourName ?? fallback?.TourName ?? entity.TourName,
            ShortDescription = requested?.ShortDescription ?? fallback?.ShortDescription ?? entity.ShortDescription,
            LongDescription = requested?.LongDescription ?? fallback?.LongDescription ?? entity.LongDescription,
            SEOTitle = requested?.SEOTitle ?? fallback?.SEOTitle ?? entity.SEOTitle,
            SEODescription = requested?.SEODescription ?? fallback?.SEODescription ?? entity.SEODescription
        };
    }

    public static TourClassificationTranslationData ResolveTranslation(this TourClassificationEntity entity, string? language)
    {
        var (requested, fallback) = ResolveCandidates(entity.Translations, language);
        return new TourClassificationTranslationData
        {
            Name = requested?.Name ?? fallback?.Name ?? entity.Name,
            Description = requested?.Description ?? fallback?.Description ?? entity.Description
        };
    }

    public static TourDayTranslationData ResolveTranslation(this TourDayEntity entity, string? language)
    {
        var (requested, fallback) = ResolveCandidates(entity.Translations, language);
        return new TourDayTranslationData
        {
            Title = requested?.Title ?? fallback?.Title ?? entity.Title,
            Description = requested?.Description ?? fallback?.Description ?? entity.Description
        };
    }

    public static TourDayActivityTranslationData ResolveTranslation(this TourDayActivityEntity entity, string? language)
    {
        var (requested, fallback) = ResolveCandidates(entity.Translations, language);
        return new TourDayActivityTranslationData
        {
            Title = requested?.Title ?? fallback?.Title ?? entity.Title,
            Description = requested?.Description ?? fallback?.Description ?? entity.Description,
            Note = requested?.Note ?? fallback?.Note ?? entity.Note
        };
    }

    public static TourPlanLocationTranslationData ResolveTranslation(this TourPlanLocationEntity entity, string? language)
    {
        var (requested, fallback) = ResolveCandidates(entity.Translations, language);
        return new TourPlanLocationTranslationData
        {
            LocationName = requested?.LocationName ?? fallback?.LocationName ?? entity.LocationName,
            LocationDescription = requested?.LocationDescription ?? fallback?.LocationDescription ?? entity.LocationDescription,
            Note = requested?.Note ?? fallback?.Note ?? entity.Note
        };
    }

    public static TourPlanAccommodationTranslationData ResolveTranslation(this TourPlanAccommodationEntity entity, string? language)
    {
        var (requested, fallback) = ResolveCandidates(entity.Translations, language);
        return new TourPlanAccommodationTranslationData
        {
            AccommodationName = requested?.AccommodationName ?? fallback?.AccommodationName ?? entity.AccommodationName,
            SpecialRequest = requested?.SpecialRequest ?? fallback?.SpecialRequest ?? entity.SpecialRequest,
            Note = requested?.Note ?? fallback?.Note ?? entity.Note
        };
    }

    public static TourPlanRouteTranslationData ResolveTranslation(this TourPlanRouteEntity entity, string? language)
    {
        var (requested, fallback) = ResolveCandidates(entity.Translations, language);
        return new TourPlanRouteTranslationData
        {
            FromLocationName = requested?.FromLocationName ?? fallback?.FromLocationName ?? string.Empty,
            ToLocationName = requested?.ToLocationName ?? fallback?.ToLocationName ?? string.Empty,
            TransportationType = requested?.TransportationType ?? fallback?.TransportationType,
            TransportationName = requested?.TransportationName ?? fallback?.TransportationName ?? entity.TransportationName,
            TicketInfo = requested?.TicketInfo ?? fallback?.TicketInfo,
            Note = requested?.Note ?? fallback?.Note ?? entity.Note
        };
    }

    public static void ApplyResolvedTranslations(this TourEntity entity, string? language)
    {
        var translated = entity.ResolveTranslation(language);
        entity.TourName = translated.TourName;
        entity.ShortDescription = translated.ShortDescription;
        entity.LongDescription = translated.LongDescription;
        entity.SEOTitle = translated.SEOTitle;
        entity.SEODescription = translated.SEODescription;

        foreach (var classification in entity.Classifications)
        {
            classification.ApplyResolvedTranslation(language);
        }
    }

    public static void ApplyResolvedTranslation(this TourClassificationEntity entity, string? language)
    {
        var translated = entity.ResolveTranslation(language);
        entity.Name = translated.Name;
        entity.Description = translated.Description;

        foreach (var day in entity.Plans)
        {
            day.ApplyResolvedTranslation(language);
        }
    }

    public static void ApplyResolvedTranslation(this TourDayEntity entity, string? language)
    {
        var translated = entity.ResolveTranslation(language);
        entity.Title = translated.Title;
        entity.Description = translated.Description ?? entity.Description;

        foreach (var activity in entity.Activities)
        {
            activity.ApplyResolvedTranslation(language);
        }
    }

    public static void ApplyResolvedTranslation(this TourDayActivityEntity entity, string? language)
    {
        var translated = entity.ResolveTranslation(language);
        entity.Title = translated.Title;
        entity.Description = translated.Description;
        entity.Note = translated.Note;

        foreach (var route in entity.Routes)
        {
            route.ApplyResolvedTranslation(language);
        }

        entity.Accommodation?.ApplyResolvedTranslation(language);
    }

    public static void ApplyResolvedTranslation(this TourPlanLocationEntity entity, string? language)
    {
        var translated = entity.ResolveTranslation(language);
        entity.LocationName = translated.LocationName;
        entity.LocationDescription = translated.LocationDescription;
        entity.Note = translated.Note;
    }

    public static void ApplyResolvedTranslation(this TourPlanAccommodationEntity entity, string? language)
    {
        var translated = entity.ResolveTranslation(language);
        entity.AccommodationName = translated.AccommodationName;
        entity.SpecialRequest = translated.SpecialRequest;
        entity.Note = translated.Note;
    }

    public static void ApplyResolvedTranslation(this TourPlanRouteEntity entity, string? language)
    {
        var translated = entity.ResolveTranslation(language);
        entity.TransportationName = translated.TransportationName;
        entity.Note = translated.Note;
    }

    public static TourInstanceTranslationData ResolveTranslation(this TourInstanceEntity entity, string? language)
    {
        var (requested, fallback) = ResolveCandidates(entity.Translations, language);
        return new TourInstanceTranslationData
        {
            Title = requested?.Title ?? fallback?.Title ?? entity.Title,
            Location = requested?.Location ?? fallback?.Location ?? entity.Location,
            IncludedServices = requested?.IncludedServices ?? fallback?.IncludedServices ?? entity.IncludedServices,
            CancellationReason = requested?.CancellationReason ?? fallback?.CancellationReason ?? entity.CancellationReason
        };
    }

    public static void ApplyResolvedTranslation(this TourInstanceEntity entity, string? language)
    {
        var translated = entity.ResolveTranslation(language);
        entity.Title = translated.Title;
        entity.Location = translated.Location;
        entity.IncludedServices = translated.IncludedServices;
        entity.CancellationReason = translated.CancellationReason;
    }

    private static (TTranslation? Requested, TTranslation? Fallback) ResolveCandidates<TTranslation>(
        Dictionary<string, TTranslation> translations,
        string? language)
        where TTranslation : class
    {
        var normalizedLanguage = NormalizeLanguage(language);
        var requested = TryGetTranslation(translations, normalizedLanguage);
        var fallback = normalizedLanguage == DefaultLanguage
            ? requested
            : TryGetTranslation(translations, DefaultLanguage);

        return (requested, fallback);
    }

    private static string NormalizeLanguage(string? language)
    {
        if (string.IsNullOrWhiteSpace(language))
        {
            return DefaultLanguage;
        }

        var firstToken = language.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault();
        var languageValue = firstToken ?? language;
        var normalized = languageValue.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault() ?? languageValue;
        var languageCode = normalized.Split('-', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault() ?? normalized;

        return languageCode.ToLowerInvariant();
    }

    private static TTranslation? TryGetTranslation<TTranslation>(
        Dictionary<string, TTranslation> translations,
        string languageCode)
        where TTranslation : class
    {
        if (translations.Count == 0)
        {
            return null;
        }

        if (translations.TryGetValue(languageCode, out var exactMatch))
        {
            return exactMatch;
        }

        foreach (var kvp in translations)
        {
            if (string.Equals(kvp.Key, languageCode, StringComparison.OrdinalIgnoreCase))
            {
                return kvp.Value;
            }
        }

        return null;
    }
}
