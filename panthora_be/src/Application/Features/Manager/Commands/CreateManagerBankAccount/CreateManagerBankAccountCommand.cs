namespace Application.Features.Manager.Commands.CreateManagerBankAccount;

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



public sealed record CreateManagerBankAccountCommand([property: JsonPropertyName("request")] CreateManagerBankAccountRequest Request)
    : ICommand<ErrorOr<ManagerBankAccountItemDto>>;


public sealed class CreateManagerBankAccountCommandHandler(
    IManagerBankAccountRepository bankAccountRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser)
    : ICommandHandler<CreateManagerBankAccountCommand, ErrorOr<ManagerBankAccountItemDto>>
{
    public async Task<ErrorOr<ManagerBankAccountItemDto>> Handle(
        CreateManagerBankAccountCommand command,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.Id
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var req = command.Request;

        // If the new account is default, un-default any existing default
        if (req.IsDefault)
        {
            var existingDefault = await bankAccountRepository.GetDefaultByUserIdAsync(userId, cancellationToken);

            if (existingDefault is not null)
            {
                existingDefault.IsDefault = false;
            }
        }

        // If no accounts exist yet, force this one as default
        var hasAny = await bankAccountRepository.AnyByUserIdAsync(userId, cancellationToken);

        var entity = new ManagerBankAccountEntity
        {
            UserId = userId,
            BankAccountNumber = req.BankAccountNumber,
            BankCode = req.BankCode.ToUpperInvariant(),
            BankBin = req.BankBin,
            BankShortName = req.BankShortName,
            BankAccountName = req.BankAccountName,
            IsDefault = req.IsDefault || !hasAny,
            IsVerified = true,
        };

        await bankAccountRepository.AddAsync(entity, cancellationToken);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return new ManagerBankAccountItemDto(
            entity.Id,
            entity.UserId,
            entity.BankAccountNumber,
            entity.BankCode,
            entity.BankBin,
            entity.BankShortName,
            entity.BankAccountName,
            entity.IsDefault,
            entity.IsVerified,
            entity.VerifiedAt,
            entity.CreatedOnUtc);
    }
}


public sealed class CreateManagerBankAccountCommandValidator : AbstractValidator<CreateManagerBankAccountCommand>
{
    public CreateManagerBankAccountCommandValidator()
    {
        RuleFor(x => x.Request.BankAccountNumber)
            .NotEmpty().WithMessage("Bank account number is required.")
            .Length(6, 20).WithMessage("Bank account number must be 6-20 digits.")
            .Matches(@"^\d+$").WithMessage("Bank account number must contain only digits.");

        RuleFor(x => x.Request.BankCode)
            .NotEmpty().WithMessage("Bank code is required.")
            .MaximumLength(20).WithMessage("Bank code must not exceed 20 characters.");

        RuleFor(x => x.Request.BankBin)
            .NotEmpty().WithMessage("Bank BIN is required.")
            .MaximumLength(10).WithMessage("Bank BIN must not exceed 10 characters.");

        RuleFor(x => x.Request.BankAccountName)
            .MaximumLength(200).WithMessage("Account name must not exceed 200 characters.");
    }
}
