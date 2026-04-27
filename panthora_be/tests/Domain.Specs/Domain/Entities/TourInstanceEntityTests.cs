using System;
using global::Domain.Entities;
using global::Domain.Enums;
using Xunit;

namespace Domain.Specs.Entities;

public sealed class TourInstanceEntityTests
{
    [Fact]
    public void AreAllAccommodationsApproved_MixedStatuses_ReturnsFalse()
    {
        var instance = TourInstanceEntity.Create(
            tourId: Guid.NewGuid(),
            classificationId: Guid.NewGuid(),
            title: "Test Instance",
            tourName: "Test Tour",
            tourCode: "TOUR-001",
            classificationName: "Standard",
            instanceType: TourType.Public,
            startDate: DateTimeOffset.UtcNow.Date,
            endDate: DateTimeOffset.UtcNow.Date.AddDays(1),
            maxParticipation: 10,
            basePrice: 100,
            performedBy: "tester");

        var firstDay = TourInstanceDayEntity.Create(
            instance.Id,
            Guid.NewGuid(),
            1,
            DateOnly.FromDateTime(DateTime.UtcNow.Date),
            "Day 1",
            "tester");
        var secondDay = TourInstanceDayEntity.Create(
            instance.Id,
            Guid.NewGuid(),
            2,
            DateOnly.FromDateTime(DateTime.UtcNow.Date.AddDays(1)),
            "Day 2",
            "tester");

        var approvedActivity = TourInstanceDayActivityEntity.Create(
            firstDay.Id,
            1,
            TourDayActivityType.Accommodation,
            "Hotel 1",
            "tester");
        approvedActivity.Accommodation = TourInstancePlanAccommodationEntity.Create(
            approvedActivity.Id,
            RoomType.Standard,
            1,
            supplierId: Guid.NewGuid());
        approvedActivity.Accommodation.ApproveBySupplier(true, "approved");

        var pendingActivity = TourInstanceDayActivityEntity.Create(
            secondDay.Id,
            1,
            TourDayActivityType.Accommodation,
            "Hotel 2",
            "tester");
        pendingActivity.Accommodation = TourInstancePlanAccommodationEntity.Create(
            pendingActivity.Id,
            RoomType.Deluxe,
            1,
            supplierId: Guid.NewGuid());

        firstDay.Activities.Add(approvedActivity);
        secondDay.Activities.Add(pendingActivity);
        instance.InstanceDays.Add(firstDay);
        instance.InstanceDays.Add(secondDay);

        Assert.False(instance.AreAllAccommodationsApproved());
    }

    [Fact]
    public void CheckAndActivateTourInstance_AllAccommodationAndTransportationApproved_SetsAvailable()
    {
        var instance = CreatePendingApprovalInstance();
        var day = CreateDay(instance, 1);

        day.Activities.Add(CreateApprovedAccommodation(day));
        day.Activities.Add(CreateTransportation(day, ProviderApprovalStatus.Approved));
        instance.InstanceDays.Add(day);

        instance.CheckAndActivateTourInstance();

        Assert.Equal(TourInstanceStatus.Available, instance.Status);
    }

    [Fact]
    public void CheckAndActivateTourInstance_PendingOrRejectedTransportation_RemainsPendingApproval()
    {
        var pendingInstance = CreatePendingApprovalInstance();
        var pendingDay = CreateDay(pendingInstance, 1);
        pendingDay.Activities.Add(CreateApprovedAccommodation(pendingDay));
        pendingDay.Activities.Add(CreateTransportation(pendingDay, ProviderApprovalStatus.Pending));
        pendingInstance.InstanceDays.Add(pendingDay);

        pendingInstance.CheckAndActivateTourInstance();

        Assert.Equal(TourInstanceStatus.PendingApproval, pendingInstance.Status);

        var rejectedInstance = CreatePendingApprovalInstance();
        var rejectedDay = CreateDay(rejectedInstance, 1);
        rejectedDay.Activities.Add(CreateApprovedAccommodation(rejectedDay));
        rejectedDay.Activities.Add(CreateTransportation(rejectedDay, ProviderApprovalStatus.Rejected));
        rejectedInstance.InstanceDays.Add(rejectedDay);

        rejectedInstance.CheckAndActivateTourInstance();

        Assert.Equal(TourInstanceStatus.PendingApproval, rejectedInstance.Status);
    }

