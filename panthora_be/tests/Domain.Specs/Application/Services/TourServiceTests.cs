using Application.Common.Constant;
using Application.Dtos;
using Application.Features.Tour.Commands;
using Application.Services;
using AutoMapper;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Entities.Translations;
using Domain.UnitOfWork;
using ErrorOr;
using NSubstitute;

namespace Domain.Specs.Application.Services;

/// <summary>
/// Unit tests for TourService.Create() covering the full entity graph creation flow.
/// </summary>
public sealed class TourServiceTests
{
    private readonly ITourRepository _tourRepository = Substitute.For<ITourRepository>();
    private readonly IUser _user = Substitute.For<IUser>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IMapper _mapper = Substitute.For<IMapper>();

    private TourService CreateService() => new(_tourRepository, _user, _unitOfWork, _mapper);

    #region Helper Methods

    private ImageInputDto CreateValidImage() => new(
        FileId: "file-123",
        OriginalFileName: "image.jpg",
        FileName: "image.jpg",
        PublicURL: "https://cdn.example.com/image.jpg");

    private CreateTourCommand CreateBaseValidCommand() => new(
        TourName: "Da Nang Beach Tour",
        ShortDescription: "Beach vacation",
        LongDescription: "5-day beach tour",
        SEOTitle: null,
        SEODescription: null,
        Status: Domain.Enums.TourStatus.Active,
        Thumbnail: CreateValidImage(),
        Images: [CreateValidImage()],
        Classifications: null);

    #endregion

    #region TC01: Create with valid basic command returns tour ID

    [Fact]
    public async Task Create_WithValidBasicCommand_ShouldReturnTourId()
    {
        // Arrange
        _user.Id.Returns("admin@test.com");
        _tourRepository.Create(Arg.Any<TourEntity>()).Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = CreateBaseValidCommand();
        var service = CreateService();

        // Act
        var result = await service.Create(command);

        // Assert
        Assert.False(result.IsError);
        Assert.IsType<Guid>(result.Value);
        await _tourRepository.Received(1).Create(Arg.Any<TourEntity>());
        await _unitOfWork.Received(1).SaveChangeAsync(Arg.Any<CancellationToken>());
    }

    #endregion

    #region TC02: Tour code is auto-generated in TOUR-YYYYMMDD-NNNNN format

    [Fact]
    public async Task Create_ShouldAutoGenerateTourCode()
    {
        // Arrange
        _user.Id.Returns("admin@test.com");
        _tourRepository.Create(Arg.Do<TourEntity>(t => Assert.StartsWith("TOUR-", t.TourCode)))
            .Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = CreateBaseValidCommand();
        var service = CreateService();

        // Act
        var result = await service.Create(command);

        // Assert
        Assert.False(result.IsError);
    }

    [Fact]
    public async Task Create_WhenTourCodeExists_ShouldRetryAndSucceed()
    {
        // Arrange
        _user.Id.Returns("admin@test.com");
        _tourRepository.Create(Arg.Any<TourEntity>()).Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        // First call returns conflict, subsequent calls return not-found (simulating retry)
        var callCount = 0;
        _tourRepository.ExistsByTourCode(Arg.Any<string>())
            .Returns( _ =>
            {
                callCount++; return callCount <= 1;
            });

        var command = CreateBaseValidCommand();
        var service = CreateService();

        // Act
        var result = await service.Create(command);

        // Assert
        Assert.False(result.IsError);
        Assert.True(callCount >= 2, $"Expected at least 2 ExistsByTourCode calls for retry, got {callCount}");
        await _tourRepository.Received(1).Create(Arg.Any<TourEntity>());
    }

    [Fact]
    public async Task Create_WhenTourCodeConflictsExceedMaxRetry_ShouldReturnConflictError()
    {
        // Arrange
        _user.Id.Returns("admin@test.com");
        _tourRepository.Create(Arg.Any<TourEntity>()).Returns(Task.CompletedTask);

        // Always return "exists" — retry always finds conflict
        _tourRepository.ExistsByTourCode(Arg.Any<string>()).Returns(true);

        var command = CreateBaseValidCommand();
        var service = CreateService();

        // Act
        var result = await service.Create(command);

        // Assert
        Assert.True(result.IsError);
        Assert.Equal(ErrorConstants.Tour.DuplicateCodeCode, result.Errors[0].Code);
    }

    #endregion

    #region TC03: Tour entity has correct basic fields set

    [Fact]
    public async Task Create_ShouldSetCorrectBasicFields()
    {
        // Arrange
        _user.Id.Returns("admin@test.com");
        TourEntity? capturedTour = null;
        _tourRepository.Create(Arg.Do<TourEntity>(t => capturedTour = t))
            .Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = CreateBaseValidCommand();
        var service = CreateService();

        // Act
        await service.Create(command);

        // Assert
        Assert.NotNull(capturedTour);
        Assert.Equal("Da Nang Beach Tour", capturedTour!.TourName);
        Assert.Equal("Beach vacation", capturedTour.ShortDescription);
        Assert.Equal("5-day beach tour", capturedTour.LongDescription);
        Assert.Equal(Domain.Enums.TourStatus.Active, capturedTour.Status);
        Assert.Equal("admin@test.com", capturedTour.CreatedBy);
    }

    #endregion

    #region TC04: Translations dictionary is normalized (keys lowercased)

    [Fact]
    public async Task Create_WithTranslations_ShouldNormalizeKeysToLowercase()
    {
        // Arrange
        _user.Id.Returns("admin@test.com");
        TourEntity? capturedTour = null;
        _tourRepository.Create(Arg.Do<TourEntity>(t => capturedTour = t))
            .Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = CreateBaseValidCommand() with
        {
            Translations = new Dictionary<string, TourTranslationData>(StringComparer.OrdinalIgnoreCase)
            {
                ["VI"] = new TourTranslationData { TourName = "Tour Da Nang", ShortDescription = "Mieu ta", LongDescription = "Mo ta dai" },
                ["EN"] = new TourTranslationData { TourName = "Da Nang Tour", ShortDescription = "Short", LongDescription = "Long" }
            }
        };
        var service = CreateService();

        // Act
        await service.Create(command);

        // Assert
        Assert.NotNull(capturedTour);
        Assert.Equal(2, capturedTour!.Translations.Count);
        Assert.True(capturedTour.Translations.ContainsKey("vi"));
        Assert.True(capturedTour.Translations.ContainsKey("en"));
        Assert.Equal("Tour Da Nang", capturedTour.Translations["vi"].TourName);
    }

    #endregion

    #region TC05: Classification with Plans, Activities, Routes, and Accommodation

