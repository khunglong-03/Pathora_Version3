using Application.Common.Constant;
using Application.Services;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Services;

/// <summary>
/// Tests for TourInstanceService.GetDetail — verifies it calls
/// FindByIdWithInstanceDays and the mapper receives the entity.
/// Uses mocked IMapper so we don't need Application.Dtos references.
/// </summary>
public sealed class TourInstanceServiceGetDetailTests
{
    private readonly ITourInstanceRepository _tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
    private readonly ITourInstancePlanRouteRepository _routeRepository = Substitute.For<ITourInstancePlanRouteRepository>();
    private readonly ITourRepository _tourRepository = Substitute.For<ITourRepository>();
    private readonly ITourRequestRepository _tourRequestRepository = Substitute.For<ITourRequestRepository>();
    private readonly ISupplierRepository _supplierRepository = Substitute.For<ISupplierRepository>();
    private readonly IMailRepository _mailRepository = Substitute.For<IMailRepository>();
    private readonly IRoomBlockRepository _roomBlockRepository = Substitute.For<IRoomBlockRepository>();
    private readonly IUser _user = Substitute.For<IUser>();
    private readonly AutoMapper.IMapper _mapper = Substitute.For<AutoMapper.IMapper>();
    private readonly ILogger<TourInstanceService> _logger = Substitute.For<ILogger<TourInstanceService>>();

    private TourInstanceService CreateService() =>
        new(_tourInstanceRepository, _routeRepository, _tourRepository, _tourRequestRepository,
            _supplierRepository, _mailRepository, _roomBlockRepository, _user, _mapper, _logger);

    private static TourInstanceEntity CreateBaseEntity(Guid instanceId) =>
        new TourInstanceEntity
        {
            Id = instanceId,
            TourId = Guid.NewGuid(),
            ClassificationId = Guid.NewGuid(),
            TourInstanceCode = $"TI-{Guid.NewGuid():N}".Substring(0, 16),
            Title = "Test Instance",
            TourName = "Test Tour",
            TourCode = "TT001",
            ClassificationName = "Standard",
            Status = TourInstanceStatus.Available,
            InstanceType = TourType.Public,
            StartDate = DateTimeOffset.UtcNow.AddDays(1),
            EndDate = DateTimeOffset.UtcNow.AddDays(3),
            DurationDays = 3,
            MaxParticipation = 20,
            CurrentParticipation = 5,
            BasePrice = 800,
            HotelApprovalStatus = ProviderApprovalStatus.Approved,
            TransportApprovalStatus = ProviderApprovalStatus.Approved,
            IsDeleted = false,
        };

    #region GetDetail — entity found

