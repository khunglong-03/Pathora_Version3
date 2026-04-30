using BuildingBlocks.CORS;
using ErrorOr;

namespace Application.Features.BookingManagement.Queries.GetBookingDetail;

public record GetBookingDetailQuery(Guid BookingId) : IQuery<ErrorOr<BookingDetailDto>>;
