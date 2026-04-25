namespace Application.Features.Manager.Commands.UpdateMyBankAccount;

using Application.Common.Constant;
using Application.Common.Interfaces;
using Application.Contracts.Manager;
using Application.Features.Manager.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;



public sealed record UpdateMyBankAccountCommand([property: JsonPropertyName("request")] UpdateMyBankAccountRequest Request)
    : ICommand<ErrorOr<ManagerBankAccountDto>>;


public sealed class UpdateMyBankAccountCommandHandler(
    IManagerBankAccountRepository bankAccountRepository,
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

        // Get the default bank account, or first account if no default
        var account = await bankAccountRepository.GetDefaultByUserIdAsync(userId, cancellationToken);
        account ??= (await bankAccountRepository.GetByUserIdAsync(userId, cancellationToken)).FirstOrDefault();

        if (account is null)
        {
            // Create a new default bank account if none exists
            account = new ManagerBankAccountEntity
            {
                UserId = userId,
                BankAccountNumber = request.Request.BankAccountNumber,
                BankCode = request.Request.BankCode.ToUpperInvariant(),
                BankBin = request.Request.BankCode.ToUpperInvariant(), // Use BankCode as fallback BIN
                BankAccountName = request.Request.BankAccountName,
                IsDefault = true,
                CreatedOnUtc = DateTimeOffset.UtcNow,
                LastModifiedOnUtc = DateTimeOffset.UtcNow
            };
            await bankAccountRepository.AddAsync(account, cancellationToken);
        }
        else
        {
            account.BankAccountNumber = request.Request.BankAccountNumber;
            account.BankCode = request.Request.BankCode.ToUpperInvariant();
            account.BankAccountName = request.Request.BankAccountName;
            account.LastModifiedOnUtc = DateTimeOffset.UtcNow;
        }

        await unitOfWork.SaveChangeAsync(cancellationToken);

        return new ManagerBankAccountDto(
            UserId: account.UserId,
            BankAccountNumber: account.BankAccountNumber,
            BankCode: account.BankCode,
            BankAccountName: account.BankAccountName,
            BankAccountVerified: account.IsVerified,
            BankAccountVerifiedAt: account.VerifiedAt
        );
    }
}


public sealed class UpdateMyBankAccountCommandValidator : AbstractValidator<UpdateMyBankAccountCommand>
{
    public UpdateMyBankAccountCommandValidator()
    {
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
