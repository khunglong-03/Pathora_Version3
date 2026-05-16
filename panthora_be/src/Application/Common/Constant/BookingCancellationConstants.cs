namespace Application.Common.Constant;

/// <summary>
/// Constants cho luồng Manager cancel tour instance và refund tracking.
/// </summary>
public static class BookingCancellationConstants
{
    /// <summary>Phần trăm tiền cọc khách mất khi Manager huỷ tour (30%).</summary>
    public const decimal MANAGER_CANCEL_DEPOSIT_FORFEIT_PERCENT = 30m;

    /// <summary>Phần trăm tiền hoàn lại cho khách (70% = 100% - 30% cọc).</summary>
    public const decimal REFUND_PERCENT = 0.7m;
}
