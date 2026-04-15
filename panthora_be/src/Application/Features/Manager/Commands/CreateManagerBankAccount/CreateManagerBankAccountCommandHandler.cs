using Application.Common.Interfaces;
using Application.Features.Manager.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.UnitOfWork;
using ErrorOr;

namespace Application.Features.Manager.Commands.CreateManagerBankAccount;

public sealed class CreateManagerBankAccountCommandHandler(
    IManagerBankAccountRepository bankAccountRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser)
    : ICommandHandler<CreateManagerBankAccountCommand, ErrorOr<ManagerBankAccountItemDto>>
{
    public async Task<ErrorOr<ManagerBankAccountItemDto>> Handle(
        CreateManagerBankAccountCommand command,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.Id
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var req = command.Request;

        // If the new account is default, un-default any existing default
        if (req.IsDefault)
        {
            var existingDefault = await bankAccountRepository.GetDefaultByUserIdAsync(userId, cancellationToken);

            if (existingDefault is not null)
            {
                existingDefault.IsDefault = false;
            }
        }

        // If no accounts exist yet, force this one as default
        var hasAny = await bankAccountRepository.AnyByUserIdAsync(userId, cancellationToken);

        var entity = new ManagerBankAccountEntity
        {
            UserId = userId,
            BankAccountNumber = req.BankAccountNumber,
            BankCode = req.BankCode.ToUpperInvariant(),
            BankBin = req.BankBin,
            BankShortName = req.BankShortName,
            BankAccountName = req.BankAccountName,
            IsDefault = req.IsDefault || !hasAny,
            IsVerified = true,
        };

        await bankAccountRepository.AddAsync(entity, cancellationToken);
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
