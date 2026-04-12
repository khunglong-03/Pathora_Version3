using Application.Contracts.Manager;
using Application.Features.Manager.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;

namespace Application.Features.Manager.Commands.UpdateMyBankAccount;

public sealed record UpdateMyBankAccountCommand(UpdateMyBankAccountRequest Request)
    : ICommand<ErrorOr<ManagerBankAccountDto>>;
