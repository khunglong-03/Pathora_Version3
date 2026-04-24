using System.Text.Json.Serialization;

namespace Application.Contracts.Role;

public sealed record GetAllRoleRequest(
    [property: JsonPropertyName("pageNumber")] int PageNumber = 1,
    [property: JsonPropertyName("pageSize")] int PageSize = 10,
    [property: JsonPropertyName("searchText")] string? SearchText = null);

public sealed record RoleVm(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("description")] string Description,
    [property: JsonPropertyName("status")] int Status);
