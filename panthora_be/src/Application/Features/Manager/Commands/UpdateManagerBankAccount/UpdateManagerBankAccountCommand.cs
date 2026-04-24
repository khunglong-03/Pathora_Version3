using Application.Contracts.Manager;
using Application.Features.Manager.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.Manager.Commands.UpdateManagerBankAccount;

public sealed record UpdateManagerBankAccountCommand(
    [property: JsonPropertyName("accountId")] Guid AccountId,
    [property: JsonPropertyName("request")] UpdateManagerBankAccountRequest Request)
    : ICommand<ErrorOr<ManagerBankAccountItemDto>>;
