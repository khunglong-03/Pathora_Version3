namespace Api.Endpoint.TransportProvider;

public static class DriverEndpoint
{
    public const string Base = "transport-provider/drivers";
}

public static class VehicleEndpoint
{
    public const string Base = "transport-provider/vehicles";
    public const string Available = "transport-provider/vehicles/available";
    public const string Schedule = "transport-provider/vehicles/schedule";
}
