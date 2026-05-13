using Application.Common.Interfaces;
using Application.Services;
using Application.Common.Constant;
using Domain.Common.Repositories;
using Domain.Constant;
using Domain.Enums;
using ErrorOr;
using MediatR;

namespace Application.Features.Withdrawal.Queries.GetWithdrawalQR;

public sealed class GetWithdrawalQRQueryHandler(
    ICurrentUser currentUser,
    IWithdrawalRequestRepository withdrawalRequestRepository,
    IPaymentService paymentService) : IRequestHandler<GetWithdrawalQRQuery, ErrorOr<string>>
{
    public async Task<ErrorOr<string>> Handle(GetWithdrawalQRQuery request, CancellationToken cancellationToken)
    {
        if (currentUser.Id is null || !currentUser.IsInRole(RoleConstants.Admin))
        {
            return Error.Forbidden("Withdrawal.Forbidden", "Only admins can get withdrawal QR code.");
        }

        var withdrawal = await withdrawalRequestRepository.GetByIdAsync(request.Id, cancellationToken);
        if (withdrawal is null)
        {
            return Error.NotFound("Withdrawal.NotFound", "Withdrawal request not found.");
        }

        if (withdrawal.Status != WithdrawalStatus.Approved)
        {
            return Error.Validation("Withdrawal.NotApproved", "QR code is only available for approved requests.");
        }

        var qrResult = await paymentService.GetQR(
            note: $"RUT-{request.Id.ToString()[..8]}",
            amount: (long)withdrawal.Amount,
            bankBin: withdrawal.BankBin,
            accountNo: withdrawal.BankAccountNumber,
            accountName: withdrawal.BankAccountName);

        return qrResult;
    }
}
