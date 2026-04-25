namespace Application.Features.TransportProvider.Drivers.Commands;

using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record DeleteDriverCommand(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("driverId")] Guid DriverId) : ICommand<ErrorOr<Success>>;

public sealed class DeleteDriverCommandHandler(
        Domain.Common.Repositories.IDriverRepository driverRepository)
    : MediatR.IRequestHandler<DeleteDriverCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(
        DeleteDriverCommand request,
        CancellationToken cancellationToken)
    {
        var driver = await driverRepository.FindByIdAndUserIdAsync(
            request.DriverId, request.CurrentUserId, cancellationToken);

        if (driver is null)
            return Error.NotFound(Application.Common.Constant.ErrorConstants.User.NotFoundCode, "Resource not found.");

        await driverRepository.DeactivateAsync(driver.Id, request.CurrentUserId.ToString(), cancellationToken);
        return Result.Success;
    }
}
