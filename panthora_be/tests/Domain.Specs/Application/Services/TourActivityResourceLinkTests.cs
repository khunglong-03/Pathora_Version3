using Application.Dtos;
using Application.Features.Tour.Commands;
using Application.Features.Tour.Validators;
using Application.Services;
using AutoMapper;
using Contracts.Interfaces;
using Domain.Abstractions;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.UnitOfWork;
using ErrorOr;
using NSubstitute;

namespace Domain.Specs.Application.Services;

/// <summary>
/// Unit tests for linkToResources support in TourService.Create() and ActivityDtoValidator.
/// </summary>
public sealed class TourActivityResourceLinkTests
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

    #region TC01: Create with resource links - links are persisted

    [Fact]
    public async Task Create_WithResourceLinks_ShouldPersistLinks()
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
                    Name: "Standard",
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
                                    Title: "Museum Visit",
                                    Description: null,
                                    Note: null,
                                    EstimatedCost: 0,
                                    IsOptional: false,
                                    StartTime: null,
                                    EndTime: null,
                                    Routes: [],
                                    Accommodation: null,
                                    Translations: null,
                                    LinkToResources: new List<string>
                                    {
                                        "https://www.museum.com/tickets",
                                        "https://www.museum.com/guide"
                                    })
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
        Assert.Equal(2, activity.ResourceLinks.Count);
        Assert.Equal("https://www.museum.com/tickets", activity.ResourceLinks[0].Url);
        Assert.Equal(1, activity.ResourceLinks[0].Order);
        Assert.Equal("https://www.museum.com/guide", activity.ResourceLinks[1].Url);
        Assert.Equal(2, activity.ResourceLinks[1].Order);
    }

    #endregion

    #region TC02: Create without resource links - activity has empty list

    [Fact]
    public async Task Create_WithoutResourceLinks_ShouldHaveEmptyLinks()
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
                    Name: "Standard",
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
                                    Title: "Museum Visit",
                                    Description: null,
                                    Note: null,
                                    EstimatedCost: 0,
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
        Assert.Empty(activity.ResourceLinks);
    }

    #endregion

    #region TC03: Create with null resource links - activity has empty list

    [Fact]
    public async Task Create_WithNullResourceLinks_ShouldHaveEmptyLinks()
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
                    Name: "Standard",
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
                                    Title: "Museum Visit",
                                    Description: null,
                                    Note: null,
                                    EstimatedCost: 0,
                                    IsOptional: false,
                                    StartTime: null,
                                    EndTime: null,
                                    Routes: [],
                                    Accommodation: null,
                                    Translations: null,
                                    LinkToResources: null)
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
        Assert.Empty(activity.ResourceLinks);
    }

    #endregion

    #region TC04: Create with empty resource links list - activity has empty list

    [Fact]
    public async Task Create_WithEmptyResourceLinksList_ShouldHaveEmptyLinks()
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
                    Name: "Standard",
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
                                    Title: "Museum Visit",
                                    Description: null,
                                    Note: null,
                                    EstimatedCost: 0,
                                    IsOptional: false,
                                    StartTime: null,
                                    EndTime: null,
                                    Routes: [],
                                    Accommodation: null,
                                    Translations: null,
                                    LinkToResources: new List<string>())
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
        Assert.Empty(activity.ResourceLinks);
    }

    #endregion

    #region TC05: Duplicate URLs - only unique URLs preserved (case-insensitive)

    [Fact]
    public async Task Create_WithDuplicateUrls_ShouldDeduplicateCaseInsensitive()
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
                    Name: "Standard",
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
                                    Title: "Museum Visit",
                                    Description: null,
                                    Note: null,
                                    EstimatedCost: 0,
                                    IsOptional: false,
                                    StartTime: null,
                                    EndTime: null,
                                    Routes: [],
                                    Accommodation: null,
                                    Translations: null,
                                    LinkToResources: new List<string>
                                    {
                                        "https://www.museum.com/tickets",
                                        "HTTPS://WWW.MUSEUM.COM/TICKETS",
                                        "https://www.museum.com/guide",
                                        "https://www.museum.com/tickets"
                                    })
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
        Assert.Equal(2, activity.ResourceLinks.Count);
        // Order preserved: first occurrence of each unique URL
        Assert.Equal("https://www.museum.com/tickets", activity.ResourceLinks[0].Url);
        Assert.Equal(1, activity.ResourceLinks[0].Order);
        Assert.Equal("https://www.museum.com/guide", activity.ResourceLinks[1].Url);
        Assert.Equal(2, activity.ResourceLinks[1].Order);
    }

    #endregion

    #region TC06: Whitespace URLs filtered out

    [Fact]
    public async Task Create_WithWhitespaceUrls_ShouldFilterOut()
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
                    Name: "Standard",
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
                                    Title: "Museum Visit",
                                    Description: null,
                                    Note: null,
                                    EstimatedCost: 0,
                                    IsOptional: false,
                                    StartTime: null,
                                    EndTime: null,
                                    Routes: [],
                                    Accommodation: null,
                                    Translations: null,
                                    LinkToResources: new List<string>
                                    {
                                        "  ",
                                        "",
                                        "https://www.museum.com/tickets",
                                        "   "
                                    })
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
        Assert.Single(activity.ResourceLinks);
        Assert.Equal("https://www.museum.com/tickets", activity.ResourceLinks[0].Url);
    }

    #endregion

    #region TC07: URLs trimmed

    [Fact]
    public async Task Create_WithLeadingTrailingWhitespace_ShouldTrim()
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
                    Name: "Standard",
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
                                    Title: "Museum Visit",
                                    Description: null,
                                    Note: null,
                                    EstimatedCost: 0,
                                    IsOptional: false,
                                    StartTime: null,
                                    EndTime: null,
                                    Routes: [],
                                    Accommodation: null,
                                    Translations: null,
                                    LinkToResources: new List<string>
                                    {
                                        "  https://www.museum.com/tickets  "
                                    })
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
        Assert.Single(activity.ResourceLinks);
        Assert.Equal("https://www.museum.com/tickets", activity.ResourceLinks[0].Url);
    }

    #endregion
}

