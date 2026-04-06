namespace Api.Endpoint;

public static class SiteContentEndpoint
{
    public const string Base = "api/site-content";

    public const string ByPage = "{pageKey}";
    public const string ByKey = "{pageKey}/{contentKey}";
    public const string Admin = "admin";
    public const string AdminById = "admin/{id:guid}";
}
