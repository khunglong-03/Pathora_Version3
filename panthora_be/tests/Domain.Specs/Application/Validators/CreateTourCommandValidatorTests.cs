using Application.Dtos;
using Application.Features.Tour.Commands;
using Application.Features.Tour.Validators;
using Domain.Enums;

namespace Domain.Specs.Application.Validators;

/// <summary>
/// Comprehensive test cases for CreateTourCommand covering ALL properties
/// Following FPT template: N (Normal), A (Abnormal), B (Boundary)
/// </summary>
public class CreateTourCommandValidatorTests
{
    private readonly CreateTourCommandValidator _validator = new();

    #region Helper Methods

    private string CreateString(int length) => new('A', length);

    private ImageInputDto CreateValidImage(string fileId = "file-123") => new(
        FileId: fileId,
        OriginalFileName: "image.jpg",
        FileName: "image.jpg",
        PublicURL: "https://cdn.example.com/image.jpg");

    private static readonly Guid _validPricingPolicyId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    private CreateTourCommand CreateBaseValidCommand() => new(
        TourName: "Da Nang Beach Tour",
        ShortDescription: "Beach vacation",
        LongDescription: "5-day beach tour",
        SEOTitle: null,
        SEODescription: null,
        Status: TourStatus.Active,
        Thumbnail: CreateValidImage(),
        Images: [CreateValidImage("img-1")],
        Classifications: null,
        PricingPolicyId: _validPricingPolicyId);

    #endregion

    #region TC01: All Valid - Normal

    [Fact]
    public void Validate_TC01_AllBasicFieldsValid_ShouldPass()
    {
        var command = CreateBaseValidCommand();
        var result = _validator.Validate(command);
        Assert.True(result.IsValid, string.Join(", ", result.Errors.Select(e => e.ErrorMessage)));
    }

    #endregion

    #region TC02: TourName Empty - Abnormal

