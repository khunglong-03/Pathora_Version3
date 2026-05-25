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
}
