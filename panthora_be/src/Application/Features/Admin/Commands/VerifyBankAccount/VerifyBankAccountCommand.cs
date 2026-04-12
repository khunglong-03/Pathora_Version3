namespace Application.Features.Admin.Commands.VerifyBankAccount;

using BuildingBlocks.CORS;
using ErrorOr;

public sealed record VerifyBankAccountCommand(Guid ManagerId)
    : ICommand<ErrorOr<Success>>;
