namespace Application.Features.Admin.Queries.GetAllUsers;

using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using global::Contracts;
using Domain.Enums;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record GetAllUsersQuery(
    [property: JsonPropertyName("pageNumber")] int PageNumber = 1,
    [property: JsonPropertyName("pageSize")] int PageSize = 10,
    [property: JsonPropertyName("searchText")] string? SearchText = null,
    [property: JsonPropertyName("status")] UserStatus? Status = null,
    [property: JsonPropertyName("role")] string? Role = null) : IQuery<ErrorOr<PaginatedList<UserListItemDto>>>;