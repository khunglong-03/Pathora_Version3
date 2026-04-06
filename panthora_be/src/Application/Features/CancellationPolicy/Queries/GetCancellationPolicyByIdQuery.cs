using Application.Contracts.CancellationPolicy;
using Application.Services;
using BuildingBlocks.CORS;
using Application.Common.Constant;
using ErrorOr;
using FluentValidation;

namespace Application.Features.CancellationPolicy.Queries;

public sealed record GetCancellationPolicyByIdQuery(Guid Id) : IQuery<ErrorOr<CancellationPolicyResponse>>;

public sealed class GetCancellationPolicyByIdQueryValidator : AbstractValidator<GetCancellationPolicyByIdQuery>
{
    public GetCancellationPolicyByIdQueryValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage(ValidationMessages.CancellationPolicyIdRequired);
    }
}

public sealed class GetCancellationPolicyByIdQueryHandler(ICancellationPolicyService service)
    : IQueryHandler<GetCancellationPolicyByIdQuery, ErrorOr<CancellationPolicyResponse>>
{
    public async Task<ErrorOr<CancellationPolicyResponse>> Handle(
        GetCancellationPolicyByIdQuery request,
        CancellationToken cancellationToken)
    {
        return await service.GetById(request.Id);
    }
}
