namespace Application.Common.Auth;

public static class AuthPortalResolver
{
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

        if (names.Contains("TransportProvider"))
        {
            return PortalRouting.TransportProvider;
        }

        if (names.Contains("HotelServiceProvider"))
        {
            return PortalRouting.HotelServiceProvider;
        }

        if (names.Contains("TourDesigner"))
        {
            return PortalRouting.TourDesigner;
        }

        if (names.Contains("TourGuide"))
        {
            return PortalRouting.TourGuide;
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

    public static PortalRouting TransportProvider { get; } = new("user", "/transport");

    public static PortalRouting HotelServiceProvider { get; } = new("user", "/hotel");

    public static PortalRouting TourDesigner { get; } = new("user", "/tour-designer");

    public static PortalRouting TourGuide { get; } = new("user", "/tour-guide");

    public static PortalRouting User { get; } = new("user", "/");
}
