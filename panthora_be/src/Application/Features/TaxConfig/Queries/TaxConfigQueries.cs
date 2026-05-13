using Application.Common.Constant;
using Application.Contracts.TaxConfig;
using Application.Services;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.TaxConfig.Queries;

public sealed record GetAllTaxConfigsQuery : IQuery<ErrorOr<IReadOnlyList<TaxConfigResponse>>>;

public sealed class GetAllTaxConfigsQueryHandler(ITaxConfigService taxConfigService)
    : IQueryHandler<GetAllTaxConfigsQuery, ErrorOr<IReadOnlyList<TaxConfigResponse>>>
{
    private readonly ITaxConfigService _taxConfigService = taxConfigService;

    public async Task<ErrorOr<IReadOnlyList<TaxConfigResponse>>> Handle(GetAllTaxConfigsQuery request, CancellationToken cancellationToken)
    {
        return await _taxConfigService.GetAllAsync();
    }
}

public sealed record GetTaxConfigByIdQuery([property: JsonPropertyName("id")] Guid Id) : IQuery<ErrorOr<TaxConfigResponse?>>;

public sealed class GetTaxConfigByIdQueryValidator : AbstractValidator<GetTaxConfigByIdQuery>
{
    public GetTaxConfigByIdQueryValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage(ValidationMessages.TaxConfigIdRequired);
    }
}

public sealed class GetTaxConfigByIdQueryHandler(ITaxConfigService taxConfigService)
    : IQueryHandler<GetTaxConfigByIdQuery, ErrorOr<TaxConfigResponse?>>
{
    private readonly ITaxConfigService _taxConfigService = taxConfigService;

    public async Task<ErrorOr<TaxConfigResponse?>> Handle(GetTaxConfigByIdQuery request, CancellationToken cancellationToken)
    {
        return await _taxConfigService.GetByIdAsync(request.Id);
    }
}

/// <summary>Lấy tax rate của config đang active — dùng cho public endpoints (không cần auth).</summary>
public sealed record GetActiveTaxRateQuery : IQuery<ErrorOr<decimal>>;

public sealed class GetActiveTaxRateQueryHandler(ITaxConfigRepository taxConfigRepository)
    : IQueryHandler<GetActiveTaxRateQuery, ErrorOr<decimal>>
{
    public async Task<ErrorOr<decimal>> Handle(GetActiveTaxRateQuery request, CancellationToken cancellationToken)
    {
        var configs = await taxConfigRepository.GetListAsync(c => c.IsActive, cancellationToken: cancellationToken);
        var active = configs.FirstOrDefault();
        return active is null ? 0m : active.TaxRate;
    }
}
