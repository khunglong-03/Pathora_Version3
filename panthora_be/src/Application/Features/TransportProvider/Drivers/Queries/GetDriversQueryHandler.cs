namespace Application.Features.TransportProvider.Drivers.Queries;

using Application.Common.Constant;
using Application.Features.TransportProvider.Drivers.DTOs;
using Domain.Common.Repositories;
using ErrorOr;
using MediatR;

public sealed class GetDriversQueryHandler(
        IDriverRepository driverRepository)
    : IRequestHandler<GetDriversQuery, ErrorOr<List<DriverResponseDto>>>
{
    public async Task<ErrorOr<List<DriverResponseDto>>> Handle(
        GetDriversQuery request,
        CancellationToken cancellationToken)
    {
        var drivers = await driverRepository.FindActiveByUserIdAsync(request.CurrentUserId, cancellationToken);
        return drivers.Select(MapToDto).ToList();
    }

    private static DriverResponseDto MapToDto(Domain.Entities.DriverEntity d) => new(
        d.Id, d.FullName, d.LicenseNumber, d.LicenseType.ToString(),
        d.PhoneNumber, d.AvatarUrl, d.IsActive, d.Notes, d.CreatedOnUtc);
}

public sealed class GetDriverByIdQueryHandler(
        IDriverRepository driverRepository)
    : IRequestHandler<GetDriverByIdQuery, ErrorOr<DriverResponseDto>>
{
    public async Task<ErrorOr<DriverResponseDto>> Handle(
        GetDriverByIdQuery request,
        CancellationToken cancellationToken)
    {
        var driver = await driverRepository.FindByIdAndUserIdAsync(
            request.DriverId, request.CurrentUserId, cancellationToken);

        if (driver is null)
            return Error.NotFound(ErrorConstants.User.NotFoundCode, "Resource not found.");

        return MapToDto(driver);
    }

    private static DriverResponseDto MapToDto(Domain.Entities.DriverEntity d) => new(
        d.Id, d.FullName, d.LicenseNumber, d.LicenseType.ToString(),
        d.PhoneNumber, d.AvatarUrl, d.IsActive, d.Notes, d.CreatedOnUtc);
}
