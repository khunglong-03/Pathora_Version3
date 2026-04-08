namespace Application.Features.TransportProvider.Drivers.Commands;

using Application.Common.Constant;
using Application.Features.TransportProvider.Drivers.DTOs;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using MediatR;

public sealed class CreateDriverCommandHandler(
        IDriverRepository driverRepository,
        Domain.UnitOfWork.IUnitOfWork unitOfWork)
    : IRequestHandler<CreateDriverCommand, ErrorOr<DriverResponseDto>>
{
    public async Task<ErrorOr<DriverResponseDto>> Handle(
        CreateDriverCommand request,
        CancellationToken cancellationToken)
    {
        var driver = DriverEntity.Create(
            request.CurrentUserId,
            request.Request.FullName,
            request.Request.LicenseNumber,
            (DriverLicenseType)request.Request.LicenseType,
            request.Request.PhoneNumber,
            request.CurrentUserId.ToString(),
            request.Request.AvatarUrl,
            request.Request.Notes);

        await driverRepository.CreateAsync(driver, cancellationToken);
        await unitOfWork.SaveChangeAsync(cancellationToken);
        return MapToDto(driver);
    }

    private static DriverResponseDto MapToDto(DriverEntity d) => new(
        d.Id, d.FullName, d.LicenseNumber, d.LicenseType.ToString(),
        d.PhoneNumber, d.AvatarUrl, d.IsActive, d.Notes, d.CreatedOnUtc);
}
