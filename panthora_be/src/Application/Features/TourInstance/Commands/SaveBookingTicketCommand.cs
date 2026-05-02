using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using ErrorOr;
using FluentValidation;

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
    Domain.UnitOfWork.IUnitOfWork unitOfWork)
    : ICommandHandler<SaveBookingTicketCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(SaveBookingTicketCommand request, CancellationToken cancellationToken)
    {
        var activity = await instanceRepository.FindActivityByIdAsync(request.ActivityId, cancellationToken);
        if (activity == null || activity.TourInstanceDay.TourInstanceId != request.TourInstanceId)
        {
            return Error.NotFound("TourInstance.ActivityNotFound", "Activity not found");
        }

        var existingTicket = await ticketRepository.GetByActivityAndBookingAsync(request.ActivityId, request.BookingId, cancellationToken);

        if (existingTicket == null)
        {
            var newTicket = TourInstanceBookingTicketEntity.Create(
                request.ActivityId,
                request.BookingId,
                request.FlightNumber,
                request.DepartureAt,
                request.ArrivalAt,
                request.SeatNumbers,
                request.ETicketNumbers,
                request.SeatClass,
                request.Note,
                user.Id ?? "SYSTEM");
            
            await ticketRepository.AddAsync(newTicket);
        }
        else
        {
            existingTicket.Update(
                request.FlightNumber,
                request.DepartureAt,
                request.ArrivalAt,
                request.SeatNumbers,
                request.ETicketNumbers,
                request.SeatClass,
                request.Note,
                user.Id ?? "SYSTEM");
        }

        await unitOfWork.SaveChangeAsync(cancellationToken);
        return Result.Success;
    }
}
