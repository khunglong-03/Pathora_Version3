using Application.Common.Constant;
using Application.Common;
using Application.Dtos;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.Commands;

public sealed record CreateTourInstanceDayCommand(
    [property: JsonPropertyName("instanceId")] Guid InstanceId,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("actualDate")] DateOnly ActualDate,
    [property: JsonPropertyName("description")] string? Description = null) : ICommand<ErrorOr<Guid>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourInstance, $"{CacheKey.TourInstance}:detail:{InstanceId}"];
}

public sealed class CreateTourInstanceDayCommandValidator : AbstractValidator<CreateTourInstanceDayCommand>
{
    public CreateTourInstanceDayCommandValidator()
    {
        RuleFor(x => x.InstanceId)
            .NotEmpty().WithMessage(ValidationMessages.TourInstanceIdRequired);

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(500).WithMessage("Title must not exceed 500 characters.");

        RuleFor(x => x.ActualDate)
            .NotEmpty().WithMessage("Actual date is required.");
    }
}

public sealed class CreateTourInstanceDayCommandHandler(ITourInstanceService tourInstanceService)
    : ICommandHandler<CreateTourInstanceDayCommand, ErrorOr<Guid>>
{
    public async Task<ErrorOr<Guid>> Handle(CreateTourInstanceDayCommand request, CancellationToken cancellationToken)
    {
        return await tourInstanceService.AddCustomDay(request);
    }
}
