using System.Text.Json.Serialization;

namespace Application.Contracts.Role;

public sealed record DeleteRoleRequest([property: JsonPropertyName("roleId")] int RoleId);
