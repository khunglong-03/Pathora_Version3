using Application.Features.Manager.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.Manager.Queries.GetMyBankAccounts;

public sealed record GetMyBankAccountsQuery()
    : IQuery<ErrorOr<List<ManagerBankAccountItemDto>>>;
