using Application.Common.Interfaces;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.UnitOfWork;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.Manager.Commands.DeleteManagerBankAccount;
public sealed record DeleteManagerBankAccountCommand([property: JsonPropertyName("accountId")] Guid AccountId)
    : ICommand<ErrorOr<Deleted>>;


public sealed class DeleteManagerBankAccountCommandHandler(
    IManagerBankAccountRepository bankAccountRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser)
    : ICommandHandler<DeleteManagerBankAccountCommand, ErrorOr<Deleted>>
{
    public async Task<ErrorOr<Deleted>> Handle(
        DeleteManagerBankAccountCommand command,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.Id
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var entity = await bankAccountRepository.GetByIdAndUserIdAsync(command.AccountId, userId, cancellationToken);

        if (entity is null)
            return Error.NotFound("ManagerBankAccount.NotFound", "Bank account not found.");

        var wasDefault = entity.IsDefault;

        bankAccountRepository.Remove(entity);

        // If deleted account was default, promote the next one
        if (wasDefault)
        {
            var next = await bankAccountRepository.GetLatestByUserIdAsync(userId, excludeId: entity.Id, ct: cancellationToken);

            if (next is not null)
            {
                next.IsDefault = true;
            }
        }

        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Deleted;
    }
}
