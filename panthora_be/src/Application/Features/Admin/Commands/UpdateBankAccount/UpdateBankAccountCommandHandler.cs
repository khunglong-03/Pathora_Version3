namespace Application.Features.Admin.Commands.UpdateBankAccount;

using Application.Common.Constant;
using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.UnitOfWork;
using ErrorOr;

public sealed class UpdateBankAccountCommandHandler(
    IManagerBankAccountRepository bankAccountRepository,
    IUserRepository userRepository,
    IUnitOfWork unitOfWork)
    : ICommandHandler<UpdateBankAccountCommand, ErrorOr<UserBankAccountDto>>
{
    public async Task<ErrorOr<UserBankAccountDto>> Handle(
        UpdateBankAccountCommand request,
        CancellationToken cancellationToken)
    {
        // Get the default bank account for this manager
        var account = await bankAccountRepository.GetDefaultByUserIdAsync(request.ManagerId, cancellationToken);
        account ??= (await bankAccountRepository.GetByUserIdAsync(request.ManagerId, cancellationToken)).FirstOrDefault();

        if (account is null)
        {
            return Error.NotFound(ErrorConstants.Payment.NoBankAccountCode, ErrorConstants.Payment.NoBankAccountDescription);
        }

        account.BankAccountNumber = request.Request.BankAccountNumber;
        account.BankCode = request.Request.BankCode;
        account.BankAccountName = request.Request.BankAccountName;
        account.LastModifiedOnUtc = DateTimeOffset.UtcNow;

        await unitOfWork.SaveChangeAsync(cancellationToken);

        // Load user info for the DTO
        var user = await userRepository.FindById(request.ManagerId, cancellationToken);

        return new UserBankAccountDto(
            UserId: account.UserId,
            Username: user?.Username ?? string.Empty,
            FullName: user?.FullName,
            Email: user?.Email ?? string.Empty,
            BankAccountNumber: account.BankAccountNumber,
            BankCode: account.BankCode,
            BankAccountName: account.BankAccountName,
            BankAccountVerified: account.IsVerified,
            BankAccountVerifiedAt: account.VerifiedAt
        );
    }
}
