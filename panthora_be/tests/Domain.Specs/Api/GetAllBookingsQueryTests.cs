using global::Application.Features.BookingManagement.Queries;
using ErrorOr;

namespace Domain.Specs.Api;

public sealed class GetAllBookingsQueryTests
{
    [Fact]
    public void Constructor_WithDefaults_ShouldHavePageOneAndPageSizeTwenty()
    {
        var query = new GetAllBookingsQuery();

        Assert.Equal(1, query.Page);
        Assert.Equal(20, query.PageSize);
    }

    [Theory]
    [InlineData(1, 10)]
    [InlineData(5, 50)]
    [InlineData(999, 999)]
    public void Constructor_WithCustomValues_ShouldPreserveValues(int page, int pageSize)
    {
        var query = new GetAllBookingsQuery(page, pageSize);

        Assert.Equal(page, query.Page);
        Assert.Equal(pageSize, query.PageSize);
    }
}
