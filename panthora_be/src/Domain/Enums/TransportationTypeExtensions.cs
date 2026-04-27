namespace Domain.Enums;

public static class TransportationTypeExtensions
{
    /// <summary>
    /// Map TransportationType → TransportApprovalCategory. Nguồn sự thật cho việc routing duyệt.
    /// `default` ném <see cref="ArgumentOutOfRangeException"/> để bắt enum mới chưa được phân loại.
    /// </summary>
    public static TransportApprovalCategory GetApprovalCategory(this TransportationType type) => type switch
    {
        TransportationType.Bus => TransportApprovalCategory.Ground,
        TransportationType.Car => TransportApprovalCategory.Ground,
        TransportationType.Motorbike => TransportApprovalCategory.Ground,
        TransportationType.Taxi => TransportApprovalCategory.Ground,
        TransportationType.Bicycle => TransportApprovalCategory.Ground,

        TransportationType.Flight => TransportApprovalCategory.ExternalTicket,
        TransportationType.Train => TransportApprovalCategory.ExternalTicket,
        TransportationType.Boat => TransportApprovalCategory.ExternalTicket,
        TransportationType.Other => TransportApprovalCategory.ExternalTicket,

        TransportationType.Walking => TransportApprovalCategory.NoApproval,

        _ => throw new ArgumentOutOfRangeException(
            nameof(type),
            type,
            $"Unmapped TransportationType '{type}'. Add to TransportationTypeExtensions.GetApprovalCategory."),
    };
}
