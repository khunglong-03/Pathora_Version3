namespace Api.Endpoint;

public static class TourManagerAssignmentEndpoint
{
    public const string Base = "api/tour-manager-assignment";
    public const string ManagerId = "{managerId}";
    public const string GetAll = "";
    public const string GetById = ManagerId;
    public const string Assign = "";
    public const string BulkAssign = "bulk";
    public const string Remove = ManagerId;
}