    [Fact]
    public void Validate_TC02_TourNameEmpty_ShouldFail()
    {
        var command = CreateBaseValidCommand() with { TourName = "" };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "TourName");
    }

    #endregion

    #region TC03: TourName Max 500 - Boundary

    [Fact]
    public void Validate_TC03_TourNameMaxChars_ShouldPass()
    {
        var command = CreateBaseValidCommand() with { TourName = CreateString(500) };
        var result = _validator.Validate(command);
        Assert.True(result.IsValid);
    }

    #endregion

    #region TC04: ShortDescription Empty - Abnormal

    [Fact]
    public void Validate_TC04_ShortDescriptionEmpty_ShouldFail()
    {
        var command = CreateBaseValidCommand() with { ShortDescription = "" };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "ShortDescription");
    }

    #endregion

    #region TC05: ShortDescription Max 250 - Boundary

    [Fact]
    public void Validate_TC05_ShortDescriptionMaxChars_ShouldPass()
    {
        var command = CreateBaseValidCommand() with { ShortDescription = CreateString(250) };
        var result = _validator.Validate(command);
        Assert.True(result.IsValid);
    }

    #endregion

    #region TC06: LongDescription Empty - Abnormal

    [Fact]
    public void Validate_TC06_LongDescriptionEmpty_ShouldFail()
    {
        var command = CreateBaseValidCommand() with { LongDescription = "" };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "LongDescription");
    }

    #endregion

    #region TC07: LongDescription Max 5000 - Boundary

    [Fact]
    public void Validate_TC07_LongDescriptionMaxChars_ShouldPass()
    {
        var command = CreateBaseValidCommand() with { LongDescription = CreateString(5000) };
        var result = _validator.Validate(command);
        Assert.True(result.IsValid);
    }

    #endregion

    #region TC08: Invalid Status - Abnormal

    [Fact]
    public void Validate_TC08_InvalidStatus_ShouldFail()
    {
        var command = CreateBaseValidCommand() with { Status = (TourStatus)999 };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Status");
    }

    #endregion

    #region TC09: Thumbnail Required - Abnormal

    [Fact]
    public void Validate_TC09_ThumbnailNull_ShouldFail()
    {
        var command = CreateBaseValidCommand() with { Thumbnail = null };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Thumbnail");
    }

    #endregion

    #region TC10: Thumbnail Valid - Normal

    [Fact]
    public void Validate_TC10_ThumbnailValid_ShouldPass()
    {
        var command = CreateBaseValidCommand();
        var result = _validator.Validate(command);
        Assert.True(result.IsValid);
    }

    #endregion

    #region TC11: Thumbnail FileId Empty - Abnormal

    [Fact]
    public void Validate_TC11_ThumbnailFileIdEmpty_ShouldFail()
    {
        var command = CreateBaseValidCommand() with
        {
            Thumbnail = new ImageInputDto(
                FileId: "",
                OriginalFileName: "image.jpg",
                FileName: "image.jpg",
                PublicURL: "https://cdn.example.com/image.jpg")
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("Thumbnail"));
    }

    #endregion

    #region TC12: Thumbnail Invalid URL - Abnormal

    [Fact]
    public void Validate_TC12_ThumbnailInvalidURL_ShouldFail()
    {
        var command = CreateBaseValidCommand() with
        {
            Thumbnail = new ImageInputDto(
                FileId: "file-123",
                OriginalFileName: "image.jpg",
                FileName: "image.jpg",
                PublicURL: "not-a-valid-url")
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("PublicURL"));
    }

    #endregion

    #region TC13: Images Required - Abnormal

    [Fact]
    public void Validate_TC13_ImagesNull_ShouldFail()
    {
        var command = CreateBaseValidCommand() with { Images = null };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Images");
    }

    #endregion

    #region TC14: Images Empty List - Abnormal

    [Fact]
    public void Validate_TC14_ImagesEmpty_ShouldFail()
    {
        var command = CreateBaseValidCommand() with { Images = [] };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Images");
    }

    #endregion

    #region TC15: Images Valid - Normal

    [Fact]
    public void Validate_TC15_ImagesValid_ShouldPass()
    {
        var command = CreateBaseValidCommand() with
        {
            Images = [CreateValidImage("img-1"), CreateValidImage("img-2")]
        };
        var result = _validator.Validate(command);
        Assert.True(result.IsValid);
    }

    #endregion

    #region TC16: Images Invalid FileId - Abnormal

    [Fact]
    public void Validate_TC16_ImagesInvalidFileId_ShouldFail()
    {
        var command = CreateBaseValidCommand() with
        {
            Images = [new ImageInputDto(
                FileId: "",
                OriginalFileName: "image.jpg",
                FileName: "image.jpg",
                PublicURL: "https://cdn.example.com/image.jpg")]
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("Images"));
    }

    #endregion

    #region TC17: Classification Valid - Normal

    [Fact]
    public void Validate_TC17_ClassificationValid_ShouldPass()
    {
        var command = CreateBaseValidCommand() with
        {
            Classifications = [new ClassificationDto(null,
                Name: "Standard Tour",
                Description: "Standard package",
                BasePrice: 1000,
                NumberOfDay: 3,
                NumberOfNight: 2,
                Plans: [],
                Insurances: [])
            ]
        };
        var result = _validator.Validate(command);
        Assert.True(result.IsValid);
    }

    #endregion

    #region TC18: Classification Name Empty - Abnormal

    [Fact]
    public void Validate_TC18_ClassificationNameEmpty_ShouldFail()
    {
        var command = CreateBaseValidCommand() with
        {
            Classifications = [new ClassificationDto(null,
                Name: "",
                Description: "Description",
                BasePrice: 1000,
                NumberOfDay: 3,
                NumberOfNight: 2,
                Plans: [],
                Insurances: [])
            ]
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("Classifications"));
    }

    #endregion

    #region TC19: Classification Negative Price - Abnormal

    [Fact]
    public void Validate_TC19_ClassificationNegativePrice_ShouldFail()
    {
        var command = CreateBaseValidCommand() with
        {
            Classifications = [new ClassificationDto(null,
                Name: "Standard",
                Description: "Description",
                BasePrice: -100,
                NumberOfDay: 3,
                NumberOfNight: 2,
                Plans: [],
                Insurances: [])
            ]
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("BasePrice"));
    }

    #endregion

    #region TC20: Classification Zero Days - Abnormal

    [Fact]
    public void Validate_TC20_ClassificationZeroDays_ShouldFail()
    {
        var command = CreateBaseValidCommand() with
        {
            Classifications = [new ClassificationDto(null,
                Name: "Standard",
                Description: "Description",
                BasePrice: 1000,
                NumberOfDay: 0,
                NumberOfNight: 2,
                Plans: [],
                Insurances: [])
            ]
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("NumberOfDay"));
    }

    #endregion

    #region TC21: DayPlan Valid - Normal

    [Fact]
    public void Validate_TC21_DayPlanValid_ShouldPass()
    {
        var command = CreateBaseValidCommand() with
        {
            Classifications = [new ClassificationDto(null,
                Name: "Standard",
                Description: "Description",
                BasePrice: 1000,
                NumberOfDay: 3,
                NumberOfNight: 2,
                Plans: [new DayPlanDto(null,
                    DayNumber: 1,
                    Title: "Day 1 Title",
                    Description: "Day 1 description",
                    Activities: [])],
                Insurances: [])
            ]
        };
        var result = _validator.Validate(command);
        Assert.True(result.IsValid);
    }

    #endregion

    #region TC22: DayPlan Title Empty - Abnormal

    [Fact]
    public void Validate_TC22_DayPlanTitleEmpty_ShouldFail()
    {
        var command = CreateBaseValidCommand() with
        {
            Classifications = [new ClassificationDto(null,
                Name: "Standard",
                Description: "Description",
                BasePrice: 1000,
                NumberOfDay: 3,
                NumberOfNight: 2,
                Plans: [new DayPlanDto(null,
                    DayNumber: 1,
                    Title: "",
                    Description: "Description",
                    Activities: [])],
                Insurances: [])
            ]
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("Title"));
    }

    #endregion

    #region TC23: Activity Valid - Normal

    [Fact]
    public void Validate_TC23_ActivityValid_ShouldPass()
    {
        var command = CreateBaseValidCommand() with
        {
            Classifications = [new ClassificationDto(null,
                Name: "Standard",
                Description: "Description",
                BasePrice: 1000,
                NumberOfDay: 3,
                NumberOfNight: 2,
                Plans: [new DayPlanDto(null,
                    DayNumber: 1,
                    Title: "Day 1",
                    Description: "Description",
                    Activities: [new ActivityDto(null,
                        ActivityType: "Sightseeing",
                        Title: "Visit Temple",
                        Description: "Visit ancient temple",
                        Note: null,
                        EstimatedCost: 50,
                        IsOptional: false,
                        StartTime: "09:00",
                        EndTime: "12:00",
                        Routes: [],
                        Accommodation: null)])],
                Insurances: [])
            ]
        };
        var result = _validator.Validate(command);
        Assert.True(result.IsValid);
    }

    #endregion

    #region TC24: Activity Type Empty - Abnormal

    [Fact]
    public void Validate_TC24_ActivityTypeEmpty_ShouldFail()
    {
        var command = CreateBaseValidCommand() with
        {
            Classifications = [new ClassificationDto(null,
                Name: "Standard",
                Description: "Description",
                BasePrice: 1000,
                NumberOfDay: 3,
                NumberOfNight: 2,
                Plans: [new DayPlanDto(null,
                    DayNumber: 1,
                    Title: "Day 1",
                    Description: "Description",
                    Activities: [new ActivityDto(null,
                        ActivityType: "",
                        Title: "Activity",
                        Description: null,
                        Note: null,
                        EstimatedCost: null,
                        IsOptional: false,
                        StartTime: null,
                        EndTime: null,
                        Routes: [],
                        Accommodation: null)])],
                Insurances: [])
            ]
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("ActivityType"));
    }

    #endregion

    #region TC25: Accommodation Valid - Normal

    [Fact]
    public void Validate_TC25_AccommodationValid_ShouldPass()
    {
        var command = CreateBaseValidCommand() with
        {
            Classifications = [new ClassificationDto(null,
                Name: "Standard",
                Description: "Description",
                BasePrice: 1000,
                NumberOfDay: 3,
                NumberOfNight: 2,
                Plans: [new DayPlanDto(null,
                    DayNumber: 1,
                    Title: "Day 1",
                    Description: "Description",
                    Activities: [new ActivityDto(null,
                        ActivityType: "Sightseeing",
                        Title: "Activity",
                        Description: null,
                        Note: null,
                        EstimatedCost: null,
                        IsOptional: false,
                        StartTime: null,
                        EndTime: null,
                        Routes: [],
                        Accommodation: new AccommodationDto(
                            AccommodationName: "Hotel ABC",
                            Address: "123 Main St",
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
                            SpecialRequest: null))])],
                Insurances: [])
            ]
        };
        var result = _validator.Validate(command);
        Assert.True(result.IsValid);
    }

    #endregion

    #region TC26: Accommodation Name Empty - Abnormal

    [Fact]
    public void Validate_TC26_AccommodationNameEmpty_ShouldFail()
    {
        var command = CreateBaseValidCommand() with
        {
            Classifications = [new ClassificationDto(null,
                Name: "Standard",
                Description: "Description",
                BasePrice: 1000,
                NumberOfDay: 3,
                NumberOfNight: 2,
                Plans: [new DayPlanDto(null,
                    DayNumber: 1,
                    Title: "Day 1",
                    Description: "Description",
                    Activities: [new ActivityDto(null,
                        ActivityType: "Sightseeing",
                        Title: "Activity",
                        Description: null,
                        Note: null,
                        EstimatedCost: null,
                        IsOptional: false,
                        StartTime: null,
                        EndTime: null,
                        Routes: [],
                        Accommodation: new AccommodationDto(
                            AccommodationName: "",
                            Address: "123 Main St",
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
                            SpecialRequest: null))])],
                Insurances: [])
            ]
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("AccommodationName"));
    }

    #endregion

    #region TC27: Accommodation Invalid Phone - Abnormal

    [Fact]
    public void Validate_TC27_AccommodationInvalidPhone_ShouldFail()
    {
        var command = CreateBaseValidCommand() with
        {
            Classifications = [new ClassificationDto(null,
                Name: "Standard",
                Description: "Description",
                BasePrice: 1000,
                NumberOfDay: 3,
                NumberOfNight: 2,
                Plans: [new DayPlanDto(null,
                    DayNumber: 1,
                    Title: "Day 1",
                    Description: "Description",
                    Activities: [new ActivityDto(null,
                        ActivityType: "Sightseeing",
                        Title: "Activity",
                        Description: null,
                        Note: null,
                        EstimatedCost: null,
                        IsOptional: false,
                        StartTime: null,
                        EndTime: null,
                        Routes: [],
                        Accommodation: new AccommodationDto(
                            AccommodationName: "Hotel ABC",
                            Address: null,
                            ContactPhone: "invalid-phone!",
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
                            SpecialRequest: null))])],
                Insurances: [])
            ]
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("ContactPhone"));
    }

    #endregion

    #region TC28: Route Valid - Normal

    [Fact]
    public void Validate_TC28_RouteValid_ShouldPass()
    {
        var command = CreateBaseValidCommand() with
        {
            Classifications = [new ClassificationDto(null,
                Name: "Standard",
                Description: "Description",
                BasePrice: 1000,
                NumberOfDay: 3,
                NumberOfNight: 2,
                Plans: [new DayPlanDto(null,
                    DayNumber: 1,
                    Title: "Day 1",
                    Description: "Description",
                    Activities: [new ActivityDto(null,
                        ActivityType: "Sightseeing",
                        Title: "Activity",
                        Description: null,
                        Note: null,
                        EstimatedCost: null,
                        IsOptional: false,
                        StartTime: null,
                        EndTime: null,
                        Routes: [new RouteDto(
                            TransportationType: "Bus",
                            FromLocationName: "Hotel",
                            ToLocationName: "Temple",
                            FromLocationId: null,
                            ToLocationId: null,
                            TransportationName: null,
                            DurationMinutes: 60,
                            PricingType: null,
                            Price: 20,
                            RequiresIndividualTicket: false,
                            TicketInfo: null,
                            Note: null,
                            Translations: null,
                            RouteTranslations: null)],
                        Accommodation: null)])],
                Insurances: [])
            ]
        };
        var result = _validator.Validate(command);
        Assert.True(result.IsValid);
    }

    #endregion

    #region TC29: Route FromLocation Empty - Abnormal

    [Fact]
    public void Validate_TC29_RouteFromLocationEmpty_ShouldFail()
    {
        var command = CreateBaseValidCommand() with
        {
            Classifications = [new ClassificationDto(null,
                Name: "Standard",
                Description: "Description",
                BasePrice: 1000,
                NumberOfDay: 3,
                NumberOfNight: 2,
                Plans: [new DayPlanDto(null,
                    DayNumber: 1,
                    Title: "Day 1",
                    Description: "Description",
                    Activities: [new ActivityDto(null,
                        ActivityType: "Sightseeing",
                        Title: "Activity",
                        Description: null,
                        Note: null,
                        EstimatedCost: null,
                        IsOptional: false,
                        StartTime: null,
                        EndTime: null,
                        Routes: [new RouteDto(
                            TransportationType: "Bus",
                            FromLocationName: "",
                            ToLocationName: "Temple",
                            FromLocationId: null,
                            ToLocationId: null,
                            TransportationName: null,
                            DurationMinutes: 60,
                            PricingType: null,
                            Price: null,
                            RequiresIndividualTicket: false,
                            TicketInfo: null,
                            Note: null,
                            Translations: null,
                            RouteTranslations: null)],
                        Accommodation: null)])],
                Insurances: [])
            ]
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("FromLocationName"));
    }

    #endregion

    #region TC30: Route Negative Duration - Abnormal

    [Fact]
    public void Validate_TC30_RouteNegativeDuration_ShouldFail()
    {
        var command = CreateBaseValidCommand() with
        {
            Classifications = [new ClassificationDto(null,
                Name: "Standard",
                Description: "Description",
                BasePrice: 1000,
                NumberOfDay: 3,
                NumberOfNight: 2,
                Plans: [new DayPlanDto(null,
                    DayNumber: 1,
                    Title: "Day 1",
                    Description: "Description",
                    Activities: [new ActivityDto(null,
                        ActivityType: "Sightseeing",
                        Title: "Activity",
                        Description: null,
                        Note: null,
                        EstimatedCost: null,
                        IsOptional: false,
                        StartTime: null,
                        EndTime: null,
                        Routes: [new RouteDto(
                            TransportationType: "Bus",
                            FromLocationName: "Hotel",
                            ToLocationName: "Temple",
                            FromLocationId: null,
                            ToLocationId: null,
                            TransportationName: null,
                            DurationMinutes: -10,
                            PricingType: null,
                            Price: null,
                            RequiresIndividualTicket: false,
                            TicketInfo: null,
                            Note: null,
                            Translations: null,
                            RouteTranslations: null)],
                        Accommodation: null)])],
                Insurances: [])
            ]
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("DurationMinutes"));
    }

    #endregion

    #region TC31: Insurance Valid - Normal

    [Fact]
    public void Validate_TC31_InsuranceValid_ShouldPass()
    {
        var command = CreateBaseValidCommand() with
        {
            Classifications = [new ClassificationDto(null,
                Name: "Standard",
                Description: "Description",
                BasePrice: 1000,
                NumberOfDay: 3,
                NumberOfNight: 2,
                Plans: [],
                Insurances: [new InsuranceDto(
                    InsuranceName: "Travel Insurance",
                    InsuranceType: "Travel",
                    InsuranceProvider: "ABC Insurance",
                    CoverageDescription: "Basic coverage",
                    CoverageAmount: 10000,
                    CoverageFee: 50,
                    IsOptional: true,
                    Note: null)])
            ]
        };
        var result = _validator.Validate(command);
        Assert.True(result.IsValid);
    }

    #endregion

    #region TC32: Insurance Name Empty - Abnormal

    [Fact]
    public void Validate_TC32_InsuranceNameEmpty_ShouldFail()
    {
        var command = CreateBaseValidCommand() with
        {
            Classifications = [new ClassificationDto(null,
                Name: "Standard",
                Description: "Description",
                BasePrice: 1000,
                NumberOfDay: 3,
                NumberOfNight: 2,
                Plans: [],
                Insurances: [new InsuranceDto(
                    InsuranceName: "",
                    InsuranceType: "Travel",
                    InsuranceProvider: "ABC Insurance",
                    CoverageDescription: "Basic coverage",
                    CoverageAmount: 10000,
                    CoverageFee: 50,
                    IsOptional: true,
                    Note: null)])
            ]
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("InsuranceName"));
    }

    #endregion

    #region TC33: Insurance Negative Fee - Abnormal

    [Fact]
    public void Validate_TC33_InsuranceNegativeFee_ShouldFail()
    {
        var command = CreateBaseValidCommand() with
        {
            Classifications = [new ClassificationDto(null,
                Name: "Standard",
                Description: "Description",
                BasePrice: 1000,
                NumberOfDay: 3,
                NumberOfNight: 2,
                Plans: [],
                Insurances: [new InsuranceDto(
                    InsuranceName: "Insurance",
                    InsuranceType: "Travel",
                    InsuranceProvider: "ABC Insurance",
                    CoverageDescription: "Basic coverage",
                    CoverageAmount: 10000,
                    CoverageFee: -50,
                    IsOptional: true,
                    Note: null)])
            ]
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("CoverageFee"));
    }

    #endregion

    #region TC34: SEOTitle Max 70 - Boundary

    [Fact]
    public void Validate_TC34_SEOTitleMax_ShouldPass()
    {
        var command = CreateBaseValidCommand() with { SEOTitle = CreateString(70) };
        var result = _validator.Validate(command);
        Assert.True(result.IsValid);
    }

    #endregion

    #region TC35: SEOTitle Exceeds 70 - Abnormal

    [Fact]
    public void Validate_TC35_SEOTitleExceedsMax_ShouldFail()
    {
        var command = CreateBaseValidCommand() with { SEOTitle = CreateString(71) };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "SEOTitle");
    }

    #endregion

    #region TC36: SEODescription Max 320 - Boundary

    [Fact]
    public void Validate_TC36_SEODescriptionMax_ShouldPass()
    {
        var command = CreateBaseValidCommand() with { SEODescription = CreateString(320) };
        var result = _validator.Validate(command);
        Assert.True(result.IsValid);
    }

    #endregion

    #region TC37: SEODescription Exceeds 320 - Abnormal

    [Fact]
    public void Validate_TC37_SEODescriptionExceedsMax_ShouldFail()
    {
        var command = CreateBaseValidCommand() with { SEODescription = CreateString(321) };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "SEODescription");
    }

    #endregion

    #region TC38: TourName Exceeds 500 - Abnormal

    [Fact]
    public void Validate_TC38_TourNameExceeds500_ShouldFail()
    {
        var command = CreateBaseValidCommand() with { TourName = CreateString(501) };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "TourName");
    }

    #endregion

    #region TC39: ShortDescription Exceeds 250 - Abnormal

    [Fact]
    public void Validate_TC39_ShortDescriptionExceeds250_ShouldFail()
    {
        var command = CreateBaseValidCommand() with { ShortDescription = CreateString(251) };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "ShortDescription");
    }

    #endregion

    #region TC40: LongDescription Exceeds 5000 - Abnormal

    [Fact]
    public void Validate_TC40_LongDescriptionExceeds5000_ShouldFail()
    {
        var command = CreateBaseValidCommand() with { LongDescription = CreateString(5001) };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "LongDescription");
    }

    #endregion

    #region TC41: BasePrice Zero - Boundary (allowed)

    [Fact]
    public void Validate_TC41_BasePriceZero_ShouldPass()
    {
        var command = CreateBaseValidCommand() with
        {
            Classifications = [new ClassificationDto(null,
                Name: "Free Tour",
                Description: "Free tour",
                BasePrice: 0,
                NumberOfDay: 1,
                NumberOfNight: 0,
                Plans: [],
                Insurances: [])
            ]
        };
        var result = _validator.Validate(command);
        Assert.True(result.IsValid, string.Join(", ", result.Errors.Select(e => e.ErrorMessage)));
    }

    #endregion

    #region TC42: BasePrice Negative - Abnormal

    [Fact]
    public void Validate_TC42_BasePriceNegative_ShouldFail()
    {
        var command = CreateBaseValidCommand() with
        {
            Classifications = [new ClassificationDto(null,
                Name: "Invalid",
                Description: "Bad",
                BasePrice: -1,
                NumberOfDay: 1,
                NumberOfNight: 0,
                Plans: [],
                Insurances: [])
            ]
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("BasePrice"));
    }

    #endregion

    #region TC43: Empty Classifications List - Abnormal

    [Fact]
    public void Validate_TC43_EmptyClassificationsList_ShouldFail()
    {
        var command = CreateBaseValidCommand() with
        {
            Classifications = []
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("Classifications"));
    }

    #endregion

    #region TC44: Null Classifications - Valid (optional)

    [Fact]
    public void Validate_TC44_NullClassifications_ShouldPass()
    {
        var command = CreateBaseValidCommand() with { Classifications = null };
        var result = _validator.Validate(command);
        Assert.True(result.IsValid, string.Join(", ", result.Errors.Select(e => e.ErrorMessage)));
    }

    #endregion

    #region TC45: Route DurationMinutes Zero - Boundary (allowed)

    [Fact]
    public void Validate_TC45_RouteDurationMinutesZero_ShouldPass()
    {
        var command = CreateBaseValidCommand() with
        {
            Classifications = [new ClassificationDto(null,
                Name: "Test",
                Description: "Test",
                BasePrice: 100,
                NumberOfDay: 1,
                NumberOfNight: 0,
                Plans: [new DayPlanDto(null,
                    DayNumber: 1,
                    Title: "Day",
                    Description: null,
                    Activities: [new ActivityDto(null,
                        ActivityType: "Transportation",
                        Title: "Transfer",
                        Description: null,
                        Note: null,
                        EstimatedCost: 0,
                        IsOptional: false,
                        StartTime: null,
                        EndTime: null,
                        Routes: [new RouteDto(
                            TransportationType: "Bus",
                            FromLocationName: "A",
                            ToLocationName: "B",
                            FromLocationId: null,
                            ToLocationId: null,
                            TransportationName: null,
                            DurationMinutes: 0,
                            PricingType: null,
                            Price: 0,
                            RequiresIndividualTicket: false,
                            TicketInfo: null,
                            Note: null,
                            Translations: null,
                            RouteTranslations: null)],
                        Accommodation: null)])],
                Insurances: [])
            ]
        };
        var result = _validator.Validate(command);
        Assert.True(result.IsValid, string.Join(", ", result.Errors.Select(e => e.ErrorMessage)));
    }

    #endregion

    #region V1: Route with LocationId FK - passes

    [Fact]
    public void Validate_V1_RouteWithLocationReference_ShouldPass()
    {
        var command = CreateBaseValidCommand() with
        {
            Classifications = [new ClassificationDto(null,
                Name: "Test",
                Description: "Test",
                BasePrice: 100,
                NumberOfDay: 1,
                NumberOfNight: 0,
                Plans: [new DayPlanDto(null,
                    DayNumber: 1,
                    Title: "Day",
                    Description: null,
                    Activities: [new ActivityDto(null,
                        ActivityType: "Transportation",
                        Title: "Transfer",
                        Description: null,
                        Note: null,
                        EstimatedCost: 0,
                        IsOptional: false,
                        StartTime: null,
                        EndTime: null,
                        Routes: [new RouteDto(
                            TransportationType: "Bus",
                            FromLocationName: null,
                            ToLocationName: null,
                            FromLocationId: Guid.NewGuid(),
                            ToLocationId: Guid.NewGuid(),
                            TransportationName: null,
                            DurationMinutes: 30,
                            PricingType: null,
                            Price: 10,
                            RequiresIndividualTicket: false,
                            TicketInfo: null,
                            Note: null,
                            Translations: null,
                            RouteTranslations: null)],
                        Accommodation: null)])],
                Insurances: [])
            ]
        };
        var result = _validator.Validate(command);
        Assert.True(result.IsValid, string.Join(", ", result.Errors.Select(e => e.ErrorMessage)));
    }

    #endregion

    #region V2: Route missing both From AND To - fails

    [Fact]
    public void Validate_V2_RouteMissingFromAndTo_ShouldFail()
    {
        var command = CreateBaseValidCommand() with
        {
            Classifications = [new ClassificationDto(null,
                Name: "Test",
                Description: "Test",
                BasePrice: 100,
                NumberOfDay: 1,
                NumberOfNight: 0,
                Plans: [new DayPlanDto(null,
                    DayNumber: 1,
                    Title: "Day",
                    Description: null,
                    Activities: [new ActivityDto(null,
                        ActivityType: "Transportation",
                        Title: "Transfer",
                        Description: null,
                        Note: null,
                        EstimatedCost: 0,
                        IsOptional: false,
                        StartTime: null,
                        EndTime: null,
                        Routes: [new RouteDto(
                            TransportationType: "Bus",
                            FromLocationName: null,
                            ToLocationName: null,
                            FromLocationId: null,
                            ToLocationId: null,
                            TransportationName: null,
                            DurationMinutes: 0,
                            PricingType: null,
                            Price: 0,
                            RequiresIndividualTicket: false,
                            TicketInfo: null,
                            Note: null,
                            Translations: null,
                            RouteTranslations: null)],
                        Accommodation: null)])],
                Insurances: [])
            ]
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage.Contains("FromLocation"));
        Assert.Contains(result.Errors, e => e.ErrorMessage.Contains("ToLocation"));
    }

    #endregion

    #region V3-V5: TransportationDto Bilingual Validation

    [Fact]
    public void Validate_V3_TransportationWithBilingualTranslations_ShouldPass()
    {
        var command = CreateBaseValidCommand() with
        {
            Transportations = [new TransportationDto(
                TransportationType: "Flight",
                FromLocationName: "Hanoi",
                ToLocationName: "HCM",
                FromLocationId: null,
                ToLocationId: null,
                TransportationName: "Vietnam Airlines",
                DurationMinutes: 120,
                PricingType: "Per person",
                Price: 100,
                RequiresIndividualTicket: false,
                TicketInfo: "Economy class",
                Note: null,
                Translations: new Dictionary<string, TourTransportationTranslationData>
                {
                    ["vi"] = new TourTransportationTranslationData("Hà Nội", "TP Hồ Chí Minh", "Vietnam Airlines", "Hạng phổ thông", "Bay thẳng"),
                    ["en"] = new TourTransportationTranslationData("Hanoi", "Ho Chi Minh City", "Vietnam Airlines", "Economy class", "Direct flight")
                })]
        };
        var result = _validator.Validate(command);
        Assert.True(result.IsValid, string.Join(", ", result.Errors.Select(e => e.ErrorMessage)));
    }

    [Fact]
    public void Validate_V4_TransportationWithLocationReference_ShouldPass()
    {
        var command = CreateBaseValidCommand() with
        {
            Transportations = [new TransportationDto(
                TransportationType: "Bus",
                FromLocationName: null,
                ToLocationName: null,
                FromLocationId: Guid.NewGuid(),
                ToLocationId: Guid.NewGuid(),
                TransportationName: "Tour Bus",
                DurationMinutes: 60,
                PricingType: null,
                Price: 10,
                RequiresIndividualTicket: false,
                TicketInfo: null,
                Note: null)]
        };
        var result = _validator.Validate(command);
        Assert.True(result.IsValid, string.Join(", ", result.Errors.Select(e => e.ErrorMessage)));
    }

    [Fact]
    public void Validate_V5_TransportationNegativePrice_ShouldFail()
    {
        var command = CreateBaseValidCommand() with
        {
            Transportations = [new TransportationDto(
                FromLocationName: "Hanoi",
                ToLocationName: "HCM",
                TransportationType: "Flight",
                FromLocationId: null,
                ToLocationId: null,
                TransportationName: null,
                DurationMinutes: 120,
                PricingType: "Per person",
                Price: -50,
                RequiresIndividualTicket: false,
                TicketInfo: null,
                Note: null)]
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage.Contains("price", StringComparison.OrdinalIgnoreCase));
    }

    #endregion

    #region TC46-TC48: LocationDto Validation

    [Fact]
    public void Validate_TC46_LocationNameEmpty_ShouldFail()
    {
        var command = CreateBaseValidCommand() with
        {
            Locations = [new LocationDto(
                LocationName: "",
                LocationType: "Museum",
                Description: "Description",
                City: "Hanoi",
                Country: "Vietnam",
                EntranceFee: 10,
                Address: "123 Main St")]
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("LocationName"));
    }

    [Fact]
    public void Validate_TC47_LocationNameTooLong_ShouldFail()
    {
        var command = CreateBaseValidCommand() with
        {
            Locations = [new LocationDto(
                LocationName: CreateString(201),
                LocationType: "Museum",
                Description: "Description",
                City: "Hanoi",
                Country: "Vietnam",
                EntranceFee: 10,
                Address: "123 Main St")]
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("LocationName"));
    }

    [Fact]
    public void Validate_TC48_LocationValid_ShouldPass()
    {
        var command = CreateBaseValidCommand() with
        {
            Locations = [new LocationDto(
                LocationName: "Hanoi Opera House",
                LocationType: "Museum",
                Description: "Historic building",
                City: "Hanoi",
                Country: "Vietnam",
                EntranceFee: 10,
                Address: "1 Rue de la Paix")]
        };
        var result = _validator.Validate(command);
        Assert.True(result.IsValid, string.Join(", ", result.Errors.Select(e => e.ErrorMessage)));
    }

    #endregion

    #region TC49-TC51: TransportationDto Validation

    [Fact]
    public void Validate_TC49_TransportationFromLocationEmpty_ShouldFail()
    {
        var command = CreateBaseValidCommand() with
        {
            Transportations = [new TransportationDto(
                FromLocationName: "",
                ToLocationName: "Airport",
                FromLocationId: null,
                ToLocationId: null,
                TransportationType: "Bus",
                TransportationName: "Airport Shuttle",
                DurationMinutes: 60,
                PricingType: "Per person",
                Price: 5,
                RequiresIndividualTicket: false,
                TicketInfo: null,
                Note: null,
                Translations: null)]
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("FromLocationName"));
    }

    [Fact]
    public void Validate_TC50_TransportationToLocationEmpty_ShouldFail()
    {
        var command = CreateBaseValidCommand() with
        {
            Transportations = [new TransportationDto(
                FromLocationName: "Hotel",
                ToLocationName: "",
                FromLocationId: null,
                ToLocationId: null,
                TransportationType: "Bus",
                TransportationName: "Airport Shuttle",
                DurationMinutes: 60,
                PricingType: "Per person",
                Price: 5,
                RequiresIndividualTicket: false,
                TicketInfo: null,
                Note: null)]
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("ToLocationName"));
    }

    [Fact]
    public void Validate_TC51_TransportationValid_ShouldPass()
    {
        var command = CreateBaseValidCommand() with
        {
            Transportations = [new TransportationDto(
                FromLocationName: "Hotel",
                ToLocationName: "Airport",
                TransportationType: "Bus",
                TransportationName: "Airport Shuttle",
                DurationMinutes: 60,
                PricingType: "Per person",
                Price: 5,
                RequiresIndividualTicket: false,
                TicketInfo: null,
                Note: null)]
        };
        var result = _validator.Validate(command);
        Assert.True(result.IsValid, string.Join(", ", result.Errors.Select(e => e.ErrorMessage)));
    }

    #endregion

    #region TC52-TC54: ServiceDto Validation

    [Fact]
    public void Validate_TC52_ServiceNameEmpty_ShouldFail()
    {
        var command = CreateBaseValidCommand() with
        {
            Services = [new ServiceDto(
                Id: null,
                ServiceName: "",
                PricingType: "Per booking",
                Price: 100,
                SalePrice: 80,
                Email: "guide@example.com",
                ContactNumber: "0123456789")]
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("ServiceName"));
    }

    [Fact]
    public void Validate_TC53_ServiceNameTooLong_ShouldFail()
    {
        var command = CreateBaseValidCommand() with
        {
            Services = [new ServiceDto(
                Id: null,
                ServiceName: CreateString(201),
                PricingType: "Per booking",
                Price: 100,
                SalePrice: 80,
                Email: "guide@example.com",
                ContactNumber: "0123456789")]
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("ServiceName"));
    }

    [Fact]
    public void Validate_TC54_ServiceValid_ShouldPass()
    {
        var command = CreateBaseValidCommand() with
        {
            Services = [new ServiceDto(
                Id: null,
                ServiceName: "Tour Guide Service",
                PricingType: "Per booking",
                Price: 100,
                SalePrice: 80,
                Email: "guide@example.com",
                ContactNumber: "0123456789")]
        };
        var result = _validator.Validate(command);
        Assert.True(result.IsValid, string.Join(", ", result.Errors.Select(e => e.ErrorMessage)));
    }

    #endregion

    #region TC55: Service Negative Price

    [Fact]
    public void Validate_TC55_ServiceNegativePrice_ShouldFail()
    {
        var command = CreateBaseValidCommand() with
        {
            Services = [new ServiceDto(
                Id: null,
                ServiceName: "Guide",
                PricingType: "Per booking",
                Price: -50,
                SalePrice: null,
                Email: null,
                ContactNumber: null)]
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("Price"));
    }

    #endregion

    #region TC56: Empty Locations List

    [Fact]
    public void Validate_TC56_EmptyLocationsList_ShouldFail()
    {
        var command = CreateBaseValidCommand() with { Locations = [] };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("Locations"));
    }

    #endregion

    #region TC57: Empty Transportations List

    [Fact]
    public void Validate_TC57_EmptyTransportationsList_ShouldFail()
    {
        var command = CreateBaseValidCommand() with { Transportations = [] };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("Transportations"));
    }

    #endregion

    #region TC58: Empty Services List

    [Fact]
    public void Validate_TC58_EmptyServicesList_ShouldFail()
    {
        var command = CreateBaseValidCommand() with { Services = [] };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("Services"));
    }

    #endregion

    #region TC59: Empty Accommodations List

    [Fact]
    public void Validate_TC59_EmptyAccommodationsList_ShouldFail()
    {
        var command = CreateBaseValidCommand() with { Accommodations = [] };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("Accommodations"));
    }

    #endregion

    #region TC60: Activity EstimatedCost Valid Positive - Normal

    [Fact]
    public void Validate_TC60_ActivityEstimatedCostPositive_ShouldPass()
    {
        var command = CreateBaseValidCommand() with
        {
            Classifications = [new ClassificationDto(null,
                Name: "Standard",
                Description: "Description",
                BasePrice: 1000,
                NumberOfDay: 1,
                NumberOfNight: 0,
                Plans: [new DayPlanDto(null,
                    DayNumber: 1,
                    Title: "Day 1",
                    Description: "Description",
                    Activities: [new ActivityDto(null,
                        ActivityType: "Sightseeing",
                        Title: "Activity",
                        Description: null,
                        Note: null,
                        EstimatedCost: 150.50m,
                        IsOptional: false,
                        StartTime: null,
                        EndTime: null,
                        Routes: [],
                        Accommodation: null)],
                    Translations: null)],
                Insurances: [])
            ]
        };
        var result = _validator.Validate(command);
        Assert.True(result.IsValid, string.Join(", ", result.Errors.Select(e => e.ErrorMessage)));
    }

    #endregion

    #region TC61: Activity EstimatedCost Negative - Abnormal

    [Fact]
    public void Validate_TC61_ActivityEstimatedCostNegative_ShouldFail()
    {
        var command = CreateBaseValidCommand() with
        {
            Classifications = [new ClassificationDto(null,
                Name: "Standard",
                Description: "Description",
                BasePrice: 1000,
                NumberOfDay: 1,
                NumberOfNight: 0,
                Plans: [new DayPlanDto(null,
                    DayNumber: 1,
                    Title: "Day 1",
                    Description: "Description",
                    Activities: [new ActivityDto(null,
                        ActivityType: "Sightseeing",
                        Title: "Activity",
                        Description: null,
                        Note: null,
                        EstimatedCost: -10,
                        IsOptional: false,
                        StartTime: null,
                        EndTime: null,
                        Routes: [],
                        Accommodation: null)],
                    Translations: null)],
                Insurances: [])
            ]
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("EstimatedCost"));
    }

    #endregion

    #region TC62: Activity EstimatedCost Zero - Boundary (allowed)

    [Fact]
    public void Validate_TC62_ActivityEstimatedCostZero_ShouldPass()
    {
        var command = CreateBaseValidCommand() with
        {
            Classifications = [new ClassificationDto(null,
                Name: "Standard",
                Description: "Description",
                BasePrice: 1000,
                NumberOfDay: 1,
                NumberOfNight: 0,
                Plans: [new DayPlanDto(null,
                    DayNumber: 1,
                    Title: "Day 1",
                    Description: "Description",
                    Activities: [new ActivityDto(null,
                        ActivityType: "Sightseeing",
                        Title: "Activity",
                        Description: null,
                        Note: null,
                        EstimatedCost: 0,
                        IsOptional: false,
                        StartTime: null,
                        EndTime: null,
                        Routes: [],
                        Accommodation: null)],
                    Translations: null)],
                Insurances: [])
            ]
        };
        var result = _validator.Validate(command);
        Assert.True(result.IsValid, string.Join(", ", result.Errors.Select(e => e.ErrorMessage)));
    }

    #endregion

    #region TC63: Activity EstimatedCost Null - Normal (optional)

    [Fact]
    public void Validate_TC63_ActivityEstimatedCostNull_ShouldPass()
    {
        var command = CreateBaseValidCommand() with
        {
            Classifications = [new ClassificationDto(null,
                Name: "Standard",
                Description: "Description",
                BasePrice: 1000,
                NumberOfDay: 1,
                NumberOfNight: 0,
                Plans: [new DayPlanDto(null,
                    DayNumber: 1,
                    Title: "Day 1",
                    Description: "Description",
                    Activities: [new ActivityDto(null,
                        ActivityType: "Sightseeing",
                        Title: "Activity",
                        Description: null,
                        Note: null,
                        EstimatedCost: null,
                        IsOptional: false,
                        StartTime: null,
                        EndTime: null,
                        Routes: [],
                        Accommodation: null)],
                    Translations: null)],
                Insurances: [])
            ]
        };
        var result = _validator.Validate(command);
        Assert.True(result.IsValid, string.Join(", ", result.Errors.Select(e => e.ErrorMessage)));
    }

    #endregion

    #region Enum Validation Tests

    #region TransportationType invalid

    [Fact]
    public void Validate_RouteDto_TransportationTypeInvalidString_ShouldFail()
    {
        var command = CreateBaseValidCommand() with
        {
            Classifications = [new ClassificationDto(null,
                Name: "Test",
                Description: "Test",
                BasePrice: 100,
                NumberOfDay: 1,
                NumberOfNight: 0,
                Plans: [new DayPlanDto(null,
                    DayNumber: 1,
                    Title: "Day",
                    Description: null,
                    Activities: [new ActivityDto(null,
                        ActivityType: "Transportation",
                        Title: "Transfer",
                        Description: null,
                        Note: null,
                        EstimatedCost: 0,
                        IsOptional: false,
                        StartTime: null,
                        EndTime: null,
                        Routes: [new RouteDto(
                            TransportationType: "InvalidTransportType",
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
                            RouteTranslations: null)],
                        Accommodation: null)])],
                Insurances: [])
            ]
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage.Contains("TransportationType") && e.ErrorMessage.Contains("InvalidTransportType"));
    }

    [Fact]
    public void Validate_RouteDto_TransportationTypeInvalidNumeric_ShouldFail()
    {
        var command = CreateBaseValidCommand() with
        {
            Classifications = [new ClassificationDto(null,
                Name: "Test",
                Description: "Test",
                BasePrice: 100,
                NumberOfDay: 1,
                NumberOfNight: 0,
                Plans: [new DayPlanDto(null,
                    DayNumber: 1,
                    Title: "Day",
                    Description: null,
                    Activities: [new ActivityDto(null,
                        ActivityType: "Transportation",
                        Title: "Transfer",
                        Description: null,
                        Note: null,
                        EstimatedCost: 0,
                        IsOptional: false,
                        StartTime: null,
                        EndTime: null,
                        Routes: [new RouteDto(
                            TransportationType: "999",
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
                            RouteTranslations: null)],
                        Accommodation: null)])],
                Insurances: [])
            ]
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage.Contains("TransportationType") && e.ErrorMessage.Contains("999"));
    }

    [Fact]
    public void Validate_TransportationDto_TransportationTypeInvalid_ShouldFail()
    {
        var command = CreateBaseValidCommand() with
        {
            Transportations = [new TransportationDto(
                TransportationType: "UnknownType",
                FromLocationName: "Hotel",
                ToLocationName: "Beach",
                FromLocationId: null,
                ToLocationId: null,
                TransportationName: null,
                DurationMinutes: 30,
                PricingType: null,
                Price: 5,
                RequiresIndividualTicket: false,
                TicketInfo: null,
                Note: null,
                Translations: null)]
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage.Contains("TransportationType") && e.ErrorMessage.Contains("UnknownType"));
    }

    #endregion

    #region TransportationType valid

    [Fact]
    public void Validate_RouteDto_TransportationTypeValidByName_ShouldPass()
    {
        var command = CreateBaseValidCommand() with
        {
            Classifications = [new ClassificationDto(null,
                Name: "Test",
                Description: "Test",
                BasePrice: 100,
                NumberOfDay: 1,
                NumberOfNight: 0,
                Plans: [new DayPlanDto(null,
                    DayNumber: 1,
                    Title: "Day",
                    Description: null,
                    Activities: [new ActivityDto(null,
                        ActivityType: "Transportation",
                        Title: "Transfer",
                        Description: null,
                        Note: null,
                        EstimatedCost: 0,
                        IsOptional: false,
                        StartTime: null,
                        EndTime: null,
                        Routes: [new RouteDto(
                            TransportationType: "Flight",
                            FromLocationName: "Hanoi",
                            ToLocationName: "HCM",
                            FromLocationId: null,
                            ToLocationId: null,
                            TransportationName: null,
                            DurationMinutes: 120,
                            PricingType: null,
                            Price: 100,
                            RequiresIndividualTicket: false,
                            TicketInfo: null,
                            Note: null,
                            Translations: null,
                            RouteTranslations: null)],
                        Accommodation: null)])],
                Insurances: [])
            ]
        };
        var result = _validator.Validate(command);
        Assert.True(result.IsValid, string.Join(", ", result.Errors.Select(e => e.ErrorMessage)));
    }

    [Fact]
    public void Validate_RouteDto_TransportationTypeValidByNumeric_ShouldPass()
    {
        var command = CreateBaseValidCommand() with
        {
            Classifications = [new ClassificationDto(null,
                Name: "Test",
                Description: "Test",
                BasePrice: 100,
                NumberOfDay: 1,
                NumberOfNight: 0,
                Plans: [new DayPlanDto(null,
                    DayNumber: 1,
                    Title: "Day",
                    Description: null,
                    Activities: [new ActivityDto(null,
                        ActivityType: "Transportation",
                        Title: "Transfer",
                        Description: null,
                        Note: null,
                        EstimatedCost: 0,
                        IsOptional: false,
                        StartTime: null,
                        EndTime: null,
                        Routes: [new RouteDto(
                            TransportationType: "3",
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
                            RouteTranslations: null)],
                        Accommodation: null)])],
                Insurances: [])
            ]
        };
        var result = _validator.Validate(command);
        Assert.True(result.IsValid, string.Join(", ", result.Errors.Select(e => e.ErrorMessage)));
    }

    #endregion

    #region LocationType invalid

    [Fact]
    public void Validate_LocationDto_LocationTypeInvalidString_ShouldFail()
    {
        var command = CreateBaseValidCommand() with
        {
            Locations = [new LocationDto(
                LocationName: "Test Museum",
                LocationType: "InvalidLocationType",
                Description: "Description",
                City: "Hanoi",
                Country: "Vietnam",
                EntranceFee: 10,
                Address: "123 Main St")]
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage.Contains("LocationType") && e.ErrorMessage.Contains("InvalidLocationType"));
    }

    [Fact]
    public void Validate_LocationDto_LocationTypeInvalidNumeric_ShouldFail()
    {
        var command = CreateBaseValidCommand() with
        {
            Locations = [new LocationDto(
                LocationName: "Test Museum",
                LocationType: "888",
                Description: "Description",
                City: "Hanoi",
                Country: "Vietnam",
                EntranceFee: 10,
                Address: "123 Main St")]
        };
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage.Contains("LocationType") && e.ErrorMessage.Contains("888"));
    }

    #endregion

    #region LocationType valid

    [Fact]
    public void Validate_LocationDto_LocationTypeValidByName_ShouldPass()
    {
        var command = CreateBaseValidCommand() with
        {
            Locations = [new LocationDto(
                LocationName: "Hanoi Opera House",
                LocationType: "Museum",
                Description: "Historic building",
                City: "Hanoi",
                Country: "Vietnam",
                EntranceFee: 10,
                Address: "1 Rue de la Paix")]
        };
        var result = _validator.Validate(command);
        Assert.True(result.IsValid, string.Join(", ", result.Errors.Select(e => e.ErrorMessage)));
    }

    [Fact]
    public void Validate_LocationDto_LocationTypeValidByNumeric_ShouldPass()
    {
        var command = CreateBaseValidCommand() with
        {
            Locations = [new LocationDto(
                LocationName: "My Khe Beach",
                LocationType: "3",
                Description: "Beach",
                City: "Da Nang",
                Country: "Vietnam",
                EntranceFee: 0,
                Address: null)]
        };
        var result = _validator.Validate(command);
        Assert.True(result.IsValid, string.Join(", ", result.Errors.Select(e => e.ErrorMessage)));
    }

    [Fact]
    public void Validate_LocationDto_LocationTypeOther_ShouldPass()
    {
        var command = CreateBaseValidCommand() with
        {
            Locations = [new LocationDto(
                LocationName: "Custom Place",
                LocationType: "Other",
                Description: "Some custom place",
                City: "Hanoi",
                Country: "Vietnam",
                EntranceFee: 0,
                Address: null)]
        };
        var result = _validator.Validate(command);
        Assert.True(result.IsValid, string.Join(", ", result.Errors.Select(e => e.ErrorMessage)));
    }

    [Fact]
    public void Validate_LocationDto_LocationTypeOtherNumeric_ShouldPass()
    {
        var command = CreateBaseValidCommand() with
        {
            Locations = [new LocationDto(
                LocationName: "Custom Place 2",
                LocationType: "99",
                Description: "Other",
                City: "Hanoi",
                Country: "Vietnam",
                EntranceFee: 0,
                Address: null)]
        };
        var result = _validator.Validate(command);
        Assert.True(result.IsValid, string.Join(", ", result.Errors.Select(e => e.ErrorMessage)));
    }

    #endregion

    #endregion
}
