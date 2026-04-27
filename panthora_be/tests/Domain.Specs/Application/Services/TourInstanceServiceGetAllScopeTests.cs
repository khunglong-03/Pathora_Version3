using global::Application.Common.Interfaces;
using global::Application.Dtos;
using global::Application.Features.TourInstance.Queries;
using global::Application.Services;
using AutoMapper;
using Contracts.Interfaces;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace Domain.Specs.Application.Services;

public sealed class TourInstanceServiceGetAllScopeTests
{
    private readonly ITourInstanceRepository _tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
    private readonly ITourRepository _tourRepository = Substitute.For<ITourRepository>();
    private readonly ITourRequestRepository _tourRequestRepository = Substitute.For<ITourRequestRepository>();
    private readonly ISupplierRepository _supplierRepository = Substitute.For<ISupplierRepository>();
    private readonly IVehicleRepository _vehicleRepository = Substitute.For<IVehicleRepository>();
    private readonly IMailRepository _mailRepository = Substitute.For<IMailRepository>();
    private readonly IRoomBlockRepository _roomBlockRepository = Substitute.For<IRoomBlockRepository>();
    private readonly IHotelRoomInventoryRepository _hotelRoomInventoryRepository = Substitute.For<IHotelRoomInventoryRepository>();
    private readonly IUser _user = Substitute.For<IUser>();
    private readonly IMapper _mapper = Substitute.For<IMapper>();
    private readonly ILogger<TourInstanceService> _logger = Substitute.For<ILogger<TourInstanceService>>();
    private readonly ICloudinaryService _cloudinaryService = Substitute.For<ICloudinaryService>();

    private readonly TourInstanceService _sut;

    public TourInstanceServiceGetAllScopeTests()
    {
        _sut = new TourInstanceService(
            _tourInstanceRepository,
            _tourRepository,
            _tourRequestRepository,
            _supplierRepository,
            _vehicleRepository,
            _mailRepository,
            _roomBlockRepository,
            _hotelRoomInventoryRepository,
            _user,
            _mapper,
            _logger,
            _cloudinaryService);

        _mapper.Map<TourInstanceVm>(Arg.Any<TourInstanceEntity>())
            .Returns(callInfo => CreateVm(callInfo.Arg<TourInstanceEntity>()));
    }

