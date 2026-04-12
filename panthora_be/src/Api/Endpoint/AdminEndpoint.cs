namespace Api.Endpoint;

public static class AdminEndpoint
{
    public const string Base = "api/admin";
    public const string Overview = "overview";
    public const string Dashboard = "dashboard";
    public const string TourManagement = "tour-management";
    public const string GetAllManagers = "managers";

    // User Management
    public const string Users = "users";
    public const string UserById = "users/{id:guid}";

    // Transport Provider
    public const string TransportProviders = "transport-providers";
    public const string TransportProviderById = "transport-providers/{id:guid}";

    // Hotel Provider
    public const string HotelProviders = "hotel-providers";
    public const string HotelProviderById = "hotel-providers/{id:guid}";

    // Tour Manager Staff
    public const string Staff = "staff";
    public const string TourManagerStaff = "tour-managers/{managerId:guid}/staff";
    public const string ReassignStaff = "tour-managers/{managerId:guid}/staff/{staffId:guid}/reassign";
    public const string CreateStaffUnderManager = "tour-managers/{managerId:guid}/staff/create";

    // Manager Dashboard
    public const string ManagerDashboard = "manager-dashboard";

    // Admin Dashboard
    public const string AdminDashboardOverview = "dashboard/overview";

    // Manager Bank Accounts
    public const string ManagersBankAccounts = "managers/bank-accounts";
    public const string ManagerBankAccount = "managers/{managerId:guid}/bank-account";
    public const string VerifyBankAccount = "managers/{managerId:guid}/bank-account/verify";
}
