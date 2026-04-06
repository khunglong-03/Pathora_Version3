using Domain.Entities.Translations;
using Domain.Enums;
using Application.Features.Tour.Commands;

namespace Application.Dtos;

public sealed record TourDto
{
    public Guid Id { get; init; } = default;
    public string TourCode { get; init; } = null!;
    public string TourName { get; init; } = null!;
    public string ShortDescription { get; init; } = null!;
    public string LongDescription { get; init; } = null!;
    public TourStatus Status { get; init; } = default;
    public TourScope TourScope { get; init; } = default;
    public CustomerSegment CustomerSegment { get; init; } = default;
    public string? SEOTitle { get; init; }
    public string? SEODescription { get; init; }
    public bool IsDeleted { get; init; }
    public ImageDto Thumbnail { get; init; } = null!;
    public List<ImageDto> Images { get; init; } = [];
    public List<TourClassificationDto> Classifications { get; init; } = [];
    public string? CreatedBy { get; init; }
    public DateTimeOffset CreatedOnUtc { get; init; }
    public string? LastModifiedBy { get; init; }
    public DateTimeOffset? LastModifiedOnUtc { get; init; }
    public Guid? PricingPolicyId { get; init; }
    public Guid? DepositPolicyId { get; init; }
    public Guid? CancellationPolicyId { get; init; }
    public Guid? VisaPolicyId { get; init; }
    public Dictionary<string, TourTranslationData>? Translations { get; init; }
    public List<ServiceDto>? Services { get; init; }
}
