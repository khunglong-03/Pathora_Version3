using Application.Common.Constant;
using Application.Contracts.DepositPolicy;
using Application.Services;
using BuildingBlocks.CORS;
using ErrorOr;
using FluentValidation;

namespace Application.Features.DepositPolicy.Queries;

public sealed record GetAllDepositPoliciesQuery : IQuery<ErrorOr<IReadOnlyList<DepositPolicyResponse>>>;

public sealed class GetAllDepositPoliciesQueryHandler(IDepositPolicyService depositPolicyService)
    : IQueryHandler<GetAllDepositPoliciesQuery, ErrorOr<IReadOnlyList<DepositPolicyResponse>>>
{
    private readonly IDepositPolicyService _depositPolicyService = depositPolicyService;

    public async Task<ErrorOr<IReadOnlyList<DepositPolicyResponse>>> Handle(GetAllDepositPoliciesQuery request, CancellationToken cancellationToken)
    {
        return await _depositPolicyService.GetAllAsync();
    }
}

public sealed record GetDepositPolicyByIdQuery(Guid Id) : IQuery<ErrorOr<DepositPolicyResponse?>>;

public sealed class GetDepositPolicyByIdQueryValidator : AbstractValidator<GetDepositPolicyByIdQuery>
{
    public GetDepositPolicyByIdQueryValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage(ValidationMessages.DepositPolicyIdRequired);
    }
}

public sealed class GetDepositPolicyByIdQueryHandler(IDepositPolicyService depositPolicyService)
    : IQueryHandler<GetDepositPolicyByIdQuery, ErrorOr<DepositPolicyResponse?>>
{
    private readonly IDepositPolicyService _depositPolicyService = depositPolicyService;

    public async Task<ErrorOr<DepositPolicyResponse?>> Handle(GetDepositPolicyByIdQuery request, CancellationToken cancellationToken)
    {
        return await _depositPolicyService.GetByIdAsync(request.Id);
    }
}
