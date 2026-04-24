using Application.Contracts.Manager;
using Application.Features.Manager.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.Manager.Commands.UpdateMyBankAccount;

public sealed record UpdateMyBankAccountCommand([property: JsonPropertyName("request")] UpdateMyBankAccountRequest Request)
    : ICommand<ErrorOr<ManagerBankAccountDto>>;
