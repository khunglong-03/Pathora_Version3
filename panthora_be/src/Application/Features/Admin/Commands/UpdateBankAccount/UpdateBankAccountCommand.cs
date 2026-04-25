using Application.Common.Constant;
using Application.Contracts.Admin;
using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.Admin.Commands.UpdateBankAccount;
public sealed record UpdateBankAccountCommand(
    [property: JsonPropertyName("managerId")] Guid ManagerId,
    [property: JsonPropertyName("request")] UpdateBankAccountRequest Request) : ICommand<ErrorOr<UserBankAccountDto>>;


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


public sealed class UpdateBankAccountCommandValidator : AbstractValidator<UpdateBankAccountCommand>
{
    public UpdateBankAccountCommandValidator()
    {
        RuleFor(x => x.ManagerId).NotEmpty();
        RuleFor(x => x.Request.BankAccountNumber)
            .NotEmpty().WithMessage("Bank account number is required.")
            .Length(6, 20).WithMessage("Bank account number must be 6-20 digits.")
            .Matches(@"^\d+$").WithMessage("Bank account number must contain only digits.");
        RuleFor(x => x.Request.BankCode)
            .NotEmpty().WithMessage("Bank code is required.")
            .Length(2, 10).WithMessage("Bank code must be 2-10 characters.")
            .Matches(@"^[A-Z]+$").WithMessage("Bank code must be uppercase letters.");
        RuleFor(x => x.Request.BankAccountName)
            .MaximumLength(200).WithMessage("Account name must not exceed 200 characters.");
    }
}
