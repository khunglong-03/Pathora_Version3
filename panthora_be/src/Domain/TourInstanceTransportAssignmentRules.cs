namespace Domain;

/// <summary>Shared rules for multi-vehicle transport assignments (domain-level; command validators may wrap these).</summary>
public static class TourInstanceTransportAssignmentRules
{
    public static bool HasDuplicateVehicleIds(IEnumerable<Guid> vehicleIds)
    {
        var set = new HashSet<Guid>();
        foreach (var id in vehicleIds)
        {
            if (!set.Add(id))
                return true;
        }

        return false;
    }

    /// <summary>
    /// Returns whether total effective seats cover the requested minimum.
    /// When <paramref name="requestedSeatCount"/> is null, treated as satisfied (caller may enforce stricter product rules).
    /// </summary>
    public static bool SeatCapacityCoversRequest(int totalEffectiveSeats, int? requestedSeatCount) =>
        !requestedSeatCount.HasValue || totalEffectiveSeats >= requestedSeatCount.Value;

    public static int SumEffectiveSeats(IEnumerable<(int? Snapshot, int LiveCapacity)> rows)
    {
        var sum = 0;
        foreach (var (snapshot, live) in rows)
            sum += snapshot ?? live;
        return sum;
    }
}
