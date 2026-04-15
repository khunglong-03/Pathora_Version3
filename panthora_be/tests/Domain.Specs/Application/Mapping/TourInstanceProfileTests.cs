using global::Application.Dtos;
using global::Application.Mapping;
using Domain.Entities;
using Domain.Enums;
using AutoMapper;
using Xunit;

namespace Domain.Specs.Application.Mapping;

/// <summary>
/// Tests verifying TourInstanceProfile AutoMapper mappings correctly
/// map vehicle/driver/provider fields through to DTOs.
/// </summary>
public sealed class TourInstanceProfileTests
{
    private static IMapper CreateMapper()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile<TourInstanceProfile>());
        return config.CreateMapper();
    }

    #region TourInstanceEntity → TourInstanceDto (provider fields)

    [Fact]
    public void Map_TourInstanceEntity_WithHotelProvider_MapsHotelProviderName()
    {
        var mapper = CreateMapper();
        var entity = new TourInstanceEntity
        {
            Id = Guid.NewGuid(),
            TourId = Guid.NewGuid(),
            ClassificationId = Guid.NewGuid(),
            TourInstanceCode = "TI-001",
            Title = "Ha Long Bay Tour",
            TourName = "Ha Long",
            TourCode = "HL001",
            ClassificationName = "Standard",
            Status = TourInstanceStatus.Available,
            InstanceType = TourType.Public,
            StartDate = DateTimeOffset.UtcNow.AddDays(1),
            EndDate = DateTimeOffset.UtcNow.AddDays(3),
            DurationDays = 3,
            MaxParticipation = 20,
            CurrentParticipation = 5,
            BasePrice = 500,
            HotelProviderId = Guid.NewGuid(),
            HotelApprovalStatus = ProviderApprovalStatus.Approved,
            TransportProviderId = null,
            TransportApprovalStatus = ProviderApprovalStatus.Pending,
            HotelProvider = new SupplierEntity { Name = "Grand Hotel" },
            IsDeleted = false,
        };

        var dto = mapper.Map<TourInstanceDto>(entity);

        Assert.Equal(entity.Id, dto.Id);
        Assert.Equal("Grand Hotel", dto.HotelProviderName);
        Assert.Equal(entity.HotelProviderId, dto.HotelProviderId);
        Assert.Equal(2, dto.HotelApprovalStatus);
    }

    [Fact]
    public void Map_TourInstanceEntity_WithTransportProvider_MapsTransportProviderName()
    {
        var mapper = CreateMapper();
        var entity = new TourInstanceEntity
        {
            Id = Guid.NewGuid(),
            TourId = Guid.NewGuid(),
            ClassificationId = Guid.NewGuid(),
            TourInstanceCode = "TI-002",
            Title = "Da Nang Tour",
            TourName = "Da Nang",
            TourCode = "DN001",
            ClassificationName = "Premium",
            Status = TourInstanceStatus.Available,
            InstanceType = TourType.Public,
            StartDate = DateTimeOffset.UtcNow.AddDays(1),
            EndDate = DateTimeOffset.UtcNow.AddDays(4),
            DurationDays = 4,
            MaxParticipation = 30,
            CurrentParticipation = 10,
            BasePrice = 800,
            HotelProviderId = null,
            TransportProviderId = Guid.NewGuid(),
            TransportApprovalStatus = ProviderApprovalStatus.Approved,
            HotelApprovalStatus = ProviderApprovalStatus.Approved,
            TransportProvider = new SupplierEntity { Name = "Vietransport Co." },
            IsDeleted = false,
        };

        var dto = mapper.Map<TourInstanceDto>(entity);

        Assert.Equal("Vietransport Co.", dto.TransportProviderName);
        Assert.Equal(entity.TransportProviderId, dto.TransportProviderId);
        Assert.Equal(2, dto.TransportApprovalStatus);
    }

    [Fact]
    public void Map_TourInstanceEntity_WithNoProvider_MapsNullNames()
    {
        var mapper = CreateMapper();
        var entity = new TourInstanceEntity
        {
            Id = Guid.NewGuid(),
            TourId = Guid.NewGuid(),
            ClassificationId = Guid.NewGuid(),
            TourInstanceCode = "TI-003",
            Title = "Sapa Tour",
            TourName = "Sapa",
            TourCode = "SP001",
            ClassificationName = "Economy",
            Status = TourInstanceStatus.Available,
            InstanceType = TourType.Private,
            StartDate = DateTimeOffset.UtcNow.AddDays(1),
            EndDate = DateTimeOffset.UtcNow.AddDays(2),
            DurationDays = 2,
            MaxParticipation = 15,
            CurrentParticipation = 0,
            BasePrice = 300,
            HotelProviderId = null,
            TransportProviderId = null,
            HotelApprovalStatus = ProviderApprovalStatus.Approved,
            TransportApprovalStatus = ProviderApprovalStatus.Approved,
            IsDeleted = false,
        };

        var dto = mapper.Map<TourInstanceDto>(entity);

        Assert.Null(dto.HotelProviderName);
        Assert.Null(dto.TransportProviderName);
        Assert.Null(dto.HotelProviderId);
        Assert.Null(dto.TransportProviderId);
    }

    [Fact]
    public void Map_TourInstanceEntity_IncludesInstanceDays()
    {
        var mapper = CreateMapper();
        var instanceId = Guid.NewGuid();
        var dayId = Guid.NewGuid();
        var activityId = Guid.NewGuid();

        var entity = new TourInstanceEntity
        {
            Id = instanceId,
            TourId = Guid.NewGuid(),
            ClassificationId = Guid.NewGuid(),
            TourInstanceCode = "TI-004",
            Title = "Mekong Tour",
            TourName = "Mekong",
            TourCode = "MK001",
            ClassificationName = "Standard",
            Status = TourInstanceStatus.Available,
            InstanceType = TourType.Public,
            StartDate = DateTimeOffset.UtcNow.AddDays(1),
            EndDate = DateTimeOffset.UtcNow.AddDays(2),
            DurationDays = 2,
            MaxParticipation = 25,
            CurrentParticipation = 5,
            BasePrice = 600,
            HotelApprovalStatus = ProviderApprovalStatus.Approved,
            TransportApprovalStatus = ProviderApprovalStatus.Approved,
            IsDeleted = false,
            InstanceDays = new List<TourInstanceDayEntity>
            {
                new TourInstanceDayEntity
                {
                    Id = dayId,
                    TourInstanceId = instanceId,
                    InstanceDayNumber = 1,
                    ActualDate = DateOnly.FromDateTime(DateTime.Today),
                    Title = "Day 1",
                    Activities = new List<TourInstanceDayActivityEntity>
                    {
                        new TourInstanceDayActivityEntity
                        {
                            Id = activityId,
                            Order = 1,
                            ActivityType = TourDayActivityType.Transportation,
                            Title = "Bus to Can Tho",
                            IsOptional = false,
                        }
                    }
                }
            }
        };

        var dto = mapper.Map<TourInstanceDto>(entity);

        Assert.NotNull(dto.Days);
        Assert.Single(dto.Days!);
        Assert.Equal(dayId, dto.Days![0].Id);
        Assert.Equal(1, dto.Days![0].InstanceDayNumber);
        Assert.Single(dto.Days![0].Activities);
        Assert.Equal("Transportation", dto.Days![0].Activities[0].ActivityType);
    }

    #endregion

    #region TourInstancePlanRouteEntity → TourInstancePlanRouteDto (vehicle/driver fields)

    [Fact]
    public void Map_TourInstancePlanRouteEntity_WithVehicleAndDriver_MapsAllVehicleFields()
    {
        var mapper = CreateMapper();
        var vehicleId = Guid.NewGuid();
        var driverId = Guid.NewGuid();

        var route = new TourInstancePlanRouteEntity
        {
            Id = Guid.NewGuid(),
            TourInstanceDayActivityId = Guid.NewGuid(),
            VehicleId = vehicleId,
            DriverId = driverId,
            PickupLocation = "Tan Son Nhat Airport",
            DropoffLocation = "District 1 Hotel",
            DepartureTime = DateTimeOffset.UtcNow.AddHours(14),
            ArrivalTime = DateTimeOffset.UtcNow.AddHours(15),
            Vehicle = new VehicleEntity
            {
                Id = vehicleId,
                VehiclePlate = "30A-12345",
                VehicleType = VehicleType.Bus,
                Brand = "Hyundai",
                Model = "County",
                SeatCapacity = 45,
                OwnerId = Guid.NewGuid(),
            },
            Driver = new DriverEntity
            {
                Id = driverId,
                FullName = "Nguyen Van A",
                PhoneNumber = "0909123456",
                LicenseNumber = "L001",
                LicenseType = DriverLicenseType.E,
                UserId = Guid.NewGuid(),
            }
        };

        var dto = mapper.Map<TourInstancePlanRouteDto>(route);

        Assert.Equal(vehicleId, dto.VehicleId);
        Assert.Equal(driverId, dto.DriverId);
        Assert.Equal("30A-12345", dto.VehiclePlate);
        Assert.Equal("Bus", dto.VehicleType);
        Assert.Equal("Hyundai", dto.VehicleBrand);
        Assert.Equal("County", dto.VehicleModel);
        Assert.Equal(45, dto.SeatCapacity);
        Assert.Equal("Nguyen Van A", dto.DriverName);
        Assert.Equal("0909123456", dto.DriverPhone);
        Assert.Equal("Tan Son Nhat Airport", dto.PickupLocation);
        Assert.Equal("District 1 Hotel", dto.DropoffLocation);
        Assert.NotNull(dto.DepartureTime);
        Assert.NotNull(dto.ArrivalTime);
    }

    [Fact]
    public void Map_TourInstancePlanRouteEntity_WithVehicleOnly_MapsVehicleFieldsDriverNull()
    {
        var mapper = CreateMapper();
        var vehicleId = Guid.NewGuid();

        var route = new TourInstancePlanRouteEntity
        {
            Id = Guid.NewGuid(),
            TourInstanceDayActivityId = Guid.NewGuid(),
            VehicleId = vehicleId,
            DriverId = null,
            PickupLocation = "Hotel Lobby",
            DropoffLocation = "Airport",
            DepartureTime = DateTimeOffset.UtcNow.AddHours(10),
            ArrivalTime = DateTimeOffset.UtcNow.AddHours(11),
            Vehicle = new VehicleEntity
            {
                Id = vehicleId,
                VehiclePlate = "51B-88888",
                VehicleType = VehicleType.Car,
                Brand = "Toyota",
                Model = "Camry",
                SeatCapacity = 5,
                OwnerId = Guid.NewGuid(),
            }
        };

        var dto = mapper.Map<TourInstancePlanRouteDto>(route);

        Assert.Equal(vehicleId, dto.VehicleId);
        Assert.Null(dto.DriverId);
        Assert.Equal("51B-88888", dto.VehiclePlate);
        Assert.Equal("Car", dto.VehicleType);
        Assert.Equal("Toyota", dto.VehicleBrand);
        Assert.Equal("Camry", dto.VehicleModel);
        Assert.Equal(5, dto.SeatCapacity);
        Assert.Null(dto.DriverName);
        Assert.Null(dto.DriverPhone);
    }

    [Fact]
    public void Map_TourInstancePlanRouteEntity_WithNoVehicleOrDriver_MapsNulls()
    {
        var mapper = CreateMapper();

        var route = new TourInstancePlanRouteEntity
        {
            Id = Guid.NewGuid(),
            TourInstanceDayActivityId = Guid.NewGuid(),
            VehicleId = null,
            DriverId = null,
            PickupLocation = "Meeting Point",
            DropoffLocation = "Beach",
        };

        var dto = mapper.Map<TourInstancePlanRouteDto>(route);

        Assert.Null(dto.VehicleId);
        Assert.Null(dto.DriverId);
        Assert.Null(dto.VehiclePlate);
        Assert.Null(dto.VehicleType);
        Assert.Null(dto.VehicleBrand);
        Assert.Null(dto.VehicleModel);
        Assert.Null(dto.SeatCapacity);
        Assert.Null(dto.DriverName);
        Assert.Null(dto.DriverPhone);
        Assert.Equal("Meeting Point", dto.PickupLocation);
        Assert.Equal("Beach", dto.DropoffLocation);
    }

    [Fact]
    public void Map_TourInstancePlanRouteEntity_WithNullVehicleNavigation_MapsVehicleIdOnly()
    {
        var mapper = CreateMapper();
        var vehicleId = Guid.NewGuid();

        var route = new TourInstancePlanRouteEntity
        {
            Id = Guid.NewGuid(),
            TourInstanceDayActivityId = Guid.NewGuid(),
            VehicleId = vehicleId,
            Vehicle = null,
            DriverId = null,
        };

        var dto = mapper.Map<TourInstancePlanRouteDto>(route);

        Assert.Equal(vehicleId, dto.VehicleId);
        Assert.Null(dto.VehiclePlate);
        Assert.Null(dto.VehicleType);
        Assert.Null(dto.VehicleBrand);
        Assert.Null(dto.VehicleModel);
        Assert.Null(dto.SeatCapacity);
    }

    [Fact]
    public void Map_TourInstancePlanRouteEntity_WithNullDriverNavigation_MapsDriverIdOnly()
    {
        var mapper = CreateMapper();
        var driverId = Guid.NewGuid();

        var route = new TourInstancePlanRouteEntity
        {
            Id = Guid.NewGuid(),
            TourInstanceDayActivityId = Guid.NewGuid(),
            VehicleId = null,
            DriverId = driverId,
            Driver = null,
        };

        var dto = mapper.Map<TourInstancePlanRouteDto>(route);

        Assert.Null(dto.VehicleId);
        Assert.Equal(driverId, dto.DriverId);
        Assert.Null(dto.DriverName);
        Assert.Null(dto.DriverPhone);
    }

    #endregion

    #region TourInstanceManagerEntity → TourInstanceManagerDto

    [Fact]
    public void Map_TourInstanceManagerEntity_WithUser_MapsUserNameAndAvatar()
    {
        var mapper = CreateMapper();
        var userId = Guid.NewGuid();
        var managerId = Guid.NewGuid();

        var entity = new TourInstanceManagerEntity
        {
            Id = managerId,
            TourInstanceId = Guid.NewGuid(),
            UserId = userId,
            Role = TourInstanceManagerRole.Guide,
            User = new UserEntity
            {
                Id = userId,
                FullName = "Tran Thi B",
                AvatarUrl = "https://cdn.example.com/avatar.jpg",
            }
        };

        var dto = mapper.Map<TourInstanceManagerDto>(entity);

        Assert.Equal(managerId, dto.Id);
        Assert.Equal(userId, dto.UserId);
        Assert.Equal("Tran Thi B", dto.UserName);
        Assert.Equal("https://cdn.example.com/avatar.jpg", dto.UserAvatar);
        Assert.Equal("Guide", dto.Role);
    }

    [Fact]
    public void Map_TourInstanceManagerEntity_WithManagerRole_MapsCorrectRole()
    {
        var mapper = CreateMapper();

        var entity = new TourInstanceManagerEntity
        {
            Id = Guid.NewGuid(),
            TourInstanceId = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Role = TourInstanceManagerRole.Manager,
            User = new UserEntity { Id = Guid.NewGuid(), FullName = "Le Van C" }
        };

        var dto = mapper.Map<TourInstanceManagerDto>(entity);

        Assert.Equal("Manager", dto.Role);
    }

    #endregion
}
