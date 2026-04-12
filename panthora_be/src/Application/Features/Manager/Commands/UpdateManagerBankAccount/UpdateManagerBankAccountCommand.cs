using Application.Contracts.Manager;
using Application.Features.Manager.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;

namespace Application.Features.Manager.Commands.UpdateManagerBankAccount;

public sealed record UpdateManagerBankAccountCommand(Guid AccountId, UpdateManagerBankAccountRequest Request)
    : ICommand<ErrorOr<ManagerBankAccountItemDto>>;
