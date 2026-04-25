namespace Application.Features.Admin.Commands.VerifyBankAccount;

using Application.Common.Constant;
using Application.Common.Interfaces;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;



public sealed record VerifyBankAccountCommand([property: JsonPropertyName("managerId")] Guid ManagerId)
    : ICommand<ErrorOr<Success>>;


public sealed class VerifyBankAccountCommandHandler(
    IManagerBankAccountRepository bankAccountRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser)
    : ICommandHandler<VerifyBankAccountCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(
        VerifyBankAccountCommand request,
        CancellationToken cancellationToken)
    {
        // Get the default bank account for this manager
        var account = await bankAccountRepository.GetDefaultByUserIdAsync(request.ManagerId, cancellationToken);
        account ??= (await bankAccountRepository.GetByUserIdAsync(request.ManagerId, cancellationToken)).FirstOrDefault();

        if (account is null)
        {
            return Error.NotFound(ErrorConstants.Payment.NoBankAccountCode, ErrorConstants.Payment.NoBankAccountDescription);
        }

        account.IsVerified = true;
        account.VerifiedAt = DateTimeOffset.UtcNow;
        account.VerifiedBy = currentUser.Id;
        account.LastModifiedOnUtc = DateTimeOffset.UtcNow;

        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}


public sealed class VerifyBankAccountCommandValidator : AbstractValidator<VerifyBankAccountCommand>
{
    public VerifyBankAccountCommandValidator()
    {
        RuleFor(x => x.ManagerId).NotEmpty();
    }
}
