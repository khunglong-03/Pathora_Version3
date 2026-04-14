namespace Api.Endpoint;

public static class InsuranceEndpoint
{
    public const string Base = "api/insurance";
    public const string Id = "{id:guid}";
    public const string ByClassification = "by-classification/{classificationId:guid}";
}