    [Fact]
    public void AreAllTransportationApproved_NoAssignedSupplier_ReturnsTrue()
    {
        var instance = CreatePendingApprovalInstance();
        var day = CreateDay(instance, 1);

        day.Activities.Add(TourInstanceDayActivityEntity.Create(
            day.Id,
            1,
            TourDayActivityType.Transportation,
            "Unassigned transfer",
            "tester"));
        instance.InstanceDays.Add(day);

        Assert.True(instance.AreAllTransportationApproved());
    }

    [Fact]
    public void AreAllTransportationApproved_WalkingActivityWithSupplier_IsExcluded()
    {
        // Edge: Walking activity that somehow has a supplier (legacy/manual mistake) should not block readiness.
        var instance = CreatePendingApprovalInstance();
        var day = CreateDay(instance, 1);

        var walking = TourInstanceDayActivityEntity.Create(
            day.Id,
            1,
            TourDayActivityType.Transportation,
            "Walk to museum",
            "tester",
            transportationType: TransportationType.Walking);
        walking.TransportSupplierId = Guid.NewGuid();
        walking.TransportationApprovalStatus = ProviderApprovalStatus.Pending;

        day.Activities.Add(walking);
        instance.InstanceDays.Add(day);

        Assert.True(instance.AreAllTransportationApproved());
    }

    [Fact]
    public void AreAllTransportationApproved_WalkingPlusPendingBus_StillFalseDueToBus()
    {
        var instance = CreatePendingApprovalInstance();
        var day = CreateDay(instance, 1);

        var walking = TourInstanceDayActivityEntity.Create(
            day.Id,
            1,
            TourDayActivityType.Transportation,
            "Walk",
            "tester",
            transportationType: TransportationType.Walking);

        var bus = TourInstanceDayActivityEntity.Create(
            day.Id,
            2,
            TourDayActivityType.Transportation,
            "Bus transfer",
            "tester",
            transportationType: TransportationType.Bus);
        bus.AssignTransportSupplier(Guid.NewGuid(), VehicleType.Coach, 12);

        day.Activities.Add(walking);
        day.Activities.Add(bus);
        instance.InstanceDays.Add(day);

        Assert.False(instance.AreAllTransportationApproved());
    }

    [Fact]
    public void AreAllExternalTransportConfirmed_OnlyWalking_ReturnsTrue()
    {
        var instance = CreatePendingApprovalInstance();
        var day = CreateDay(instance, 1);

        var walking = TourInstanceDayActivityEntity.Create(
            day.Id,
            1,
            TourDayActivityType.Transportation,
            "Walk",
            "tester",
            transportationType: TransportationType.Walking);

        day.Activities.Add(walking);
        instance.InstanceDays.Add(day);

        Assert.True(instance.AreAllExternalTransportConfirmed());
    }

    [Fact]
    public void AreAllExternalTransportConfirmed_FlightUnconfirmed_ReturnsFalse()
    {
        var instance = CreatePendingApprovalInstance();
        var day = CreateDay(instance, 1);

        var flight = TourInstanceDayActivityEntity.Create(
            day.Id,
            1,
            TourDayActivityType.Transportation,
            "Hanoi → Saigon",
            "tester",
            transportationType: TransportationType.Flight);

        day.Activities.Add(flight);
        instance.InstanceDays.Add(day);

        Assert.False(instance.AreAllExternalTransportConfirmed());
    }

