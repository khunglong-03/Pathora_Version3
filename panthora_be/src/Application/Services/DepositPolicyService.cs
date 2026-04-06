using Application.Contracts.DepositPolicy;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using System.ComponentModel;

namespace Application.Services;

public interface IDepositPolicyService
{
    Task<ErrorOr<IReadOnlyList<DepositPolicyResponse>>> GetAllAsync();
    Task<ErrorOr<DepositPolicyResponse?>> GetByIdAsync(Guid id);
    Task<ErrorOr<Guid>> Create(CreateDepositPolicyRequest request);
    Task<ErrorOr<Success>> Update(UpdateDepositPolicyRequest request);
    Task<ErrorOr<Success>> Delete(Guid id);
}

public class DepositPolicyService(
    IDepositPolicyRepository depositPolicyRepository,
    IUnitOfWork unitOfWork)
    : IDepositPolicyService
{
    private readonly IDepositPolicyRepository _repository = depositPolicyRepository;
    private readonly IUnitOfWork _unitOfWork = unitOfWork;

    public async Task<ErrorOr<IReadOnlyList<DepositPolicyResponse>>> GetAllAsync()
    {
        var policies = await _repository.GetListAsync(x => !x.IsDeleted);
        return policies.Select(MapToResponse).ToList();
    }

    public async Task<ErrorOr<DepositPolicyResponse?>> GetByIdAsync(Guid id)
    {
        var policy = await _repository.GetByIdAsync(id);
        return policy is null ? null : MapToResponse(policy);
    }

    public async Task<ErrorOr<Guid>> Create(CreateDepositPolicyRequest request)
    {
        var policy = DepositPolicyEntity.Create(
            (TourScope)request.TourScope,
            (DepositType)request.DepositType,
            request.DepositValue,
            request.MinDaysBeforeDeparture,
            "system",
            request.Translations
        );

        await _repository.AddAsync(policy);
        await _unitOfWork.SaveChangeAsync();
        return policy.Id;
    }

    public async Task<ErrorOr<Success>> Update(UpdateDepositPolicyRequest request)
    {
        var policy = await _repository.GetByIdAsync(request.Id);
        if (policy is null)
        {
            return Error.NotFound("Deposit policy not found.");
        }

        policy.Update(
            (TourScope)request.TourScope,
            (DepositType)request.DepositType,
            request.DepositValue,
            request.MinDaysBeforeDeparture,
            "system"
        );
        policy.SetActive(request.IsActive, "system");

        // Update translations if provided
        if (request.Translations != null)
        {
            policy.Translations = request.Translations;
        }

        _repository.Update(policy);
        await _unitOfWork.SaveChangeAsync();
        return Result.Success;
    }

    public async Task<ErrorOr<Success>> Delete(Guid id)
    {
        var policy = await _repository.GetByIdAsync(id);
        if (policy is null)
        {
            return Error.NotFound("Deposit policy not found.");
        }

        policy.SoftDelete("system");
        _repository.Update(policy);
        await _unitOfWork.SaveChangeAsync();
        return Result.Success;
    }

    private static DepositPolicyResponse MapToResponse(DepositPolicyEntity entity)
    {
        var tourScopeName = GetEnumDescription(entity.TourScope);
        var depositTypeName = GetEnumDescription(entity.DepositType);

        return new DepositPolicyResponse(
            entity.Id,
            (int)entity.TourScope,
            tourScopeName,
            (int)entity.DepositType,
            depositTypeName,
            entity.DepositValue,
            entity.MinDaysBeforeDeparture,
            entity.IsActive,
            entity.Translations ?? [],
            entity.CreatedOnUtc,
            entity.LastModifiedOnUtc
        );
    }

    private static string GetEnumDescription(Enum value)
    {
        var field = value.GetType().GetField(value.ToString());
        var attribute = field?.GetCustomAttributes(typeof(DescriptionAttribute), false)
            .FirstOrDefault() as DescriptionAttribute;
        return attribute?.Description ?? value.ToString();
    }
}
