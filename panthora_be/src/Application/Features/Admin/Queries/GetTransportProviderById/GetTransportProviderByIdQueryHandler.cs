namespace Application.Features.Admin.Queries.GetTransportProviderById;

using Application.Common.Constant;
using Application.Features.Admin.DTOs;
using Domain.Common.Repositories;
using ErrorOr;
using MediatR;

public sealed class GetTransportProviderByIdQueryHandler(
    IUserRepository userRepository,
    ISupplierRepository supplierRepository,
    IVehicleRepository vehicleRepository,
    IDriverRepository driverRepository)
    : IRequestHandler<GetTransportProviderByIdQuery, ErrorOr<TransportProviderDetailDto>>
{
    public async Task<ErrorOr<TransportProviderDetailDto>> Handle(
        GetTransportProviderByIdQuery request,
        CancellationToken cancellationToken)
    {
        var user = await userRepository.FindTransportProviderByIdAsync(request.Id, cancellationToken);
        if (user is null)
            return Error.NotFound(ErrorConstants.User.NotFoundCode, ErrorConstants.User.NotFoundDescription);

        // Fetch supplier, vehicles, drivers, and booking counts sequentially
        // (DbContext is not thread-safe — parallel queries on the same context throw InvalidOperationException)
        var supplier = await supplierRepository.FindByOwnerUserIdAsync(user.Id);
        var vehicles = await vehicleRepository.FindAllByOwnerIdAsync(user.Id, cancellationToken);
        var drivers = await driverRepository.FindAllByUserIdAsync(user.Id, cancellationToken);
        var (bookingCount, activeBookingCount, completedBookingCount) = await supplierRepository.GetTransportBookingCountsByOwnerAsync(user.Id, cancellationToken);

        var vehicleSummaries = vehicles.Select(v => new VehicleSummaryDto(
            v.Id,
            v.VehiclePlate,
            v.VehicleType.ToString(),
            v.Brand,
            v.Model,
            v.SeatCapacity,
            v.LocationArea?.ToString(),
            v.IsActive,
            v.CreatedOnUtc
        )).ToList();

        var driverSummaries = drivers.Select(d => new DriverSummaryDto(
            d.Id,
            d.FullName,
            d.LicenseNumber,
            d.LicenseType.ToString(),
            d.PhoneNumber,
            d.IsActive
        )).ToList();

        return new TransportProviderDetailDto(
            user.Id,
            supplier?.Name ?? user.FullName ?? string.Empty,
            supplier?.SupplierCode ?? string.Empty,
            supplier?.Address,
            supplier?.Phone,
            supplier?.Email ?? user.Email,
            user.AvatarUrl,
            user.Status,
            user.CreatedOnUtc,
            vehicleSummaries,
            driverSummaries,
            bookingCount,
            activeBookingCount,
            completedBookingCount);
    }
}
