using Application.Common.Constant;
using Application.Contracts.VisaPolicy;
using Application.Services;
using BuildingBlocks.CORS;
using ErrorOr;
using FluentValidation;

namespace Application.Features.VisaPolicy.Queries;

public sealed record GetAllVisaPoliciesQuery : IQuery<ErrorOr<IReadOnlyList<VisaPolicyResponse>>>;

public sealed class GetAllVisaPoliciesQueryHandler(IVisaPolicyService visaPolicyService)
    : IQueryHandler<GetAllVisaPoliciesQuery, ErrorOr<IReadOnlyList<VisaPolicyResponse>>>
{
    private readonly IVisaPolicyService _visaPolicyService = visaPolicyService;

    public async Task<ErrorOr<IReadOnlyList<VisaPolicyResponse>>> Handle(GetAllVisaPoliciesQuery request, CancellationToken cancellationToken)
    {
        return await _visaPolicyService.GetAllAsync();
    }
}

public sealed record GetVisaPolicyByIdQuery(Guid Id) : IQuery<ErrorOr<VisaPolicyResponse?>>;

public sealed class GetVisaPolicyByIdQueryValidator : AbstractValidator<GetVisaPolicyByIdQuery>
{
    public GetVisaPolicyByIdQueryValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage(ValidationMessages.VisaPolicyIdRequired);
    }
}

public sealed class GetVisaPolicyByIdQueryHandler(IVisaPolicyService visaPolicyService)
    : IQueryHandler<GetVisaPolicyByIdQuery, ErrorOr<VisaPolicyResponse?>>
{
    private readonly IVisaPolicyService _visaPolicyService = visaPolicyService;

    public async Task<ErrorOr<VisaPolicyResponse?>> Handle(GetVisaPolicyByIdQuery request, CancellationToken cancellationToken)
    {
        return await _visaPolicyService.GetByIdAsync(request.Id);
    }
}
