using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;

namespace Application.Features.BookingManagement.Queries;

public sealed record GetCustomerRejectedParticipantCountQuery() : IQuery<ErrorOr<int>>;

public sealed class GetCustomerRejectedParticipantCountQueryHandler(
    IUser user,
    IBookingParticipantRepository bookingParticipantRepository)
    : IQueryHandler<GetCustomerRejectedParticipantCountQuery, ErrorOr<int>>
{
    public async Task<ErrorOr<int>> Handle(GetCustomerRejectedParticipantCountQuery request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(user.Id) || !Guid.TryParse(user.Id, out var currentUserId))
        {
            return Error.Unauthorized("Unauthorized", "User is not authenticated.");
        }

        var participants = await bookingParticipantRepository.GetListAsync(
            p => p.Booking.UserId == currentUserId &&
                 p.InfoReviewStatus == ParticipantInfoReviewStatus.Rejected &&
                 p.Status != ReservationStatus.Cancelled &&
                 p.Booking.Status != BookingStatus.Cancelled,
            cancellationToken: cancellationToken);

        return participants.Count;
    }
}
