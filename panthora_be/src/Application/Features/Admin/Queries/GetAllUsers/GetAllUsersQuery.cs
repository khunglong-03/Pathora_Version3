namespace Application.Features.Admin.Queries.GetAllUsers;

using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using global::Contracts;
using Domain.Enums;
using ErrorOr;

public sealed record GetAllUsersQuery(
    int PageNumber = 1,
    int PageSize = 10,
    string? SearchText = null,
    UserStatus? Status = null,
    string? Role = null
) : IQuery<ErrorOr<PaginatedList<UserListItemDto>>>;