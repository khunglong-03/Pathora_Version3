namespace Api.Endpoint;

public static class CancellationPolicyEndpoint
{
    public const string Base = "api/cancellation-policies";
    public const string Id = "/{id:guid}";
    public const string CalculateRefund = "/calculate-refund";
}
