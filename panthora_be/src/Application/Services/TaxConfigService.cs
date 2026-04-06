using Application.Contracts.TaxConfig;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.UnitOfWork;
using ErrorOr;

namespace Application.Services;

public interface ITaxConfigService
{
    Task<ErrorOr<IReadOnlyList<TaxConfigResponse>>> GetAllAsync();
    Task<ErrorOr<TaxConfigResponse?>> GetByIdAsync(Guid id);
    Task<ErrorOr<Guid>> Create(CreateTaxConfigRequest request);
    Task<ErrorOr<Success>> Update(UpdateTaxConfigRequest request);
    Task<ErrorOr<Success>> Delete(Guid id);
}

public class TaxConfigService(
    ITaxConfigRepository taxConfigRepository,
    IUnitOfWork unitOfWork)
    : ITaxConfigService
{
    private readonly ITaxConfigRepository _repository = taxConfigRepository;
    private readonly IUnitOfWork _unitOfWork = unitOfWork;

    public async Task<ErrorOr<IReadOnlyList<TaxConfigResponse>>> GetAllAsync()
    {
        var configs = await _repository.GetListAsync();
        return configs.Select(MapToResponse).ToList();
    }

    public async Task<ErrorOr<TaxConfigResponse?>> GetByIdAsync(Guid id)
    {
        var config = await _repository.GetByIdAsync(id);
        return config is null ? null : MapToResponse(config);
    }

    public async Task<ErrorOr<Guid>> Create(CreateTaxConfigRequest request)
    {
        var config = TaxConfigEntity.Create(
            request.TaxName,
            request.TaxRate,
            request.Description,
            request.EffectiveDate,
            "system"
        );

        await _repository.AddAsync(config);
        await _unitOfWork.SaveChangeAsync();
        return config.Id;
    }

    public async Task<ErrorOr<Success>> Update(UpdateTaxConfigRequest request)
    {
        var config = await _repository.GetByIdAsync(request.Id);
        if (config is null)
        {
            return Error.NotFound("Tax configuration not found.");
        }

        config.Update(
            request.TaxName,
            request.TaxRate,
            request.Description,
            request.EffectiveDate,
            "system"
        );
        if (request.IsActive)
            config.Activate("system");
        else
            config.Deactivate("system");

        _repository.Update(config);
        await _unitOfWork.SaveChangeAsync();
        return Result.Success;
    }

    public async Task<ErrorOr<Success>> Delete(Guid id)
    {
        var config = await _repository.GetByIdAsync(id);
        if (config is null)
        {
            return Error.NotFound("Tax configuration not found.");
        }

        _repository.Delete(config);
        await _unitOfWork.SaveChangeAsync();
        return Result.Success;
    }

    private static TaxConfigResponse MapToResponse(TaxConfigEntity entity) => new(
        entity.Id,
        entity.TaxName,
        TaxConfigEntity.GenerateTaxCode(),
        entity.TaxRate,
        entity.Description,
        entity.IsActive,
        entity.EffectiveDate,
        entity.CreatedBy,
        entity.LastModifiedBy,
        entity.CreatedOnUtc,
        entity.LastModifiedOnUtc
    );
}
