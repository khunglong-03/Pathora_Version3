using System.Text.Json.Serialization;

namespace Domain.Entities.Translations;

public sealed class TourTranslationData
{
    [JsonPropertyName("tourName")]
    public string TourName { get; set; } = string.Empty;
    [JsonPropertyName("shortDescription")]
    public string ShortDescription { get; set; } = string.Empty;
    [JsonPropertyName("longDescription")]
    public string LongDescription { get; set; } = string.Empty;
    [JsonPropertyName("seoTitle")]
    public string? SEOTitle { get; set; }
    [JsonPropertyName("seoDescription")]
    public string? SEODescription { get; set; }
}

public sealed class TourClassificationTranslationData
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;
}

public sealed class TourDayTranslationData
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;
    [JsonPropertyName("description")]
    public string? Description { get; set; }
}

public sealed class TourDayActivityTranslationData
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;
    [JsonPropertyName("description")]
    public string? Description { get; set; }
    [JsonPropertyName("note")]
    public string? Note { get; set; }
    [JsonPropertyName("transportationType")]
    public string? TransportationType { get; set; }
    [JsonPropertyName("transportationName")]
    public string? TransportationName { get; set; }
}

public sealed class TourPlanLocationTranslationData
{
    [JsonPropertyName("locationName")]
    public string LocationName { get; set; } = string.Empty;
    [JsonPropertyName("locationDescription")]
    public string? LocationDescription { get; set; }
    [JsonPropertyName("city")]
    public string? City { get; set; }
    [JsonPropertyName("country")]
    public string? Country { get; set; }
    [JsonPropertyName("address")]
    public string? Address { get; set; }
    [JsonPropertyName("note")]
    public string? Note { get; set; }
}

public sealed class TourPlanAccommodationTranslationData
{
    [JsonPropertyName("accommodationName")]
    public string AccommodationName { get; set; } = string.Empty;
    [JsonPropertyName("address")]
    public string? Address { get; set; }
    [JsonPropertyName("specialRequest")]
    public string? SpecialRequest { get; set; }
    [JsonPropertyName("note")]
    public string? Note { get; set; }
}

public sealed class TourPlanRouteTranslationData
{
    [JsonPropertyName("fromLocationName")]
    public string? FromLocationName { get; set; }
    [JsonPropertyName("toLocationName")]
    public string? ToLocationName { get; set; }
    [JsonPropertyName("transportationType")]
    public string? TransportationType { get; set; }
    [JsonPropertyName("transportationName")]
    public string? TransportationName { get; set; }
    [JsonPropertyName("ticketInfo")]
    public string? TicketInfo { get; set; }
    [JsonPropertyName("note")]
    public string? Note { get; set; }
}

public sealed class TourInstanceTranslationData
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;
    [JsonPropertyName("location")]
    public string? Location { get; set; }
    [JsonPropertyName("includedServices")]
    public List<string> IncludedServices { get; set; } = [];
    [JsonPropertyName("cancellationReason")]
    public string? CancellationReason { get; set; }
}

public sealed class TourInstanceDayTranslationData
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;
    [JsonPropertyName("description")]
    public string? Description { get; set; }
    [JsonPropertyName("note")]
    public string? Note { get; set; }
}

public sealed class VisaPolicyTranslationData
{
    [JsonPropertyName("region")]
    public string Region { get; set; } = string.Empty;
    [JsonPropertyName("note")]
    public string? Note { get; set; }
}

public sealed class DepositPolicyTranslationData
{
    [JsonPropertyName("description")]
    public string? Description { get; set; }
}

public sealed class PricingPolicyTranslationData
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
    [JsonPropertyName("description")]
    public string? Description { get; set; }
}

public sealed class CancellationPolicyTranslationData
{
    [JsonPropertyName("description")]
    public string? Description { get; set; }
}

public sealed class TourResourceTranslationData
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
    [JsonPropertyName("description")]
    public string? Description { get; set; }
    [JsonPropertyName("note")]
    public string? Note { get; set; }
    [JsonPropertyName("fromLocationName")]
    public string? FromLocationName { get; set; }
    [JsonPropertyName("toLocationName")]
    public string? ToLocationName { get; set; }
    [JsonPropertyName("transportationName")]
    public string? TransportationName { get; set; }
    [JsonPropertyName("ticketInfo")]
    public string? TicketInfo { get; set; }
}
