using Application.Common.Constant;
using Application.Contracts.TaxConfig;
using Application.Services;
using BuildingBlocks.CORS;
using ErrorOr;
using FluentValidation;

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

public sealed record GetTaxConfigByIdQuery(Guid Id) : IQuery<ErrorOr<TaxConfigResponse?>>;

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
