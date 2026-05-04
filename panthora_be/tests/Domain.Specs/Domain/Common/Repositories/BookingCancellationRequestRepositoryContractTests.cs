using Domain.Common.Repositories;
using Domain.Entities;

namespace Domain.Specs.Domain.Common.Repositories;

public sealed class BookingCancellationRequestRepositoryContractTests
{
    [Fact]
    public void Interface_ShouldExposePendingLookupAddAndIdLookup()
    {
        var repositoryType = typeof(IBookingCancellationRequestRepository);

        Assert.NotNull(repositoryType.GetMethod(nameof(IBookingCancellationRequestRepository.GetPendingByBookingId)));
        Assert.NotNull(repositoryType.GetMethod(nameof(IBookingCancellationRequestRepository.Add)));
        Assert.NotNull(repositoryType.GetMethod(nameof(IBookingCancellationRequestRepository.GetById)));
    }

    [Fact]
    public void Methods_ShouldUseBookingCancellationRequestEntity()
    {
        var repositoryType = typeof(IBookingCancellationRequestRepository);

        Assert.Equal(
            typeof(Task<BookingCancellationRequestEntity>),
            repositoryType.GetMethod(nameof(IBookingCancellationRequestRepository.GetPendingByBookingId))!.ReturnType);
        Assert.Equal(
            typeof(Task<BookingCancellationRequestEntity>),
            repositoryType.GetMethod(nameof(IBookingCancellationRequestRepository.GetById))!.ReturnType);
        Assert.Equal(
            typeof(Task),
            repositoryType.GetMethod(nameof(IBookingCancellationRequestRepository.Add))!.ReturnType);
    }
}
