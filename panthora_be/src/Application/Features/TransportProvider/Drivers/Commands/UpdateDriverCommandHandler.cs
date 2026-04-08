namespace Application.Features.TransportProvider.Drivers.Commands;

using Application.Common.Constant;
using Application.Features.TransportProvider.Drivers.DTOs;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using MediatR;

public sealed class UpdateDriverCommandHandler(
        IDriverRepository driverRepository)
    : IRequestHandler<UpdateDriverCommand, ErrorOr<DriverResponseDto>>
{
    public async Task<ErrorOr<DriverResponseDto>> Handle(
        UpdateDriverCommand request,
        CancellationToken cancellationToken)
    {
        var driver = await driverRepository.FindByIdAndUserIdAsync(
            request.DriverId, request.CurrentUserId, cancellationToken);

        if (driver is null)
            return Error.NotFound(ErrorConstants.User.NotFoundCode, "Resource not found.");

        driver.Update(
            request.Request.FullName,
            request.Request.LicenseNumber,
            request.Request.LicenseType.HasValue ? (DriverLicenseType)request.Request.LicenseType.Value : null,
            request.Request.PhoneNumber,
            request.Request.AvatarUrl,
            request.Request.Notes,
            request.CurrentUserId.ToString());

        await driverRepository.UpdateAsync(driver, cancellationToken);
        return MapToDto(driver);
    }

    private static DriverResponseDto MapToDto(Domain.Entities.DriverEntity d) => new(
        d.Id, d.FullName, d.LicenseNumber, d.LicenseType.ToString(),
        d.PhoneNumber, d.AvatarUrl, d.IsActive, d.Notes, d.CreatedOnUtc);
}
