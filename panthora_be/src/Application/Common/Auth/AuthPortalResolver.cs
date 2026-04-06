namespace Application.Common.Auth;

public static class AuthPortalResolver
{
    private const int CustomerRoleType = 2;
    private static readonly HashSet<int> AdminRoleTypes = [0, 1, 9];

    public static PortalRouting Resolve(IEnumerable<int> roleTypes)
    {
        var normalizedRoleTypes = roleTypes
            .Distinct()
            .ToList();

        if (normalizedRoleTypes.Any(AdminRoleTypes.Contains))
        {
            return PortalRouting.Admin;
        }

        if (normalizedRoleTypes.Contains(CustomerRoleType))
        {
            return PortalRouting.User;
        }

        return PortalRouting.User;
    }
}

public sealed record PortalRouting(string Portal, string DefaultPath)
{
    public static PortalRouting Admin { get; } = new("admin", "/dashboard");

    public static PortalRouting User { get; } = new("user", "/home");
}
