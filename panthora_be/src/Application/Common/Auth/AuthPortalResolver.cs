namespace Application.Common.Auth;

public static class AuthPortalResolver
{
    private const int CustomerRoleType = 2;
    private static readonly HashSet<int> AdminRoleTypes = [0, 9];

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

    /// <summary>
    /// Resolves portal routing using role names for precise routing decisions.
    /// </summary>
    public static PortalRouting ResolveByName(IEnumerable<string> roleNames)
    {
        var names = roleNames.ToList();

        // Manager is classified as Admin portal (for cookie/portal purposes)
        // but needs its own defaultPath for routing
        if (names.Contains("Manager"))
        {
            return PortalRouting.Manager;
        }

        if (names.Contains("Admin"))
        {
            return PortalRouting.Admin;
        }

        if (names.Contains("Customer"))
        {
            return PortalRouting.User;
        }

        return PortalRouting.User;
    }
}

public sealed record PortalRouting(string Portal, string DefaultPath)
{
    public static PortalRouting Admin { get; } = new("admin", "/admin/users");

    /// <summary>
    /// Manager portal — shares "admin" cookie portal but uses /manager default path.
    /// </summary>
    public static PortalRouting Manager { get; } = new("admin", "/manager");

    public static PortalRouting User { get; } = new("user", "/home");
}