/// <summary>
/// Unit tests for linkToResources in TourService.Update().
/// </summary>
public sealed class TourActivityResourceLinkUpdateTests
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

    private TourEntity CreateTourWithActivityAndLinks(Guid tourId)
    {
        var tour = TourEntity.Create(
            "Test Tour", "Short", "Long", "admin@test.com",
            Domain.Enums.TourStatus.Active);
        typeof(Entity<Guid>).GetProperty("Id")!.SetValue(tour, tourId);

        var classification = TourClassificationEntity.Create(
            tourId, "Standard", 100m, "Desc", 1, 0, "admin@test.com");
        typeof(Entity<Guid>).GetProperty("Id")!.SetValue(classification, Guid.CreateVersion7());

        var day = TourDayEntity.Create(classification.Id, 1, "Day 1", "admin@test.com", null);
        typeof(Entity<Guid>).GetProperty("Id")!.SetValue(day, Guid.CreateVersion7());

        var activity = TourDayActivityEntity.Create(
            day.Id, 1, Domain.Enums.TourDayActivityType.Sightseeing,
            "Museum", "admin@test.com", null, null, null, null, null, false,
            [("https://existing.com/link1", 1), ("https://existing.com/link2", 2)]);
        typeof(Entity<Guid>).GetProperty("Id")!.SetValue(activity, Guid.CreateVersion7());

        day.Activities.Add(activity);
        classification.Plans.Add(day);
        tour.Classifications.Add(classification);
        return tour;
    }

    #endregion

    #region TC23: Update activity with linkToResources - replaces existing links

    [Fact]
    public async Task Update_WithNewLinkToResources_ShouldReplaceExistingLinks()
    {
        // Arrange
        var tourId = Guid.CreateVersion7();
        var activityId = Guid.CreateVersion7();
        _user.Id.Returns("admin@test.com");

        var tour = CreateTourWithActivityAndLinks(tourId);
        var activity = tour.Classifications[0].Plans[0].Activities[0];
        typeof(Entity<Guid>).GetProperty("Id")!.SetValue(activity, activityId);

        _tourRepository.FindById(tourId, false).Returns(tour);
        _tourRepository.FindByIdForUpdate(tourId).Returns(tour);
        _tourRepository.ExistsByTourCode(Arg.Any<string>(), tourId).Returns(false);
        _tourRepository.Update(Arg.Any<TourEntity>()).Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = new UpdateTourCommand(
            Id: tourId,
            TourName: "Test Tour",
            ShortDescription: "Short",
            LongDescription: "Long",
            SEOTitle: null,
            SEODescription: null,
            Status: Domain.Enums.TourStatus.Active,
            Translations: null,
            Classifications:
            [
                new ClassificationDto(
                    Id: tour.Classifications[0].Id,
                    Name: "Standard",
                    Description: "Desc",
                    BasePrice: 100m,
                    NumberOfDay: 1,
                    NumberOfNight: 0,
                    Plans:
                    [
                        new DayPlanDto(
                            Id: tour.Classifications[0].Plans[0].Id,
                            DayNumber: 1,
                            Title: "Day 1",
                            Description: null,
                            Activities:
                            [
                                new ActivityDto(
                                    Id: activityId,
                                    ActivityType: "Sightseeing",
                                    Title: "Museum",
                                    Description: null,
                                    Note: null,
                                    EstimatedCost: null,
                                    IsOptional: false,
                                    StartTime: null,
                                    EndTime: null,
                                    Routes: [],
                                    Accommodation: null,
                                    LinkToResources: new List<string>
                                    {
                                        "https://new.com/link1",
                                        "https://new.com/link2",
                                        "https://new.com/link3"
                                    })
                            ])
                    ],
                    Insurances: [])
            ]);

        var service = CreateService();

        // Act
        var result = await service.Update(command);

        // Assert
        Assert.False(result.IsError);
        var updatedActivity = tour.Classifications[0].Plans[0].Activities[0];
        Assert.Equal(3, updatedActivity.ResourceLinks.Count);
        Assert.Equal("https://new.com/link1", updatedActivity.ResourceLinks[0].Url);
        Assert.Equal(1, updatedActivity.ResourceLinks[0].Order);
        Assert.Equal("https://new.com/link2", updatedActivity.ResourceLinks[1].Url);
        Assert.Equal(2, updatedActivity.ResourceLinks[1].Order);
        Assert.Equal("https://new.com/link3", updatedActivity.ResourceLinks[2].Url);
        Assert.Equal(3, updatedActivity.ResourceLinks[2].Order);
    }

    #endregion

    #region TC24: Update activity without linkToResources - clears existing links

    [Fact]
    public async Task Update_WithNullLinkToResources_ShouldClearExistingLinks()
    {
        // Arrange
        var tourId = Guid.CreateVersion7();
        var activityId = Guid.CreateVersion7();
        _user.Id.Returns("admin@test.com");

        var tour = CreateTourWithActivityAndLinks(tourId);
        var activity = tour.Classifications[0].Plans[0].Activities[0];
        typeof(Entity<Guid>).GetProperty("Id")!.SetValue(activity, activityId);

        _tourRepository.FindById(tourId, false).Returns(tour);
        _tourRepository.FindByIdForUpdate(tourId).Returns(tour);
        _tourRepository.ExistsByTourCode(Arg.Any<string>(), tourId).Returns(false);
        _tourRepository.Update(Arg.Any<TourEntity>()).Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = new UpdateTourCommand(
            Id: tourId,
            TourName: "Test Tour",
            ShortDescription: "Short",
            LongDescription: "Long",
            SEOTitle: null,
            SEODescription: null,
            Status: Domain.Enums.TourStatus.Active,
            Translations: null,
            Classifications:
            [
                new ClassificationDto(
                    Id: tour.Classifications[0].Id,
                    Name: "Standard",
                    Description: "Desc",
                    BasePrice: 100m,
                    NumberOfDay: 1,
                    NumberOfNight: 0,
                    Plans:
                    [
                        new DayPlanDto(
                            Id: tour.Classifications[0].Plans[0].Id,
                            DayNumber: 1,
                            Title: "Day 1",
                            Description: null,
                            Activities:
                            [
                                new ActivityDto(
                                    Id: activityId,
                                    ActivityType: "Sightseeing",
                                    Title: "Museum",
                                    Description: null,
                                    Note: null,
                                    EstimatedCost: null,
                                    IsOptional: false,
                                    StartTime: null,
                                    EndTime: null,
                                    Routes: [],
                                    Accommodation: null)
                            ])
                    ],
                    Insurances: [])
            ]);

        var service = CreateService();

        // Act
        var result = await service.Update(command);

        // Assert
        Assert.False(result.IsError);
        var updatedActivity = tour.Classifications[0].Plans[0].Activities[0];
        Assert.Empty(updatedActivity.ResourceLinks);
    }

    #endregion

    #region TC25: Update without classifications param - preserves existing links

    [Fact]
    public async Task Update_WithoutClassifications_ShouldPreserveExistingLinks()
    {
        // Arrange
        var tourId = Guid.CreateVersion7();
        _user.Id.Returns("admin@test.com");

        var tour = CreateTourWithActivityAndLinks(tourId);

        _tourRepository.FindById(tourId, false).Returns(tour);
        _tourRepository.FindByIdForUpdate(tourId).Returns(tour);
        _tourRepository.ExistsByTourCode(Arg.Any<string>(), tourId).Returns(false);
        _tourRepository.Update(Arg.Any<TourEntity>()).Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = new UpdateTourCommand(
            Id: tourId,
            TourName: "Test Tour Updated",
            ShortDescription: "Short",
            LongDescription: "Long",
            SEOTitle: null,
            SEODescription: null,
            Status: Domain.Enums.TourStatus.Active,
            Translations: null,
            Classifications: null);

        var service = CreateService();

        // Act
        var result = await service.Update(command);

        // Assert
        Assert.False(result.IsError);
        var activity = tour.Classifications[0].Plans[0].Activities[0];
        Assert.Equal(2, activity.ResourceLinks.Count);
        Assert.Equal("https://existing.com/link1", activity.ResourceLinks[0].Url);
        Assert.Equal("https://existing.com/link2", activity.ResourceLinks[1].Url);
    }

    #endregion

    #region TC26: Update with new activity (no Id) - creates with links

    [Fact]
    public async Task Update_WithNewActivityAndLinks_ShouldCreateWithLinks()
    {
        // Arrange
        var tourId = Guid.CreateVersion7();
        _user.Id.Returns("admin@test.com");

        var tour = TourEntity.Create(
            "Test Tour", "Short", "Long", "admin@test.com",
            Domain.Enums.TourStatus.Active);
        typeof(Entity<Guid>).GetProperty("Id")!.SetValue(tour, tourId);

        var classification = TourClassificationEntity.Create(
            tourId, "Standard", 100m, "Desc", 1, 0, "admin@test.com");
        typeof(Entity<Guid>).GetProperty("Id")!.SetValue(classification, Guid.CreateVersion7());

        var day = TourDayEntity.Create(classification.Id, 1, "Day 1", "admin@test.com", null);
        typeof(Entity<Guid>).GetProperty("Id")!.SetValue(day, Guid.CreateVersion7());
        classification.Plans.Add(day);

        tour.Classifications.Add(classification);

        _tourRepository.FindById(tourId, false).Returns(tour);
        _tourRepository.FindByIdForUpdate(tourId).Returns(tour);
        _tourRepository.ExistsByTourCode(Arg.Any<string>(), tourId).Returns(false);
        _tourRepository.Update(Arg.Any<TourEntity>()).Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var command = new UpdateTourCommand(
            Id: tourId,
            TourName: "Test Tour",
            ShortDescription: "Short",
            LongDescription: "Long",
            SEOTitle: null,
            SEODescription: null,
            Status: Domain.Enums.TourStatus.Active,
            Translations: null,
            Classifications:
            [
                new ClassificationDto(
                    Id: classification.Id,
                    Name: "Standard",
                    Description: "Desc",
                    BasePrice: 100m,
                    NumberOfDay: 1,
                    NumberOfNight: 0,
                    Plans:
                    [
                        new DayPlanDto(
                            Id: day.Id,
                            DayNumber: 1,
                            Title: "Day 1",
                            Description: null,
                            Activities:
                            [
                                new ActivityDto(
                                    Id: null,
                                    ActivityType: "Sightseeing",
                                    Title: "New Activity",
                                    Description: null,
                                    Note: null,
                                    EstimatedCost: null,
                                    IsOptional: false,
                                    StartTime: null,
                                    EndTime: null,
                                    Routes: [],
                                    Accommodation: null,
                                    LinkToResources: new List<string>
                                    {
                                        "https://new.com/link1",
                                        "https://new.com/link2"
                                    })
                            ])
                    ],
                    Insurances: [])
            ]);

        var service = CreateService();

        // Act
        var result = await service.Update(command);

        // Assert
        Assert.False(result.IsError);
        var newActivity = tour.Classifications[0].Plans[0].Activities[0];
        Assert.Equal(2, newActivity.ResourceLinks.Count);
        Assert.Equal("https://new.com/link1", newActivity.ResourceLinks[0].Url);
        Assert.Equal(1, newActivity.ResourceLinks[0].Order);
        Assert.Equal("https://new.com/link2", newActivity.ResourceLinks[1].Url);
        Assert.Equal(2, newActivity.ResourceLinks[1].Order);
    }

    #endregion
}

