namespace Application.Features.Admin.Commands.VerifyBankAccount;

using BuildingBlocks.CORS;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record VerifyBankAccountCommand([property: JsonPropertyName("managerId")] Guid ManagerId)
    : ICommand<ErrorOr<Success>>;
