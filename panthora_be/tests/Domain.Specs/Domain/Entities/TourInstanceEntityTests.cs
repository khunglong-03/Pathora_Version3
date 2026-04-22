using System;
using Domain.Entities;
using Domain.Enums;
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
            transportProviderId: Guid.NewGuid());

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
