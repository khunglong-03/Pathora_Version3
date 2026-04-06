namespace Application.Common.Constant;

public static class RoleConstants
{
    public const string Admin = "Admin";
    public const string Manager = "Manager";
    public const string TourDesigner = "TourDesigner";
    public const string TourGuide = "TourGuide";
    public const string Customer = "Customer";
    public const string TransportProvider = "TransportProvider";
    public const string HotelServiceProvider = "HotelServiceProvider";

    // Combined role constants
    public const string Admin_Admin = "Admin";
    public const string Admin_Manager = "Admin,Manager";
    public const string Admin_Customer = "Admin,Customer";
    public const string Admin_TourGuide = "Admin,TourGuide";
    public const string Admin_TransportProvider = "Admin,TransportProvider";
    public const string Admin_HotelServiceProvider = "Admin,HotelServiceProvider";
    public const string Admin_Manager_TourDesigner = "Admin,Manager,TourDesigner";
    public const string Admin_Manager_TourGuide = "Admin,Manager,TourGuide";
}
