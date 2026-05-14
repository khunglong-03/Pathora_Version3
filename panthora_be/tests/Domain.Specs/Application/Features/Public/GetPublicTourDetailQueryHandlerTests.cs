namespace Domain.Specs.Application.Features.Public.Queries;

using global::Application.Dtos;
using global::Application.Features.Public.Queries;
using global::AutoMapper;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using global::Domain.ValueObjects;
using global::NSubstitute;
using global::Xunit;

public sealed class GetPublicTourDetailQueryHandlerTests
{
    private readonly ITourRepository _tourRepository = Substitute.For<ITourRepository>();
    private readonly IDepositPolicyRepository _depositPolicyRepository = Substitute.For<IDepositPolicyRepository>();
    private readonly IPricingPolicyRepository _pricingPolicyRepository = Substitute.For<IPricingPolicyRepository>();
    private readonly IMapper _mapper = Substitute.For<IMapper>();

    [Fact]
    public async Task Handle_IncludesPrivatePricingPolicy_ForPrivateCustomEstimate()
    {
        var tourId = Guid.NewGuid();
        var tour = new TourEntity
        {
            Id = tourId,
            TourCode = "TOUR-001",
            TourName = "Private candidate tour",
            ShortDescription = "Short",
            LongDescription = "Long",
            Status = TourStatus.Active,
            TourScope = TourScope.Domestic,
            IsDeleted = false,
            Thumbnail = new ImageEntity(),
        };
        var policy = new PricingPolicy
        {
            Id = Guid.NewGuid(),
            PolicyCode = "PP-PRIVATE",
            Name = "Private age tiers",
            TourType = TourType.Private,
            Status = PricingPolicyStatus.Active,
            Tiers =
            [
                new PricingPolicyTier { Label = "Adult", AgeFrom = 12, AgeTo = null, PricePercentage = 100 },
                new PricingPolicyTier { Label = "Child", AgeFrom = 2, AgeTo = 11, PricePercentage = 50 },
                new PricingPolicyTier { Label = "Infant", AgeFrom = 0, AgeTo = 1, PricePercentage = 0 },
            ],
        };
        var policyDto = new PricingPolicyDto(policy.Id, policy.PolicyCode, policy.Name, policy.Tiers);

        _tourRepository.FindById(tourId, true, Arg.Any<CancellationToken>()).Returns(tour);
        _depositPolicyRepository.GetAllActiveAsync(Arg.Any<CancellationToken>()).Returns(Array.Empty<DepositPolicyEntity>());
        _pricingPolicyRepository.GetActivePolicyByTourType(TourType.Private, Arg.Any<CancellationToken>()).Returns(policy);
        _mapper.Map<TourDto>(tour).Returns(new TourDto
        {
            Id = tourId,
            TourCode = tour.TourCode,
            TourName = tour.TourName,
            ShortDescription = tour.ShortDescription,
            LongDescription = tour.LongDescription,
            Status = tour.Status,
            TourScope = tour.TourScope,
            Thumbnail = new ImageDto(null, null, null, null),
        });
        _mapper.Map<PricingPolicyDto>(policy).Returns(policyDto);

        var handler = new GetPublicTourDetailQueryHandler(
            _tourRepository,
            _depositPolicyRepository,
            _pricingPolicyRepository,
            _mapper);

        var result = await handler.Handle(new GetPublicTourDetailQuery(tourId, "en"), CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal(policyDto, result.Value.PricingPolicy);
        await _pricingPolicyRepository.Received(1).GetActivePolicyByTourType(TourType.Private, Arg.Any<CancellationToken>());
    }
}
