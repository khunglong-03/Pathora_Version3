using System.Text.Json.Serialization;

namespace Application.Contracts.Role;

public sealed record CreateRoleRequest(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("description")] string Description);
