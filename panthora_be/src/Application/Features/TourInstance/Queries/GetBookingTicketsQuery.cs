using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using ErrorOr;

namespace Application.Features.TourInstance.Queries;

public sealed record GetBookingTicketsQuery(Guid ActivityId) : IQuery<ErrorOr<List<BookingTicketDto>>>;

public sealed record BookingTicketDto(
    Guid BookingId,
    string? FlightNumber,
    DateTimeOffset? DepartureAt,
    DateTimeOffset? ArrivalAt,
    string? SeatNumbers,
    string? ETicketNumbers,
    string? SeatClass,
    string? Note);

public sealed class GetBookingTicketsQueryHandler(ITourInstanceBookingTicketRepository ticketRepository)
    : IQueryHandler<GetBookingTicketsQuery, ErrorOr<List<BookingTicketDto>>>
{
    public async Task<ErrorOr<List<BookingTicketDto>>> Handle(GetBookingTicketsQuery request, CancellationToken cancellationToken)
    {
        var tickets = await ticketRepository.GetByActivityIdAsync(request.ActivityId, cancellationToken);
        
        return tickets.Select(t => new BookingTicketDto(
            t.BookingId,
            t.FlightNumber,
            t.DepartureAt,
            t.ArrivalAt,
            t.SeatNumbers,
            t.ETicketNumbers,
            t.SeatClass,
            t.Note
        )).ToList();
    }
}
