namespace Api.Endpoint;

public static class ManagerEndpoint
{
    public const string Base = "api/manager";
    public const string Dashboard = "dashboard";
    public const string Overview = "overview";
    public const string TourManagement = "tour-management";
    public const string TourManagementStats = "tour-management/stats";

    // Transport Provider
    public const string TransportProviders = "transport-providers";
    public const string TransportProviderStats = "transport-providers/stats";
    public const string TransportProviderById = "transport-providers/{id:guid}";
    public const string AdminTransportVehicles = "transport-providers/{id:guid}/vehicles";
    public const string AdminTransportVehicleByPlate = "transport-providers/{id:guid}/vehicles/{plate}";

    // Hotel Provider
    public const string HotelProviders = "hotel-providers";
    public const string HotelProviderById = "hotel-providers/{id:guid}";

    // Tour Manager Staff
    public const string Staff = "staff";
    public const string TourManagerStaff = "tour-managers/{managerId}/staff";
    public const string ReassignStaff = "tour-managers/{managerId}/staff/{staffId}/reassign";
    public const string CreateStaffUnderManager = "tour-managers/{managerId}/staff/create";
}
