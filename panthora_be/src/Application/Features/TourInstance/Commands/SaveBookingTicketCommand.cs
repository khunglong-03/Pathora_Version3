using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using ErrorOr;
using FluentValidation;
using Microsoft.Extensions.Logging;

namespace Application.Features.TourInstance.Commands;

public sealed record SaveBookingTicketCommand(
    Guid TourInstanceId,
    Guid ActivityId,
    Guid BookingId,
    string? FlightNumber,
    DateTimeOffset? DepartureAt,
    DateTimeOffset? ArrivalAt,
    string? SeatNumbers,
    string? ETicketNumbers,
    string? SeatClass,
    string? Note) : ICommand<ErrorOr<Success>>;

public sealed class SaveBookingTicketCommandValidator : AbstractValidator<SaveBookingTicketCommand>
{
    public SaveBookingTicketCommandValidator()
    {
        RuleFor(x => x.TourInstanceId).NotEmpty();
        RuleFor(x => x.ActivityId).NotEmpty();
        RuleFor(x => x.BookingId).NotEmpty();
        RuleFor(x => x.FlightNumber).MaximumLength(100);
        RuleFor(x => x.SeatNumbers).MaximumLength(500);
        RuleFor(x => x.ETicketNumbers).MaximumLength(500);
        RuleFor(x => x.SeatClass).MaximumLength(100);
        RuleFor(x => x.Note).MaximumLength(1000);
    }
}

public sealed class SaveBookingTicketCommandHandler(
    ITourInstanceBookingTicketRepository ticketRepository,
    ITourInstanceRepository instanceRepository,
    IUser user,
    Domain.UnitOfWork.IUnitOfWork unitOfWork,
    Microsoft.Extensions.Logging.ILogger<SaveBookingTicketCommandHandler> logger)
    : ICommandHandler<SaveBookingTicketCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(SaveBookingTicketCommand request, CancellationToken cancellationToken)
    {
        var activity = await instanceRepository.FindActivityByIdAsync(request.ActivityId, asNoTracking: false, cancellationToken);
        if (activity == null || activity.TourInstanceDay.TourInstanceId != request.TourInstanceId)
        {
            logger.LogWarning("SaveBookingTicket failed: Activity {ActivityId} not found or mismatched with TourInstanceId {TourInstanceId}", request.ActivityId, request.TourInstanceId);
            return Error.NotFound("TourInstance.ActivityNotFound", "Activity not found");
        }

        logger.LogInformation("Processing SaveBookingTicketCommand payload: {@Payload}", request);

        var existingTicket = await ticketRepository.GetByActivityAndBookingAsync(request.ActivityId, request.BookingId, cancellationToken);

        var utcDepartureAt = request.DepartureAt?.ToUniversalTime();
        var utcArrivalAt = request.ArrivalAt?.ToUniversalTime();

        if (existingTicket == null)
        {
            var newTicket = TourInstanceBookingTicketEntity.Create(
                request.ActivityId,
                request.BookingId,
                request.FlightNumber,
                utcDepartureAt,
                utcArrivalAt,
                request.SeatNumbers,
                request.ETicketNumbers,
                request.SeatClass,
                request.Note,
                user.Id ?? "SYSTEM");
            
            await ticketRepository.AddAsync(newTicket);
        }
        else
        {
            logger.LogInformation("Updating existing ticket for Activity {ActivityId} and Booking {BookingId}", request.ActivityId, request.BookingId);
            existingTicket.Update(
                request.FlightNumber,
                utcDepartureAt,
                utcArrivalAt,
                request.SeatNumbers,
                request.ETicketNumbers,
                request.SeatClass,
                request.Note,
                user.Id ?? "SYSTEM");
        }

        // Sync the common transport details back to the activity entity
        // This is required so that ConfirmExternalTransport has the DepartureTime and ArrivalTime.
        if (utcDepartureAt.HasValue) activity.DepartureTime = utcDepartureAt;
        if (utcArrivalAt.HasValue) activity.ArrivalTime = utcArrivalAt;
        if (!string.IsNullOrWhiteSpace(request.FlightNumber)) activity.ExternalTransportReference = request.FlightNumber;

        var savedCount = await unitOfWork.SaveChangeAsync(cancellationToken);
        logger.LogInformation("SaveChangeAsync completed. Changes saved: {Count}", savedCount);
        return Result.Success;
    }
}
