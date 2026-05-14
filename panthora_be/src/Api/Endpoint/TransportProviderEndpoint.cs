namespace Api.Endpoint.TransportProvider;

public static class DriverEndpoint
{
    public const string Base = "api/transport-provider/drivers";
}

public static class VehicleEndpoint
{
    public const string Base = "api/transport-provider/vehicles";
    public const string Available = "api/transport-provider/vehicles/available";
    public const string Schedule = "api/transport-provider/vehicles/schedule";
}
