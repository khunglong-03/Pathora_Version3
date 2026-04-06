namespace Application.Contracts.Role;

public sealed record CreateRoleRequest(
    string Name,
    string Description,
    int Type,
    IEnumerable<int>? FunctionIds = null);
