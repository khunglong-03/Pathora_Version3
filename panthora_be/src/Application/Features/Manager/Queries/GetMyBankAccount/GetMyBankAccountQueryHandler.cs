using Application.Common.Interfaces;
using Application.Common.Constant;
using Application.Features.Manager.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using ErrorOr;

namespace Application.Features.Manager.Queries.GetMyBankAccount;

public sealed class GetMyBankAccountQueryHandler(
    IUserRepository userRepository,
    ICurrentUser currentUser)
    : IQueryHandler<GetMyBankAccountQuery, ErrorOr<ManagerBankAccountDto>>
{
    public async Task<ErrorOr<ManagerBankAccountDto>> Handle(
        GetMyBankAccountQuery request,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.Id
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var user = await userRepository.FindById(userId, cancellationToken);
        if (user is null)
            return Error.NotFound(ErrorConstants.User.NotFoundCode, ErrorConstants.User.NotFoundDescription);

        return new ManagerBankAccountDto(
            UserId: user.Id,
            BankAccountNumber: user.BankAccountNumber,
            BankCode: user.BankCode,
            BankAccountName: user.BankAccountName,
            BankAccountVerified: user.BankAccountVerified,
            BankAccountVerifiedAt: user.BankAccountVerifiedAt
        );
    }
}