/// <summary>
/// Validator tests for linkToResources in ActivityDtoValidator.
/// </summary>
public sealed class ActivityResourceLinkValidatorTests
{
    private readonly CreateTourCommandValidator _validator = new();

    #region Helper Methods

    private string CreateString(int length) => new('A', length);

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

    private CreateTourCommand CreateCommandWithActivityLinks(List<string>? links)
    {
        return CreateBaseValidCommand() with
        {
            Classifications =
            [
                new ClassificationDto(null,
                    Name: "Standard",
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
                                    Title: "Museum Visit",
                                    Description: null,
                                    Note: null,
                                    EstimatedCost: 0,
                                    IsOptional: false,
                                    StartTime: null,
                                    EndTime: null,
                                    Routes: [],
                                    Accommodation: null,
                                    Translations: null,
                                    LinkToResources: links)
                            ],
                            Translations: null)
                    ],
                    Insurances: [],
                    Translations: null)
            ]
        };
    }

    #endregion

    #region TC08: Valid HTTPS URL - should pass

    [Fact]
    public void Validate_WithValidHttpsUrl_ShouldPass()
    {
        var command = CreateCommandWithActivityLinks(new List<string> { "https://www.museum.com/tickets" });
        var result = _validator.Validate(command);
        Assert.True(result.IsValid, string.Join(", ", result.Errors.Select(e => e.ErrorMessage)));
    }

    #endregion

    #region TC09: Valid HTTP URL - should pass

    [Fact]
    public void Validate_WithValidHttpUrl_ShouldPass()
    {
        var command = CreateCommandWithActivityLinks(new List<string> { "http://www.museum.com/tickets" });
        var result = _validator.Validate(command);
        Assert.True(result.IsValid, string.Join(", ", result.Errors.Select(e => e.ErrorMessage)));
    }

    #endregion

    #region TC10: FTP URL - should fail

    [Fact]
    public void Validate_WithFtpUrl_ShouldFail()
    {
        var command = CreateCommandWithActivityLinks(new List<string> { "ftp://files.example.com/doc.pdf" });
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage.Contains("resource link") && e.ErrorMessage.Contains("http"));
    }

    #endregion

    #region TC11: Relative URL - should fail

    [Fact]
    public void Validate_WithRelativeUrl_ShouldFail()
    {
        var command = CreateCommandWithActivityLinks(new List<string> { "/museum/tickets" });
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage.Contains("resource link") && e.ErrorMessage.Contains("URL"));
    }

    #endregion

    #region TC12: Plain text (no scheme) - should fail

    [Fact]
    public void Validate_WithPlainTextUrl_ShouldFail()
    {
        var command = CreateCommandWithActivityLinks(new List<string> { "www.museum.com/tickets" });
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage.Contains("resource link") && e.ErrorMessage.Contains("URL"));
    }

    #endregion

    #region TC13: Empty string URL - should fail

    [Fact]
    public void Validate_WithEmptyStringUrl_ShouldFail()
    {
        var command = CreateCommandWithActivityLinks(new List<string> { "" });
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
    }

    #endregion

    #region TC14: URL exceeds 2048 chars - should fail

    [Fact]
    public void Validate_WithUrlExceeding2048Chars_ShouldFail()
    {
        var longPath = new string('a', 2049);
        var command = CreateCommandWithActivityLinks(new List<string> { $"https://example.com/{longPath}" });
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage.Contains("2048"));
    }

    #endregion

    #region TC15: URL exactly 2048 chars - should pass

    [Fact]
    public void Validate_WithUrlExactly2048Chars_ShouldPass()
    {
        var longPath = new string('a', 2028);
        var command = CreateCommandWithActivityLinks(new List<string> { $"https://example.com/{longPath}" });
        var result = _validator.Validate(command);
        Assert.True(result.IsValid, string.Join(", ", result.Errors.Select(e => e.ErrorMessage)));
    }

    #endregion

    #region TC16: Null linkToResources - should pass (optional)

    [Fact]
    public void Validate_WithNullLinkToResources_ShouldPass()
    {
        var command = CreateCommandWithActivityLinks(null);
        var result = _validator.Validate(command);
        Assert.True(result.IsValid, string.Join(", ", result.Errors.Select(e => e.ErrorMessage)));
    }

    #endregion

    #region TC17: Empty linkToResources list - should pass (optional)

    [Fact]
    public void Validate_WithEmptyLinkToResources_ShouldPass()
    {
        var command = CreateCommandWithActivityLinks(new List<string>());
        var result = _validator.Validate(command);
        Assert.True(result.IsValid, string.Join(", ", result.Errors.Select(e => e.ErrorMessage)));
    }

    #endregion

    #region TC18: Mixed valid and invalid URLs - should fail with specific error

    [Fact]
    public void Validate_WithMixedValidAndInvalidUrls_ShouldFail()
    {
        var command = CreateCommandWithActivityLinks(new List<string>
        {
            "https://www.museum.com/tickets",
            "not-a-valid-url",
            "https://www.museum.com/guide"
        });
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage.Contains("resource link") && e.ErrorMessage.Contains("URL"));
    }

    #endregion

    #region TC19: Multiple valid URLs - should pass

    [Fact]
    public void Validate_WithMultipleValidUrls_ShouldPass()
    {
        var command = CreateCommandWithActivityLinks(new List<string>
        {
            "https://www.museum.com/tickets",
            "https://www.museum.com/guide",
            "https://www.museum.com/audio"
        });
        var result = _validator.Validate(command);
        Assert.True(result.IsValid, string.Join(", ", result.Errors.Select(e => e.ErrorMessage)));
    }

    #endregion

    #region TC20: FTP URL - should fail

    [Fact]
    public void Validate_WithFtpScheme_ShouldFail()
    {
        var command = CreateCommandWithActivityLinks(new List<string> { "ftp://example.com" });
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage.Contains("http"));
    }

    #endregion

    #region TC21: Mailto URL - should fail

    [Fact]
    public void Validate_WithMailtoScheme_ShouldFail()
    {
        var command = CreateCommandWithActivityLinks(new List<string> { "mailto:test@example.com" });
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage.Contains("http"));
    }

    #endregion

    #region TC22: HTTPS URL - should pass

    [Fact]
    public void Validate_WithHttpsScheme_ShouldPass()
    {
        var command = CreateCommandWithActivityLinks(new List<string> { "https://example.com" });
        var result = _validator.Validate(command);
        Assert.True(result.IsValid, string.Join(", ", result.Errors.Select(e => e.ErrorMessage)));
    }

    #endregion
}
