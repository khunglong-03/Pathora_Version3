namespace Application.Features.Admin.Queries.GetTransportProviderById;

using Application.Common.Constant;
using Application.Features.Admin.DTOs;
using Domain.Common.Repositories;
using Domain.Enums;
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
        Domain.Entities.SupplierEntity? supplier = null;

        if (user is null)
        {
            supplier = await supplierRepository.GetByIdAsync(request.Id, cancellationToken);
            if (supplier is not null && supplier.OwnerUserId.HasValue)
            {
                user = await userRepository.FindTransportProviderByIdAsync(supplier.OwnerUserId.Value, cancellationToken);
            }
        }
        else
        {
            var suppliers = await supplierRepository.FindAllByOwnerUserIdAsync(user.Id, cancellationToken);
            supplier = suppliers.FirstOrDefault();
        }

        if (user is null && supplier is null)
            return Error.NotFound(ErrorConstants.User.NotFoundCode, "Transport provider not found.");

        var targetUserId = user?.Id ?? supplier?.OwnerUserId ?? Guid.Empty;

        var vehicles = targetUserId != Guid.Empty ? await vehicleRepository.FindAllByOwnerIdAsync(targetUserId, cancellationToken) : [];
        var drivers = targetUserId != Guid.Empty ? await driverRepository.FindAllByUserIdAsync(targetUserId, cancellationToken) : [];

        var (bookingCount, activeBookingCount, completedBookingCount) = targetUserId != Guid.Empty
            ? await supplierRepository.GetTransportBookingCountsByOwnerAsync(targetUserId, cancellationToken)
            : (0, 0, 0);

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

        var primaryContinent = supplier?.Continent?.ToString();
        var vehicleContinents = vehicles.Where(v => v.LocationArea.HasValue).Select(v => v.LocationArea!.Value.ToString()).Distinct().ToList();
        var continents = vehicleContinents.Count > 0
            ? vehicleContinents
            : (primaryContinent != null ? [primaryContinent] : []);

        return new TransportProviderDetailDto(
            user?.Id ?? supplier!.Id,
            supplier?.Name ?? user?.FullName ?? string.Empty,
            supplier?.SupplierCode ?? string.Empty,
            supplier?.Address,
            supplier?.Phone,
            supplier?.Email ?? user?.Email,
            user?.AvatarUrl,
            user?.Status ?? UserStatus.Active,
            user?.Id,
            user?.CreatedOnUtc ?? supplier?.CreatedOnUtc,
            primaryContinent,
            continents,
            vehicleSummaries,
            driverSummaries,
            bookingCount,
            activeBookingCount,
            completedBookingCount);
    }
}
