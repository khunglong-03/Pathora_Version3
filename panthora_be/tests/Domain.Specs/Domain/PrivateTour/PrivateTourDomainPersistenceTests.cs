using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Domain.Specs.Domain.PrivateTour;

/// <summary>OpenSpec private-custom-tour — entity / mapping checks (tasks 1.1–1.7 coverage).</summary>
public sealed class PrivateTourDomainPersistenceTests
{
    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public void TourInstance_CreatePrivate_ShouldStartInDraft()
    {
        var ti = TourInstanceEntity.Create(
            tourId: Guid.NewGuid(),
            classificationId: Guid.NewGuid(),
            title: "Private",
            tourName: "T",
            tourCode: "TC",
            classificationName: "C",
            instanceType: TourType.Private,
            startDate: DateTimeOffset.UtcNow,
            endDate: DateTimeOffset.UtcNow.AddDays(2),
            maxParticipation: 4,
            basePrice: 1000m,
            performedBy: "test");

        Assert.Equal(TourInstanceStatus.Draft, ti.Status);
    }

    [Fact]
    public void TourInstance_ShouldExposeFinalSellPrice_WithoutReplacingBasePrice()
    {
        var ti = TourInstanceEntity.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "x", "n", "c", "cn",
            TourType.Private,
            DateTimeOffset.UtcNow,
            DateTimeOffset.UtcNow.AddDays(1),
            2,
            500m,
            "u");
        ti.FinalSellPrice = 450m;

        Assert.Equal(500m, ti.BasePrice);
        Assert.Equal(450m, ti.FinalSellPrice);
    }

    [Fact]
    public async Task TourItineraryFeedback_ShouldPersist_WithForeignKeys()
    {
        await using var ctx = CreateContext();
        var tourId = Guid.NewGuid();
        var classificationId = Guid.NewGuid();
        var thumb = new ImageEntity { FileId = "f", FileName = "x", PublicURL = "u" };
        var ti = TourInstanceEntity.Create(
            tourId, classificationId, "t", "n", "c", "cn",
            TourType.Private,
            DateTimeOffset.UtcNow,
            DateTimeOffset.UtcNow.AddDays(1),
            2, 100m, "u", thumbnail: thumb);
        ctx.TourInstances.Add(ti);
        await ctx.SaveChangesAsync();

        var day = TourInstanceDayEntity.Create(
            ti.Id,
            tourDayId: Guid.NewGuid(),
            instanceDayNumber: 1,
            actualDate: DateOnly.FromDateTime(DateTime.UtcNow),
            title: "D1",
            performedBy: "u");
        ctx.TourInstanceDays.Add(day);
        await ctx.SaveChangesAsync();

        var booking = BookingEntity.Create(
            ti.Id,
            "c",
            "0909",
            2,
            100m,
            PaymentMethod.BankTransfer,
            isFullPay: true,
            performedBy: "u");
        ctx.Bookings.Add(booking);
        await ctx.SaveChangesAsync();

        var fb = TourItineraryFeedbackEntity.Create(
            ti.Id,
            day.Id,
            "Need earlier flight",
            isFromCustomer: true,
            performedBy: "u",
            bookingId: booking.Id);
        ctx.TourItineraryFeedbacks.Add(fb);
        await ctx.SaveChangesAsync();

        Assert.NotEqual(Guid.Empty, fb.Id);
        var reload = await ctx.TourItineraryFeedbacks.FindAsync(fb.Id);
        Assert.NotNull(reload);
        Assert.Equal(day.Id, reload!.TourInstanceDayId);
    }

    [Fact]
    public async Task TransactionHistory_ShouldPersist_Credit_ToUser()
    {
        await using var ctx = CreateContext();
        var user = UserEntity.Create("u1", null, "e@e.com", "hash", "seed");
        ctx.Users.Add(user);
        await ctx.SaveChangesAsync();

        var booking = BookingEntity.Create(
            Guid.NewGuid(),
            "c",
            "1",
            1,
            10m,
            PaymentMethod.BankTransfer,
            true,
            performedBy: "u",
            userId: user.Id);

        ctx.Bookings.Add(booking);
        await ctx.SaveChangesAsync();

        var th = TransactionHistoryEntity.CreateCredit(
            user.Id,
            25.5m,
            "Delta refund to wallet",
            "system",
            booking.Id);
        ctx.TransactionHistories.Add(th);
        await ctx.SaveChangesAsync();

        var loaded = await ctx.TransactionHistories.SingleAsync();
        Assert.Equal(25.5m, loaded.Amount);
        Assert.Equal(user.Id, loaded.UserId);
    }

    [Fact]
    public void TourInstance_Draft_CanMoveToPendingAdjustment_ThenConfirmed()
    {
        var ti = TourInstanceEntity.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "t", "n", "c", "cn",
            TourType.Private,
            DateTimeOffset.UtcNow,
            DateTimeOffset.UtcNow.AddDays(1),
            2,
            100m,
            "u");

        ti.ChangeStatus(TourInstanceStatus.PendingAdjustment, "op");
        Assert.Equal(TourInstanceStatus.PendingAdjustment, ti.Status);

        ti.ChangeStatus(TourInstanceStatus.Confirmed, "op");
        Assert.Equal(TourInstanceStatus.Confirmed, ti.Status);
    }

    [Fact]
    public void Booking_Paid_CanMoveToPendingAdjustment_ThenPaidAgain()
    {
        var b = BookingEntity.Create(
            Guid.NewGuid(),
            "c",
            "1",
            1,
            100m,
            PaymentMethod.BankTransfer,
            true,
            "u");
        b.Confirm("u");
        b.MarkDeposited("u");
        b.MarkPaid("u");

        b.MarkPendingAdjustment("u");
        Assert.Equal(BookingStatus.PendingAdjustment, b.Status);

        b.MarkPaid("u");
        Assert.Equal(BookingStatus.Paid, b.Status);
    }
}
