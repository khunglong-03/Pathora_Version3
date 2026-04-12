using Application.Common.Interfaces;
using Application.Features.Manager.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.UnitOfWork;
using ErrorOr;

namespace Application.Features.Manager.Commands.UpdateManagerBankAccount;

public sealed class UpdateManagerBankAccountCommandHandler(
    IManagerBankAccountRepository bankAccountRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser)
    : ICommandHandler<UpdateManagerBankAccountCommand, ErrorOr<ManagerBankAccountItemDto>>
{
    public async Task<ErrorOr<ManagerBankAccountItemDto>> Handle(
        UpdateManagerBankAccountCommand command,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.Id
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var entity = await bankAccountRepository.GetByIdAndUserIdAsync(command.AccountId, userId, cancellationToken);

        if (entity is null)
            return Error.NotFound("ManagerBankAccount.NotFound", "Bank account not found.");

        var req = command.Request;

        entity.BankAccountNumber = req.BankAccountNumber;
        entity.BankCode = req.BankCode.ToUpperInvariant();
        entity.BankBin = req.BankBin;
        entity.BankShortName = req.BankShortName;
        entity.BankAccountName = req.BankAccountName;

        // Handle default toggle
        if (req.IsDefault && !entity.IsDefault)
        {
            // Un-default existing default
            var existingDefault = await bankAccountRepository.GetDefaultByUserIdAsync(userId, cancellationToken);

            if (existingDefault is not null && existingDefault.Id != entity.Id)
            {
                existingDefault.IsDefault = false;
            }

            entity.IsDefault = true;
        }
        else if (!req.IsDefault && entity.IsDefault)
        {
            // Cannot un-default the only default; there must always be one
            var otherCount = await bankAccountRepository.CountByUserIdAsync(userId, excludeId: entity.Id, ct: cancellationToken);

            if (otherCount == 0)
            {
                // Keep as default since it's the only account
                entity.IsDefault = true;
            }
            else
            {
                entity.IsDefault = false;
            }
        }

        // Reset verification when account details change
        entity.IsVerified = false;
        entity.VerifiedAt = null;
        entity.VerifiedBy = null;

        await unitOfWork.SaveChangeAsync(cancellationToken);

        return new ManagerBankAccountItemDto(
            entity.Id,
            entity.UserId,
            entity.BankAccountNumber,
            entity.BankCode,
            entity.BankBin,
            entity.BankShortName,
            entity.BankAccountName,
            entity.IsDefault,
            entity.IsVerified,
            entity.VerifiedAt,
            entity.CreatedOnUtc);
    }
}
