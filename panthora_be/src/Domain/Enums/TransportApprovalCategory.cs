namespace Domain.Enums;

/// <summary>
/// Phân loại hoạt động vận chuyển theo cơ quan có thẩm quyền duyệt.
/// </summary>
public enum TransportApprovalCategory
{
    /// <summary>
    /// Phương tiện đường bộ — Transport Provider (nhà cung cấp ngoài) duyệt.
    /// Bus, Car, Motorbike, Taxi, Bicycle.
    /// </summary>
    Ground = 0,

    /// <summary>
    /// Vé ngoài — TourDesigner mua vé bên ngoài (hãng bay, đường sắt, ...) và upload bằng chứng.
    /// Flight, Train, Boat, Other.
    /// </summary>
    ExternalTicket = 1,

    /// <summary>
    /// Không cần duyệt — hệ thống auto-skip. Walking.
    /// </summary>
    NoApproval = 2,
}
