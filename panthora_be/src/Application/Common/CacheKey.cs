namespace Application.Common;

public static class CacheKey
{
    public const string Admin = nameof(Admin);
    public const string AdminTourManagement = $"{Admin}:tour-management";
    public const string User = nameof(User);
    public const string AccessToken = nameof(AccessToken);
    public const string SystemKey = nameof(SystemKey);
    public const string Role = nameof(Role);
    public const string Position = nameof(Position);
    public const string Department = nameof(Department);
    public const string Tour = nameof(Tour);
    public const string TourInstance = nameof(TourInstance);
    public const string TourRequest = nameof(TourRequest);
    public const string Supplier = nameof(Supplier);
    public const string Booking = nameof(Booking);
    public const string TourManagerAssignment = nameof(TourManagerAssignment);
}
