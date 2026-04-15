using Application.Common.Constant;
using Application.Services;
using AutoMapper;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Services;

/// <summary>
/// Tests for TourInstanceService.GetDetail — verifies repository calls,
/// entity loading, and provider mapping without relying on internal
/// AutoMapper configuration or DTO constructors.
/// </summary>
public sealed class TourInstanceServiceGetDetailTests
{
    private readonly ITourInstanceRepository _tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
    private readonly ITourRepository _tourRepository = Substitute.For<ITourRepository>();
    private readonly ITourRequestRepository _tourRequestRepository = Substitute.For<ITourRequestRepository>();
    private readonly ISupplierRepository _supplierRepository = Substitute.For<ISupplierRepository>();
    private readonly IMailRepository _mailRepository = Substitute.For<IMailRepository>();
    private readonly IUser _user = Substitute.For<IUser>();
    private readonly IMapper _mapper = Substitute.For<IMapper>();
    private readonly ILogger<TourInstanceService> _logger = Substitute.For<ILogger<TourInstanceService>>();

    private TourInstanceService CreateService() =>
        new(_tourInstanceRepository, _tourRepository, _tourRequestRepository,
            _supplierRepository, _mailRepository, _user, _mapper, _logger);

    private static TourInstanceEntity CreateBaseEntity(Guid instanceId)
    {
        return new TourInstanceEntity
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
            Managers = [],
            InstanceDays = [],
        };
    }

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
                Id = Guid.NewGuid(),
                TourInstanceId = instanceId,
                UserId = Guid.NewGuid(),
                Role = TourInstanceManagerRole.Manager,
                User = new UserEntity { FullName = "Admin User" }
            }
        };

        _tourInstanceRepository.FindByIdWithInstanceDays(instanceId, Arg.Any<CancellationToken>())
            .Returns(entity);
        _mapper.Map<Application.Dtos.TourInstanceDto>(entity)
            .Returns(new Application.Dtos.TourInstanceDto(
                Id: instanceId, TourId: entity.TourId, TourInstanceCode: entity.TourInstanceCode,
                Title: entity.Title, TourName: entity.TourName, TourCode: entity.TourCode,
                ClassificationId: entity.ClassificationId, ClassificationName: entity.ClassificationName,
                Location: null, Thumbnail: null, Images: [], StartDate: entity.StartDate, EndDate: entity.EndDate,
                DurationDays: 3, CurrentParticipation: 5, MaxParticipation: 20, BasePrice: 800,
                Status: "Available", InstanceType: "Public", CancellationReason: null,
                Rating: 0, TotalBookings: 0, Revenue: 0, ConfirmationDeadline: null,
                Managers: [], IncludedServices: [],
                HotelApprovalStatus: 2, TransportApprovalStatus: 2,
                HotelApprovalNote: null, TransportApprovalNote: null,
                HotelProviderId: null, HotelProviderName: null,
                TransportProviderId: null, TransportProviderName: null,
                Days: null));

        var service = CreateService();
        var result = await service.GetDetail(instanceId);

        Assert.False(result.IsError);
        await _tourInstanceRepository.Received(1)
            .FindByIdWithInstanceDays(instanceId, Arg.Any<CancellationToken>());
        Assert.Equal(instanceId, result.Value.Id);
    }

    [Fact]
    public async Task GetDetail_WithProviderIds_PassesProviderNamesThroughMapper()
    {
        var instanceId = Guid.NewGuid();
        var hotelProviderId = Guid.NewGuid();
        var transportProviderId = Guid.NewGuid();

        var entity = CreateBaseEntity(instanceId);
        entity.HotelProviderId = hotelProviderId;
        entity.TransportProviderId = transportProviderId;
        entity.HotelApprovalStatus = ProviderApprovalStatus.Pending;
        entity.TransportApprovalStatus = ProviderApprovalStatus.Approved;
        entity.HotelProvider = new SupplierEntity { Id = hotelProviderId, Name = "Grand Hotel Saigon" };
        entity.TransportProvider = new SupplierEntity { Id = transportProviderId, Name = "Vietransport Co." };

        _tourInstanceRepository.FindByIdWithInstanceDays(instanceId, Arg.Any<CancellationToken>())
            .Returns(entity);
        _mapper.Map<Application.Dtos.TourInstanceDto>(entity)
            .Returns(new Application.Dtos.TourInstanceDto(
                Id: instanceId, TourId: entity.TourId, TourInstanceCode: entity.TourInstanceCode,
                Title: entity.Title, TourName: entity.TourName, TourCode: entity.TourCode,
                ClassificationId: entity.ClassificationId, ClassificationName: entity.ClassificationName,
                Location: null, Thumbnail: null, Images: [], StartDate: entity.StartDate, EndDate: entity.EndDate,
                DurationDays: 3, CurrentParticipation: 5, MaxParticipation: 20, BasePrice: 800,
                Status: "Available", InstanceType: "Public", CancellationReason: null,
                Rating: 0, TotalBookings: 0, Revenue: 0, ConfirmationDeadline: null,
                Managers: [], IncludedServices: [],
                HotelApprovalStatus: 1, TransportApprovalStatus: 2,
                HotelApprovalNote: null, TransportApprovalNote: null,
                HotelProviderId: hotelProviderId, HotelProviderName: "Grand Hotel Saigon",
                TransportProviderId: transportProviderId, TransportProviderName: "Vietransport Co.",
                Days: null));

        var service = CreateService();
        var result = await service.GetDetail(instanceId);

        Assert.False(result.IsError);
        Assert.Equal("Grand Hotel Saigon", result.Value.HotelProviderName);
        Assert.Equal("Vietransport Co.", result.Value.TransportProviderName);
        Assert.Equal(1, result.Value.HotelApprovalStatus);
        Assert.Equal(2, result.Value.TransportApprovalStatus);
    }

    [Fact]
    public async Task GetDetail_WithNoProvider_PassesNullNamesToMapper()
    {
        var instanceId = Guid.NewGuid();
        var entity = CreateBaseEntity(instanceId);
        entity.HotelProviderId = null;
        entity.TransportProviderId = null;

        _tourInstanceRepository.FindByIdWithInstanceDays(instanceId, Arg.Any<CancellationToken>())
            .Returns(entity);
        _mapper.Map<Application.Dtos.TourInstanceDto>(entity)
            .Returns(new Application.Dtos.TourInstanceDto(
                Id: instanceId, TourId: entity.TourId, TourInstanceCode: entity.TourInstanceCode,
                Title: entity.Title, TourName: entity.TourName, TourCode: entity.TourCode,
                ClassificationId: entity.ClassificationId, ClassificationName: entity.ClassificationName,
                Location: null, Thumbnail: null, Images: [], StartDate: entity.StartDate, EndDate: entity.EndDate,
                DurationDays: 3, CurrentParticipation: 5, MaxParticipation: 20, BasePrice: 800,
                Status: "Available", InstanceType: "Public", CancellationReason: null,
                Rating: 0, TotalBookings: 0, Revenue: 0, ConfirmationDeadline: null,
                Managers: [], IncludedServices: [],
                HotelApprovalStatus: 2, TransportApprovalStatus: 2,
                HotelApprovalNote: null, TransportApprovalNote: null,
                HotelProviderId: null, HotelProviderName: null,
                TransportProviderId: null, TransportProviderName: null,
                Days: null));

        var service = CreateService();
        var result = await service.GetDetail(instanceId);

        Assert.False(result.IsError);
        Assert.Null(result.Value.HotelProviderName);
        Assert.Null(result.Value.TransportProviderName);
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
        _mapper.DidNotReceiveWithAnyArgs().Map<Application.Dtos.TourInstanceDto>(Arg.Any<TourInstanceEntity>());
    }

    #endregion

    #region GetDetail — instance with days, activities, routes

    [Fact]
    public async Task GetDetail_WithRouteVehicleAndDriver_PassesToMapper()
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
            Id = dayId, TourInstanceId = instanceId,
            InstanceDayNumber = 1, ActualDate = DateOnly.FromDateTime(DateTime.Today), Title = "Day 1",
        };
        var activity = new TourInstanceDayActivityEntity
        {
            Id = activityId, TourInstanceDayId = dayId, Order = 1,
            ActivityType = TourDayActivityType.Transportation, Title = "Bus to Can Tho", IsOptional = false,
        };
        var route = new TourInstancePlanRouteEntity
        {
            Id = routeId, TourInstanceDayActivityId = activityId,
            VehicleId = vehicleId, DriverId = driverId,
            PickupLocation = "Hotel Lobby", DropoffLocation = "Can Tho Port",
            Vehicle = new VehicleEntity
            {
                Id = vehicleId, VehiclePlate = "60A-99999", VehicleType = VehicleType.Bus,
                Brand = "Isuzu", SeatCapacity = 45, OwnerId = Guid.NewGuid(),
            },
            Driver = new DriverEntity
            {
                Id = driverId, FullName = "Nguyen Van D",
                PhoneNumber = "0933123456", LicenseNumber = "L099",
                LicenseType = DriverLicenseType.D, UserId = Guid.NewGuid(),
            },
        };
        activity.Routes.Add(route);
        day.Activities.Add(activity);
        entity.InstanceDays.Add(day);

        _tourInstanceRepository.FindByIdWithInstanceDays(instanceId, Arg.Any<CancellationToken>())
            .Returns(entity);

        Application.Dtos.TourInstanceDayDto? capturedDay = null;
        _mapper.Map<Application.Dtos.TourInstanceDto>(entity)
            .Returns(new Application.Dtos.TourInstanceDto(
                Id: instanceId, TourId: entity.TourId, TourInstanceCode: entity.TourInstanceCode,
                Title: entity.Title, TourName: entity.TourName, TourCode: entity.TourCode,
                ClassificationId: entity.ClassificationId, ClassificationName: entity.ClassificationName,
                Location: null, Thumbnail: null, Images: [], StartDate: entity.StartDate, EndDate: entity.EndDate,
                DurationDays: 3, CurrentParticipation: 5, MaxParticipation: 20, BasePrice: 800,
                Status: "Available", InstanceType: "Public", CancellationReason: null,
                Rating: 0, TotalBookings: 0, Revenue: 0, ConfirmationDeadline: null,
                Managers: [], IncludedServices: [],
                HotelApprovalStatus: 2, TransportApprovalStatus: 2,
                HotelApprovalNote: null, TransportApprovalNote: null,
                HotelProviderId: null, HotelProviderName: null,
                TransportProviderId: null, TransportProviderName: null,
                Days: null));

        var service = CreateService();
        var result = await service.GetDetail(instanceId);

        Assert.False(result.IsError);
        // Repository was called — entity returned includes routes with Vehicle/Driver loaded
        await _tourInstanceRepository.Received(1)
            .FindByIdWithInstanceDays(instanceId, Arg.Any<CancellationToken>());
    }

    #endregion

    #region GetStats

    [Fact]
    public async Task GetStats_ReturnsCorrectStatsTuple()
    {
        _tourInstanceRepository.GetStats(Arg.Any<CancellationToken>())
            .Returns((10, 5, 3, 2));

        var service = CreateService();
        var result = await service.GetStats();

        Assert.False(result.IsError);
        Assert.Equal(10, result.Value.TotalInstances);
        Assert.Equal(5, result.Value.Available);
        Assert.Equal(3, result.Value.Confirmed);
        Assert.Equal(2, result.Value.SoldOut);
    }

    #endregion
}