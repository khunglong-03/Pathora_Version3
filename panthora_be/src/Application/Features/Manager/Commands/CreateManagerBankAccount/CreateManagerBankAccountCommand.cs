using Application.Contracts.Manager;
using Application.Features.Manager.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.Manager.Commands.CreateManagerBankAccount;

public sealed record CreateManagerBankAccountCommand([property: JsonPropertyName("request")] CreateManagerBankAccountRequest Request)
    : ICommand<ErrorOr<ManagerBankAccountItemDto>>;
