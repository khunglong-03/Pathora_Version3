using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using MediatR;
using System.Text.Json.Serialization;

namespace Application.Features.VisaApplication.Commands;

// Create
public sealed record CreateVisaApplicationCommand(
    [property: JsonPropertyName("bookingParticipantId")] Guid BookingParticipantId,
    [property: JsonPropertyName("passportId")] Guid PassportId,
    [property: JsonPropertyName("destinationCountry")] string DestinationCountry,
    [property: JsonPropertyName("minReturnDate")] DateTimeOffset? MinReturnDate = null,
    [property: JsonPropertyName("visaFileUrl")] string? VisaFileUrl = null) : ICommand<ErrorOr<Guid>>;

public sealed class CreateVisaApplicationCommandValidator : AbstractValidator<CreateVisaApplicationCommand>
{
    public CreateVisaApplicationCommandValidator()
    {
        RuleFor(x => x.BookingParticipantId).NotEmpty();
        RuleFor(x => x.PassportId).NotEmpty();
        RuleFor(x => x.DestinationCountry).NotEmpty().MaximumLength(100);
    }
}

public sealed class CreateVisaApplicationCommandHandler(
    IVisaApplicationRepository repository,
    IUnitOfWork unitOfWork)
    : IRequestHandler<CreateVisaApplicationCommand, ErrorOr<Guid>>
{
    public async Task<ErrorOr<Guid>> Handle(CreateVisaApplicationCommand request, CancellationToken cancellationToken)
    {
        var entity = VisaApplicationEntity.Create(
            request.BookingParticipantId,
            request.PassportId,
            request.DestinationCountry,
            "system",
            request.MinReturnDate,
            request.VisaFileUrl
        );

        await repository.AddAsync(entity);
        await unitOfWork.SaveChangeAsync();
        return entity.Id;
    }
}

// UpdateStatus
public sealed record UpdateVisaApplicationStatusCommand(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("status")] VisaStatus Status,
    [property: JsonPropertyName("refusalReason")] string? RefusalReason = null,
    [property: JsonPropertyName("visaFileUrl")] string? VisaFileUrl = null) : ICommand<ErrorOr<Success>>;

public sealed class UpdateVisaApplicationStatusCommandValidator : AbstractValidator<UpdateVisaApplicationStatusCommand>
{
    public UpdateVisaApplicationStatusCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Status).IsInEnum();
    }
}

public sealed class UpdateVisaApplicationStatusCommandHandler(
    IVisaApplicationRepository repository,
    IUnitOfWork unitOfWork)
    : IRequestHandler<UpdateVisaApplicationStatusCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(UpdateVisaApplicationStatusCommand request, CancellationToken cancellationToken)
    {
        var entity = await repository.GetByIdAsync(request.Id);
        if (entity is null)
            return Error.NotFound("Visa application not found.");

        entity.Update(
            entity.DestinationCountry,
            "system",
            request.Status,
            entity.MinReturnDate,
            request.RefusalReason,
            request.VisaFileUrl
        );

        repository.Update(entity);
        await unitOfWork.SaveChangeAsync();
        return Result.Success;
    }
}
