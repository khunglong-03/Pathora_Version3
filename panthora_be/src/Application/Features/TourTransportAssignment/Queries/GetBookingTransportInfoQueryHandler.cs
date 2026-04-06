namespace Application.Features.TourTransportAssignment.Queries;

using Application.Common.Constant;
using Application.Features.TourTransportAssignment.DTOs;
using Domain.Common.Repositories;
using ErrorOr;
using MediatR;

public sealed class GetBookingTransportInfoQueryHandler(
        ITourDayActivityRouteTransportRepository routeTransportRepository,
        IBookingRepository bookingRepository)
    : IRequestHandler<GetBookingTransportInfoQuery, ErrorOr<BookingTransportInfoDto>>
{
    public async Task<ErrorOr<BookingTransportInfoDto>> Handle(
        GetBookingTransportInfoQuery request,
        CancellationToken cancellationToken)
    {
        var booking = await bookingRepository.GetByIdAsync(request.BookingId);
        if (booking == null)
            return Error.NotFound(ErrorConstants.Booking.NotFoundCode, ErrorConstants.Booking.NotFoundDescription);

        // Verify the current user is the booking owner or has admin/manager role
        // For now, allow access - the controller should handle authorization

        var routeTransports = await routeTransportRepository.FindByBookingIdAsync(request.BookingId, cancellationToken);

        var routes = routeTransports.Select(rt => new TransportInfoDto(
            rt.TourPlanRouteId,
            rt.TourPlanRoute?.Order ?? 0,
            rt.Driver != null
                ? new DriverInfoDto(rt.Driver.FullName, rt.Driver.PhoneNumber, MaskLicense(rt.Driver.LicenseNumber))
                : null,
            rt.Vehicle != null
                ? new VehicleInfoDto(rt.Vehicle.VehiclePlate, rt.Vehicle.VehicleType.ToString(),
                    rt.Vehicle.Brand, rt.Vehicle.Model, rt.Vehicle.SeatCapacity)
                : null)).ToList();

        return new BookingTransportInfoDto(request.BookingId, routes);
    }

    private static string MaskLicense(string? license)
    {
        if (string.IsNullOrEmpty(license) || license.Length < 4)
            return "****";
        return new string('*', Math.Max(0, license.Length - 4)) + license[^4..];
    }
}
