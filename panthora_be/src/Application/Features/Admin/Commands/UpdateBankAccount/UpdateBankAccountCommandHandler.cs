namespace Application.Features.Admin.Commands.UpdateBankAccount;

using Application.Common.Constant;
using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.UnitOfWork;
using ErrorOr;

public sealed class UpdateBankAccountCommandHandler(
    IUserRepository userRepository,
    IUnitOfWork unitOfWork)
    : ICommandHandler<UpdateBankAccountCommand, ErrorOr<UserBankAccountDto>>
{
    public async Task<ErrorOr<UserBankAccountDto>> Handle(
        UpdateBankAccountCommand request,
        CancellationToken cancellationToken)
    {
        var user = await userRepository.FindById(request.ManagerId, cancellationToken);
        if (user is null)
            return Error.NotFound(ErrorConstants.User.NotFoundCode, ErrorConstants.User.NotFoundDescription);

        user.BankAccountNumber = request.Request.BankAccountNumber;
        user.BankCode = request.Request.BankCode;
        user.BankAccountName = request.Request.BankAccountName;
        user.LastModifiedBy = "admin";
        user.LastModifiedOnUtc = DateTimeOffset.UtcNow;

        userRepository.Update(user);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return new UserBankAccountDto(
            UserId: user.Id,
            Username: user.Username,
            FullName: user.FullName,
            Email: user.Email,
            BankAccountNumber: user.BankAccountNumber,
            BankCode: user.BankCode,
            BankAccountName: user.BankAccountName,
            BankAccountVerified: user.BankAccountVerified,
            BankAccountVerifiedAt: user.BankAccountVerifiedAt
        );
    }
}
