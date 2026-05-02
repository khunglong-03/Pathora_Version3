namespace Domain.Specs.Application.Features.Admin.Queries;

using global::Application.Features.Admin.Queries.GetTransportProviders;
using global::Domain.Common.Repositories;
using global::Domain.Enums;
using NSubstitute;
using Xunit;

public sealed class GetTransportProviderStatsQueryHandlerTests
{
    private readonly IUserRepository _userRepository;
    private readonly GetTransportProviderStatsQueryHandler _handler;

    public GetTransportProviderStatsQueryHandlerTests()
    {
        _userRepository = Substitute.For<IUserRepository>();
        _handler = new GetTransportProviderStatsQueryHandler(_userRepository);
    }

    [Fact]
    public async Task Handle_ReturnsCorrectStats()
    {
        // Arrange
        var search = "taxi";
        _userRepository.CountProvidersByRoleAsync(6, search, null, null, Arg.Any<CancellationToken>()).Returns(10);
        _userRepository.CountProvidersByRoleAsync(6, search, "Active", null, Arg.Any<CancellationToken>()).Returns(7);
        _userRepository.CountProvidersByRoleAsync(6, search, "Inactive", null, Arg.Any<CancellationToken>()).Returns(2);
        _userRepository.CountProvidersByRoleAsync(6, search, "Pending", null, Arg.Any<CancellationToken>()).Returns(1);

        var query = new GetTransportProviderStatsQuery(search);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(10, result.Value.Total);
        Assert.Equal(7, result.Value.Active);
        Assert.Equal(2, result.Value.Inactive);
        Assert.Equal(1, result.Value.Pending);
    }
}
