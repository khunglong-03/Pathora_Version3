using Application.Contracts.CancellationPolicy;
using Application.Services;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using Domain.ValueObjects;
using NSubstitute;

namespace Domain.Specs.Application.Services;

/// <summary>
/// Unit tests for CancellationPolicyService.CalculateRefund() after FK decoupling.
/// Policy resolution now uses scope-based lookup (most-recently-created active policy wins)
/// instead of the removed tour.CancellationPolicyId.
/// </summary>
public sealed class CancellationPolicyServiceTests
{
    private readonly ICancellationPolicyRepository _repository = Substitute.For<ICancellationPolicyRepository>();
    private readonly ITourRepository _tourRepository = Substitute.For<ITourRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();

    private CancellationPolicyService CreateService() => new(_repository, _tourRepository, _unitOfWork);

    private static TourEntity CreateTour(TourScope scope = TourScope.Domestic)
    {
        return TourEntity.Create(
            "Test Tour", "Short", "Long", "system",
            TourStatus.Active, scope);
    }

    private static CancellationPolicyEntity CreatePolicy(
        TourScope scope,
        List<CancellationPolicyTier> tiers,
        DateTimeOffset? createdOnUtc = null,
        bool isDeleted = false)
    {
        var policy = CancellationPolicyEntity.Create(scope, tiers, "system");
        if (createdOnUtc.HasValue)
        {
            policy.CreatedOnUtc = createdOnUtc.Value;
        }
        if (isDeleted)
        {
            policy.SoftDelete("system");
        }
        return policy;
    }

    private static List<CancellationPolicyTier> CreateDefaultTiers() =>
    [
        new CancellationPolicyTier(0, 6, 100),
        new CancellationPolicyTier(7, 13, 50),
        new CancellationPolicyTier(14, int.MaxValue, 0)
    ];

    #region CalculateRefund — Tour not found

    [Fact]
    public async Task CalculateRefund_WhenTourNotFound_ShouldReturnNotFoundError()
    {
        // Arrange
        _tourRepository.FindById(Arg.Any<Guid>()).Returns((TourEntity?)null);
        var request = new CalculateRefundRequest(Guid.CreateVersion7(), DateTimeOffset.UtcNow.AddDays(10), 1000);
        var service = CreateService();

        // Act
        var result = await service.CalculateRefund(request);

        // Assert
        Assert.True(result.IsError);
        Assert.Equal("TOUR_NOT_FOUND", result.Errors[0].Code);
    }

    #endregion

    #region CalculateRefund — No policy for scope → 100% refund

    [Fact]
    public async Task CalculateRefund_WhenNoPolicyForScope_ShouldReturn100PercentRefund()
    {
        // Arrange
        var tour = CreateTour(TourScope.Domestic);
        _tourRepository.FindById(tour.Id).Returns(tour);
        _repository.FindByTourScope(TourScope.Domestic)
            .Returns(new List<CancellationPolicyEntity>());

        var request = new CalculateRefundRequest(tour.Id, DateTimeOffset.UtcNow.AddDays(10), 1000);
        var service = CreateService();

        // Act
        var result = await service.CalculateRefund(request);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(CalculationStatus.NoPolicyAssigned, result.Value.Status);
        Assert.Equal(1000, result.Value.RefundAmount);
        Assert.Equal(0, result.Value.PenaltyAmount);
    }

    #endregion

    #region CalculateRefund — Deleted policies skipped → NoPolicyAssigned

    [Fact]
    public async Task CalculateRefund_WhenAllPoliciesDeleted_ShouldReturnNoPolicyAssigned()
    {
        // Arrange
        var tour = CreateTour(TourScope.Domestic);
        _tourRepository.FindById(tour.Id).Returns(tour);

        var deletedPolicy = CreatePolicy(TourScope.Domestic, CreateDefaultTiers(), isDeleted: true);
        _repository.FindByTourScope(TourScope.Domestic)
            .Returns(new List<CancellationPolicyEntity> { deletedPolicy });

        var request = new CalculateRefundRequest(tour.Id, DateTimeOffset.UtcNow.AddDays(10), 1000);
        var service = CreateService();

        // Act
        var result = await service.CalculateRefund(request);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(CalculationStatus.NoPolicyAssigned, result.Value.Status);
    }

    #endregion

    #region CalculateRefund — Most-recently-created active policy wins

