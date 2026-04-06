using Application.Common.Constant;
using Application.Contracts.PricingPolicy;
using Contracts;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;

namespace Application.Services;

public interface IPricingPolicyService
{
    Task<ErrorOr<List<PricingPolicyResponse>>> GetAll();
    Task<ErrorOr<PricingPolicyResponse>> GetById(Guid id);
    Task<ErrorOr<Guid>> Create(CreatePricingPolicyRequest request);
    Task<ErrorOr<Success>> Update(UpdatePricingPolicyRequest request);
    Task<ErrorOr<Success>> Delete(Guid id);
    Task<ErrorOr<Success>> SetAsDefault(Guid id);
}

public class PricingPolicyService(
    IPricingPolicyRepository pricingPolicyRepository,
    IUnitOfWork unitOfWork) : IPricingPolicyService
{
    private readonly IPricingPolicyRepository _pricingPolicyRepository = pricingPolicyRepository;
    private readonly IUnitOfWork _unitOfWork = unitOfWork;

    public async Task<ErrorOr<List<PricingPolicyResponse>>> GetAll()
    {
        var policies = await _pricingPolicyRepository.FindAll();
        return policies.Select(MapToResponse).ToList();
    }

    public async Task<ErrorOr<PricingPolicyResponse>> GetById(Guid id)
    {
        var policy = await _pricingPolicyRepository.FindById(id);
        if (policy is null)
            return Error.NotFound(ErrorConstants.PricingPolicy.NotFoundCode, ErrorConstants.PricingPolicy.NotFoundDescription);

        return MapToResponse(policy);
    }

    public async Task<ErrorOr<Guid>> Create(CreatePricingPolicyRequest request)
    {
        var policy = PricingPolicy.Create(
            request.Name,
            request.TourType,
            request.Tiers,
            request.IsDefault,
            "system",
            request.Translations);

        if (request.IsDefault)
        {
            await _pricingPolicyRepository.RemoveDefaultFromOthers(policy.Id);
        }

        await _pricingPolicyRepository.Create(policy);
        await _unitOfWork.SaveChangeAsync();
        return policy.Id;
    }

    public async Task<ErrorOr<Success>> Update(UpdatePricingPolicyRequest request)
    {
        var policy = await _pricingPolicyRepository.FindById(request.Id);
        if (policy is null)
            return Error.NotFound(ErrorConstants.PricingPolicy.NotFoundCode, ErrorConstants.PricingPolicy.NotFoundDescription);

        policy.Update(request.Name, request.TourType, request.Tiers, "system");

        if (request.Status.HasValue)
        {
            if (request.Status == Domain.Enums.PricingPolicyStatus.Active)
                policy.Activate("system");
            else
                policy.Deactivate("system");
        }

        // Update translations if provided
        if (request.Translations != null)
        {
            policy.Translations = request.Translations;
        }

        await _pricingPolicyRepository.UpdateAsync(policy);
        await _unitOfWork.SaveChangeAsync();
        return Result.Success;
    }

    public async Task<ErrorOr<Success>> Delete(Guid id)
    {
        var policy = await _pricingPolicyRepository.FindById(id);
        if (policy is null)
            return Error.NotFound(ErrorConstants.PricingPolicy.NotFoundCode, ErrorConstants.PricingPolicy.NotFoundDescription);

        policy.SoftDelete("system");
        await _pricingPolicyRepository.UpdateAsync(policy);
        await _unitOfWork.SaveChangeAsync();
        return Result.Success;
    }

    public async Task<ErrorOr<Success>> SetAsDefault(Guid id)
    {
        var policy = await _pricingPolicyRepository.FindById(id);
        if (policy is null)
            return Error.NotFound(ErrorConstants.PricingPolicy.NotFoundCode, ErrorConstants.PricingPolicy.NotFoundDescription);

        await _pricingPolicyRepository.RemoveDefaultFromOthers(id);
        await _pricingPolicyRepository.SetAsDefault(id);
        await _unitOfWork.SaveChangeAsync();
        return Result.Success;
    }

    private static PricingPolicyResponse MapToResponse(PricingPolicy policy)
    {
        return new PricingPolicyResponse(
            policy.Id,
            policy.PolicyCode,
            policy.Name,
            policy.TourType,
            policy.TourType.ToString(),
            policy.Status,
            policy.Status.ToString(),
            policy.IsDefault,
            policy.Tiers,
            policy.Translations ?? [],
            policy.CreatedOnUtc,
            policy.LastModifiedOnUtc);
    }
}