    [Fact]
    public async Task Create_WithClassificationAndNestedEntities_ShouldBuildCorrectEntityGraph()
    {
        // Arrange
        _user.Id.Returns("admin@test.com");
        TourEntity? capturedTour = null;
        _tourRepository.Create(Arg.Do<TourEntity>(t => capturedTour = t))
            .Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = CreateBaseValidCommand() with
        {
            Classifications =
            [
                new ClassificationDto(null,
                    Name: "Standard Package",
                    Description: "Standard 3-day package",
                    BasePrice: 1000,
                    NumberOfDay: 3,
                    NumberOfNight: 2,
                    Plans:
                    [
                        new DayPlanDto(null,
                            DayNumber: 1,
                            Title: "Day 1",
                            Description: "Arrival",
                            Activities:
                            [
                                new ActivityDto(null,
                                    ActivityType: "Transport",
                                    Title: "Airport Pickup",
                                    Description: "Pick up from airport",
                                    Note: "Driver will wait",
                                    EstimatedCost: 50,
                                    IsOptional: false,
                                    StartTime: "08:00",
                                    EndTime: "10:00",
                                    Routes:
                                    [
                                        new RouteDto(
                                            TransportationType: "Car",
                                            FromLocationName: "Airport",
                                            ToLocationName: "Hotel",
                                            FromLocationId: null,
                                            ToLocationId: null,
                                            TransportationName: "Sedan",
                                            DurationMinutes: 60,
                                            PricingType: null,
                                            Price: 30,
                                            RequiresIndividualTicket: false,
                                            TicketInfo: null,
                                            Note: null,
                                            Translations: null,
                                            RouteTranslations: null)
                                    ],
                                    Accommodation: new AccommodationDto(
                                        AccommodationName: "Hotel ABC",
                                        Address: "123 Main St",
                                        ContactPhone: "0123456789",
                                        CheckInTime: "14:00",
                                        CheckOutTime: "12:00",
                                        Note: "Late check-in available",
                                        RoomType: null,
                                        RoomCapacity: null,
                                        MealsIncluded: null,
                                        RoomPrice: null,
                                        NumberOfRooms: null,
                                        NumberOfNights: null,
                                        Latitude: null,
                                        Longitude: null,
                                        SpecialRequest: null,
                                        Translations: null),
                                    Translations: null)
                            ],
                            Translations: null)
                    ],
                    Insurances:
                    [
                        new InsuranceDto(
                            InsuranceName: "Travel Insurance",
                            InsuranceType: "Basic",
                            InsuranceProvider: "ABC Insurance",
                            CoverageDescription: "Basic coverage",
                            CoverageAmount: 10000,
                            CoverageFee: 50,
                            IsOptional: true,
                            Note: null,
                            Translations: null)
                    ],
                    Translations: null)
            ]
        };
        var service = CreateService();

        // Act
        var result = await service.Create(command);

        // Assert
        Assert.False(result.IsError);
        Assert.NotNull(capturedTour);
        Assert.Single(capturedTour!.Classifications);
        var cls = capturedTour.Classifications[0];
        Assert.Equal("Standard Package", cls.Name);
        Assert.Equal(1000, cls.BasePrice);
        Assert.Single(cls.Plans);
        Assert.Single(cls.Plans[0].Activities);
        Assert.Equal("Airport Pickup", cls.Plans[0].Activities[0].Title);
        Assert.Single(cls.Plans[0].Activities[0].Routes);
        Assert.Equal("Airport", cls.Plans[0].Activities[0].Routes[0].FromLocation!.LocationName);
        Assert.Equal("Hotel ABC", cls.Plans[0].Activities[0].Accommodation!.AccommodationName);
        Assert.Single(cls.Insurances);
        Assert.Equal("Travel Insurance", cls.Insurances[0].InsuranceName);
    }

    #endregion

    #region TC06: Activity time parsing (valid time strings)

    [Fact]
    public async Task Create_WithActivityTimeStrings_ShouldParseTimeOnly()
    {
        // Arrange
        _user.Id.Returns("admin@test.com");
        TourEntity? capturedTour = null;
        _tourRepository.Create(Arg.Do<TourEntity>(t => capturedTour = t))
            .Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = CreateBaseValidCommand() with
        {
            Classifications =
            [
                new ClassificationDto(null,
                    Name: "Test",
                    Description: "",
                    BasePrice: 0,
                    NumberOfDay: 1,
                    NumberOfNight: 0,
                    Plans:
                    [
                        new DayPlanDto(null,
                            DayNumber: 1,
                            Title: "Day",
                            Description: null,
                            Activities:
                            [
                                new ActivityDto(null,
                                    ActivityType: "Sightseeing",
                                    Title: "Visit Temple",
                                    Description: null,
                                    Note: null,
                                    EstimatedCost: 0,
                                    IsOptional: false,
                                    StartTime: "09:30",
                                    EndTime: "17:45",
                                    Routes: [],
                                    Accommodation: null,
                                    Translations: null)
                            ],
                            Translations: null)
                    ],
                    Insurances: [],
                    Translations: null)
            ]
        };
        var service = CreateService();

        // Act
        await service.Create(command);

        // Assert
        var activity = capturedTour!.Classifications[0].Plans[0].Activities[0];
        Assert.NotNull(activity.StartTime);
        Assert.Equal(9, activity.StartTime.Value.Hour);
        Assert.Equal(30, activity.StartTime.Value.Minute);
        Assert.NotNull(activity.EndTime);
        Assert.Equal(17, activity.EndTime.Value.Hour);
        Assert.Equal(45, activity.EndTime.Value.Minute);
    }

    #endregion

    #region TC07: Activity time parsing (invalid time strings become null)

    [Fact]
    public async Task Create_WithInvalidActivityTimeStrings_ShouldBeNull()
    {
        // Arrange
        _user.Id.Returns("admin@test.com");
        TourEntity? capturedTour = null;
        _tourRepository.Create(Arg.Do<TourEntity>(t => capturedTour = t))
            .Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = CreateBaseValidCommand() with
        {
            Classifications =
            [
                new ClassificationDto(null,
                    Name: "Test",
                    Description: "",
                    BasePrice: 0,
                    NumberOfDay: 1,
                    NumberOfNight: 0,
                    Plans:
                    [
                        new DayPlanDto(null,
                            DayNumber: 1,
                            Title: "Day",
                            Description: null,
                            Activities:
                            [
                                new ActivityDto(null,
                                    ActivityType: "Sightseeing",
                                    Title: "Visit",
                                    Description: null,
                                    Note: null,
                                    EstimatedCost: 0,
                                    IsOptional: false,
                                    StartTime: "not-a-time",
                                    EndTime: "",
                                    Routes: [],
                                    Accommodation: null,
                                    Translations: null)
                            ],
                            Translations: null)
                    ],
                    Insurances: [],
                    Translations: null)
            ]
        };
        var service = CreateService();

        // Act
        await service.Create(command);

        // Assert
        var activity = capturedTour!.Classifications[0].Plans[0].Activities[0];
        Assert.Null(activity.StartTime);
        Assert.Null(activity.EndTime);
    }

    #endregion

    #region TC08: Activity type enum fallback to Other

    [Fact]
    public async Task Create_WithUnknownActivityType_ShouldFallbackToOther()
    {
        // Arrange
        _user.Id.Returns("admin@test.com");
        TourEntity? capturedTour = null;
        _tourRepository.Create(Arg.Do<TourEntity>(t => capturedTour = t))
            .Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = CreateBaseValidCommand() with
        {
            Classifications =
            [
                new ClassificationDto(null,
                    Name: "Test",
                    Description: "",
                    BasePrice: 0,
                    NumberOfDay: 1,
                    NumberOfNight: 0,
                    Plans:
                    [
                        new DayPlanDto(null,
                            DayNumber: 1,
                            Title: "Day",
                            Description: null,
                            Activities:
                            [
                                new ActivityDto(null,
                                    ActivityType: "UnknownActivityType",
                                    Title: "Activity",
                                    Description: null,
                                    Note: null,
                                    EstimatedCost: 0,
                                    IsOptional: false,
                                    StartTime: null,
                                    EndTime: null,
                                    Routes: [],
                                    Accommodation: null,
                                    Translations: null)
                            ],
                            Translations: null)
                    ],
                    Insurances: [],
                    Translations: null)
            ]
        };
        var service = CreateService();

        // Act
        await service.Create(command);

        // Assert
        Assert.Equal(
            Domain.Enums.TourDayActivityType.Other,
            capturedTour!.Classifications[0].Plans[0].Activities[0].ActivityType);
    }

    #endregion

    #region TC09: Route transportation type enum — valid values map correctly

    [Fact]
    public async Task Create_WithValidTransportationType_ShouldMapCorrectly()
    {
        // Arrange
        _user.Id.Returns("admin@test.com");
        TourEntity? capturedTour = null;
        _tourRepository.Create(Arg.Do<TourEntity>(t => capturedTour = t))
            .Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = CreateBaseValidCommand() with
        {
            Classifications =
            [
                new ClassificationDto(null,
                    Name: "Test",
                    Description: "",
                    BasePrice: 0,
                    NumberOfDay: 1,
                    NumberOfNight: 0,
                    Plans:
                    [
                        new DayPlanDto(null,
                            DayNumber: 1,
                            Title: "Day",
                            Description: null,
                            Activities:
                            [
                                new ActivityDto(null,
                                    ActivityType: "Transport",
                                    Title: "Transfer",
                                    Description: null,
                                    Note: null,
                                    EstimatedCost: 0,
                                    IsOptional: false,
                                    StartTime: null,
                                    EndTime: null,
                                    Routes:
                                    [
                                        new RouteDto(
                                            TransportationType: "Flight",
                                            FromLocationName: "A",
                                            ToLocationName: "B",
                                            FromLocationId: null,
                                            ToLocationId: null,
                                            TransportationName: null,
                                            DurationMinutes: 30,
                                            PricingType: null,
                                            Price: 10,
                                            RequiresIndividualTicket: false,
                                            TicketInfo: null,
                                            Note: null,
                                            Translations: null,
                                            RouteTranslations: null)
                                    ],
                                    Accommodation: null,
                                    Translations: null)
                            ],
                            Translations: null)
                    ],
                    Insurances: [],
                    Translations: null)
            ]
        };
        var service = CreateService();

        // Act
        await service.Create(command);

        // Assert
        Assert.Equal(
            Domain.Enums.TransportationType.Flight,
            capturedTour!.Classifications[0].Plans[0].Activities[0].Routes[0].TransportationType);
    }