    [Fact]
    public async Task CalculateRefund_WhenMultiplePolicies_ShouldUseMostRecentlyCreated()
    {
        // Arrange
        var tour = CreateTour(TourScope.International);
        _tourRepository.FindById(tour.Id).Returns(tour);

        // Older policy: 0% penalty (full refund for 14+ days)
        var olderPolicy = CreatePolicy(
            TourScope.International,
            [new CancellationPolicyTier(0, int.MaxValue, 0)],
            createdOnUtc: DateTimeOffset.UtcNow.AddDays(-30));

        // Newer policy: 30% penalty for all days
        var newerPolicy = CreatePolicy(
            TourScope.International,
            [new CancellationPolicyTier(0, int.MaxValue, 30)],
            createdOnUtc: DateTimeOffset.UtcNow.AddDays(-1));

        _repository.FindByTourScope(TourScope.International)
            .Returns(new List<CancellationPolicyEntity> { olderPolicy, newerPolicy });

        var request = new CalculateRefundRequest(tour.Id, DateTimeOffset.UtcNow.AddDays(10), 1000);
        var service = CreateService();

        // Act
        var result = await service.CalculateRefund(request);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(CalculationStatus.Calculated, result.Value.Status);
        Assert.Equal(300, result.Value.PenaltyAmount); // 30% of 1000
        Assert.Equal(700, result.Value.RefundAmount);
    }

    #endregion

    #region CalculateRefund — After departure → full penalty

    [Fact]
    public async Task CalculateRefund_WhenAfterDeparture_ShouldReturnFullPenalty()
    {
        // Arrange
        var tour = CreateTour(TourScope.Domestic);
        _tourRepository.FindById(tour.Id).Returns(tour);

        var policy = CreatePolicy(TourScope.Domestic, CreateDefaultTiers());
        _repository.FindByTourScope(TourScope.Domestic)
            .Returns(new List<CancellationPolicyEntity> { policy });

        // Cancellation date is in the past
        var request = new CalculateRefundRequest(tour.Id, DateTimeOffset.UtcNow.AddDays(-1), 1000);
        var service = CreateService();

        // Act
        var result = await service.CalculateRefund(request);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(CalculationStatus.AfterDeparture, result.Value.Status);
        Assert.Equal(0, result.Value.RefundAmount);
        Assert.Equal(1000, result.Value.PenaltyAmount);
    }

    #endregion

    #region CalculateRefund — Tier matched → correct calculation

    [Fact]
    public async Task CalculateRefund_WithMatchingTier_ShouldCalculateCorrectRefund()
    {
        // Arrange
        var tour = CreateTour(TourScope.Domestic);
        _tourRepository.FindById(tour.Id).Returns(tour);

        var policy = CreatePolicy(TourScope.Domestic, CreateDefaultTiers());
        _repository.FindByTourScope(TourScope.Domestic)
            .Returns(new List<CancellationPolicyEntity> { policy });

        // 10 days before departure → 7-13 tier → 50% penalty
        var request = new CalculateRefundRequest(tour.Id, DateTimeOffset.UtcNow.AddDays(10), 2000);
        var service = CreateService();

        // Act
        var result = await service.CalculateRefund(request);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(CalculationStatus.Calculated, result.Value.Status);
        Assert.Equal(1000, result.Value.PenaltyAmount); // 50% of 2000
        Assert.Equal(1000, result.Value.RefundAmount);
    }

    [Fact]
    public async Task CalculateRefund_With14PlusDaysTier_ShouldReturnFullRefund()
    {
        // Arrange
        var tour = CreateTour(TourScope.Domestic);
        _tourRepository.FindById(tour.Id).Returns(tour);

        var policy = CreatePolicy(TourScope.Domestic, CreateDefaultTiers());
        _repository.FindByTourScope(TourScope.Domestic)
            .Returns(new List<CancellationPolicyEntity> { policy });

        // 20 days before departure → 14+ tier → 0% penalty
        var request = new CalculateRefundRequest(tour.Id, DateTimeOffset.UtcNow.AddDays(20), 3000);
        var service = CreateService();

        // Act
        var result = await service.CalculateRefund(request);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(CalculationStatus.Calculated, result.Value.Status);
        Assert.Equal(0, result.Value.PenaltyAmount);
        Assert.Equal(3000, result.Value.RefundAmount);
    }

    #endregion
}
