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
}
