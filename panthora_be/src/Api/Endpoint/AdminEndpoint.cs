namespace Api.Endpoint;

public static class AdminEndpoint
{
    public const string Base = "api/admin";
    public const string Dashboard = "dashboard";
    public const string GetAllManagers = "managers";

    // User Management
    public const string Users = "users";
    public const string UserById = "users/{id:guid}";

    // Admin Dashboard
    public const string AdminDashboardOverview = "dashboard/overview";

    // Manager Bank Accounts
    public const string ManagersBankAccounts = "managers/bank-accounts";
    public const string ManagerBankAccount = "managers/{managerId}/bank-account";
    public const string VerifyBankAccount = "managers/{managerId}/bank-account/verify";

    // Tour Manager Staff
    public const string GetTourManagerStaff = "tour-managers/{managerId:guid}/staff";
    public const string CreateStaffUnderManager = "tour-managers/{managerId:guid}/staff/create";
    public const string UpdateStaffUnderManager = "tour-managers/{managerId:guid}/staff/{staffId:guid}/update";
    public const string ReassignStaff = "tour-managers/{managerId:guid}/staff/{staffId:guid}/reassign";

    // Transport Provider
    public const string DriverActivities = "transport-providers/{providerId:guid}/drivers/{driverId:guid}/activities";
}
