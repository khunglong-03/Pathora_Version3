using Application.Common.Constant;
using Application.Common;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.Commands;

public sealed record DeleteTourInstanceActivityCommand(
    [property: JsonIgnore] Guid InstanceId,
    [property: JsonIgnore] Guid DayId,
    [property: JsonIgnore] Guid ActivityId) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourInstance, $"{CacheKey.TourInstance}:detail:{InstanceId}"];
}

public sealed class DeleteTourInstanceActivityCommandValidator : AbstractValidator<DeleteTourInstanceActivityCommand>
{
    public DeleteTourInstanceActivityCommandValidator()
    {
        RuleFor(x => x.InstanceId).NotEmpty().WithMessage(ValidationMessages.TourInstanceIdRequired);
        RuleFor(x => x.DayId).NotEmpty().WithMessage("Day ID is required.");
        RuleFor(x => x.ActivityId).NotEmpty().WithMessage("Activity ID is required.");
    }
}

public sealed class DeleteTourInstanceActivityCommandHandler(ITourInstanceService tourInstanceService)
    : ICommandHandler<DeleteTourInstanceActivityCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(DeleteTourInstanceActivityCommand request, CancellationToken cancellationToken)
    {
        return await tourInstanceService.DeleteActivity(request);
    }
}
