using Application.Features.Admin.DTOs;
using Application.Features.Admin.Queries.GetHotelProviders;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using global::Contracts;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Features.Admin.Queries;

public sealed class GetHotelProvidersQueryHandlerTests
{
    private readonly ISupplierRepository _supplierRepository;
    private readonly IUserRepository _userRepository;
    private readonly GetHotelProvidersQueryHandler _handler;

    public GetHotelProvidersQueryHandlerTests()
    {
        _supplierRepository = Substitute.For<ISupplierRepository>();
        _userRepository = Substitute.For<IUserRepository>();
        _handler = new GetHotelProvidersQueryHandler(_supplierRepository, _userRepository);
    }

    [Fact]
    public async Task Handle_ReturnsHotelProvidersFromSupplierRepository()
    {
        var providerId = Guid.NewGuid();
        var supplier = new SupplierEntity
        {
            Id = providerId,
            Name = "Hotel Provider One",
            Email = "hotel@example.com",
            Phone = "+84 444 555 666",
            SupplierType = SupplierType.Accommodation
        };
        var user = new UserEntity
        {
            Id = providerId,
            AvatarUrl = "https://example.com/hotel.jpg",
            Status = UserStatus.Active
        };
        _supplierRepository.FindAllHotelProvidersAsync(Arg.Any<CancellationToken>())
            .Returns(new List<SupplierEntity> { supplier });
        _userRepository.FindById(providerId).Returns(user);

        var query = new GetHotelProvidersQuery();

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Single(result.Value.Items);
        Assert.Equal("Hotel Provider One", result.Value.Items[0].FullName);
        Assert.Equal(0, result.Value.Items[0].AccommodationCount);
    }

    [Fact]
    public async Task Handle_NoHotelProviders_ReturnsEmptyList()
    {
        _supplierRepository.FindAllHotelProvidersAsync(Arg.Any<CancellationToken>())
            .Returns(new List<SupplierEntity>());

        var query = new GetHotelProvidersQuery();

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Empty(result.Value.Items);
    }

    [Fact]
    public async Task Handle_UserHasInactiveStatus_ReturnsInactiveStatus()
    {
        var providerId = Guid.NewGuid();
        var supplier = new SupplierEntity
        {
            Id = providerId,
            Name = "Inactive Hotel",
            Email = "inactive@example.com",
            Phone = "+84 444 555 666",
            SupplierType = SupplierType.Accommodation
        };
        var user = new UserEntity
        {
            Id = providerId,
            Status = UserStatus.Inactive
        };
        _supplierRepository.FindAllHotelProvidersAsync(Arg.Any<CancellationToken>())
            .Returns(new List<SupplierEntity> { supplier });
        _userRepository.FindById(providerId).Returns(user);

        var query = new GetHotelProvidersQuery();

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal(UserStatus.Inactive, result.Value.Items[0].Status);
    }

    [Fact]
    public async Task Handle_MultipleProviders_ReturnsAll()
    {
        var p1 = new SupplierEntity { Id = Guid.NewGuid(), Name = "Hotel 1", Email = "h1@example.com", Phone = "+1", SupplierType = SupplierType.Accommodation };
        var p2 = new SupplierEntity { Id = Guid.NewGuid(), Name = "Hotel 2", Email = "h2@example.com", Phone = "+2", SupplierType = SupplierType.Accommodation };
        _supplierRepository.FindAllHotelProvidersAsync(Arg.Any<CancellationToken>())
            .Returns(new List<SupplierEntity> { p1, p2 });
        _userRepository.FindById(p1.Id).Returns((UserEntity?)null);
        _userRepository.FindById(p2.Id).Returns((UserEntity?)null);

        var query = new GetHotelProvidersQuery();

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal(2, result.Value.Items.Count);
    }
}
