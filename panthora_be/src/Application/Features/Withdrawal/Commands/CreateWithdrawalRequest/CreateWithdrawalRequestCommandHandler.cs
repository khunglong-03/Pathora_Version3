using Application.Common.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.UnitOfWork;
using ErrorOr;
using MediatR;

namespace Application.Features.Withdrawal.Commands.CreateWithdrawalRequest;

public sealed class CreateWithdrawalRequestCommandHandler(
    ICurrentUser currentUser,
    IManagerBankAccountRepository managerBankAccountRepository,
    IUserRepository userRepository,
    IWithdrawalRequestRepository withdrawalRequestRepository,
    ITransactionHistoryRepository transactionHistoryRepository,
    IUnitOfWork unitOfWork) : IRequestHandler<CreateWithdrawalRequestCommand, ErrorOr<Guid>>
{
    public async Task<ErrorOr<Guid>> Handle(CreateWithdrawalRequestCommand request, CancellationToken cancellationToken)
    {
        if (currentUser.Id is not { } userId)
        {
            return Error.Unauthorized();
        }

        var bankAccount = await managerBankAccountRepository.GetByIdAndUserIdAsync(request.BankAccountId, userId, cancellationToken);
        if (bankAccount is null)
        {
            return Error.Forbidden("Withdrawal.Forbidden", "Bank account not found or does not belong to the user.");
        }

        var user = await userRepository.FindById(userId, cancellationToken);
        if (user is null)
        {
            return Error.NotFound("Withdrawal.UserNotFound", "User not found.");
        }

        if (request.Amount < 100_000m || request.Amount > 10_000_000m)
        {
            return Error.Validation("Withdrawal.InvalidAmount", "Amount must be between 100,000 and 10,000,000 VND.");
        }

        if (user.Balance < request.Amount)
        {
            return Error.Validation("Withdrawal.InsufficientBalance", "Insufficient balance.");
        }

        user.DebitBalance(request.Amount);

        var withdrawalRequest = WithdrawalRequestEntity.Create(
            userId,
            bankAccount.Id,
            request.Amount,
            bankAccount.BankAccountNumber,
            bankAccount.BankCode,
            bankAccount.BankBin,
            bankAccount.BankShortName,
            bankAccount.BankAccountName);

        await withdrawalRequestRepository.AddAsync(withdrawalRequest, cancellationToken);

        var performedBy = user.FullName ?? user.Username;

        var transactionHistory = TransactionHistoryEntity.CreateDebit(
            userId,
            request.Amount,
            $"Tạo yêu cầu rút tiền #{withdrawalRequest.Id.ToString()[..8]}",
            performedBy);

        await transactionHistoryRepository.AddAsync(transactionHistory, cancellationToken);

        try
        {
            await unitOfWork.SaveChangeAsync(cancellationToken);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            return Error.Conflict("Withdrawal.Concurrency", "The balance was updated by another process. Please try again.");
        }

        return withdrawalRequest.Id;
    }
}
