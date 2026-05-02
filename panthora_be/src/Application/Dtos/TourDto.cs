using Domain.Entities.Translations;
using Domain.Enums;
using Application.Features.Tour.Commands;
using System.Text.Json.Serialization;

namespace Application.Dtos;

public sealed record TourDto
{
    [JsonPropertyName("id")]
    public Guid Id { get; init; } = default;

    [JsonPropertyName("tourCode")]
    public string TourCode { get; init; } = null!;

    [JsonPropertyName("tourName")]
    public string TourName { get; init; } = null!;

    [JsonPropertyName("shortDescription")]
    public string ShortDescription { get; init; } = null!;

    [JsonPropertyName("longDescription")]
    public string LongDescription { get; init; } = null!;

    [JsonPropertyName("status")]
    public TourStatus Status { get; init; } = default;

    [JsonPropertyName("tourScope")]
    public TourScope TourScope { get; init; } = default;

    [JsonPropertyName("isVisa")]
    public bool IsVisa { get; init; }

    [JsonPropertyName("continent")]
    public Continent? Continent { get; init; }

    [JsonPropertyName("customerSegment")]
    public CustomerSegment CustomerSegment { get; init; } = default;

    [JsonPropertyName("seoTitle")]
    public string? SEOTitle { get; init; }

    [JsonPropertyName("seoDescription")]
    public string? SEODescription { get; init; }

    [JsonPropertyName("isDeleted")]
    public bool IsDeleted { get; init; }

    [JsonPropertyName("thumbnail")]
    public ImageDto Thumbnail { get; init; } = null!;

    [JsonPropertyName("images")]
    public List<ImageDto> Images { get; init; } = [];

    [JsonPropertyName("classifications")]
    public List<TourClassificationDto> Classifications { get; init; } = [];

    [JsonPropertyName("createdBy")]
    public string? CreatedBy { get; init; }

    [JsonPropertyName("createdOnUtc")]
    public DateTimeOffset CreatedOnUtc { get; init; }

    [JsonPropertyName("lastModifiedBy")]
    public string? LastModifiedBy { get; init; }

    [JsonPropertyName("lastModifiedOnUtc")]
    public DateTimeOffset? LastModifiedOnUtc { get; init; }

    [JsonPropertyName("translations")]
    public Dictionary<string, TourTranslationData>? Translations { get; init; }

    [JsonPropertyName("includedServices")]
    public List<string> IncludedServices { get; init; } = [];

    [JsonPropertyName("services")]
    public List<ServiceDto>? Services { get; init; }

    [JsonPropertyName("depositPolicy")]
    public DepositPolicyDto? DepositPolicy { get; init; }
}
