namespace Application.Features.GuestArrival.Queries.GetGuestArrivalsByHotel;

using Application.Common.Constant;
using Application.Features.GuestArrival.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;

public sealed class GetGuestArrivalsByHotelQueryHandler(
    IGuestArrivalRepository guestArrivalRepository,
    ISupplierRepository supplierRepository)
    : IQueryHandler<GetGuestArrivalsByHotelQuery, ErrorOr<List<GuestArrivalListDto>>>
{
    public async Task<ErrorOr<List<GuestArrivalListDto>>> Handle(
        GetGuestArrivalsByHotelQuery request,
        CancellationToken cancellationToken)
    {
        var supplier = await supplierRepository.GetByIdAsync(request.SupplierId);
        if (supplier is null)
        {
            return Error.NotFound(ErrorConstants.Supplier.NotFoundCode, ErrorConstants.Supplier.NotFoundDescription.En);
        }

        var arrivals = await guestArrivalRepository.GetByHotelAsync(request.SupplierId);

        var filtered = arrivals.Where(a =>
        {
            if (request.Status.HasValue && a.Status != request.Status.Value)
                return false;

            var checkIn = a.BookingAccommodationDetail?.CheckInAt;
            if (!checkIn.HasValue)
                return true;

            var checkInDate = DateOnly.FromDateTime(checkIn.Value.LocalDateTime);
            if (request.DateFrom.HasValue && checkInDate < request.DateFrom.Value)
                return false;

            if (request.DateTo.HasValue && checkInDate > request.DateTo.Value)
                return false;

            return true;
        });

        var result = filtered.Select(a => new GuestArrivalListDto(
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