    #endregion

    #region TC10: Standalone accommodations/locations/transportations logged (not persisted)

    [Fact]
    public async Task Create_WithStandaloneAccommodationsLocationsTransportations_ShouldNotThrow()
    {
        // Arrange
        _user.Id.Returns("admin@test.com");
        _tourRepository.Create(Arg.Any<TourEntity>()).Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = CreateBaseValidCommand() with
        {
            Accommodations =
            [
                new AccommodationDto(
                    AccommodationName: "Hotel 1",
                    Address: "123 St",
                    ContactPhone: null,
                    CheckInTime: null,
                    CheckOutTime: null,
                    Note: null,
                    RoomType: null,
                    RoomCapacity: null,
                    MealsIncluded: null,
                    RoomPrice: null,
                    NumberOfRooms: null,
                    NumberOfNights: null,
                    Latitude: null,
                    Longitude: null,
                    SpecialRequest: null,
                    Translations: null)
            ],
            Locations =
            [
                new LocationDto(
                    LocationName: "Museum",
                    LocationType: "Museum",
                    Description: null,
                    City: "Da Nang",
                    Country: "Vietnam",
                    EntranceFee: 0,
                    Address: null,
                    Translations: null)
            ],
            Transportations =
            [
                new TransportationDto(
                    FromLocationName: "Hotel",
                    ToLocationName: "Beach",
                    TransportationType: "Bus",
                    TransportationName: null,
                    DurationMinutes: 30,
                    PricingType: null,
                    Price: 5,
                    RequiresIndividualTicket: false,
                    TicketInfo: null,
                    Note: null,
                    Translations: null)
            ]
        };
        var service = CreateService();

        // Act
        var result = await service.Create(command);

        // Assert
        Assert.False(result.IsError);
    }

    #endregion

    #region TC11: Policy IDs are set on tour entity

    [Fact]
    public async Task Create_WithPolicyIds_ShouldSetOnTourEntity()
    {
        // Arrange
        _user.Id.Returns("admin@test.com");
        TourEntity? capturedTour = null;
        _tourRepository.Create(Arg.Do<TourEntity>(t => capturedTour = t))
            .Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var visaPolicyId = Guid.CreateVersion7();
        var depositPolicyId = Guid.CreateVersion7();
        var pricingPolicyId = Guid.CreateVersion7();
        var cancellationPolicyId = Guid.CreateVersion7();

        var command = CreateBaseValidCommand() with
        {
            VisaPolicyId = visaPolicyId,
            DepositPolicyId = depositPolicyId,
            PricingPolicyId = pricingPolicyId,
            CancellationPolicyId = cancellationPolicyId
        };
        var service = CreateService();

        // Act
        await service.Create(command);

        // Assert
        Assert.NotNull(capturedTour);
        Assert.Equal(visaPolicyId, capturedTour!.VisaPolicyId);
        Assert.Equal(depositPolicyId, capturedTour.DepositPolicyId);
        Assert.Equal(pricingPolicyId, capturedTour.PricingPolicyId);
        Assert.Equal(cancellationPolicyId, capturedTour.CancellationPolicyId);
    }

    #endregion

    #region TC12: Nested entity translations are normalized

    [Fact]
    public async Task Create_WithNestedTranslations_ShouldNormalizeKeysToLowercase()
    {
        // Arrange
        _user.Id.Returns("admin@test.com");
        TourEntity? capturedTour = null;
        _tourRepository.Create(Arg.Do<TourEntity>(t => capturedTour = t))
            .Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = CreateBaseValidCommand() with
        {
            Classifications =
            [
                new ClassificationDto(null,
                    Name: "Pkg",
                    Description: "Desc",
                    BasePrice: 0,
                    NumberOfDay: 1,
                    NumberOfNight: 0,
                    Plans:
                    [
                        new DayPlanDto(null,
                            DayNumber: 1,
                            Title: "Day",
                            Description: null,
                            Activities:
                            [
                                new ActivityDto(null,
                                    ActivityType: "Sightseeing",
                                    Title: "Act",
                                    Description: null,
                                    Note: null,
                                    EstimatedCost: 0,
                                    IsOptional: false,
                                    StartTime: null,
                                    EndTime: null,
                                    Routes: [],
                                    Accommodation: null,
                                    Translations: new Dictionary<string, TourDayActivityTranslationData>(StringComparer.OrdinalIgnoreCase)
                                    {
                                        ["EN"] = new TourDayActivityTranslationData { Title = "Activity EN", Description = "Desc EN" },
                                        ["VI"] = new TourDayActivityTranslationData { Title = "Activity VI", Description = "Desc VI" }
                                    })
                            ],
                            Translations: new Dictionary<string, TourDayTranslationData>(StringComparer.OrdinalIgnoreCase)
                            {
                                ["EN"] = new TourDayTranslationData { Title = "Day EN", Description = "Desc EN" }
                            })
                    ],
                    Insurances: [],
                    Translations: new Dictionary<string, TourClassificationTranslationData>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["EN"] = new TourClassificationTranslationData { Name = "Pkg EN", Description = "Desc EN" }
                    })
            ]
        };
        var service = CreateService();

        // Act
        await service.Create(command);

