using Domain.Entities.Translations;

namespace Application.Contracts.VisaPolicy;

public sealed record CreateVisaPolicyRequest(
    string Region,
    int ProcessingDays,
    int BufferDays,
    bool FullPaymentRequired,
    Dictionary<string, VisaPolicyTranslationData>? Translations = null
);

public sealed record UpdateVisaPolicyRequest(
    Guid Id,
    string Region,
    int ProcessingDays,
    int BufferDays,
    bool FullPaymentRequired,
    bool IsActive,
    Dictionary<string, VisaPolicyTranslationData>? Translations = null
);

public sealed record VisaPolicyResponse(
    Guid Id,
    string Region,
    int ProcessingDays,
    int BufferDays,
    bool FullPaymentRequired,
    bool IsActive,
    bool IsDeleted,
    Dictionary<string, VisaPolicyTranslationData> Translations,
    DateTimeOffset CreatedOnUtc,
    DateTimeOffset? LastModifiedOnUtc
);
