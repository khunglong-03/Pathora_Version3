using Application.Contracts.CancellationPolicy;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;

namespace Application.Services;

public interface ICancellationPolicyService
{
    Task<ErrorOr<CancellationPolicyResponse>> Create(CreateCancellationPolicyRequest request);
    Task<ErrorOr<CancellationPolicyResponse>> Update(UpdateCancellationPolicyRequest request);
    Task<ErrorOr<Guid>> Delete(Guid id);
    Task<ErrorOr<IReadOnlyList<CancellationPolicyResponse>>> GetAll();
    Task<ErrorOr<CancellationPolicyResponse>> GetById(Guid id);
    Task<ErrorOr<IReadOnlyList<CancellationPolicyResponse>>> GetByScope(TourScope tourScope);
    Task<ErrorOr<CalculateRefundResponse>> CalculateRefund(CalculateRefundRequest request);
}

public class CancellationPolicyService(
    ICancellationPolicyRepository repository,
    ITourRepository tourRepository,
    IUnitOfWork unitOfWork) : ICancellationPolicyService
{
    private readonly ICancellationPolicyRepository _repository = repository;
    private readonly ITourRepository _tourRepository = tourRepository;
    private readonly IUnitOfWork _unitOfWork = unitOfWork;

    public async Task<ErrorOr<CancellationPolicyResponse>> Create(CreateCancellationPolicyRequest request)
    {
        var validationErrors = ValidateTiers(request.Tiers);
        if (validationErrors.Count > 0)
            return validationErrors;

        var entity = CancellationPolicyEntity.Create(
            request.TourScope,
            request.Tiers,
            "system",
            request.Translations);

        await _repository.Create(entity);
        await _unitOfWork.SaveChangeAsync();

        return ToResponse(entity);
    }

    public async Task<ErrorOr<CancellationPolicyResponse>> Update(UpdateCancellationPolicyRequest request)
    {
        var entity = await _repository.FindById(request.Id);
        if (entity == null)
            return Error.NotFound("POLICY_NOT_FOUND", "Cancellation policy not found");

        var validationErrors = ValidateTiers(request.Tiers);
        if (validationErrors.Count > 0)
            return validationErrors;

        entity.Update(
            request.TourScope,
            request.Tiers,
            request.Status,
            "system");

        if (request.Translations != null)
            entity.Translations = request.Translations;

        await _repository.UpdateAsync(entity);
        await _unitOfWork.SaveChangeAsync();

        return ToResponse(entity);
    }

    public async Task<ErrorOr<Guid>> Delete(Guid id)
    {
        var entity = await _repository.FindById(id);
        if (entity == null)
        {
            return Error.NotFound("POLICY_NOT_FOUND", "Cancellation policy not found");
        }

        entity.SoftDelete("system");
        await _repository.UpdateAsync(entity);
        await _unitOfWork.SaveChangeAsync();

        return entity.Id;
    }

    public async Task<ErrorOr<IReadOnlyList<CancellationPolicyResponse>>> GetAll()
    {
        var entities = await _repository.FindAll();
        return entities.Select(ToResponse).ToList();
    }

    public async Task<ErrorOr<CancellationPolicyResponse>> GetById(Guid id)
    {
        var entity = await _repository.FindById(id);
        if (entity == null)
        {
            return Error.NotFound("POLICY_NOT_FOUND", "Cancellation policy not found");
        }

        return ToResponse(entity);
    }

    public async Task<ErrorOr<IReadOnlyList<CancellationPolicyResponse>>> GetByScope(TourScope tourScope)
    {
        var entities = await _repository.FindByTourScope(tourScope);
        return entities.Select(ToResponse).ToList();
    }

    public async Task<ErrorOr<CalculateRefundResponse>> CalculateRefund(CalculateRefundRequest request)
    {
        // Step 1: Load tour via ITourRepository
        var tour = await _tourRepository.FindById(request.TourId);
        if (tour == null)
            return Error.NotFound("TOUR_NOT_FOUND", "Tour not found");

        // Step 2: If no policy assigned, return 100% refund
        if (tour.CancellationPolicyId == null)
        {
            return new CalculateRefundResponse(
                request.DepositAmount,
                0,
                null,
                null,
                request.DepositAmount,
                0,
                CalculationStatus.NoPolicyAssigned);
        }

        // Step 3: Load policy
        var policy = await _repository.FindById(tour.CancellationPolicyId.Value);
        if (policy == null)
        {
            return new CalculateRefundResponse(
                request.DepositAmount,
                0,
                null,
                null,
                request.DepositAmount,
                0,
                CalculationStatus.NoPolicyAssigned);
        }

        // Step 5: Compute days
        var days = (request.CancellationDate - DateTimeOffset.UtcNow).Days;

        // Step 6: If days < 0, already past cancellation window
        if (days < 0)
        {
            return new CalculateRefundResponse(
                request.DepositAmount,
                days,
                null,
                policy.PolicyCode,
                0,
                request.DepositAmount,
                CalculationStatus.AfterDeparture);
        }

        // Step 7: Find matching tier
        var tier = policy.FindMatchingTier(days);
        if (tier == null)
        {
            return new CalculateRefundResponse(
                request.DepositAmount,
                days,
                null,
                policy.PolicyCode,
                0,
                request.DepositAmount,
                CalculationStatus.NoTierMatch);
        }

        // Step 9: Calculate refund
        var penalty = request.DepositAmount * tier.PenaltyPercentage / 100;
        var refund = request.DepositAmount - penalty;

        return new CalculateRefundResponse(
            request.DepositAmount,
            days,
            tier,
            policy.PolicyCode,
            refund,
            penalty,
            CalculationStatus.Calculated);
    }

    private const int TIER_COVERS_ALL = int.MaxValue;

    private static List<Error> ValidateTiers(List<Domain.ValueObjects.CancellationPolicyTier> tiers)
    {
        var errors = new List<Error>();

        if (tiers == null || tiers.Count == 0)
        {
            errors.Add(Error.Validation("TIERS_REQUIRED", "At least one tier is required"));
            return errors;
        }

        foreach (var tier in tiers)
        {
            if (tier.MinDaysBeforeDeparture < 0)
                errors.Add(Error.Validation("TIER_MIN_DAYS_NEGATIVE", "Min days must be >= 0"));
            if (tier.MaxDaysBeforeDeparture < tier.MinDaysBeforeDeparture)
                errors.Add(Error.Validation("TIER_MAX_LESS_THAN_MIN", "Max days must be >= min days"));
            if (tier.PenaltyPercentage < 0 || tier.PenaltyPercentage > 100)
                errors.Add(Error.Validation("TIER_PENALTY_OUT_OF_RANGE", "Penalty percentage must be between 0 and 100"));
        }

        // Last tier must cover all remaining days (TIER_COVERS_ALL)
        var lastTier = tiers[^1];
        if (lastTier.MaxDaysBeforeDeparture != TIER_COVERS_ALL)
            errors.Add(Error.Validation("TIER_LAST_MUST_COVER_ALL", "Last tier must have MaxDays = int.MaxValue to cover all remaining days"));

        // Tiers must be sorted by MinDays ascending, last tier covers to MaxValue
        // Non-overlapping (sorted by penalty asc) so earlier tiers apply to shorter cancellation windows
        var sorted = tiers.OrderBy(t => t.MinDaysBeforeDeparture).ToList();
        for (var i = 0; i < sorted.Count - 1; i++)
        {
            var current = sorted[i];
            var next = sorted[i + 1];
            // Allow gaps — earlier tier covers the specific window, gap means no rule applies there
            if (current.MaxDaysBeforeDeparture > next.MinDaysBeforeDeparture)
                errors.Add(Error.Validation("TIERS_OVERLAP", $"Tier {i} and {i + 1} have overlapping day ranges"));
        }

        return errors;
    }

    private static CancellationPolicyResponse ToResponse(CancellationPolicyEntity entity) =>
        new(
            entity.Id,
            entity.PolicyCode,
            entity.TourScope,
            entity.TourScope.ToString(),
            entity.Tiers,
            entity.Status,
            entity.Status.ToString(),
            entity.Translations ?? [],
            entity.CreatedOnUtc,
            entity.LastModifiedOnUtc
        );
}
