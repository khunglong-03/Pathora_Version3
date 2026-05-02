using global::Application.Common.Interfaces;
using Contracts.Interfaces;
using global::Application.Dtos;
using global::Application.Features.TourInstance.Commands;
using global::Application.Services;
using AutoMapper;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using ErrorOr;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Services;

public class TourInstanceServiceDayActivityTests
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

    public TourInstanceServiceDayActivityTests()
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
    }

    [Fact]
    public async Task AddCustomDay_ShouldReturnError_WhenInstanceNotFound()
    {
        var command = new CreateTourInstanceDayCommand(Guid.NewGuid(), "Day 1", DateOnly.FromDateTime(DateTime.UtcNow), "Desc");
        _tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(command.InstanceId).Returns((TourInstanceEntity)null!);

        var result = await _sut.AddCustomDay(command);

        Assert.True(result.IsError);
        Assert.Equal("TourInstance.NotFound", result.FirstError.Code);
    }

    [Fact]
    public async Task AddCustomDay_ShouldReturnError_WhenDuplicateDate()
    {
        var instanceId = Guid.NewGuid();
        var date = DateOnly.FromDateTime(DateTime.UtcNow);
        var instance = new TourInstanceEntity
        {
            Id = instanceId,
            InstanceDays = new List<TourInstanceDayEntity>
            {
                new() { Id = Guid.NewGuid(), ActualDate = date }
            }
        };
        var command = new CreateTourInstanceDayCommand(instanceId, "Day 2", date, "Desc");
        
        _tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(instanceId).Returns(instance);

        var result = await _sut.AddCustomDay(command);

        Assert.True(result.IsError);
        Assert.Equal("TourInstanceDay.DuplicateDate", result.FirstError.Code);
    }

    [Fact]
    public async Task AddCustomDay_ShouldSucceed_AndExtendDateRange_WhenValid()
    {
        var instanceId = Guid.NewGuid();
        var date = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(5));
        var instance = new TourInstanceEntity
        {
            Id = instanceId,
            StartDate = DateTimeOffset.UtcNow,
            EndDate = DateTimeOffset.UtcNow.AddDays(2),
            InstanceDays = new List<TourInstanceDayEntity>()
        };
        var command = new CreateTourInstanceDayCommand(instanceId, "Day 2", date, "Desc");
        
        _tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(instanceId).Returns(instance);
        _user.Id.Returns("test-user");

        var result = await _sut.AddCustomDay(command);

        Assert.False(result.IsError);
        Assert.NotEqual(Guid.Empty, result.Value);
        Assert.Equal(date, DateOnly.FromDateTime(instance.EndDate.DateTime)); // EndDate should be extended
        await _tourInstanceRepository.Received(1).AddDay(Arg.Any<TourInstanceDayEntity>());
        await _tourInstanceRepository.Received(1).Update(instance);
    }

    [Fact]
    public async Task CreateActivity_ShouldReturnError_WhenInstanceNotFound()
    {
        var command = new CreateTourInstanceActivityCommand(Guid.NewGuid(), Guid.NewGuid(), "Act", global::Domain.Enums.TourDayActivityType.Sightseeing, null, null, null, null);
        _tourInstanceRepository.FindInstanceDayById(command.InstanceId, command.DayId).Returns((TourInstanceDayEntity)null!);

        var result = await _sut.CreateActivity(command);

        Assert.True(result.IsError);
        Assert.Equal("TourInstanceDay.NotFound", result.FirstError.Code);
    }

    [Fact]
    public async Task CreateActivity_ShouldReturnError_WhenDayNotFound()
    {
        var instanceId = Guid.NewGuid();
        var dayId = Guid.NewGuid();
        var command = new CreateTourInstanceActivityCommand(instanceId, dayId, "Act", global::Domain.Enums.TourDayActivityType.Sightseeing, null, null, null, null);
        
        _tourInstanceRepository.FindInstanceDayById(instanceId, dayId).Returns((TourInstanceDayEntity)null!);

        var result = await _sut.CreateActivity(command);

        Assert.True(result.IsError);
        Assert.Equal("TourInstanceDay.NotFound", result.FirstError.Code);
    }

    [Fact]
    public async Task CreateActivity_ShouldSucceed_WhenValid()
    {
        var instanceId = Guid.NewGuid();
        var dayId = Guid.NewGuid();
        var day = new TourInstanceDayEntity { Id = dayId, Activities = new List<TourInstanceDayActivityEntity>() };
        var command = new CreateTourInstanceActivityCommand(instanceId, dayId, "Act", global::Domain.Enums.TourDayActivityType.Sightseeing, null, null, null, null);
        
        _tourInstanceRepository.FindInstanceDayById(instanceId, dayId).Returns(day);
        _user.Id.Returns("test-user");
        _mapper.Map<TourInstanceDayActivityDto>(Arg.Any<TourInstanceDayActivityEntity>()).Returns(default(TourInstanceDayActivityDto)!);

        var result = await _sut.CreateActivity(command);

        Assert.False(result.IsError);
        await _tourInstanceRepository.Received(1).AddInstanceDayActivity(Arg.Any<TourInstanceDayActivityEntity>());
    }

    [Fact]
    public async Task CreateActivity_Flight_ShouldSetExternalFields()
    {
        var instanceId = Guid.NewGuid();
        var dayId = Guid.NewGuid();
        var day = new TourInstanceDayEntity { Id = dayId, Activities = new List<TourInstanceDayActivityEntity>() };
        var command = new CreateTourInstanceActivityCommand(
            instanceId, dayId, "Flight to HN", global::Domain.Enums.TourDayActivityType.Transportation,
            null, null, null, null, null, false,
            global::Domain.Enums.TransportationType.Flight,
            "VN Airlines",
            null, null,
            DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddHours(2),
            null, null, "VN123");
        
        _tourInstanceRepository.FindInstanceDayById(instanceId, dayId).Returns(day);
        
        var result = await _sut.CreateActivity(command);
        
        Assert.False(result.IsError);
        await _tourInstanceRepository.Received(1).AddInstanceDayActivity(Arg.Is<TourInstanceDayActivityEntity>(a =>
            a.TransportationType == global::Domain.Enums.TransportationType.Flight &&
            a.ExternalTransportReference == "VN123" &&
            a.DepartureTime.HasValue &&
            a.ArrivalTime.HasValue &&
            a.RequestedVehicleType == null
        ));
    }

    [Fact]
    public async Task CreateActivity_Car_ShouldSetGroundFields()
    {
        var instanceId = Guid.NewGuid();
        var dayId = Guid.NewGuid();
        var day = new TourInstanceDayEntity { Id = dayId, Activities = new List<TourInstanceDayActivityEntity>() };
        var command = new CreateTourInstanceActivityCommand(
            instanceId, dayId, "Car to Hotel", global::Domain.Enums.TourDayActivityType.Transportation,
            null, null, null, null, null, false,
            global::Domain.Enums.TransportationType.Car,
            null,
            null, null,
            null, null,
            global::Domain.Enums.VehicleType.Car, 4, null);
        
        _tourInstanceRepository.FindInstanceDayById(instanceId, dayId).Returns(day);
        
        var result = await _sut.CreateActivity(command);
        
        Assert.False(result.IsError);
        await _tourInstanceRepository.Received(1).AddInstanceDayActivity(Arg.Is<TourInstanceDayActivityEntity>(a =>
            a.TransportationType == global::Domain.Enums.TransportationType.Car &&
            a.RequestedVehicleType == global::Domain.Enums.VehicleType.Car &&
            a.RequestedSeatCount == 4 &&
            a.ExternalTransportReference == null
        ));
    }

    [Fact]
    public async Task UpdateActivity_ShouldReturnError_WhenInstanceNotFound()
    {
        var command = new UpdateTourInstanceActivityCommand(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
        _tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(command.InstanceId).Returns((TourInstanceEntity)null!);

        var result = await _sut.UpdateActivity(command);

        Assert.True(result.IsError);
        Assert.Equal("TourInstance.NotFound", result.FirstError.Code);
    }

    [Fact]
    public async Task UpdateActivity_ShouldReturnError_WhenDayNotFound()
    {
        var instanceId = Guid.NewGuid();
        var dayId = Guid.NewGuid();
        var command = new UpdateTourInstanceActivityCommand(instanceId, dayId, Guid.NewGuid());
        
        var instance = new TourInstanceEntity { Id = instanceId, InstanceDays = new List<TourInstanceDayEntity>() };
        _tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(instanceId).Returns(instance);

        var result = await _sut.UpdateActivity(command);

        Assert.True(result.IsError);
        Assert.Equal("TourInstance.NotFound", result.FirstError.Code);
        Assert.Equal("Tour instance day not found.", result.FirstError.Description);
    }

    [Fact]
    public async Task UpdateActivity_ShouldReturnError_WhenActivityNotFound()
    {
        var instanceId = Guid.NewGuid();
        var dayId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        var command = new UpdateTourInstanceActivityCommand(instanceId, dayId, activityId);
        
        var day = new TourInstanceDayEntity { Id = dayId, Activities = new List<TourInstanceDayActivityEntity>() };
        var instance = new TourInstanceEntity { Id = instanceId, InstanceDays = new List<TourInstanceDayEntity> { day } };
        _tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(instanceId).Returns(instance);

        var result = await _sut.UpdateActivity(command);

        Assert.True(result.IsError);
        Assert.Equal("TourInstance.NotFound", result.FirstError.Code);
        Assert.Equal("Activity not found.", result.FirstError.Description);
    }

    [Fact]
    public async Task UpdateActivity_ShouldSucceed_WhenValid()
    {
        var instanceId = Guid.NewGuid();
        var dayId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        var command = new UpdateTourInstanceActivityCommand(instanceId, dayId, activityId, Note: "Updated Note");
        
        var activity = new TourInstanceDayActivityEntity { Id = activityId };
        var day = new TourInstanceDayEntity { Id = dayId, Activities = new List<TourInstanceDayActivityEntity> { activity } };
        var instance = new TourInstanceEntity { Id = instanceId, InstanceDays = new List<TourInstanceDayEntity> { day } };
        
        _tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(instanceId).Returns(instance);
        _user.Id.Returns("test-user");

        var result = await _sut.UpdateActivity(command);

        Assert.False(result.IsError);
        Assert.Equal("Updated Note", activity.Note);
        await _tourInstanceRepository.Received(1).Update(instance);
    }

    [Fact]
    public async Task DeleteActivity_ShouldReturnError_WhenActivityNotFound()
    {
        var command = new DeleteTourInstanceActivityCommand(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
        _tourInstanceRepository.FindActivityByIdAsync(command.ActivityId).Returns((TourInstanceDayActivityEntity)null!);

        var result = await _sut.DeleteActivity(command);

        Assert.True(result.IsError);
        Assert.Equal("TourInstance.NotFound", result.FirstError.Code);
    }

    [Fact]
    public async Task DeleteActivity_ShouldSucceed_WhenValid()
    {
        var command = new DeleteTourInstanceActivityCommand(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
        var activity = new TourInstanceDayActivityEntity { Id = command.ActivityId };
        _tourInstanceRepository.FindActivityByIdAsync(command.ActivityId).Returns(activity);

        var result = await _sut.DeleteActivity(command);

        Assert.False(result.IsError);
        await _tourInstanceRepository.Received(1).DeleteInstanceDayActivity(activity);
    }

    [Fact]
    public async Task UpdateActivity_ChangeGroup_ShouldReject_WhenSupplierAssigned()
    {
        var instanceId = Guid.NewGuid();
        var dayId = Guid.NewGuid();
        var activityId = Guid.NewGuid();

        var activity = new TourInstanceDayActivityEntity { 
            Id = activityId, 
            ActivityType = global::Domain.Enums.TourDayActivityType.Transportation,
            TransportationType = global::Domain.Enums.TransportationType.Car,
            TransportSupplierId = Guid.NewGuid() // Supplier assigned
        };

        var instance = new TourInstanceEntity { Id = instanceId, InstanceDays = new List<TourInstanceDayEntity> { 
            new TourInstanceDayEntity { Id = dayId, Activities = new List<TourInstanceDayActivityEntity> { activity } }
        }};

        var command = new UpdateTourInstanceActivityCommand(instanceId, dayId, activityId, 
            TransportationType: global::Domain.Enums.TransportationType.Flight); // Changing Ground -> External
        
        _tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(instanceId).Returns(instance);
        
        var result = await _sut.UpdateActivity(command);
        
        Assert.True(result.IsError);
        Assert.Equal("TourInstanceActivity.CannotChangeTransportGroupWithSupplierAssigned", result.FirstError.Code);
    }

    [Fact]
    public async Task UpdateActivity_ChangeGroup_ShouldSucceed_WhenNoSupplier()
    {
        var instanceId = Guid.NewGuid();
        var dayId = Guid.NewGuid();
        var activityId = Guid.NewGuid();

        var activity = new TourInstanceDayActivityEntity { 
            Id = activityId, 
            ActivityType = global::Domain.Enums.TourDayActivityType.Transportation,
            TransportationType = global::Domain.Enums.TransportationType.Car,
            TransportSupplierId = null // No supplier
        };

        var instance = new TourInstanceEntity { Id = instanceId, InstanceDays = new List<TourInstanceDayEntity> { 
            new TourInstanceDayEntity { Id = dayId, Activities = new List<TourInstanceDayActivityEntity> { activity } }
        }};

        var command = new UpdateTourInstanceActivityCommand(instanceId, dayId, activityId, 
            TransportationType: global::Domain.Enums.TransportationType.Flight,
            ExternalTransportReference: "VN123");
        
        _tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(instanceId).Returns(instance);
        _user.Id.Returns("test-user");
        
        var result = await _sut.UpdateActivity(command);
        
        Assert.False(result.IsError);
        Assert.Equal(global::Domain.Enums.TransportationType.Flight, activity.TransportationType);
        Assert.Equal("VN123", activity.ExternalTransportReference);
        await _tourInstanceRepository.Received(1).Update(instance);
    }
}
