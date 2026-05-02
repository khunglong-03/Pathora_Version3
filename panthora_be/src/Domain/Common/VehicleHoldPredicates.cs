namespace Domain.Common;

using System.Linq.Expressions;
using Domain.Entities;
using Domain.Enums;

/// <summary>
/// Shared active-hold predicate for VehicleBlock queries.
/// A hold is active if:
///   - HoldStatus == Hard, OR
///   - HoldStatus == Soft AND ExpiresAt > nowUtc
/// Soft holds with ExpiresAt == null are considered inactive
/// (matches SoftHoldCleanupWorkerService convention).
/// </summary>
public static class VehicleHoldPredicates
{
    /// <summary>
    /// Returns an expression that evaluates to true when a <see cref="VehicleBlockEntity"/>
    /// has an active hold at the given <paramref name="nowUtc"/>.
    /// </summary>
    public static Expression<Func<VehicleBlockEntity, bool>> IsActiveHold(DateTimeOffset nowUtc)
    {
        return b => b.HoldStatus == HoldStatus.Hard
                  || (b.HoldStatus == HoldStatus.Soft && b.ExpiresAt > nowUtc);
    }

    /// <summary>
    /// In-memory version of the active-hold check for use with <c>IEnumerable</c> / LINQ-to-Objects.
    /// </summary>
    public static bool IsActiveHoldFunc(VehicleBlockEntity block, DateTimeOffset nowUtc)
    {
        return block.HoldStatus == HoldStatus.Hard
            || (block.HoldStatus == HoldStatus.Soft && block.ExpiresAt > nowUtc);
    }
}
