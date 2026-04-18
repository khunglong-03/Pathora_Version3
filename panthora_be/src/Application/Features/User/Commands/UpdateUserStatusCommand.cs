using Application.Common;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using Microsoft.Extensions.Logging;

namespace Application.Features.User.Commands;

public sealed record UpdateUserStatusCommand(
    Guid UserId,
    UserStatus NewStatus) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.User];
}

public sealed class UpdateUserStatusCommandHandler(
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    ILogger<UpdateUserStatusCommandHandler> logger)
    : ICommandHandler<UpdateUserStatusCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(
        UpdateUserStatusCommand request,
        CancellationToken cancellationToken)
    {
        var user = await userRepository.FindById(request.UserId, cancellationToken);
        if (user is null)
        {
            return Error.NotFound("User.NotFound", $"User with ID '{request.UserId}' was not found.");
        }

        var previousStatus = user.Status;
        user.Status = request.NewStatus;
        user.LastModifiedBy = "admin";
        user.LastModifiedOnUtc = DateTimeOffset.UtcNow;

        userRepository.Update(user);

        await unitOfWork.SaveChangeAsync(cancellationToken);

        logger.LogInformation(
            "User {UserId} status changed from {PreviousStatus} to {NewStatus}",
            request.UserId,
            previousStatus,
            request.NewStatus);

        return Result.Success;
    }
}

