using Application.Common.Constant;
using Application.Contracts.CancellationPolicy;
using Application.Services;
using BuildingBlocks.CORS;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.CancellationPolicy.Queries;

public sealed record GetCancellationPolicyByIdQuery([property: JsonPropertyName("id")] Guid Id) : IQuery<ErrorOr<CancellationPolicyResponse>>;

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