    [Fact]
    public async Task GetAll_WhenUserIdInvalid_ShouldReturnEmptyAndNotQueryRepository()
    {
        _user.Id.Returns("not-a-guid");
        var query = new GetAllTourInstancesQuery(null, null, 1, 10, false, "not-a-guid");

        var result = await _sut.GetAll(query);

        Assert.False(result.IsError);
        Assert.Equal(0, result.Value.Total);
        Assert.Empty(result.Value.Items);
        _ = _tourInstanceRepository.DidNotReceive().FindAll(
            Arg.Any<string?>(),
            Arg.Any<TourInstanceStatus?>(),
            Arg.Any<int>(),
            Arg.Any<int>(),
            Arg.Any<bool>(),
            Arg.Any<Guid?>(),
            Arg.Any<CancellationToken>());
        _ = _tourInstanceRepository.DidNotReceive().CountAll(
            Arg.Any<string?>(),
            Arg.Any<TourInstanceStatus?>(),
            Arg.Any<bool>(),
            Arg.Any<Guid?>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetAll_WhenUserIdValid_ShouldPassPrincipalToRepository()
    {
        var managerId = Guid.NewGuid();
        var entity = CreateEntity("Manager A instance");
        _user.Id.Returns(managerId.ToString());
        _tourInstanceRepository.FindAll(null, null, 1, 10, false, managerId, Arg.Any<CancellationToken>())
            .Returns(new List<TourInstanceEntity> { entity });
        _tourInstanceRepository.CountAll(null, null, false, managerId, Arg.Any<CancellationToken>())
            .Returns(1);

        var result = await _sut.GetAll(new GetAllTourInstancesQuery(null, null, 1, 10, false, managerId.ToString()));

        Assert.False(result.IsError);
        Assert.Equal(1, result.Value.Total);
        Assert.Single(result.Value.Items);
        Assert.Equal("Manager A instance", result.Value.Items[0].Title);
        await _tourInstanceRepository.Received(1).FindAll(null, null, 1, 10, false, managerId, Arg.Any<CancellationToken>());
        await _tourInstanceRepository.Received(1).CountAll(null, null, false, managerId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetAll_WhenManagersDiffer_ShouldReturnDisjointScopedLists()
    {
        var managerAId = Guid.NewGuid();
        var managerBId = Guid.NewGuid();
        var managerAEntity = CreateEntity("Manager A instance");
        var managerBEntity = CreateEntity("Manager B instance");

        _tourInstanceRepository.FindAll(null, null, 1, 10, false, managerAId, Arg.Any<CancellationToken>())
            .Returns(new List<TourInstanceEntity> { managerAEntity });
        _tourInstanceRepository.CountAll(null, null, false, managerAId, Arg.Any<CancellationToken>())
            .Returns(1);
        _tourInstanceRepository.FindAll(null, null, 1, 10, false, managerBId, Arg.Any<CancellationToken>())
            .Returns(new List<TourInstanceEntity> { managerBEntity });
        _tourInstanceRepository.CountAll(null, null, false, managerBId, Arg.Any<CancellationToken>())
            .Returns(1);

        _user.Id.Returns(managerAId.ToString());
        var managerAResult = await _sut.GetAll(new GetAllTourInstancesQuery(null, null, 1, 10, false, managerAId.ToString()));

        _user.Id.Returns(managerBId.ToString());
        var managerBResult = await _sut.GetAll(new GetAllTourInstancesQuery(null, null, 1, 10, false, managerBId.ToString()));

        Assert.False(managerAResult.IsError);
        Assert.False(managerBResult.IsError);
        Assert.Equal("Manager A instance", Assert.Single(managerAResult.Value.Items).Title);
        Assert.Equal("Manager B instance", Assert.Single(managerBResult.Value.Items).Title);
    }

    [Fact]
    public async Task GetAll_WhenManagerHasNoAssignments_ShouldReturnEmpty()
    {
        var managerId = Guid.NewGuid();
        _user.Id.Returns(managerId.ToString());
        _tourInstanceRepository.FindAll(null, null, 1, 10, false, managerId, Arg.Any<CancellationToken>())
            .Returns(new List<TourInstanceEntity>());
        _tourInstanceRepository.CountAll(null, null, false, managerId, Arg.Any<CancellationToken>())
            .Returns(0);

        var result = await _sut.GetAll(new GetAllTourInstancesQuery(null, null, 1, 10, false, managerId.ToString()));

        Assert.False(result.IsError);
        Assert.Equal(0, result.Value.Total);
        Assert.Empty(result.Value.Items);
        await _tourInstanceRepository.Received(1).FindAll(null, null, 1, 10, false, managerId, Arg.Any<CancellationToken>());
    }

    private static TourInstanceEntity CreateEntity(string title)
    {
        return new TourInstanceEntity
        {
            Id = Guid.NewGuid(),
            TourId = Guid.NewGuid(),
            ClassificationId = Guid.NewGuid(),
            TourInstanceCode = "TI-001",
            Title = title,
            TourName = "Tour name",
            TourCode = "TOUR-001",
            ClassificationName = "Standard",
            StartDate = DateTimeOffset.UtcNow,
            EndDate = DateTimeOffset.UtcNow.AddDays(1),
            DurationDays = 2,
            MaxParticipation = 10,
            BasePrice = 1000m,
            Status = TourInstanceStatus.Available,
            InstanceType = TourType.Public
        };
    }

    private static TourInstanceVm CreateVm(TourInstanceEntity entity)
    {
        return new TourInstanceVm(
            entity.Id,
            entity.TourId,
            entity.TourInstanceCode,
            entity.Title,
            entity.TourName,
            entity.TourCode,
            entity.ClassificationName,
            entity.Location,
            null,
            [],
            entity.StartDate,
            entity.EndDate,
            entity.DurationDays,
            entity.CurrentParticipation,
            entity.MaxParticipation,
            entity.BasePrice,
            entity.Status.ToString(),
            entity.InstanceType.ToString());
    }
}