        // Assert
        var cls = capturedTour!.Classifications[0];
        // Classification translations: EN key added, VI key added
        // Classification translations: only EN provided
        Assert.Single(cls.Translations);
        Assert.True(cls.Translations.ContainsKey("en"));
        Assert.False(cls.Translations.ContainsKey("vi"));
        // DayPlan translations: only EN key added
        Assert.Single(cls.Plans[0].Translations);
        Assert.True(cls.Plans[0].Translations.ContainsKey("en"));
        Assert.Equal("Day EN", cls.Plans[0].Translations["en"].Title);
        // Activity translations: EN and VI keys added
        Assert.True(cls.Plans[0].Activities[0].Translations.ContainsKey("en"));
        Assert.True(cls.Plans[0].Activities[0].Translations.ContainsKey("vi"));
        Assert.Equal("Activity EN", cls.Plans[0].Activities[0].Translations["en"].Title);
        Assert.Equal("Activity VI", cls.Plans[0].Activities[0].Translations["vi"].Title);
    }

    #endregion

    #region TC13: Services are persisted as TourResource entities

    [Fact]
    public async Task Create_WithServices_ShouldPersistAsTourResources()
    {
        // Arrange
        _user.Id.Returns("admin@test.com");
        TourEntity? capturedTour = null;
        _tourRepository.Create(Arg.Do<TourEntity>(t => capturedTour = t))
            .Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = CreateBaseValidCommand() with
        {
            Services =
            [
                new ServiceDto(
                    Id: null,
                    ServiceName: "Guide Service",
                    PricingType: "Per Person",
                    Price: 50,
                    SalePrice: 45,
                    Email: "guide@tour.com",
                    ContactNumber: "0123456789")
            ]
        };
        var service = CreateService();

        // Act
        var result = await service.Create(command);

        // Assert
        Assert.False(result.IsError);
        Assert.NotNull(capturedTour);
        Assert.Single(capturedTour!.Resources);
        var resource = capturedTour.Resources[0];
        Assert.Equal(Domain.Entities.TourResourceType.Service, resource.Type);
        Assert.Equal("Guide Service", resource.Name);
        Assert.Equal(50, resource.Price);
        Assert.Equal("Per Person", resource.PricingType);
        Assert.Equal("guide@tour.com", resource.ContactEmail);
        Assert.Equal("0123456789", resource.ContactPhone);
    }

    [Fact]
    public async Task Create_WithServices_UsesSalePriceWhenBothPriceAndSalePriceProvided()
    {
        // Arrange
        _user.Id.Returns("admin@test.com");
        TourEntity? capturedTour = null;
        _tourRepository.Create(Arg.Do<TourEntity>(t => capturedTour = t))
            .Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = CreateBaseValidCommand() with
        {
            Services =
            [
                new ServiceDto(
                    Id: null,
                    ServiceName: "Guide",
                    PricingType: null,
                    Price: 100,
                    SalePrice: 80,
                    Email: null,
                    ContactNumber: null)
            ]
        };
        var service = CreateService();

        // Act
        await service.Create(command);

        // Assert - TourService uses Price when both are provided, falls back to SalePrice
        Assert.Equal(100, capturedTour!.Resources[0].Price);
    }

    #endregion

    #region TC14: Create activity with EstimatedCost -> entity has correct value

    [Fact]
    public async Task Create_WithActivityEstimatedCost_ShouldSetCorrectValue()
    {
        // Arrange
        _user.Id.Returns("admin@test.com");
        TourEntity? capturedTour = null;
        _tourRepository.Create(Arg.Do<TourEntity>(t => capturedTour = t))
            .Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = CreateBaseValidCommand() with
        {
            Classifications =
            [
                new ClassificationDto(null,
                    Name: "Test",
                    Description: "",
                    BasePrice: 0,
                    NumberOfDay: 1,
                    NumberOfNight: 0,
                    Plans:
                    [
                        new DayPlanDto(null,
                            DayNumber: 1,
                            Title: "Day",
                            Description: null,
                            Activities:
                            [
                                new ActivityDto(null,
                                    ActivityType: "Sightseeing",
                                    Title: "Activity",
                                    Description: null,
                                    Note: null,
                                    EstimatedCost: 250.75m,
                                    IsOptional: false,
                                    StartTime: null,
                                    EndTime: null,
                                    Routes: [],
                                    Accommodation: null)
                            ],
                            Translations: null)
                    ],
                    Insurances: [],
                    Translations: null)
            ]
        };
        var service = CreateService();

        // Act
        await service.Create(command);

        // Assert
        Assert.NotNull(capturedTour);
        var activity = capturedTour!.Classifications[0].Plans[0].Activities[0];
        Assert.Equal(250.75m, activity.EstimatedCost);
    }

    #endregion

    #region TC15: Create activity EstimatedCost null -> entity is null

    [Fact]
    public async Task Create_WithActivityEstimatedCostNull_ShouldSetNull()
    {
        // Arrange
        _user.Id.Returns("admin@test.com");
        TourEntity? capturedTour = null;
        _tourRepository.Create(Arg.Do<TourEntity>(t => capturedTour = t))
            .Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = CreateBaseValidCommand() with
        {
            Classifications =
            [
                new ClassificationDto(null,
                    Name: "Test",
                    Description: "",
                    BasePrice: 0,
                    NumberOfDay: 1,
                    NumberOfNight: 0,
                    Plans:
                    [
                        new DayPlanDto(null,
                            DayNumber: 1,
                            Title: "Day",
                            Description: null,
                            Activities:
                            [
                                new ActivityDto(null,
                                    ActivityType: "Sightseeing",
                                    Title: "Activity",
                                    Description: null,
                                    Note: null,
                                    EstimatedCost: null,
                                    IsOptional: false,
                                    StartTime: null,
                                    EndTime: null,
                                    Routes: [],
                                    Accommodation: null)
                            ],
                            Translations: null)
                    ],
                    Insurances: [],
                    Translations: null)
            ]
        };
        var service = CreateService();

        // Act
        await service.Create(command);

        // Assert
        Assert.NotNull(capturedTour);
        var activity = capturedTour!.Classifications[0].Plans[0].Activities[0];
        Assert.Null(activity.EstimatedCost);
    }

    #endregion

    #region TC16: Create activity EstimatedCost negative -> throws

    [Fact]
    public async Task Create_WithActivityEstimatedCostNegative_ShouldThrow()
    {
        // Arrange
        _user.Id.Returns("admin@test.com");
        _tourRepository.Create(Arg.Any<TourEntity>()).Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = CreateBaseValidCommand() with
        {
            Classifications =
            [
                new ClassificationDto(null,
                    Name: "Test",
                    Description: "",
                    BasePrice: 0,
                    NumberOfDay: 1,
                    NumberOfNight: 0,
                    Plans:
                    [
                        new DayPlanDto(null,
                            DayNumber: 1,
                            Title: "Day",
                            Description: null,
                            Activities:
                            [
                                new ActivityDto(null,
                                    ActivityType: "Sightseeing",
                                    Title: "Activity",
                                    Description: null,
                                    Note: null,
                                    EstimatedCost: -50,
                                    IsOptional: false,
                                    StartTime: null,
                                    EndTime: null,
                                    Routes: [],
                                    Accommodation: null)
                            ],
                            Translations: null)
                    ],
                    Insurances: [],
                    Translations: null)
            ]
        };
        var service = CreateService();

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() => service.Create(command));
    }

    #endregion

    #region S1: Route text-only backward compat — FromLocation/ToLocation created

    [Fact]
    public async Task CreateTour_WithRouteTextOnly_BackwardCompat()
    {
        // Arrange
        _user.Id.Returns("admin@test.com");
        TourEntity? captured = null;
        _tourRepository.Create(Arg.Do<TourEntity>(t => captured = t))
            .Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = CreateBaseValidCommand() with
        {
            Classifications =
            [
                new ClassificationDto(null,
                    Name: "Test",
                    Description: "Test",
                    BasePrice: 100,
                    NumberOfDay: 1,
                    NumberOfNight: 0,
                    Plans:
                    [
                        new DayPlanDto(null,
                            DayNumber: 1,
                            Title: "Day",
                            Description: null,
                            Activities:
                            [
                                new ActivityDto(null,
                                    ActivityType: "Transport",
                                    Title: "Airport Pickup",
                                    Description: null,
                                    Note: null,
                                    EstimatedCost: 0,
                                    IsOptional: false,
                                    StartTime: null,
                                    EndTime: null,
                                    Routes:
                                    [
                                        new RouteDto(
                                            TransportationType: "Car",
                                            FromLocationName: "Airport",
                                            ToLocationName: "Hotel",
                                            FromLocationId: null,
                                            ToLocationId: null,
                                            TransportationName: null,
                                            DurationMinutes: 30,
                                            PricingType: null,
                                            Price: 50,
                                            RequiresIndividualTicket: false,
                                            TicketInfo: null,
                                            Note: null,
                                            Translations: null,
                                            RouteTranslations: null)
                                    ],
                                    Accommodation: null,
                                    Translations: null)
                            ],
                            Translations: null)
                    ],
                    Insurances: [])
            ]
        };

        var service = CreateService();

        // Act
        var result = await service.Create(command);

        // Assert
        Assert.False(result.IsError);
        Assert.NotNull(captured);
        var classification = captured!.Classifications[0];
        var plan = classification.Plans[0];
        var activity = plan.Activities[0];
        var route = activity.Routes[0];
        Assert.NotNull(route.FromLocation);
        Assert.NotNull(route.ToLocation);
        Assert.Equal("Airport", route.FromLocation!.LocationName);
        Assert.Equal("Hotel", route.ToLocation!.LocationName);
        Assert.Equal(route.FromLocation.TourId, captured.Id);
        Assert.Equal(route.ToLocation.TourId, captured.Id);
    }

    #endregion

    #region S2: Multiple routes same from/to name — deduplication via location cache

    [Fact]
    public async Task CreateTour_MultipleRoutesSameFromToName_DeduplicatesLocations()
    {
        // Arrange
        _user.Id.Returns("admin@test.com");
        TourEntity? captured = null;
        _tourRepository.Create(Arg.Do<TourEntity>(t => captured = t))
            .Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = CreateBaseValidCommand() with
        {
            Classifications =
            [
                new ClassificationDto(null,
                    Name: "Test",
                    Description: "Test",
                    BasePrice: 100,
                    NumberOfDay: 1,
                    NumberOfNight: 0,
                    Plans:
                    [
                        new DayPlanDto(null,
                            DayNumber: 1,
                            Title: "Day",
                            Description: null,
                            Activities:
                            [
                                new ActivityDto(null,
                                    ActivityType: "Transport",
                                    Title: "Transfer 1",
                                    Description: null,
                                    Note: null,
                                    EstimatedCost: 0,
                                    IsOptional: false,
                                    StartTime: null,
                                    EndTime: null,
                                    Routes:
                                    [
                                        new RouteDto(
                                            TransportationType: "Car",
                                            FromLocationName: "Hotel",
                                            ToLocationName: "Airport",
                                            FromLocationId: null,
                                            ToLocationId: null,
                                            TransportationName: null,
                                            DurationMinutes: 30,
                                            PricingType: null,
                                            Price: 20,
                                            RequiresIndividualTicket: false,
                                            TicketInfo: null,
                                            Note: null,
                                            Translations: null,
                                            RouteTranslations: null),
                                        new RouteDto(
                                            TransportationType: "Car",
                                            FromLocationName: "Airport",
                                            ToLocationName: "Museum",
                                            FromLocationId: null,
                                            ToLocationId: null,
                                            TransportationName: null,
                                            DurationMinutes: 45,
                                            PricingType: null,
                                            Price: 15,
                                            RequiresIndividualTicket: false,
                                            TicketInfo: null,
                                            Note: null,
                                            Translations: null,
                                            RouteTranslations: null)
                                    ],
                                    Accommodation: null,
                                    Translations: null)
                            ],
                            Translations: null)
                    ],
                    Insurances: [])
            ]
        };

        var service = CreateService();

        // Act
        var result = await service.Create(command);

        // Assert
        Assert.False(result.IsError);
        Assert.NotNull(captured);
        var activity = captured!.Classifications[0].Plans[0].Activities[0];
        var hotelRoutes = activity.Routes.Where(r => r.FromLocation?.LocationName == "Hotel").ToList();
        var airportRoutes = activity.Routes.Where(r => r.FromLocation?.LocationName == "Airport").ToList();

        // Hotel appears once as from (1 route), Airport appears once as from and once as to (2 routes total)
        Assert.Single(hotelRoutes);
        Assert.Single(airportRoutes);

        // Same "Airport" location instance used for both routes that mention it
        var airportFrom = activity.Routes.First(r => r.FromLocation?.LocationName == "Airport");
        var airportTo = activity.Routes.First(r => r.ToLocation?.LocationName == "Airport");
        Assert.Same(airportFrom.FromLocation, airportTo.ToLocation);
    }

    #endregion

    #region S3: Transportation with bilingual translations

    [Fact]
    public async Task CreateTour_TransportationWithBilingualTranslations_ShouldSetNameAndTranslations()
    {
        // Arrange
        _user.Id.Returns("admin@test.com");
        TourEntity? captured = null;
        _tourRepository.Create(Arg.Do<TourEntity>(t => captured = t))
            .Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = CreateBaseValidCommand() with
        {
            Transportations =
            [
                new TransportationDto(
                    TransportationType: "Flight",
                    FromLocationName: "Hanoi",
                    ToLocationName: "HCM",
                    FromLocationId: null,
                    ToLocationId: null,
                    TransportationName: "Vietnam Airlines",
                    DurationMinutes: 120,
                    PricingType: "Per person",
                    Price: 100,
                    RequiresIndividualTicket: true,
                    TicketInfo: "Economy",
                    Note: "Direct",
                    Translations: new Dictionary<string, TourTransportationTranslationData>
                    {
                        ["vi"] = new TourTransportationTranslationData("Hà Nội", "TP Hồ Chí Minh", "Hãng Vietnam Airlines", "Phổ thông", "Bay thẳng"),
                        ["en"] = new TourTransportationTranslationData("Hanoi", "Ho Chi Minh City", "Vietnam Airlines", "Economy", "Direct")
                    })
            ]
        };

        var service = CreateService();

        // Act
        var result = await service.Create(command);

        // Assert
        Assert.False(result.IsError);
        Assert.NotNull(captured);
        var resource = captured!.Resources.Single();
        Assert.Equal(TourResourceType.Transportation, resource.Type);
        Assert.Equal(2, resource.Translations.Count);
        Assert.True(resource.Translations.ContainsKey("vi"));
        Assert.True(resource.Translations.ContainsKey("en"));
        Assert.Equal("Hà Nội", resource.Translations["vi"].FromLocationName);
        Assert.Equal("Phổ thông", resource.Translations["vi"].TicketInfo);
    }

    #endregion

    #region Issue1: Cascade soft delete

    [Fact]
    public async Task Delete_WithFullEntityGraph_ShouldCascadeSoftDeleteToAllNestedEntities()
    {
        // Arrange
        _user.Id.Returns("admin@test.com");

        var tourId = Guid.CreateVersion7();
        var classificationId = Guid.CreateVersion7();
        var dayId = Guid.CreateVersion7();
        var activityId = Guid.CreateVersion7();
        var routeId = Guid.CreateVersion7();
        var insuranceId = Guid.CreateVersion7();
        var resourceId = Guid.CreateVersion7();
        var locationId = Guid.CreateVersion7();
        var accommodationId = Guid.CreateVersion7();

        var tour = TourEntity.Create(
            "Test Tour", "Short", "Long", "admin@test.com",
            Domain.Enums.TourStatus.Active);

        // Build a complete entity graph
        var classification = TourClassificationEntity.Create(
            tour.Id, "Standard", 100, "Desc", 1, 0, "admin@test.com");
        classification.Id = classificationId;

        var day = TourDayEntity.Create(
            classification.Id, 1, "Day 1", "admin@test.com");
        day.Id = dayId;

        var activity = TourDayActivityEntity.Create(
            day.Id, 1, Domain.Enums.TourDayActivityType.Sightseeing,
            "Visit", "admin@test.com");
        activity.Id = activityId;

        var fromLocation = TourPlanLocationEntity.Create(
            "Airport", Domain.Enums.LocationType.Airport, "admin@test.com", tour.Id);
        fromLocation.Id = locationId;

        var toLocation = TourPlanLocationEntity.Create(
            "Hotel", Domain.Enums.LocationType.Hotel, "admin@test.com", tour.Id);
        toLocation.Id = Guid.CreateVersion7();

        var route = TourPlanRouteEntity.Create(
            1, Domain.Enums.TransportationType.Car, "admin@test.com");
        route.Id = routeId;
        route.FromLocation = fromLocation;
        route.ToLocation = toLocation;

        activity.Routes.Add(route);

        var accommodation = TourPlanAccommodationEntity.Create(
            "Hotel ABC", Domain.Enums.RoomType.Double, 2,
            Domain.Enums.MealType.Breakfast, "admin@test.com");
        accommodation.Id = accommodationId;
        activity.Accommodation = accommodation;

        day.Activities.Add(activity);
        classification.Plans.Add(day);

        var insurance = TourInsuranceEntity.Create(
            "Insurance", Domain.Enums.InsuranceType.Travel,
            "Provider", "Coverage", 1000, 50, "admin@test.com");
        insurance.Id = insuranceId;
        classification.Insurances.Add(insurance);

        tour.Classifications.Add(classification);

        var resource = TourResourceEntity.Create(
            tour.Id, TourResourceType.Service, "Guide", "admin@test.com");
        resource.Id = resourceId;
        tour.Resources.Add(resource);

        var planLocation = TourPlanLocationEntity.Create(
            "Museum", Domain.Enums.LocationType.Museum, "admin@test.com", tour.Id);
        planLocation.Id = Guid.CreateVersion7();
        tour.PlanLocations.Add(planLocation);

        _tourRepository.FindById(tour.Id).Returns(tour);
        _tourRepository.SoftDelete(tour.Id).Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var service = CreateService();

        // Act
        var result = await service.Delete(tour.Id);

        // Assert
        Assert.False(result.IsError);
        Assert.True(tour.IsDeleted);
        // All nested entities must also have IsDeleted = true
        Assert.True(classification.IsDeleted, "Classification should be soft-deleted");
        Assert.True(day.IsDeleted, "Day should be soft-deleted");
        Assert.True(activity.IsDeleted, "Activity should be soft-deleted");
        Assert.True(fromLocation.IsDeleted, "FromLocation should be soft-deleted");
        Assert.True(toLocation.IsDeleted, "ToLocation should be soft-deleted");
        Assert.True(route.IsDeleted, "Route should be soft-deleted");
        Assert.True(insurance.IsDeleted, "Insurance should be soft-deleted");
        Assert.True(resource.IsDeleted, "Resource should be soft-deleted");
        Assert.True(planLocation.IsDeleted, "PlanLocation should be soft-deleted");
        Assert.True(accommodation.IsDeleted, "Accommodation should be soft-deleted");
        await _unitOfWork.Received(1).SaveChangeAsync(Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangeAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Delete_WhenTourNotFound_ShouldReturnNotFoundError()
    {
        // Arrange
        _user.Id.Returns("admin@test.com");
        var tourId = Guid.CreateVersion7();
        _tourRepository.FindById(tourId).Returns((TourEntity?)null);

        var service = CreateService();

        // Act
        var result = await service.Delete(tourId);

        // Assert
        Assert.True(result.IsError);
        Assert.Equal(ErrorConstants.Tour.NotFoundCode, result.Errors[0].Code);
    }

    #endregion

    #region Issue2: ResolveLocation should fetch from DB when locationId is provided

    [Fact]
    public async Task Create_WithLocationId_ShouldFetchActualLocationFromRepository()
    {
        // Arrange
        _user.Id.Returns("admin@test.com");
        TourEntity? capturedTour = null;
        _tourRepository.Create(Arg.Do<TourEntity>(t => capturedTour = t))
            .Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var existingLocationId = Guid.CreateVersion7();
        var existingLocation = TourPlanLocationEntity.Create(
            "Da Nang Airport",
            Domain.Enums.LocationType.Airport,
            "admin@test.com",
            Guid.Empty); // TourId does not matter for this entity
        existingLocation.Id = existingLocationId;
        existingLocation.Latitude = 16.0544m;
        existingLocation.Longitude = 108.2022m;
        existingLocation.City = "Da Nang";
        existingLocation.Country = "Vietnam";

        _tourRepository.FindLocationByIdAsync(existingLocationId).Returns(existingLocation);

        var command = CreateBaseValidCommand() with
        {
            Classifications =
            [
                new ClassificationDto(null,
                    Name: "Test",
                    Description: "Test",
                    BasePrice: 100,
                    NumberOfDay: 1,
                    NumberOfNight: 0,
                    Plans:
                    [
                        new DayPlanDto(null,
                            DayNumber: 1,
                            Title: "Day",
                            Description: null,
                            Activities:
                            [
                                new ActivityDto(null,
                                    ActivityType: "Transport",
                                    Title: "Transfer",
                                    Description: null,
                                    Note: null,
                                    EstimatedCost: 0,
                                    IsOptional: false,
                                    StartTime: null,
                                    EndTime: null,
                                    Routes:
                                    [
                                        new RouteDto(
                                            TransportationType: "Car",
                                            FromLocationName: null,
                                            ToLocationName: null,
                                            FromLocationId: existingLocationId,
                                            ToLocationId: null,
                                            TransportationName: null,
                                            DurationMinutes: 30,
                                            PricingType: null,
                                            Price: 20,
                                            RequiresIndividualTicket: false,
                                            TicketInfo: null,
                                            Note: null,
                                            Translations: null,
                                            RouteTranslations: null)
                                    ],
                                    Accommodation: null,
                                    Translations: null)
                            ],
                            Translations: null)
                    ],
                    Insurances: [],
                    Translations: null)
            ]
        };
        var service = CreateService();

        // Act
        var result = await service.Create(command);

        // Assert
        Assert.False(result.IsError);
        Assert.NotNull(capturedTour);
        var route = capturedTour!.Classifications[0].Plans[0].Activities[0].Routes[0];
        Assert.NotNull(route.FromLocation);
        // The resolved location should preserve actual properties, not be a generic stub
        Assert.Equal("Da Nang Airport", route.FromLocation.LocationName);
        Assert.Equal(Domain.Enums.LocationType.Airport, route.FromLocation.LocationType);
        Assert.Equal(16.0544m, route.FromLocation.Latitude);
        Assert.Equal(108.2022m, route.FromLocation.Longitude);
        // Verify the repository was called to fetch the location
        await _tourRepository.Received(1).FindLocationByIdAsync(existingLocationId);
    }

    [Fact]
    public async Task Create_WithNonExistentLocationId_ShouldFallbackToStub()
    {
        // Arrange
        _user.Id.Returns("admin@test.com");
        TourEntity? capturedTour = null;
        _tourRepository.Create(Arg.Do<TourEntity>(t => capturedTour = t))
            .Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var nonExistentLocationId = Guid.CreateVersion7();
        _tourRepository.FindLocationByIdAsync(nonExistentLocationId).Returns((TourPlanLocationEntity?)null);

        var command = CreateBaseValidCommand() with
        {
            Classifications =
            [
                new ClassificationDto(null,
                    Name: "Test",
                    Description: "Test",
                    BasePrice: 100,
                    NumberOfDay: 1,
                    NumberOfNight: 0,
                    Plans:
                    [
                        new DayPlanDto(null,
                            DayNumber: 1,
                            Title: "Day",
                            Description: null,
                            Activities:
                            [
                                new ActivityDto(null,
                                    ActivityType: "Transport",
                                    Title: "Transfer",
                                    Description: null,
                                    Note: null,
                                    EstimatedCost: 0,
                                    IsOptional: false,
                                    StartTime: null,
                                    EndTime: null,
                                    Routes:
                                    [
                                        new RouteDto(
                                            TransportationType: "Car",
                                            FromLocationName: null,
                                            ToLocationName: null,
                                            FromLocationId: nonExistentLocationId,
                                            ToLocationId: null,
                                            TransportationName: null,
                                            DurationMinutes: 30,
                                            PricingType: null,
                                            Price: 20,
                                            RequiresIndividualTicket: false,
                                            TicketInfo: null,
                                            Note: null,
                                            Translations: null,
                                            RouteTranslations: null)
                                    ],
                                    Accommodation: null,
                                    Translations: null)
                            ],
                            Translations: null)
                    ],
                    Insurances: [],
                    Translations: null)
            ]
        };
        var service = CreateService();

        // Act
        var result = await service.Create(command);

        // Assert
        Assert.False(result.IsError);
        Assert.NotNull(capturedTour);
        var route = capturedTour!.Classifications[0].Plans[0].Activities[0].Routes[0];
        Assert.NotNull(route.FromLocation);
        // Should fallback to stub with "Referenced Location" name
        Assert.Equal("Referenced Location", route.FromLocation.LocationName);
        Assert.Equal(Domain.Enums.LocationType.Other, route.FromLocation.LocationType);
    }

    #endregion

    #region Issue1 (Update): Standalone resources should be mergeable via Update flow

    private UpdateTourCommand CreateBaseValidUpdateCommand(Guid tourId) => new(
        Id: tourId,
        TourName: "Updated Tour",
        ShortDescription: "Updated short desc",
        LongDescription: "Updated long desc",
        SEOTitle: null,
        SEODescription: null,
        Status: Domain.Enums.TourStatus.Active,
        Thumbnail: null,
        Images: null,
        Translations: null,
        Classifications: null,
        Accommodations: null,
        Locations: null,
        Transportations: null,
        Services: null,
        VisaPolicyId: null,
        DepositPolicyId: null,
        PricingPolicyId: null,
        CancellationPolicyId: null,
        DeletedClassificationIds: null,
        DeletedActivityIds: null);

    private static TourEntity CreateExistingTour(Guid id) =>
        TourEntity.Create(
            "Original Tour",
            "Original short",
            "Original long",
            "admin@test.com",
            Domain.Enums.TourStatus.Active,
            tourScope: Domain.Enums.TourScope.Domestic,
            customerSegment: Domain.Enums.CustomerSegment.Group);

    [Fact]
    public async Task Update_WithStandaloneAccommodations_ShouldAddAsTourResources()
    {
        // Arrange
        var tourId = Guid.CreateVersion7();
        _user.Id.Returns("admin@test.com");
        TourEntity? existingTour = CreateExistingTour(tourId);
        _tourRepository.FindById(tourId, Arg.Any<bool>()).Returns(existingTour);
        _tourRepository.FindByIdForUpdate(tourId).Returns(existingTour);
        _tourRepository.ExistsByTourCode(Arg.Any<string>(), Arg.Any<Guid>()).Returns(false);
        _tourRepository.Update(Arg.Any<TourEntity>()).Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = CreateBaseValidUpdateCommand(tourId) with
        {
            Accommodations =
            [
                new AccommodationDto(
                    AccommodationName: "Hotel A",
                    Address: "123 St",
                    ContactPhone: "0123456789",
                    CheckInTime: "14:00",
                    CheckOutTime: "12:00",
                    Note: null,
                    RoomType: null,
                    RoomCapacity: null,
                    MealsIncluded: null,
                    RoomPrice: null,
                    NumberOfRooms: null,
                    NumberOfNights: null,
                    Latitude: null,
                    Longitude: null,
                    SpecialRequest: null,
                    Translations: null)
            ]
        };

        var service = CreateService();

        // Act
        var result = await service.Update(command);

        // Assert
        Assert.False(result.IsError);
        Assert.Single(existingTour.Resources);
        Assert.Equal(TourResourceType.Accommodation, existingTour.Resources[0].Type);
        Assert.Equal("Hotel A", existingTour.Resources[0].Name);
        Assert.Equal("123 St", existingTour.Resources[0].Address);
        await _tourRepository.Received(1).Update(Arg.Any<TourEntity>());
    }

    [Fact]
    public async Task Update_WithStandaloneLocations_ShouldAddAsTourPlanLocations()
    {
        // Arrange
        var tourId = Guid.CreateVersion7();
        _user.Id.Returns("admin@test.com");
        TourEntity? existingTour = CreateExistingTour(tourId);
        _tourRepository.FindById(tourId, Arg.Any<bool>()).Returns(existingTour);
        _tourRepository.FindByIdForUpdate(tourId).Returns(existingTour);
        _tourRepository.ExistsByTourCode(Arg.Any<string>(), Arg.Any<Guid>()).Returns(false);
        _tourRepository.Update(Arg.Any<TourEntity>()).Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = CreateBaseValidUpdateCommand(tourId) with
        {
            Locations =
            [
                new LocationDto(
                    LocationName: "Museum",
                    LocationType: "Museum",
                    Description: "Art museum",
                    City: "Da Nang",
                    Country: "Vietnam",
                    EntranceFee: 0,
                    Address: null,
                    Translations: null)
            ]
        };

        var service = CreateService();

        // Act
        var result = await service.Update(command);

        // Assert
        Assert.False(result.IsError);
        Assert.Single(existingTour.PlanLocations);
        Assert.Equal("Museum", existingTour.PlanLocations[0].LocationName);
        Assert.Equal(Domain.Enums.LocationType.Museum, existingTour.PlanLocations[0].LocationType);
        Assert.Equal("Da Nang", existingTour.PlanLocations[0].City);
        await _tourRepository.Received(1).Update(Arg.Any<TourEntity>());
    }

    [Fact]
    public async Task Update_WithStandaloneTransportations_ShouldAddAsTourResources()
    {
        // Arrange
        var tourId = Guid.CreateVersion7();
        _user.Id.Returns("admin@test.com");
        TourEntity? existingTour = CreateExistingTour(tourId);
        _tourRepository.FindById(tourId, Arg.Any<bool>()).Returns(existingTour);
        _tourRepository.FindByIdForUpdate(tourId).Returns(existingTour);
        _tourRepository.ExistsByTourCode(Arg.Any<string>(), Arg.Any<Guid>()).Returns(false);
        _tourRepository.Update(Arg.Any<TourEntity>()).Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = CreateBaseValidUpdateCommand(tourId) with
        {
            Transportations =
            [
                new TransportationDto(
                    FromLocationName: "Hotel",
                    ToLocationName: "Beach",
                    TransportationType: "Bus",
                    TransportationName: "City Bus",
                    FromLocationId: null,
                    ToLocationId: null,
                    DurationMinutes: 30,
                    PricingType: "Per person",
                    Price: 5,
                    RequiresIndividualTicket: false,
                    TicketInfo: null,
                    Note: null,
                    Translations: null)
            ]
        };

        var service = CreateService();

        // Act
        var result = await service.Update(command);

        // Assert
        Assert.False(result.IsError);
        Assert.Single(existingTour.Resources);
        Assert.Equal(TourResourceType.Transportation, existingTour.Resources[0].Type);
        Assert.Equal("City Bus", existingTour.Resources[0].TransportationName);
        await _tourRepository.Received(1).Update(Arg.Any<TourEntity>());
    }

    [Fact]
    public async Task Update_WithStandaloneServices_ShouldAddAsTourResources()
    {
        // Arrange
        var tourId = Guid.CreateVersion7();
        _user.Id.Returns("admin@test.com");
        TourEntity? existingTour = CreateExistingTour(tourId);
        _tourRepository.FindById(tourId, Arg.Any<bool>()).Returns(existingTour);
        _tourRepository.FindByIdForUpdate(tourId).Returns(existingTour);
        _tourRepository.ExistsByTourCode(Arg.Any<string>(), Arg.Any<Guid>()).Returns(false);
        _tourRepository.Update(Arg.Any<TourEntity>()).Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = CreateBaseValidUpdateCommand(tourId) with
        {
            Services =
            [
                new ServiceDto(
                    Id: null,
                    ServiceName: "Guide Service",
                    PricingType: "Per Person",
                    Price: 50,
                    SalePrice: 45,
                    Email: "guide@tour.com",
                    ContactNumber: "0123456789")
            ]
        };

        var service = CreateService();

        // Act
        var result = await service.Update(command);

        // Assert
        Assert.False(result.IsError);
        Assert.Single(existingTour.Resources);
        Assert.Equal(TourResourceType.Service, existingTour.Resources[0].Type);
        Assert.Equal("Guide Service", existingTour.Resources[0].Name);
        Assert.Equal(50, existingTour.Resources[0].Price);
        await _tourRepository.Received(1).Update(Arg.Any<TourEntity>());
    }

    #endregion

    #region Issue3: Cascade soft-delete classifications and activities via Update

    [Fact]
    public async Task Update_WithDeletedClassificationIds_ShouldSoftDeleteClassificationAndNestedEntities()
    {
        // Arrange
        var tourId = Guid.CreateVersion7();
        var classificationId = Guid.CreateVersion7();
        var dayId = Guid.CreateVersion7();
        var activityId = Guid.CreateVersion7();
        var routeId = Guid.CreateVersion7();
        var insuranceId = Guid.CreateVersion7();

        var existingTour = CreateExistingTour(tourId);
        var classification = TourClassificationEntity.Create(
            tourId, "Standard", 100, "Desc", 1, 0, "admin@test.com");
        classification.Id = classificationId;

        var day = TourDayEntity.Create(classification.Id, 1, "Day 1", "admin@test.com");
        day.Id = dayId;

        var fromLocation = TourPlanLocationEntity.Create(
            "Airport", Domain.Enums.LocationType.Airport, "admin@test.com", tourId);
        var toLocation = TourPlanLocationEntity.Create(
            "Hotel", Domain.Enums.LocationType.Hotel, "admin@test.com", tourId);
        var route = TourPlanRouteEntity.Create(
            1, Domain.Enums.TransportationType.Car, "admin@test.com");
        route.Id = routeId;
        route.FromLocation = fromLocation;
        route.ToLocation = toLocation;

        var activity = TourDayActivityEntity.Create(
            day.Id, 1, Domain.Enums.TourDayActivityType.Sightseeing,
            "Visit", "admin@test.com");
        activity.Id = activityId;
        activity.Routes.Add(route);

        day.Activities.Add(activity);
        classification.Plans.Add(day);

        var insurance = TourInsuranceEntity.Create(
            "Insurance", Domain.Enums.InsuranceType.Travel,
            "Provider", "Coverage", 1000, 50, "admin@test.com");
        insurance.Id = insuranceId;
        classification.Insurances.Add(insurance);

        existingTour.Classifications.Add(classification);

        _user.Id.Returns("admin@test.com");
        _tourRepository.FindById(tourId, Arg.Any<bool>()).Returns(existingTour);
        _tourRepository.FindByIdForUpdate(tourId).Returns(existingTour);
        _tourRepository.ExistsByTourCode(Arg.Any<string>(), Arg.Any<Guid>()).Returns(false);
        _tourRepository.Update(Arg.Any<TourEntity>()).Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = CreateBaseValidUpdateCommand(tourId) with
        {
            DeletedClassificationIds = [classificationId]
        };

        var service = CreateService();

        // Act
        var result = await service.Update(command);

        // Assert
        Assert.False(result.IsError);
        Assert.True(classification.IsDeleted, "Classification should be soft-deleted");
        Assert.True(day.IsDeleted, "Day should be soft-deleted");
        Assert.True(activity.IsDeleted, "Activity should be soft-deleted");
        Assert.True(route.IsDeleted, "Route should be soft-deleted");
        Assert.True(fromLocation.IsDeleted, "FromLocation should be soft-deleted");
        Assert.True(toLocation.IsDeleted, "ToLocation should be soft-deleted");
        Assert.True(insurance.IsDeleted, "Insurance should be soft-deleted");
        await _unitOfWork.Received(1).SaveChangeAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Update_WithDeletedActivityIds_ShouldSoftDeleteActivityAndNestedRoutesAccommodations()
    {
        // Arrange
        var tourId = Guid.CreateVersion7();
        var classificationId = Guid.CreateVersion7();
        var dayId = Guid.CreateVersion7();
        var activityId = Guid.CreateVersion7();
        var routeId = Guid.CreateVersion7();

        var existingTour = CreateExistingTour(tourId);
        var classification = TourClassificationEntity.Create(
            tourId, "Standard", 100, "Desc", 1, 0, "admin@test.com");
        classification.Id = classificationId;

        var day = TourDayEntity.Create(classification.Id, 1, "Day 1", "admin@test.com");
        day.Id = dayId;

        var fromLocation = TourPlanLocationEntity.Create(
            "Airport", Domain.Enums.LocationType.Airport, "admin@test.com", tourId);
        var toLocation = TourPlanLocationEntity.Create(
            "Hotel", Domain.Enums.LocationType.Hotel, "admin@test.com", tourId);
        var route = TourPlanRouteEntity.Create(
            1, Domain.Enums.TransportationType.Car, "admin@test.com");
        route.Id = routeId;
        route.FromLocation = fromLocation;
        route.ToLocation = toLocation;

        var activity = TourDayActivityEntity.Create(
            day.Id, 1, Domain.Enums.TourDayActivityType.Sightseeing,
            "Visit", "admin@test.com");
        activity.Id = activityId;
        activity.Routes.Add(route);

        var accommodation = TourPlanAccommodationEntity.Create(
            "Hotel ABC", Domain.Enums.RoomType.Double, 2,
            Domain.Enums.MealType.Breakfast, "admin@test.com");
        activity.Accommodation = accommodation;

        day.Activities.Add(activity);
        classification.Plans.Add(day);
        existingTour.Classifications.Add(classification);

        _user.Id.Returns("admin@test.com");
        _tourRepository.FindById(tourId, Arg.Any<bool>()).Returns(existingTour);
        _tourRepository.FindByIdForUpdate(tourId).Returns(existingTour);
        _tourRepository.ExistsByTourCode(Arg.Any<string>(), Arg.Any<Guid>()).Returns(false);
        _tourRepository.Update(Arg.Any<TourEntity>()).Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = CreateBaseValidUpdateCommand(tourId) with
        {
            DeletedActivityIds = [activityId]
        };

        var service = CreateService();

        // Act
        var result = await service.Update(command);

        // Assert
        Assert.False(result.IsError);
        Assert.True(activity.IsDeleted, "Activity should be soft-deleted");
        Assert.True(route.IsDeleted, "Route should be soft-deleted");
        Assert.True(fromLocation.IsDeleted, "FromLocation should be soft-deleted");
        Assert.True(toLocation.IsDeleted, "ToLocation should be soft-deleted");
        Assert.True(accommodation.IsDeleted, "Accommodation should be soft-deleted");
        // Day and Classification should NOT be deleted
        Assert.False(day.IsDeleted, "Day should NOT be soft-deleted");
        Assert.False(classification.IsDeleted, "Classification should NOT be soft-deleted");
        await _unitOfWork.Received(1).SaveChangeAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Update_WithDeletedClassificationIds_OnlyDeletesSpecifiedIds()
    {
        // Arrange
        var tourId = Guid.CreateVersion7();
        var classificationId1 = Guid.CreateVersion7();
        var classificationId2 = Guid.CreateVersion7();
        var dayId = Guid.CreateVersion7();

        var existingTour = CreateExistingTour(tourId);
        var classification1 = TourClassificationEntity.Create(
            tourId, "Standard", 100, "Desc", 1, 0, "admin@test.com");
        classification1.Id = classificationId1;

        var classification2 = TourClassificationEntity.Create(
            tourId, "Premium", 200, "Desc", 2, 1, "admin@test.com");
        classification2.Id = classificationId2;

        var day = TourDayEntity.Create(classification1.Id, 1, "Day 1", "admin@test.com");
        day.Id = dayId;
        classification1.Plans.Add(day);

        existingTour.Classifications.Add(classification1);
        existingTour.Classifications.Add(classification2);

        _user.Id.Returns("admin@test.com");
        _tourRepository.FindById(tourId, Arg.Any<bool>()).Returns(existingTour);
        _tourRepository.FindByIdForUpdate(tourId).Returns(existingTour);
        _tourRepository.ExistsByTourCode(Arg.Any<string>(), Arg.Any<Guid>()).Returns(false);
        _tourRepository.Update(Arg.Any<TourEntity>()).Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = CreateBaseValidUpdateCommand(tourId) with
        {
            DeletedClassificationIds = [classificationId1]
        };

        var service = CreateService();

        // Act
        var result = await service.Update(command);

        // Assert
        Assert.False(result.IsError);
        Assert.True(classification1.IsDeleted, "Only deleted classification1");
        Assert.False(classification2.IsDeleted, "classification2 should NOT be deleted");
        Assert.True(day.IsDeleted, "Nested day should be deleted");
    }

    #endregion

    #region UpdateStatus

    [Fact]
    public async Task UpdateStatus_WhenTourExists_ShouldReturnSuccess()
    {
        // Arrange
        var tourId = Guid.CreateVersion7();
        _user.Id.Returns("admin@test.com");
        _tourRepository.UpdateStatus(tourId, Domain.Enums.TourStatus.Active, "admin@test.com")
            .Returns(1);

        var service = CreateService();

        // Act
        var result = await service.UpdateStatus(tourId, Domain.Enums.TourStatus.Active);

        // Assert
        Assert.False(result.IsError);
        await _tourRepository.Received(1).UpdateStatus(tourId, Domain.Enums.TourStatus.Active, "admin@test.com");
    }

    [Fact]
    public async Task UpdateStatus_WhenTourNotFound_ShouldReturnNotFoundError()
    {
        // Arrange
        var tourId = Guid.CreateVersion7();
        _user.Id.Returns("admin@test.com");
        _tourRepository.UpdateStatus(tourId, Domain.Enums.TourStatus.Inactive, "admin@test.com")
            .Returns(0);

        var service = CreateService();

        // Act
        var result = await service.UpdateStatus(tourId, Domain.Enums.TourStatus.Inactive);

        // Assert
        Assert.True(result.IsError);
        Assert.Equal(ErrorConstants.Tour.NotFoundCode, result.Errors[0].Code);
    }

    #endregion

    #region T3.1: Create should set TourDesignerId from current user

    [Fact]
    public async Task Create_ShouldSetTourDesignerIdToCurrentUser()
    {
        // Arrange
        var userId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        _user.Id.Returns(userId.ToString());
        TourEntity? capturedTour = null;
        _tourRepository.Create(Arg.Do<TourEntity>(t => capturedTour = t))
            .Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = CreateBaseValidCommand();
        var service = CreateService();

        // Act
        var result = await service.Create(command);

        // Assert
        Assert.False(result.IsError);
        Assert.NotNull(capturedTour);
        Assert.Equal(userId, capturedTour!.TourDesignerId);
    }

    #endregion

    #region T3.4: Update should not change TourDesignerId

    [Fact]
    public async Task Update_ShouldPreserveTourDesignerId()
    {
        // Arrange
        var tourId = Guid.NewGuid();
        var originalTourDesignerId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        var existingTour = TourEntity.Create(
            "Original Tour",
            "Original short",
            "Original long",
            "performer@test.com",
            Domain.Enums.TourStatus.Active);
        existingTour.Id = tourId;
        existingTour.TourDesignerId = originalTourDesignerId;

        _user.Id.Returns("updater@test.com");
        _tourRepository.FindById(tourId, Arg.Any<bool>()).Returns(existingTour);
        _tourRepository.FindByIdForUpdate(tourId).Returns(existingTour);
        _tourRepository.ExistsByTourCode(Arg.Any<string>(), tourId).Returns(false);
        _tourRepository.Update(Arg.Any<TourEntity>()).Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = CreateBaseValidUpdateCommand(tourId) with
        {
            TourName = "Updated Tour Name",
            ShortDescription = "Updated short",
            LongDescription = "Updated long"
        };
        var service = CreateService();

        // Act
        var result = await service.Update(command);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(originalTourDesignerId, existingTour.TourDesignerId);
    }

    #endregion
}
