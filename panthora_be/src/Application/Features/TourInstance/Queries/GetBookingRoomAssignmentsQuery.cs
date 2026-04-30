using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;

namespace Application.Features.TourInstance.Queries;

public sealed record GetBookingRoomAssignmentsQuery(Guid ActivityId)
    : IQuery<ErrorOr<List<BookingRoomAssignmentDto>>>;

public sealed record BookingRoomAssignmentDto(
    Guid BookingId,
    RoomType RoomType,
    int RoomCount,
    string? RoomNumbers,
    string? Note);

public sealed class GetBookingRoomAssignmentsQueryHandler(
    ITourInstanceBookingRoomAssignmentRepository assignmentRepository)
    : IQueryHandler<GetBookingRoomAssignmentsQuery, ErrorOr<List<BookingRoomAssignmentDto>>>
{
    public async Task<ErrorOr<List<BookingRoomAssignmentDto>>> Handle(GetBookingRoomAssignmentsQuery request, CancellationToken cancellationToken)
    {
        var assignments = await assignmentRepository.GetByActivityIdAsync(request.ActivityId, cancellationToken);
        return assignments.Select(a => new BookingRoomAssignmentDto(
            a.BookingId,
            a.RoomType,
            a.RoomCount,
            a.RoomNumbers,
            a.Note
        )).ToList();
    }
}
