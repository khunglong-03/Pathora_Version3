using Application.Common.Constant;
using Application.Common;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Enums;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.Tour.Commands;

public sealed record UpdateTourStatusCommand(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("status")] TourStatus Status) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Tour];
}

public sealed class UpdateTourStatusCommandHandler(ITourService tourService)
    : ICommandHandler<UpdateTourStatusCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(UpdateTourStatusCommand request, CancellationToken cancellationToken)
    {
        return await tourService.UpdateStatus(request.Id, request.Status);
    }
}


public sealed class UpdateTourStatusCommandValidator : AbstractValidator<UpdateTourStatusCommand>
{
    public UpdateTourStatusCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage(ValidationMessages.CommonIdRequired);

        RuleFor(x => x.Status)
            .IsInEnum().WithMessage(ValidationMessages.TourStatusInvalid);
    }
}
