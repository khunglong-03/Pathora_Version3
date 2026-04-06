namespace Application.Features.TransportProvider.Drivers.Commands;

using Application.Common.Constant;
using Domain.Common.Repositories;
using ErrorOr;
using MediatR;

public sealed class DeleteDriverCommandHandler(
        IDriverRepository driverRepository)
    : IRequestHandler<DeleteDriverCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(
        DeleteDriverCommand request,
        CancellationToken cancellationToken)
    {
        var driver = await driverRepository.FindByIdAndUserIdAsync(
            request.DriverId, request.CurrentUserId, cancellationToken);

        if (driver is null)
            return Error.NotFound(ErrorConstants.User.NotFoundCode, "Driver not found or you do not own this driver.");

        await driverRepository.DeactivateAsync(driver.Id, request.CurrentUserId.ToString(), cancellationToken);
        return Result.Success;
    }
}