    [Fact]
    public void AreAllExternalTransportConfirmed_FlightConfirmedAndGroundIgnored_ReturnsTrue()
    {
        var instance = CreatePendingApprovalInstance();
        var day = CreateDay(instance, 1);

        var flight = TourInstanceDayActivityEntity.Create(
            day.Id,
            1,
            TourDayActivityType.Transportation,
            "Hanoi → Saigon",
            "tester",
            transportationType: TransportationType.Flight,
            bookingReference: "VN-12345");
        flight.DepartureTime = DateTimeOffset.UtcNow.AddDays(1);
        flight.ArrivalTime = DateTimeOffset.UtcNow.AddDays(1).AddHours(2);
        flight.ConfirmExternalTransport("manager");

        var bus = TourInstanceDayActivityEntity.Create(
            day.Id,
            2,
            TourDayActivityType.Transportation,
            "Bus to airport",
            "tester",
            transportationType: TransportationType.Bus);

        day.Activities.Add(flight);
        day.Activities.Add(bus);
        instance.InstanceDays.Add(day);

        Assert.True(instance.AreAllExternalTransportConfirmed());
    }

    [Fact]
    public void CheckAndActivateTourInstance_IgnoresSoftDeletedPendingTransportationDay()
    {
        var instance = CreatePendingApprovalInstance();

        var activeDay = CreateDay(instance, 1);
        activeDay.Activities.Add(CreateApprovedAccommodation(activeDay));
        activeDay.Activities.Add(CreateTransportation(activeDay, ProviderApprovalStatus.Approved));

        var deletedDay = CreateDay(instance, 2);
        deletedDay.IsDeleted = true;
        deletedDay.Activities.Add(CreateTransportation(deletedDay, ProviderApprovalStatus.Pending));

        instance.InstanceDays.Add(activeDay);
        instance.InstanceDays.Add(deletedDay);

        instance.CheckAndActivateTourInstance();

        Assert.Equal(TourInstanceStatus.Available, instance.Status);
    }

    private static TourInstanceEntity CreatePendingApprovalInstance()
    {
        var instance = TourInstanceEntity.Create(
            tourId: Guid.NewGuid(),
            classificationId: Guid.NewGuid(),
            title: "Approval Test Instance",
            tourName: "Approval Test Tour",
            tourCode: "TOUR-APPROVAL",
            classificationName: "Standard",
            instanceType: TourType.Public,
            startDate: DateTimeOffset.UtcNow.Date,
            endDate: DateTimeOffset.UtcNow.Date.AddDays(2),
            maxParticipation: 10,
            basePrice: 100,
            performedBy: "tester",
            requiresApproval: true);

        instance.Status = TourInstanceStatus.PendingApproval;
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

    private static TourInstanceDayActivityEntity CreateApprovedAccommodation(TourInstanceDayEntity day)
    {
        var activity = TourInstanceDayActivityEntity.Create(
            day.Id,
            1,
            TourDayActivityType.Accommodation,
            "Hotel stay",
            "tester");

        activity.Accommodation = TourInstancePlanAccommodationEntity.Create(
            activity.Id,
            RoomType.Standard,
            1,
            supplierId: Guid.NewGuid());
        activity.Accommodation.ApproveBySupplier(true, "approved");

        return activity;
    }

    private static TourInstanceDayActivityEntity CreateTransportation(
        TourInstanceDayEntity day,
        ProviderApprovalStatus status)
    {
        var activity = TourInstanceDayActivityEntity.Create(
            day.Id,
            day.Activities.Count + 1,
            TourDayActivityType.Transportation,
            "Coach transfer",
            "tester");

        activity.AssignTransportSupplier(Guid.NewGuid(), VehicleType.Coach, 12);

        switch (status)
        {
            case ProviderApprovalStatus.Approved:
                activity.ApproveTransportation(Guid.NewGuid(), Guid.NewGuid(), "approved");
                break;
            case ProviderApprovalStatus.Rejected:
                activity.RejectTransportation("rejected");
                break;
        }

        return activity;
    }
}