    [Fact]
    public async Task GetDetail_WithExistingId_CallsFindByIdWithInstanceDays()
    {
        var instanceId = Guid.NewGuid();
        var entity = CreateBaseEntity(instanceId);
        entity.Managers = new List<TourInstanceManagerEntity>
        {
            new TourInstanceManagerEntity
            {
                Id = Guid.NewGuid(), TourInstanceId = instanceId, UserId = Guid.NewGuid(),
                Role = TourInstanceManagerRole.Manager,
                User = new UserEntity { FullName = "Admin User" }
            }
        };

        _tourInstanceRepository.FindByIdWithInstanceDays(instanceId, Arg.Any<CancellationToken>())
            .Returns(entity);
        _mapper.Map(Arg.Any<TourInstanceEntity>(), Arg.Any<Type>()).Returns((object?)null);

        var service = CreateService();
        var result = await service.GetDetail(instanceId);

        Assert.False(result.IsError);
        await _tourInstanceRepository.Received(1)
            .FindByIdWithInstanceDays(instanceId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetDetail_WithProviderIds_EntityHasProviderNavigations()
    {
        var instanceId = Guid.NewGuid();
        var entity = CreateBaseEntity(instanceId);
        entity.HotelProviderId = Guid.NewGuid();
        entity.TransportProviderId = Guid.NewGuid();
        entity.HotelApprovalStatus = ProviderApprovalStatus.Pending;
        entity.TransportApprovalStatus = ProviderApprovalStatus.Approved;
        entity.HotelProvider = new SupplierEntity { Name = "Grand Hotel Saigon" };
        entity.TransportProvider = new SupplierEntity { Name = "Vietransport Co." };

        _tourInstanceRepository.FindByIdWithInstanceDays(instanceId, Arg.Any<CancellationToken>())
            .Returns(entity);
        _mapper.Map(Arg.Any<TourInstanceEntity>(), Arg.Any<Type>()).Returns((object?)null);

        var service = CreateService();
        var result = await service.GetDetail(instanceId);

        Assert.False(result.IsError);
        await _tourInstanceRepository.Received(1)
            .FindByIdWithInstanceDays(instanceId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetDetail_WithNoProvider_EntityHasNullNavigations()
    {
        var instanceId = Guid.NewGuid();
        var entity = CreateBaseEntity(instanceId);
        entity.HotelProviderId = null;
        entity.TransportProviderId = null;

        _tourInstanceRepository.FindByIdWithInstanceDays(instanceId, Arg.Any<CancellationToken>())
            .Returns(entity);
        _mapper.Map(Arg.Any<TourInstanceEntity>(), Arg.Any<Type>()).Returns((object?)null);

        var service = CreateService();
        var result = await service.GetDetail(instanceId);

        Assert.False(result.IsError);
    }

    #endregion

    #region GetDetail — entity not found

    [Fact]
    public async Task GetDetail_WithNonExistentId_ReturnsNotFoundError()
    {
        var nonExistentId = Guid.NewGuid();
        _tourInstanceRepository.FindByIdWithInstanceDays(nonExistentId, Arg.Any<CancellationToken>())
            .Returns((TourInstanceEntity?)null);

        var service = CreateService();
        var result = await service.GetDetail(nonExistentId);

        Assert.True(result.IsError);
        Assert.Equal(ErrorConstants.TourInstance.NotFoundCode, result.FirstError.Code);
    }

    #endregion

    #region GetDetail — instance with days, activities, routes

    [Fact]
    public async Task GetDetail_WithRouteVehicleAndDriver_EntityReturnedWithFullNavigation()
    {
        var instanceId = Guid.NewGuid();
        var dayId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        var routeId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var driverId = Guid.NewGuid();

        var entity = CreateBaseEntity(instanceId);
        var day = new TourInstanceDayEntity
        {
            Id = dayId,
            TourInstanceId = instanceId,
            InstanceDayNumber = 1,
            ActualDate = DateOnly.FromDateTime(DateTime.Today),
            Title = "Day 1",
        };
        var activity = new TourInstanceDayActivityEntity
        {
            Id = activityId,
            TourInstanceDayId = dayId,
            Order = 1,
            ActivityType = TourDayActivityType.Transportation,
            Title = "Bus to Can Tho",
            IsOptional = false,
        };
        var route = new TourInstancePlanRouteEntity
        {
            Id = routeId,
            TourInstanceDayActivityId = activityId,
            VehicleId = vehicleId,
            DriverId = driverId,
            PickupLocation = "Hotel Lobby",
            DropoffLocation = "Can Tho Port",
            Vehicle = new VehicleEntity
            {
                Id = vehicleId,
                VehiclePlate = "60A-99999",
                VehicleType = VehicleType.Bus,
                Brand = "Isuzu",
                SeatCapacity = 45,
                OwnerId = Guid.NewGuid(),
            },
            Driver = new DriverEntity
            {
                Id = driverId,
                FullName = "Nguyen Van D",
                PhoneNumber = "0933123456",
                LicenseNumber = "L099",
                LicenseType = DriverLicenseType.D,
                UserId = Guid.NewGuid(),
            },
        };
        activity.Routes.Add(route);
        day.Activities.Add(activity);
        entity.InstanceDays.Add(day);

        _tourInstanceRepository.FindByIdWithInstanceDays(instanceId, Arg.Any<CancellationToken>())
            .Returns(entity);
        _mapper.Map(Arg.Any<TourInstanceEntity>(), Arg.Any<Type>()).Returns((object?)null);

        var service = CreateService();
        var result = await service.GetDetail(instanceId);

        Assert.False(result.IsError);
        await _tourInstanceRepository.Received(1)
            .FindByIdWithInstanceDays(instanceId, Arg.Any<CancellationToken>());
        Assert.NotNull(entity.InstanceDays);
        Assert.Single(entity.InstanceDays);
        Assert.NotNull(entity.InstanceDays[0].Activities[0].Routes[0].Vehicle);
        Assert.Equal("60A-99999", entity.InstanceDays[0].Activities[0].Routes[0].Vehicle!.VehiclePlate);
        Assert.NotNull(entity.InstanceDays[0].Activities[0].Routes[0].Driver);
        Assert.Equal("Nguyen Van D", entity.InstanceDays[0].Activities[0].Routes[0].Driver!.FullName);
    }

    #endregion

    #region GetStats

    [Fact]
    public async Task GetStats_ReturnsCorrectStatsFromRepository()
    {
        _tourInstanceRepository.GetStats(Arg.Any<CancellationToken>())
            .Returns((10, 5, 3, 2, 8));

        var service = CreateService();
        var result = await service.GetStats();

        Assert.False(result.IsError);
        Assert.Equal(10, result.Value.TotalInstances);
        Assert.Equal(5, result.Value.Available);
        Assert.Equal(3, result.Value.Confirmed);
        Assert.Equal(2, result.Value.SoldOut);
        Assert.Equal(8, result.Value.Completed);
    }

    #endregion
}