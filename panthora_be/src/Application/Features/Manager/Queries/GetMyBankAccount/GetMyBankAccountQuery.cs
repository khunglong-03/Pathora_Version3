using Application.Features.Manager.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.Manager.Queries.GetMyBankAccount;

public sealed record GetMyBankAccountQuery()
    : IQuery<ErrorOr<ManagerBankAccountDto>>;
