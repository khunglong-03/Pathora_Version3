using Application.Common;
using Application.Common.Constant;
using Contracts.Interfaces;
using ErrorOr;
using FluentValidation;
using Application.Services;
using BuildingBlocks.CORS;

namespace Application.Features.TourInstance.Commands;

public sealed record ProviderApproveTourInstanceCommand(
    Guid InstanceId,
    bool IsApproved,
    string? Note,
    string ProviderType) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourInstance];
}

public sealed class ProviderApproveTourInstanceCommandValidator : AbstractValidator<ProviderApproveTourInstanceCommand>
{
    public ProviderApproveTourInstanceCommandValidator()
    {
        RuleFor(x => x.InstanceId).NotEmpty();
        RuleFor(x => x.Note).MaximumLength(1000);
        RuleFor(x => x.ProviderType).Must(x => x is "Hotel" or "Transport").WithMessage("ProviderType must be either 'Hotel' or 'Transport'.");
    }
}

public sealed class ProviderApproveTourInstanceCommandHandler(ITourInstanceService tourInstanceService)
    : ICommandHandler<ProviderApproveTourInstanceCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(ProviderApproveTourInstanceCommand request, CancellationToken cancellationToken)
    {
        return await tourInstanceService.ProviderApprove(request.InstanceId, request.IsApproved, request.Note, request.ProviderType, cancellationToken);
    }
}
