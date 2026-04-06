namespace Application.Features.GuestArrival.Queries.GetGuestArrivalsByHotel;

using Application.Common.Constant;
using Application.Features.GuestArrival.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using ErrorOr;

public sealed class GetGuestArrivalsByHotelQueryHandler(
    IGuestArrivalRepository guestArrivalRepository,
    ISupplierRepository supplierRepository)
    : IQueryHandler<GetGuestArrivalsByHotelQuery, ErrorOr<List<GuestArrivalListDto>>>
{
    public async Task<ErrorOr<List<GuestArrivalListDto>>> Handle(
        GetGuestArrivalsByHotelQuery request, CancellationToken cancellationToken)
    {
        var supplier = await supplierRepository.GetByIdAsync(request.SupplierId);
        if (supplier is null)
        {
            return Error.NotFound("Supplier.NotFound", "Supplier not found.");
        }

        var arrivals = await guestArrivalRepository.GetByHotelAsync(request.SupplierId);

        var result = arrivals.Select(a => new GuestArrivalListDto(
            a.Id,
            a.BookingAccommodationDetailId,
            a.BookingAccommodationDetail?.AccommodationName,
            a.Status,
            a.BookingAccommodationDetail?.CheckInAt,
            a.BookingAccommodationDetail?.CheckOutAt,
            a.Participants.Count,
            a.SubmittedAt,
            a.SubmissionStatus)).ToList();

        return result;
    }
}
