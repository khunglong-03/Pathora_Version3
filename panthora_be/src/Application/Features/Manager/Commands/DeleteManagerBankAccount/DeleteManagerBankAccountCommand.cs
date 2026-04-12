using BuildingBlocks.CORS;
using ErrorOr;

namespace Application.Features.Manager.Commands.DeleteManagerBankAccount;

public sealed record DeleteManagerBankAccountCommand(Guid AccountId)
    : ICommand<ErrorOr<Deleted>>;
