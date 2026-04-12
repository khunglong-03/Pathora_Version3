using Application.Contracts.Manager;
using Application.Features.Manager.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;

namespace Application.Features.Manager.Commands.CreateManagerBankAccount;

public sealed record CreateManagerBankAccountCommand(CreateManagerBankAccountRequest Request)
    : ICommand<ErrorOr<ManagerBankAccountItemDto>>;
