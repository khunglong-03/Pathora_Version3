using global::Domain.Entities;
using global::Domain.Enums;
using global::Infrastructure.Data;
using global::Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Xunit;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Domain.Specs.Infrastructure.Repositories;

public sealed class AdminOverviewRepositoryTests
{
    private static AppDbContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task GetOverview_CalculatesPaymentStatsCorrectly_ExcludingRefundFromRevenueAndCompletedCount()
    {
        // Arrange
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);

        var tourInstance = new TourInstanceEntity
        {
            Id = Guid.NewGuid(),
            TourName = "Ha Long Bay Special",
            TourCode = "HLB001",
            TourInstanceCode = "HLB001-01",
            Title = "HLB Special",
            ClassificationName = "Eco",
            StartDate = DateTimeOffset.UtcNow.AddDays(10),
            Status = TourInstanceStatus.Available
        };
        context.TourInstances.Add(tourInstance);

        var booking = BookingEntity.Create(
            tourInstanceId: tourInstance.Id,
            customerName: "Nguyen Van A",
            customerPhone: "+84987654321",
            numberAdult: 2,
            totalPrice: 3000000m,
            paymentMethod: PaymentMethod.BankTransfer,
            isFullPay: true,
            performedBy: "TEST_USER");
        context.Bookings.Add(booking);

        // Seed 3 transactions:
        // 1. Deposit/Completed (1000000m) -> Should contribute to TotalRevenue and CompletedCount
        var tx1 = PaymentTransactionEntity.Create(
            bookingId: booking.Id,
            transactionCode: "TX1",
            type: TransactionType.Deposit,
            amount: 1000000m,
            paymentMethod: PaymentMethod.BankTransfer,
            paymentNote: "Deposit paid",
            createdBy: "TEST_USER");
        tx1.Id = Guid.Parse("11111111-1111-1111-1111-111111111111");
        tx1.MarkAsPaid(1000000m, DateTimeOffset.UtcNow);
        context.PaymentTransactions.Add(tx1);

        // 2. Refund/Completed (700000m) -> Should NOT contribute to TotalRevenue/CompletedCount, should count as RefundedCount
        var tx2 = PaymentTransactionEntity.Create(
            bookingId: booking.Id,
            transactionCode: "TX2",
            type: TransactionType.Refund,
            amount: 700000m,
            paymentMethod: PaymentMethod.BankTransfer,
            paymentNote: "Refund completed",
            createdBy: "TEST_USER");
        tx2.Id = Guid.Parse("22222222-2222-2222-2222-222222222222");
        tx2.MarkAsPaid(700000m, DateTimeOffset.UtcNow);
        context.PaymentTransactions.Add(tx2);

        // 3. Deposit/Pending (1500000m) -> Should count as PendingAmount and PendingCount
        var tx3 = PaymentTransactionEntity.Create(
            bookingId: booking.Id,
            transactionCode: "TX3",
            type: TransactionType.Deposit,
            amount: 1500000m,
            paymentMethod: PaymentMethod.BankTransfer,
            paymentNote: "Pending rest",
            createdBy: "TEST_USER");
        tx3.Id = Guid.Parse("33333333-3333-3333-3333-333333333333");
        context.PaymentTransactions.Add(tx3);

        await context.SaveChangesAsync();

        var repo = new AdminOverviewRepository(context);

        // Act
        var overview = await repo.GetOverview(null, CancellationToken.None);

        // Assert
        Assert.NotNull(overview);
        Assert.NotNull(overview.PaymentStats);

        // TotalRevenue: Should be 1000000m (tx1), not 1700000m (tx1 + tx2) and not 300000m
        Assert.Equal(1000000m, overview.PaymentStats.TotalRevenue);

        // PendingAmount: Should be 1500000m (tx3)
        Assert.Equal(1500000m, overview.PaymentStats.PendingAmount);

        // CompletedCount: Should be 1 (tx1), excluding tx2 (Refund)
        Assert.Equal(1, overview.PaymentStats.CompletedCount);

        // PendingCount: Should be 1 (tx3)
        Assert.Equal(1, overview.PaymentStats.PendingCount);

        // RefundedCount: Should be 1 (tx2)
        Assert.Equal(1, overview.PaymentStats.RefundedCount);

