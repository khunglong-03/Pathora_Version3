namespace Application.Features.Admin.Commands.UpdateBankAccount;

using Application.Contracts.Admin;
using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record UpdateBankAccountCommand(
    [property: JsonPropertyName("managerId")] Guid ManagerId,
    [property: JsonPropertyName("request")] UpdateBankAccountRequest Request) : ICommand<ErrorOr<UserBankAccountDto>>;
