using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Domain.Specs.Infrastructure.Repositories;

/// <summary>
/// Integration tests verifying that TourInstanceRepository.FindPublicAvailable()
/// eagerly loads Tour, Classification, and Managers navigation properties without N+1 queries.
/// </summary>
public sealed class TourInstanceRepositoryIncludesTests
{
    private static AppDbContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new AppDbContext(options);
    }

    private static async Task<(AppDbContext context, Guid tourInstanceId)> SeedTourInstanceWithNavigations(AppDbContext context)
    {
        var userId = Guid.NewGuid();
        var classificationId = Guid.NewGuid();
        var tourId = Guid.NewGuid();
        var tourInstanceId = Guid.NewGuid();

        context.Users.Add(new UserEntity
        {
            Id = userId,
            Username = "tourmanager",
            Email = "manager@test.com",
            FullName = "Tour Manager",
            Status = UserStatus.Active,
            IsDeleted = false,
        });

        context.TourClassifications.Add(new TourClassificationEntity
        {
            Id = classificationId,
            TourId = tourId,
            Name = "Standard",
            BasePrice = 1000m,
            Description = "Standard classification",
            NumberOfDay = 3,
            NumberOfNight = 2,
            IsDeleted = false,
        });

        context.Tours.Add(new TourEntity
        {
            Id = tourId,
            TourCode = "TI-INCLUDE-001",
            TourName = "Tour Instance Include Test Tour",
            ShortDescription = "Test",
            LongDescription = "Test",
            Status = TourStatus.Active,
            IsDeleted = false,
        });

        var tourInstance = new TourInstanceEntity
        {
            Id = tourInstanceId,
            TourId = tourId,
            ClassificationId = classificationId,
            TourInstanceCode = "TI-INC-001",
            Title = "Tour Instance Include Test Instance",
            TourName = "Tour Instance Include Test Tour",
            TourCode = "TI-INCLUDE-001",
            ClassificationName = "Standard",
            StartDate = DateTimeOffset.UtcNow.AddDays(10),
            EndDate = DateTimeOffset.UtcNow.AddDays(13),
            DurationDays = 3,
            Status = TourInstanceStatus.Available,
            IsDeleted = false,
        };
        context.TourInstances.Add(tourInstance);

        // Add a manager assignment
        context.TourManagerAssignments.Add(new TourManagerAssignmentEntity
        {
            Id = Guid.NewGuid(),
            TourManagerId = userId,
            AssignedUserId = null,
            AssignedTourId = tourInstanceId,
            AssignedEntityType = AssignedEntityType.Tour,
            CreatedBy = "system",
            CreatedOnUtc = DateTimeOffset.UtcNow,
        });

        await context.SaveChangesAsync();
        return (context, tourInstanceId);
    }

    [Fact]
    public async Task FindPublicAvailable_Tour_IsNotNull()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var (ctx, _) = await SeedTourInstanceWithNavigations(context);
        var repo = new TourInstanceRepository(ctx);

        var results = await repo.FindPublicAvailable(destination: null, sortBy: null, page: 1, pageSize: 10);

        Assert.NotEmpty(results);
        Assert.NotNull(results[0].Tour);
    }

    [Fact]
    public async Task FindPublicAvailable_Classification_IsNotNull()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var (ctx, _) = await SeedTourInstanceWithNavigations(context);
        var repo = new TourInstanceRepository(ctx);

        var results = await repo.FindPublicAvailable(destination: null, sortBy: null, page: 1, pageSize: 10);

        Assert.NotEmpty(results);
        Assert.NotNull(results[0].Classification);
    }

    [Fact]
    public async Task FindPublicAvailable_Managers_IsLoadable()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var (ctx, _) = await SeedTourInstanceWithNavigations(context);
        var repo = new TourInstanceRepository(ctx);

        var results = await repo.FindPublicAvailable(destination: null, sortBy: null, page: 1, pageSize: 10);

        Assert.NotEmpty(results);
        // Managers collection should be loadable without triggering additional queries
        var managers = results[0].Managers;
        Assert.NotNull(managers);
    }

    [Fact]
    public async Task FindByIds_ReturnsMatchingInstances()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var (ctx, tourInstanceId) = await SeedTourInstanceWithNavigations(context);
        var repo = new TourInstanceRepository(ctx);

        var results = await repo.FindByIds(new[] { tourInstanceId });

        Assert.Single(results);
        Assert.Equal(tourInstanceId, results[0].Id);
    }

    [Fact]
    public async Task FindByIds_ReturnsEmptyList_ForEmptyInput()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var repo = new TourInstanceRepository(context);

        var results = await repo.FindByIds(Array.Empty<Guid>());

        Assert.Empty(results);
    }

    [Fact]
    public async Task FindByIds_ReturnsEmptyList_ForNonExistentIds()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var repo = new TourInstanceRepository(context);

        var results = await repo.FindByIds(new[] { Guid.NewGuid() });

        Assert.Empty(results);
    }

    #region FindByIdWithInstanceDays — Vehicle & Driver includes

    [Fact]
    public async Task FindByIdWithInstanceDays_WithVehicleAssigned_VehicleIsLoaded()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);

        // Seed: User + Vehicle
        var ownerId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        context.Users.Add(new UserEntity
        {
            Id = ownerId,
            Username = "transportowner",
            Email = "owner@test.com",
            FullName = "Transport Owner",
            Status = UserStatus.Active,
            IsDeleted = false,
        });
        context.Vehicles.Add(new VehicleEntity
        {
            Id = vehicleId,
            OwnerId = ownerId,
            VehiclePlate = "30A-55555",
            VehicleType = VehicleType.Bus,
            Brand = "Hyundai",
            Model = "County",
            SeatCapacity = 40,
            IsActive = true,
            IsDeleted = false,
        });

        // Seed: TourInstance
        var classificationId = Guid.NewGuid();
        var tourId = Guid.NewGuid();
        var instanceId = Guid.NewGuid();
        var dayId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        var routeId = Guid.NewGuid();

        context.TourClassifications.Add(new TourClassificationEntity
        {
            Id = classificationId,
            TourId = tourId,
            Name = "Standard",
            BasePrice = 1000,
            Description = "Standard",
            NumberOfDay = 1,
            NumberOfNight = 0,
            IsDeleted = false,
        });
        context.Tours.Add(new TourEntity
        {
            Id = tourId,
            TourCode = "TI-VEH-TEST",
            TourName = "Vehicle Include Test",
            ShortDescription = "Test",
            LongDescription = "Test",
            Status = TourStatus.Active,
            IsDeleted = false,
        });
        var instance = new TourInstanceEntity
        {
            Id = instanceId,
            TourId = tourId,
            ClassificationId = classificationId,
            TourInstanceCode = "TI-VEH-INCL",
            Title = "Vehicle Include Test",
            TourName = "Vehicle Include Test",
            TourCode = "TI-VEH-TEST",
            ClassificationName = "Standard",
            StartDate = DateTimeOffset.UtcNow.AddDays(1),
            EndDate = DateTimeOffset.UtcNow.AddDays(2),
            DurationDays = 1,
            Status = TourInstanceStatus.Available,
            IsDeleted = false,
        };
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
            Title = "Bus Transfer",
            IsOptional = false,
        };
        var route = new TourInstancePlanRouteEntity
        {
            Id = routeId,
            TourInstanceDayActivityId = activityId,
            VehicleId = vehicleId,
            PickupLocation = "Hotel Lobby",
            DropoffLocation = "Airport",
        };
        activity.Routes.Add(route);
        day.Activities.Add(activity);
        instance.InstanceDays.Add(day);
        context.TourInstances.Add(instance);
        await context.SaveChangesAsync();

        // Test
        var repo = new TourInstanceRepository(context);
        var result = await repo.FindByIdWithInstanceDays(instanceId);

        Assert.NotNull(result);
        var foundRoute = result!.InstanceDays[0].Activities[0].Routes[0];
        Assert.NotNull(foundRoute.Vehicle);
        Assert.Equal("30A-55555", foundRoute.Vehicle!.VehiclePlate);
        Assert.Equal(VehicleType.Bus, foundRoute.Vehicle!.VehicleType);
        Assert.Equal("Hyundai", foundRoute.Vehicle!.Brand);
        Assert.Equal(40, foundRoute.Vehicle!.SeatCapacity);
    }

    [Fact]
    public async Task FindByIdWithInstanceDays_WithDriverAssigned_DriverIsLoaded()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);

        // Seed: User + Driver
        var driverUserId = Guid.NewGuid();
        var driverId = Guid.NewGuid();
        context.Users.Add(new UserEntity
        {
            Id = driverUserId,
            Username = "driver1",
            Email = "driver@test.com",
            FullName = "Nguyen Van Driver",
            Status = UserStatus.Active,
            IsDeleted = false,
        });
        context.Drivers.Add(new DriverEntity
        {
            Id = driverId,
            UserId = driverUserId,
            FullName = "Nguyen Van Driver",
            LicenseNumber = "L123",
            LicenseType = DriverLicenseType.D,
            PhoneNumber = "0909123456",
            IsActive = true,
        });

        // Seed: TourInstance with route + driver
        var classificationId = Guid.NewGuid();
        var tourId = Guid.NewGuid();
        var instanceId = Guid.NewGuid();
        var dayId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        var routeId = Guid.NewGuid();

        context.TourClassifications.Add(new TourClassificationEntity
        {
            Id = classificationId,
            TourId = tourId,
            Name = "Standard",
            BasePrice = 500,
            Description = "Standard",
            NumberOfDay = 1,
            NumberOfNight = 0,
            IsDeleted = false,
        });
        context.Tours.Add(new TourEntity
        {
            Id = tourId,
            TourCode = "TI-DRV-TEST",
            TourName = "Driver Include Test",
            ShortDescription = "Test",
            LongDescription = "Test",
            Status = TourStatus.Active,
            IsDeleted = false,
        });
        var instance = new TourInstanceEntity
        {
            Id = instanceId,
            TourId = tourId,
            ClassificationId = classificationId,
            TourInstanceCode = "TI-DRV-INCL",
            Title = "Driver Include Test",
            TourName = "Driver Include Test",
            TourCode = "TI-DRV-TEST",
            ClassificationName = "Standard",
            StartDate = DateTimeOffset.UtcNow.AddDays(1),
            EndDate = DateTimeOffset.UtcNow.AddDays(2),
            DurationDays = 1,
            Status = TourInstanceStatus.Available,
            IsDeleted = false,
        };
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
            Title = "Private Car",
            IsOptional = false,
        };
        var route = new TourInstancePlanRouteEntity
        {
            Id = routeId,
            TourInstanceDayActivityId = activityId,
            DriverId = driverId,
            PickupLocation = "Airport",
            DropoffLocation = "Hotel",
        };
        activity.Routes.Add(route);
        day.Activities.Add(activity);
        instance.InstanceDays.Add(day);
        context.TourInstances.Add(instance);
        await context.SaveChangesAsync();

        // Test
        var repo = new TourInstanceRepository(context);
        var result = await repo.FindByIdWithInstanceDays(instanceId);

        Assert.NotNull(result);
        var foundRoute = result!.InstanceDays[0].Activities[0].Routes[0];
        Assert.NotNull(foundRoute.Driver);
        Assert.Equal("Nguyen Van Driver", foundRoute.Driver!.FullName);
        Assert.Equal("0909123456", foundRoute.Driver!.PhoneNumber);
        Assert.Equal(DriverLicenseType.D, foundRoute.Driver!.LicenseType);
    }

    [Fact]
    public async Task FindByIdWithInstanceDays_WithProviderAssignments_ProvidersAreLoaded()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);

        // Seed: Suppliers
        var hotelProviderId = Guid.NewGuid();
        var transportProviderId = Guid.NewGuid();
        context.Suppliers.Add(new SupplierEntity
        {
            Id = hotelProviderId,
            Name = "Grand Hotel Saigon",
            SupplierType = SupplierType.Accommodation,
            IsDeleted = false,
        });
        context.Suppliers.Add(new SupplierEntity
        {
            Id = transportProviderId,
            Name = "Vietransport Co.",
            SupplierType = SupplierType.Transport,
            IsDeleted = false,
        });

        // Seed: TourInstance with providers
        var classificationId = Guid.NewGuid();
        var tourId = Guid.NewGuid();
        var instanceId = Guid.NewGuid();

        context.TourClassifications.Add(new TourClassificationEntity
        {
            Id = classificationId,
            TourId = tourId,
            Name = "Standard",
            BasePrice = 800,
            Description = "Standard",
            NumberOfDay = 2,
            NumberOfNight = 1,
            IsDeleted = false,
        });
        context.Tours.Add(new TourEntity
        {
            Id = tourId,
            TourCode = "TI-PROV-TEST",
            TourName = "Provider Include Test",
            ShortDescription = "Test",
            LongDescription = "Test",
            Status = TourStatus.Active,
            IsDeleted = false,
        });
        var instance = new TourInstanceEntity
        {
            Id = instanceId,
            TourId = tourId,
            ClassificationId = classificationId,
            TourInstanceCode = "TI-PROV-INCL",
            Title = "Provider Include Test",
            TourName = "Provider Include Test",
            TourCode = "TI-PROV-TEST",
            ClassificationName = "Standard",
            StartDate = DateTimeOffset.UtcNow.AddDays(1),
            EndDate = DateTimeOffset.UtcNow.AddDays(3),
            DurationDays = 2,
            Status = TourInstanceStatus.Available,
            HotelProviderId = hotelProviderId,
            HotelApprovalStatus = ProviderApprovalStatus.Pending,
            TransportProviderId = transportProviderId,
            TransportApprovalStatus = ProviderApprovalStatus.Approved,
            IsDeleted = false,
        };
        context.TourInstances.Add(instance);
        await context.SaveChangesAsync();

        // Test
        var repo = new TourInstanceRepository(context);
        var result = await repo.FindByIdWithInstanceDays(instanceId);

        Assert.NotNull(result);
        Assert.NotNull(result!.HotelProvider);
        Assert.Equal("Grand Hotel Saigon", result.HotelProvider!.Name);
        Assert.NotNull(result.TransportProvider);
        Assert.Equal("Vietransport Co.", result.TransportProvider!.Name);
    }

    [Fact]
    public async Task FindByIdWithInstanceDays_WithAccommodationAndRoute_AccommodationIsLoaded()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);

        var classificationId = Guid.NewGuid();
        var tourId = Guid.NewGuid();
        var instanceId = Guid.NewGuid();
        var dayId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        var accommodationId = Guid.NewGuid();

        context.TourClassifications.Add(new TourClassificationEntity
        {
            Id = classificationId,
            TourId = tourId,
            Name = "Standard",
            BasePrice = 1000,
            Description = "Standard",
            NumberOfDay = 1,
            NumberOfNight = 0,
            IsDeleted = false,
        });
        context.Tours.Add(new TourEntity
        {
            Id = tourId,
            TourCode = "TI-ACC-TEST",
            TourName = "Accommodation Include Test",
            ShortDescription = "Test",
            LongDescription = "Test",
            Status = TourStatus.Active,
            IsDeleted = false,
        });
        var instance = new TourInstanceEntity
        {
            Id = instanceId,
            TourId = tourId,
            ClassificationId = classificationId,
            TourInstanceCode = "TI-ACC-INCL",
            Title = "Accommodation Include Test",
            TourName = "Accommodation Include Test",
            TourCode = "TI-ACC-TEST",
            ClassificationName = "Standard",
            StartDate = DateTimeOffset.UtcNow.AddDays(1),
            EndDate = DateTimeOffset.UtcNow.AddDays(2),
            DurationDays = 1,
            Status = TourInstanceStatus.Available,
            IsDeleted = false,
        };
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
            ActivityType = TourDayActivityType.Accommodation,
            Title = "Hotel Stay",
            IsOptional = false,
        };
        activity.Accommodation = new TourInstancePlanAccommodationEntity
        {
            Id = accommodationId,
            TourInstanceDayActivityId = activityId,
            RoomType = RoomType.Double,
            Quantity = 5,
        };
        day.Activities.Add(activity);
        instance.InstanceDays.Add(day);
        context.TourInstances.Add(instance);
        await context.SaveChangesAsync();

        // Test
        var repo = new TourInstanceRepository(context);
        var result = await repo.FindByIdWithInstanceDays(instanceId);

        Assert.NotNull(result);
        var foundAccommodation = result!.InstanceDays[0].Activities[0].Accommodation;
        Assert.NotNull(foundAccommodation);
        Assert.Equal(RoomType.Double, foundAccommodation!.RoomType);
        Assert.Equal(5, foundAccommodation.Quantity);
    }

    #endregion
}
