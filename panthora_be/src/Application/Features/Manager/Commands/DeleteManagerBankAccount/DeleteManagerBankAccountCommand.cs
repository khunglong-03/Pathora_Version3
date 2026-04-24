using BuildingBlocks.CORS;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.Manager.Commands.DeleteManagerBankAccount;

public sealed record DeleteManagerBankAccountCommand([property: JsonPropertyName("accountId")] Guid AccountId)
    : ICommand<ErrorOr<Deleted>>;
