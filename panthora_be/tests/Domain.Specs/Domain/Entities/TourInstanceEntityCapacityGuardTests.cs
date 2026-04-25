using global::Domain.Entities;
using global::Domain.Enums;

namespace Domain.Specs.Entities;

public sealed class TourInstanceEntityCapacityGuardTests
{
    [Fact]
    public void EnsureCapacityCoversAllApprovedTransports_11_7_3_WhenRaiseAboveApprovedVehicleCapacity_Throws()
    {
        var instance = CreateInstance(maxParticipation: 40);
        var day = CreateDay(instance, 1);
        var approvedActivity = CreateApprovedTransport(day, vehicleId: Guid.NewGuid());
        day.Activities.Add(approvedActivity);
        instance.InstanceDays.Add(day);

        // Approved vehicle has 40 seats
        int ResolveCapacity(Guid _) => 40;

        var ex = Assert.Throws<InvalidOperationException>(() =>
            instance.EnsureCapacityCoversAllApprovedTransports(newMaxParticipation: 50, ResolveCapacity));

        Assert.Contains("không đủ", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void EnsureCapacityCoversAllApprovedTransports_WhenNewMaxFitsEveryVehicle_DoesNotThrow()
    {
        var instance = CreateInstance(maxParticipation: 30);
        var day = CreateDay(instance, 1);
        var approvedActivity = CreateApprovedTransport(day, vehicleId: Guid.NewGuid());
        day.Activities.Add(approvedActivity);
        instance.InstanceDays.Add(day);

        int ResolveCapacity(Guid _) => 45;

        instance.EnsureCapacityCoversAllApprovedTransports(newMaxParticipation: 40, ResolveCapacity);
    }

    [Fact]
    public void EnsureCapacityCoversAllApprovedTransports_WhenNewMaxNotIncreased_SkipsCheck()
    {
        var instance = CreateInstance(maxParticipation: 30);
        var day = CreateDay(instance, 1);
        day.Activities.Add(CreateApprovedTransport(day, vehicleId: Guid.NewGuid()));
        instance.InstanceDays.Add(day);

        // Resolver would throw if called — but it shouldn't be invoked for same-or-lower max
        int ResolveCapacity(Guid _) => throw new Xunit.Sdk.XunitException("Resolver must not run when MaxParticipation is not increased.");

        instance.EnsureCapacityCoversAllApprovedTransports(newMaxParticipation: 30, ResolveCapacity);
        instance.EnsureCapacityCoversAllApprovedTransports(newMaxParticipation: 20, ResolveCapacity);
    }

    [Fact]
    public void EnsureCapacityCoversAllApprovedTransports_IgnoresPendingAndSoftDeletedActivities()
    {
        var instance = CreateInstance(maxParticipation: 30);
        var day = CreateDay(instance, 1);

        var pendingActivity = TourInstanceDayActivityEntity.Create(
            day.Id, 1, TourDayActivityType.Transportation, "Pending leg", "tester");
        pendingActivity.TransportSupplierId = Guid.NewGuid();
        pendingActivity.VehicleId = Guid.NewGuid();
        pendingActivity.TransportationApprovalStatus = ProviderApprovalStatus.Pending;
        day.Activities.Add(pendingActivity);

        var softDeletedDay = CreateDay(instance, 2);
        softDeletedDay.IsDeleted = true;
        softDeletedDay.Activities.Add(CreateApprovedTransport(softDeletedDay, vehicleId: Guid.NewGuid()));

        instance.InstanceDays.Add(day);
        instance.InstanceDays.Add(softDeletedDay);

        // Resolver would throw if invoked — pending/soft-deleted must be filtered out
        int ResolveCapacity(Guid _) => throw new Xunit.Sdk.XunitException("Resolver must not run for pending or soft-deleted activities.");

        instance.EnsureCapacityCoversAllApprovedTransports(newMaxParticipation: 60, ResolveCapacity);
    }

    [Fact]
    public void EnsureCapacityCoversAllApprovedTransports_WhenTwoAssignmentRowsSumCoversNewMax_DoesNotThrow()
    {
        var instance = CreateInstance(maxParticipation: 20);
        var day = CreateDay(instance, 1);
        var v1 = Guid.NewGuid();
        var v2 = Guid.NewGuid();
        var activity = CreateApprovedTransportWithAssignments(day, (v1, 25), (v2, 25));
        day.Activities.Add(activity);
        instance.InstanceDays.Add(day);

        int ResolveCapacity(Guid id) => id == v1 ? 25 : id == v2 ? 25 : throw new Xunit.Sdk.XunitException("Unexpected vehicle id");

        instance.EnsureCapacityCoversAllApprovedTransports(newMaxParticipation: 45, ResolveCapacity);
    }

    [Fact]
    public void EnsureCapacityCoversAllApprovedTransports_WhenTwoAssignmentRowsSumBelowNewMax_Throws()
    {
        var instance = CreateInstance(maxParticipation: 20);
        var day = CreateDay(instance, 1);
        var v1 = Guid.NewGuid();
        var v2 = Guid.NewGuid();
        var activity = CreateApprovedTransportWithAssignments(day, (v1, 20), (v2, 20));
        day.Activities.Add(activity);
        instance.InstanceDays.Add(day);

        int ResolveCapacity(Guid id) => id == v1 ? 20 : id == v2 ? 20 : 0;

        var ex = Assert.Throws<InvalidOperationException>(() =>
            instance.EnsureCapacityCoversAllApprovedTransports(newMaxParticipation: 45, ResolveCapacity));

        Assert.Contains("không đủ", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    private static TourInstanceEntity CreateInstance(int maxParticipation)
    {
        var instance = TourInstanceEntity.Create(
            tourId: Guid.NewGuid(),
            classificationId: Guid.NewGuid(),
            title: "Capacity Guard",
            tourName: "Capacity Guard Tour",
            tourCode: "TOUR-CG",
            classificationName: "Standard",
            instanceType: TourType.Public,
            startDate: DateTimeOffset.UtcNow.Date,
            endDate: DateTimeOffset.UtcNow.Date.AddDays(1),
            maxParticipation: maxParticipation,
            basePrice: 100m,
            performedBy: "tester");
        instance.Status = TourInstanceStatus.Available;
        return instance;
    }

    private static TourInstanceDayEntity CreateDay(TourInstanceEntity instance, int dayNumber)
    {
        return TourInstanceDayEntity.Create(
            instance.Id,
            Guid.NewGuid(),
            dayNumber,
            DateOnly.FromDateTime(DateTime.UtcNow.Date.AddDays(dayNumber - 1)),
            $"Day {dayNumber}",
            "tester");
    }

    private static TourInstanceDayActivityEntity CreateApprovedTransport(TourInstanceDayEntity day, Guid vehicleId)
    {
        var activity = TourInstanceDayActivityEntity.Create(
            day.Id, 1, TourDayActivityType.Transportation, "Approved leg", "tester");
        activity.TransportSupplierId = Guid.NewGuid();
        activity.RequestedVehicleType = VehicleType.Coach;
        activity.RequestedSeatCount = 40;
        activity.VehicleId = vehicleId;
        activity.DriverId = Guid.NewGuid();
        activity.TransportationApprovalStatus = ProviderApprovalStatus.Approved;
        return activity;
    }

    private static TourInstanceDayActivityEntity CreateApprovedTransportWithAssignments(
        TourInstanceDayEntity day,
        params (Guid VehicleId, int SeatSnapshot)[] rows)
    {
        var activity = TourInstanceDayActivityEntity.Create(
            day.Id, 1, TourDayActivityType.Transportation, "Multi leg", "tester");
        activity.TransportSupplierId = Guid.NewGuid();
        activity.RequestedVehicleType = VehicleType.Coach;
        activity.RequestedSeatCount = 50;
        activity.TransportationApprovalStatus = ProviderApprovalStatus.Approved;
        foreach (var (vehicleId, seat) in rows)
        {
            activity.TransportAssignments.Add(
                TourInstanceTransportAssignmentEntity.Create(
                    activity.Id,
                    vehicleId,
                    Guid.NewGuid(),
                    seat,
                    "tester"));
        }

        var primary = rows[0].VehicleId;
        activity.VehicleId = primary;
        activity.DriverId = Guid.NewGuid();
        return activity;
    }
}
