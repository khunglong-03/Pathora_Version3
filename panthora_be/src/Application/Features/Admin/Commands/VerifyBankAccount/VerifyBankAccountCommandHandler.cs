namespace Application.Features.Admin.Commands.VerifyBankAccount;

using Application.Common.Interfaces;
using Application.Common.Constant;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.UnitOfWork;
using ErrorOr;

public sealed class VerifyBankAccountCommandHandler(
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser)
    : ICommandHandler<VerifyBankAccountCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(
        VerifyBankAccountCommand request,
        CancellationToken cancellationToken)
    {
        var user = await userRepository.FindById(request.ManagerId, cancellationToken);
        if (user is null)
            return Error.NotFound(ErrorConstants.User.NotFoundCode, ErrorConstants.User.NotFoundDescription);

        user.BankAccountVerified = true;
        user.BankAccountVerifiedAt = DateTimeOffset.UtcNow;
        user.BankAccountVerifiedBy = currentUser.Id;
        user.LastModifiedBy = "admin";
        user.LastModifiedOnUtc = DateTimeOffset.UtcNow;

        userRepository.Update(user);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}
