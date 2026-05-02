using Domain.Entities;
using Domain.Enums;
using Xunit;

namespace Domain.Specs.Domain.Entities;

public class BookingEntityTests
{
    private static BookingEntity CreateValidBooking()
    {
        return BookingEntity.Create(
            Guid.NewGuid(), "Customer", "123", 1, 1000m, PaymentMethod.VnPay, true, "TEST");
    }

    [Fact]
    public void AddVisaServiceFee_WithPositiveAmount_ShouldIncreaseTotals()
    {
        var booking = CreateValidBooking();
        var initialTotal = booking.TotalPrice;
        var fee = 100m;

        booking.AddVisaServiceFee(fee, "TEST");

        Assert.Equal(fee, booking.VisaServiceFeeTotal);
        Assert.Equal(initialTotal + fee, booking.TotalPrice);
    }

    [Fact]
    public void AddVisaServiceFee_WithZeroOrNegativeAmount_ShouldThrow()
    {
        var booking = CreateValidBooking();

        var act1 = () => booking.AddVisaServiceFee(0m, "TEST");
        var act2 = () => booking.AddVisaServiceFee(-100m, "TEST");

        Assert.Throws<ArgumentOutOfRangeException>(act1);
        Assert.Throws<ArgumentOutOfRangeException>(act2);
    }
}
