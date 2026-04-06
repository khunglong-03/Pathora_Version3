using Application.Features.Admin.DTOs;
using Application.Features.Admin.Queries.GetTransportProviders;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Features.Admin.Queries;

public sealed class GetTransportProvidersQueryHandlerTests
{
    private readonly ISupplierRepository _supplierRepository;
    private readonly IUserRepository _userRepository;
    private readonly GetTransportProvidersQueryHandler _handler;

    public GetTransportProvidersQueryHandlerTests()
    {
        _supplierRepository = Substitute.For<ISupplierRepository>();
        _userRepository = Substitute.For<IUserRepository>();
        _handler = new GetTransportProvidersQueryHandler(_supplierRepository, _userRepository);
    }

    [Fact]
    public async Task Handle_ReturnsTransportProvidersFromSupplierRepository()
    {
        var providerId = Guid.NewGuid();
        var supplier = new SupplierEntity
        {
            Id = providerId,
            Name = "Transport Provider One",
            Email = "transport@example.com",
            Phone = "+84 111 222 333",
            SupplierType = SupplierType.Transport
        };
        var user = new UserEntity
        {
            Id = providerId,
            AvatarUrl = "https://example.com/transport.jpg",
            Status = UserStatus.Active
        };
        _supplierRepository.FindAllTransportProvidersAsync(Arg.Any<CancellationToken>())
            .Returns(new List<SupplierEntity> { supplier });
        _userRepository.FindById(providerId).Returns(user);

        var query = new GetTransportProvidersQuery();

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Single(result.Value.Items);
        Assert.Equal("Transport Provider One", result.Value.Items[0].FullName);
        Assert.Equal(0, result.Value.Items[0].BookingCount);
        Assert.Equal(1, result.Value.Total);
        Assert.Equal(1, result.Value.PageNumber);
        Assert.Equal(10, result.Value.PageSize);
    }

    [Fact]
    public async Task Handle_NoTransportProviders_ReturnsEmptyList()
    {
        _supplierRepository.FindAllTransportProvidersAsync(Arg.Any<CancellationToken>())
            .Returns(new List<SupplierEntity>());

        var query = new GetTransportProvidersQuery();

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Empty(result.Value.Items);
        Assert.Equal(0, result.Value.Total);
    }

    [Fact]
    public async Task Handle_UserHasInactiveStatus_ReturnsInactiveStatus()
    {
        var providerId = Guid.NewGuid();
        var supplier = new SupplierEntity
        {
            Id = providerId,
            Name = "Inactive Provider",
            Email = "inactive@example.com",
            Phone = "+84 111 222 333",
            SupplierType = SupplierType.Transport
        };
        var user = new UserEntity
        {
            Id = providerId,
            Status = UserStatus.Inactive
        };
        _supplierRepository.FindAllTransportProvidersAsync(Arg.Any<CancellationToken>())
            .Returns(new List<SupplierEntity> { supplier });
        _userRepository.FindById(providerId).Returns(user);

        var query = new GetTransportProvidersQuery();

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Single(result.Value.Items);
        Assert.Equal(UserStatus.Inactive, result.Value.Items[0].Status);
    }

    [Fact]
    public async Task Handle_MultipleProviders_ReturnsAll()
    {
        var p1 = new SupplierEntity { Id = Guid.NewGuid(), Name = "Provider 1", Email = "p1@example.com", Phone = "+1", SupplierType = SupplierType.Transport };
        var p2 = new SupplierEntity { Id = Guid.NewGuid(), Name = "Provider 2", Email = "p2@example.com", Phone = "+2", SupplierType = SupplierType.Transport };
        _supplierRepository.FindAllTransportProvidersAsync(Arg.Any<CancellationToken>())
            .Returns(new List<SupplierEntity> { p1, p2 });
        _userRepository.FindById(p1.Id).Returns((UserEntity?)null);
        _userRepository.FindById(p2.Id).Returns((UserEntity?)null);

        var query = new GetTransportProvidersQuery();

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal(2, result.Value.Items.Count);
        Assert.Equal(UserStatus.Inactive, result.Value.Items[0].Status);
        Assert.Equal(UserStatus.Inactive, result.Value.Items[1].Status);
        Assert.Equal(2, result.Value.Total);
    }
}
