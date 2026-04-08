using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Phân công phương tiện và tài xế cho một lịch trình di chuyển trong booking.
/// Gắn Driver và Vehicle cụ thể với một BookingActivityReservation và TourPlanRoute.
/// </summary>
public class TourDayActivityRouteTransportEntity : Aggregate<Guid>
{
    /// <summary>ID của BookingActivityReservation mà phân công này thuộc về.</summary>
    public Guid BookingActivityReservationId { get; set; }
    /// <summary>BookingActivityReservation liên quan.</summary>
    public virtual BookingActivityReservationEntity BookingActivityReservation { get; set; } = null!;
    /// <summary>ID của TourPlanRoute mà tài xế/xe được gán vào.</summary>
    public Guid TourPlanRouteId { get; set; }
    /// <summary>TourPlanRoute liên quan.</summary>
    public virtual TourPlanRouteEntity TourPlanRoute { get; set; } = null!;
    /// <summary>ID của Driver được phân công.</summary>
    public Guid? DriverId { get; set; }
    /// <summary>Driver được phân công.</summary>
    public virtual DriverEntity? Driver { get; set; }
    /// <summary>ID của Vehicle được phân công.</summary>
    public Guid? VehicleId { get; set; }
    /// <summary>Vehicle được phân công.</summary>
    public virtual VehicleEntity? Vehicle { get; set; }
    /// <summary>Trạng thái phân công chuyến xe: Pending/InProgress/Completed/Rejected/Cancelled.</summary>
    public int? Status { get; set; }
    /// <summary>Lý do từ chối (nếu Rejected).</summary>
    public string? RejectionReason { get; set; }
    /// <summary>Thời gian cập nhật phân công gần nhất.</summary>
    public DateTimeOffset UpdatedAt { get; set; }
    /// <summary>ID của User thực hiện cập nhật.</summary>
    public Guid UpdatedById { get; set; }

    public static TourDayActivityRouteTransportEntity Create(
        Guid bookingActivityReservationId,
        Guid tourPlanRouteId,
        Guid? driverId,
        Guid? vehicleId,
        Guid updatedById,
        string performedBy)
    {
        return new TourDayActivityRouteTransportEntity
        {
            Id = Guid.CreateVersion7(),
            BookingActivityReservationId = bookingActivityReservationId,
            TourPlanRouteId = tourPlanRouteId,
            DriverId = driverId,
            VehicleId = vehicleId,
            UpdatedAt = DateTimeOffset.UtcNow,
            UpdatedById = updatedById,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Assign(Guid? driverId, Guid? vehicleId, Guid updatedById, string performedBy)
    {
        DriverId = driverId;
        VehicleId = vehicleId;
        UpdatedAt = DateTimeOffset.UtcNow;
        UpdatedById = updatedById;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void Accept(string performedBy)
    {
        Status = (int)TripAssignmentStatus.InProgress;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void Reject(string reason, string performedBy)
    {
        Status = (int)TripAssignmentStatus.Rejected;
        RejectionReason = reason;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void Complete(string performedBy)
    {
        Status = (int)TripAssignmentStatus.Completed;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void Cancel(string performedBy)
    {
        Status = (int)TripAssignmentStatus.Cancelled;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }
}
