namespace Application.Features.Admin.Commands.UpdateBankAccount;

using Application.Contracts.Admin;
using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;

public sealed record UpdateBankAccountCommand(
    Guid ManagerId,
    UpdateBankAccountRequest Request
) : ICommand<ErrorOr<UserBankAccountDto>>;
