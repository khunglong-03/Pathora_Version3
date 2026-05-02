using global::Application.Services;

namespace Domain.Specs.Application.Services;

public sealed class SepayParsingHelperTests
{
    // ParseAmount tests

    [Theory]
    [InlineData("+6.000 đ", 6000)]
    [InlineData("120.000đ", 120000)]
    [InlineData("+6000", 6000)]
    [InlineData("6,000", 6000)]
    [InlineData("+120.000.000 đ", 120000000)]
    public void ParseAmount_SePayFormat_ReturnsCorrectDecimal(string input, decimal expected)
    {
        var result = SepayParsingHelper.ParseAmount(input, null);
        Assert.Equal(expected, result);
    }

    [Fact]
    public void ParseAmount_NullInput_ReturnsZero()
    {
        Assert.Equal(0m, SepayParsingHelper.ParseAmount(null, null));
    }

    [Fact]
    public void ParseAmount_EmptyInput_ReturnsZero()
    {
        Assert.Equal(0m, SepayParsingHelper.ParseAmount("", ""));
    }

    [Fact]
    public void ParseAmount_WhitespaceInput_ReturnsZero()
    {
        Assert.Equal(0m, SepayParsingHelper.ParseAmount("   ", "   "));
    }

    [Fact]
    public void ParseAmount_AmountOutFallback_ReturnsAmountOut()
    {
        // When amountIn is null, should fallback to amountOut
        var result = SepayParsingHelper.ParseAmount(null, "+9.000 đ");
        Assert.Equal(9000m, result);
    }

    [Fact]
    public void ParseAmount_BothNull_ReturnsZero()
    {
        Assert.Equal(0m, SepayParsingHelper.ParseAmount(null, null));
    }

    [Fact]
    public void ParseAmount_AmountInHasPriority()
    {
        // When amountIn is valid, should use it even if amountOut exists
        var result = SepayParsingHelper.ParseAmount("+6.000 đ", "+9.000 đ");
        Assert.Equal(6000m, result);
    }

    // ParseDate tests

    [Fact]
    public void ParseDate_VietnameseFormat_ReturnsCorrectDate()
    {
        var result = SepayParsingHelper.ParseDate("02/04/2026 03:50:00");
        Assert.Equal(2026, result.Year);
        Assert.Equal(4, result.Month);  // April, not February
        Assert.Equal(2, result.Day);
        Assert.Equal(3, result.Hour);
        Assert.Equal(50, result.Minute);
    }

    [Theory]
    [InlineData("2026-04-02 03:50:00")]
    [InlineData("2026/04/02 03:50:00")]
    public void ParseDate_IsoFormat_ParsesCorrectly(string input)
    {
        var result = SepayParsingHelper.ParseDate(input);
        Assert.Equal(2026, result.Year);
        Assert.Equal(4, result.Month);
        Assert.Equal(2, result.Day);
    }

    [Fact]
    public void ParseDate_NullInput_ReturnsUtcNow()
    {
        var before = DateTimeOffset.UtcNow;
        var result = SepayParsingHelper.ParseDate(null);
        var after = DateTimeOffset.UtcNow;

        Assert.InRange(result, before, after);
    }

    [Fact]
    public void ParseDate_EmptyInput_ReturnsUtcNow()
    {
        var before = DateTimeOffset.UtcNow;
        var result = SepayParsingHelper.ParseDate("");
        var after = DateTimeOffset.UtcNow;

        Assert.InRange(result, before, after);
    }

    // ToTransactionData tests

    [Fact]
    public void ToTransactionData_MapsReferenceCode()
    {
        var sePayTx = new SePayTransaction
        {
            id = "tx-123",
            transaction_date = "02/04/2026 03:50:00",
            amount_in = "+6.000 đ",
            transaction_content = "PAY-20260401204934-67ECC922|26040120K188|Payment for Tour",
            reference_number = "26040120K188",
            gateway = "MBBank"
        };

        var result = SepayParsingHelper.ToTransactionData(sePayTx);

        Assert.Equal("tx-123", result.TransactionId);
        Assert.Equal(6000m, result.Amount);
        Assert.Equal("26040120K188", result.ReferenceCode);
        Assert.Equal("26040120K188", result.ReferenceNumber);
    }

    [Fact]
    public void ToTransactionData_NullReferenceNumber_SetsEmptyString()
    {
        var sePayTx = new SePayTransaction
        {
            id = "tx-123",
            transaction_date = "2026-04-02 03:50:00",
            amount_in = "+6000",
            reference_number = null
        };

        var result = SepayParsingHelper.ToTransactionData(sePayTx);

        Assert.Equal(string.Empty, result.ReferenceCode);
        Assert.Equal(string.Empty, result.ReferenceNumber);
    }

    [Fact]
    public void ToTransactionData_NullId_ThrowsArgumentNullException()
    {
        var sePayTx = new SePayTransaction { id = null };
        Assert.Throws<ArgumentNullException>(() => SepayParsingHelper.ToTransactionData(sePayTx));
    }
}