        // Assert payments listing status mapping:
        var listedTx2 = overview.Payments.Find(p => p.Id.Contains(tx2.Id.ToString("N")[..8].ToUpperInvariant()));
        Assert.NotNull(listedTx2);
        Assert.Equal("refunded", listedTx2.Status);
    }

    [Fact]
    public async Task GetOverview_ReturnsAllVisaApplicationsForManagerScope_Correctly()
    {
        // Arrange
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);

        var managerId = Guid.NewGuid();

        // 1. Create a Manager-scoped Tour
        var scopedTour = TourEntity.Create(
            tourName: "Scoped Tour",
            shortDescription: "Short",
            longDescription: "Long",
            performedBy: "TEST_USER",
            tourScope: TourScope.International,
            tourOperatorId: managerId,
            isVisa: true
        );
        context.Tours.Add(scopedTour);

        // 2. Create TourInstance for this scoped tour
        var scopedInstance = new TourInstanceEntity
        {
            Id = Guid.NewGuid(),
            TourId = scopedTour.Id,
            TourName = "Scoped Instance",
            TourCode = "SCOPED001",
            TourInstanceCode = "SCOPED001-01",
            Title = "Scoped Title",
            ClassificationName = "Eco",
            StartDate = DateTimeOffset.UtcNow.AddDays(10),
            Status = TourInstanceStatus.Available
        };
        context.TourInstances.Add(scopedInstance);

        // 3. Create out-of-scope Tour
        var unscopedTour = TourEntity.Create(
            tourName: "Unscoped Tour",
            shortDescription: "Short",
            longDescription: "Long",
            performedBy: "TEST_USER",
            tourScope: TourScope.International,
            tourOperatorId: Guid.NewGuid(), // out of scope
            isVisa: true
        );
        context.Tours.Add(unscopedTour);

        // 4. Create TourInstance for out-of-scope tour
        var unscopedInstance = new TourInstanceEntity
        {
            Id = Guid.NewGuid(),
            TourId = unscopedTour.Id,
            TourName = "Unscoped Instance",
            TourCode = "UNSCOPED001",
            TourInstanceCode = "UNSCOPED001-01",
            Title = "Unscoped Title",
            ClassificationName = "Eco",
            StartDate = DateTimeOffset.UtcNow.AddDays(10),
            Status = TourInstanceStatus.Available
        };
        context.TourInstances.Add(unscopedInstance);

        // 5. Create Bookings
        var scopedBooking = BookingEntity.Create(
            tourInstanceId: scopedInstance.Id,
            customerName: "Customer A",
            customerPhone: "+84987654321",
            numberAdult: 1,
            totalPrice: 1000000m,
            paymentMethod: PaymentMethod.BankTransfer,
            isFullPay: true,
            performedBy: "TEST_USER");
        context.Bookings.Add(scopedBooking);

        var unscopedBooking = BookingEntity.Create(
            tourInstanceId: unscopedInstance.Id,
            customerName: "Customer B",
            customerPhone: "+84987654321",
            numberAdult: 1,
            totalPrice: 1000000m,
            paymentMethod: PaymentMethod.BankTransfer,
            isFullPay: true,
            performedBy: "TEST_USER");
        context.Bookings.Add(unscopedBooking);

        // 6. Create Participants
        var participantA1 = BookingParticipantEntity.Create(scopedBooking.Id, "Adult", "Nguyen Van A1", "TEST_USER");
        var participantA2 = BookingParticipantEntity.Create(scopedBooking.Id, "Adult", "Nguyen Van A2", "TEST_USER");
        var participantA3 = BookingParticipantEntity.Create(scopedBooking.Id, "Adult", "Nguyen Van A3", "TEST_USER");
        var participantB = BookingParticipantEntity.Create(unscopedBooking.Id, "Adult", "Nguyen Van B", "TEST_USER");

        context.BookingParticipants.AddRange(participantA1, participantA2, participantA3, participantB);

        // 7. Create Passports
        var passportA1 = PassportEntity.Create(participantA1.Id, "PP-A1", "TEST_USER");
        var passportA2 = PassportEntity.Create(participantA2.Id, "PP-A2", "TEST_USER");
        var passportA3 = PassportEntity.Create(participantA3.Id, "PP-A3", "TEST_USER");
        var passportB = PassportEntity.Create(participantB.Id, "PP-B", "TEST_USER");

        context.Passports.AddRange(passportA1, passportA2, passportA3, passportB);

        // 8. Create Visa Applications
        // Scenario 1: Manager-scope system-assisted awaiting quote (IsSystemAssisted=true, ServiceFeePaidAt=null, ServiceFeeQuotedAt=null)
        var app1 = VisaApplicationEntity.Create(participantA1.Id, passportA1.Id, "Japan", "TEST_USER", isSystemAssisted: true);
        
        // Scenario 2: Manager-scope system-assisted awaiting payment (IsSystemAssisted=true, ServiceFeeQuotedAt != null, ServiceFeePaidAt=null)
        var app2 = VisaApplicationEntity.Create(participantA2.Id, passportA2.Id, "Japan", "TEST_USER", isSystemAssisted: true);
        app2.QuoteServiceFee(50m, Guid.NewGuid(), "TEST_USER");

        // Scenario 3: Manager-scope self-applied (IsSystemAssisted=false)
        var app3 = VisaApplicationEntity.Create(participantA3.Id, passportA3.Id, "Japan", "TEST_USER", isSystemAssisted: false);

        // Scenario 4: Out-of-scope visa application (unscoped TourInstance)
        var app4 = VisaApplicationEntity.Create(participantB.Id, passportB.Id, "Japan", "TEST_USER", isSystemAssisted: true);

        context.VisaApplications.AddRange(app1, app2, app3, app4);

        await context.SaveChangesAsync();

        var repo = new AdminOverviewRepository(context);

        // Act
        var overview = await repo.GetOverview(managerId, CancellationToken.None);

        // Assert
        Assert.NotNull(overview);
        Assert.NotNull(overview.VisaApplications);

        // Should return the 3 applications in manager's scope, and not the out-of-scope one.
        Assert.Equal(3, overview.VisaApplications.Count);

        var returnedIds = overview.VisaApplications.Select(v => v.Id).ToList();
        Assert.Contains(app1.Id.ToString(), returnedIds);
        Assert.Contains(app2.Id.ToString(), returnedIds);
        Assert.Contains(app3.Id.ToString(), returnedIds);
        Assert.DoesNotContain(app4.Id.ToString(), returnedIds);
    }
}
