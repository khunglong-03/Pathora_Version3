using Application.Common.Constant;
using Application.Common.Interfaces;
using Application.Features.Manager.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.UnitOfWork;
using ErrorOr;

namespace Application.Features.Manager.Commands.UpdateMyBankAccount;

public sealed class UpdateMyBankAccountCommandHandler(
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser)
    : ICommandHandler<UpdateMyBankAccountCommand, ErrorOr<ManagerBankAccountDto>>
{
    public async Task<ErrorOr<ManagerBankAccountDto>> Handle(
        UpdateMyBankAccountCommand request,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.Id
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var user = await userRepository.FindById(userId, cancellationToken);
        if (user is null)
            return Error.NotFound(ErrorConstants.User.NotFoundCode, ErrorConstants.User.NotFoundDescription);

        user.BankAccountNumber = request.Request.BankAccountNumber;
        user.BankCode = request.Request.BankCode;
        user.BankAccountName = request.Request.BankAccountName;
        user.LastModifiedOnUtc = DateTimeOffset.UtcNow;

        userRepository.Update(user);
        await unitOfWork.SaveChangeAsync(cancellationToken);

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
