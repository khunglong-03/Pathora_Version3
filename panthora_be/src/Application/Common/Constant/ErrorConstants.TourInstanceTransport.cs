namespace Application.Common.Constant;

/// <summary>
/// Error code registry for the per-activity transport request & approval flow (ER-15).
///
/// HTTP status mapping:
/// <list type="table">
///   <listheader>
///     <term>Code</term>
///     <description>Meaning — HTTP</description>
///   </listheader>
///   <item>
///     <term><see cref="SeatCountBelowCapacityCode"/></term>
///     <description>RequestedSeatCount &lt; MaxParticipation — 400</description>
///   </item>
///   <item>
///     <term><see cref="VehicleWrongTypeCode"/></term>
///     <description>Vehicle.VehicleType != activity.RequestedVehicleType — 400</description>
///   </item>
///   <item>
///     <term><see cref="VehicleInsufficientCapacityCode"/></term>
///     <description>Vehicle.SeatCapacity &lt; RequestedSeatCount — 400</description>
///   </item>
///   <item>
///     <term><see cref="VehicleWrongSupplierCode"/></term>
///     <description>vehicle.SupplierId != activity.TransportSupplierId — 400</description>
///   </item>
///   <item>
///     <term><see cref="VehicleUnavailableCode"/></term>
///     <description>Cross-tour hold conflict — 409</description>
///   </item>
///   <item>
///     <term><see cref="RoomBlockInsufficientInventoryCode"/></term>
///     <description>Hotel inventory exhausted — 409</description>
///   </item>
///   <item>
///     <term><see cref="ProviderNotAssignedCode"/></term>
///     <description>Caller does not own the activity's supplier — 403</description>
///   </item>
///   <item>
///     <term><see cref="BulkApproveFailedCode"/></term>
///     <description>One of N activities failed during bulk approve — 409</description>
///   </item>
///   <item>
///     <term><see cref="CapacityExceededCode"/></term>
///     <description>MaxParticipation raised beyond approved vehicle seat capacity — 400</description>
///   </item>
/// </list>
/// </summary>
public static class TourInstanceTransportErrors
{
    public const string SeatCountBelowCapacityCode = "TourInstanceActivity.SeatCountBelowCapacity";
    public static readonly LocalizedMessage SeatCountBelowCapacityDescription =
        new(
            "Số ghế yêu cầu không được nhỏ hơn số khách tối đa của tour.",
            "Requested seat count cannot be less than the tour's max participation.");

    public const string VehicleWrongTypeCode = "Vehicle.WrongType";
    public static readonly LocalizedMessage VehicleWrongTypeDescription =
        new(
            "Loại xe không khớp với loại xe đã yêu cầu cho hoạt động này.",
            "Vehicle type does not match the type requested for this activity.");

    public const string VehicleInsufficientCapacityCode = "Vehicle.InsufficientCapacity";
    public static readonly LocalizedMessage VehicleInsufficientCapacityDescription =
        new(
            "Sức chứa của xe không đủ cho số ghế yêu cầu.",
            "Vehicle seat capacity is not enough for the requested seat count.");

    public const string DuplicateVehicleInActivityCode = "TourInstanceActivity.DuplicateVehicle";
    public static readonly LocalizedMessage DuplicateVehicleInActivityDescription =
        new(
            "Không được gán trùng cùng một xe cho một hoạt động.",
            "The same vehicle cannot be assigned twice to one activity.");

    public const string TransportFleetInsufficientCapacityCode = "TourInstanceActivity.TransportFleetInsufficientCapacity";
    public static readonly LocalizedMessage TransportFleetInsufficientCapacityDescription =
        new(
            "Tổng sức chỗ các xe không đủ cho số ghế yêu cầu.",
            "Combined vehicle seat capacity is not enough for the requested seat count.");

    public const string VehicleWrongSupplierCode = "Vehicle.WrongSupplier";
    public static readonly LocalizedMessage VehicleWrongSupplierDescription =
        new(
            "Xe không thuộc nhà cung cấp đã được gán cho hoạt động này.",
            "Vehicle does not belong to the supplier assigned to this activity.");

    public const string VehicleUnavailableCode = "Vehicle.Unavailable";
    public static readonly LocalizedMessage VehicleUnavailableDescription =
        new(
            "Xe đã được giữ chỗ cho một lịch trình khác trong cùng ngày.",
            "Vehicle is already held for another schedule on the same day.");

    public const string RoomBlockInsufficientInventoryCode = "RoomBlock.InsufficientInventory";
    public static readonly LocalizedMessage RoomBlockInsufficientInventoryDescription =
        new(
            "Không đủ phòng trống cho loại phòng này vào ngày đã chọn.",
            "Not enough rooms available for this room type on the selected date.");

    public const string ProviderNotAssignedCode = "TourInstance.ProviderNotAssigned";
    public static readonly LocalizedMessage ProviderNotAssignedDescription =
        new(
            "Bạn không phải là nhà cung cấp được gán cho hoạt động này.",
            "You are not the supplier assigned to this activity.");

    public const string BulkApproveFailedCode = "TourInstance.BulkApproveFailed";
    public static readonly LocalizedMessage BulkApproveFailedDescription =
        new(
            "Một hoặc nhiều hoạt động không thể duyệt; toàn bộ đã được rollback.",
            "One or more activities could not be approved; the entire batch was rolled back.");

    public const string CapacityExceededCode = "TourInstance.CapacityExceeded";
    public static readonly LocalizedMessage CapacityExceededDescription =
        new(
            "Số khách tối đa mới vượt sức chứa của xe đã được duyệt cho tour này.",
            "The new max participation exceeds the seat capacity of vehicles already approved for this tour.");

    // Scope addendum 2026-04-23 — manager-specified vehicle count + inventory guard.
    public const string VehicleCountMismatchCode = "TourInstanceActivity.VehicleCountMismatch";
    public static readonly LocalizedMessage VehicleCountMismatchDescription =
        new(
            "Số xe được duyệt không khớp với số xe Manager yêu cầu cho hoạt động này.",
            "The number of approved vehicles does not match the count requested by the manager.");

    public const string VehicleCountExceedsFleetCode = "TourInstanceActivity.VehicleCountExceedsFleet";
    public static readonly LocalizedMessage VehicleCountExceedsFleetDescription =
        new(
            "Số xe yêu cầu vượt quá số xe đang hoạt động của nhà cung cấp.",
            "Requested vehicle count exceeds the active fleet of the supplier.");

    public const string RoomCountExceedsInventoryCode = "TourInstanceActivity.RoomCountExceedsInventory";
    public static readonly LocalizedMessage RoomCountExceedsInventoryDescription =
        new(
            "Số phòng yêu cầu vượt quá số phòng đang hoạt động của nhà cung cấp.",
            "Requested room count exceeds the active inventory of the supplier.");
}
