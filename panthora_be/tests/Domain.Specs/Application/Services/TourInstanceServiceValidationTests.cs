using Application.Common.Interfaces;
using Contracts.Interfaces;
using Application.Dtos;
using Application.Features.TourInstance.Commands;
using Application.Services;
using AutoMapper;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Services;

public class TourInstanceServiceValidationTests
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

    private readonly TourInstanceService _sut;

    public TourInstanceServiceValidationTests()
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
            _logger);
    }

    private void SetupMocksForHappyPath(Guid tourId, Guid classificationId)
    {
        var tour = new TourEntity
        {
            Id = tourId,
            TourName = "Test Tour",
            Classifications = new List<TourClassificationEntity>
            {
                new() { Id = classificationId, TourId = tourId, Name = "Standard" }
            }
        };
        _tourRepository.FindById(tourId, Arg.Any<bool>(), Arg.Any<CancellationToken>()).Returns(tour);
        _user.Id.Returns(Guid.NewGuid().ToString());
    }

    [Fact]
    public async Task Create_ShouldReturnError_WhenVehicleNotOwnedByProvider()
    {
        // Arrange
        var tourId = Guid.NewGuid();
        var classificationId = Guid.NewGuid();
        var providerId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var originalActivityId = Guid.NewGuid();
        var ownerUserId = Guid.NewGuid();

        SetupMocksForHappyPath(tourId, classificationId);

        var request = new CreateTourInstanceCommand(
            TourId: tourId,
            ClassificationId: classificationId,
            Title: "Test Tour",
            InstanceType: TourType.Public,
            StartDate: DateTimeOffset.UtcNow.AddDays(1),
            EndDate: DateTimeOffset.UtcNow.AddDays(5),
            MaxParticipation: 10,
            BasePrice: 1000,
            TransportProviderId: providerId,
            ActivityAssignments: new List<CreateTourInstanceActivityAssignmentDto>
            {
                new(originalActivityId, null, null, null, vehicleId)
            }
        );

        var supplier = new SupplierEntity { Id = providerId, Name = "Test Transport", IsActive = true, OwnerUserId = ownerUserId };
        _supplierRepository.GetByIdAsync(providerId).Returns(supplier);

        // Mock owner user not banned
        _tourInstanceRepository.FindUserByIdAsync(ownerUserId).Returns(new UserEntity { Id = ownerUserId, Status = UserStatus.Active });

        // Mock vehicle repository returns empty set (not owned/not active)
        _vehicleRepository.FindActiveIdsByOwnerAsync(Arg.Any<IEnumerable<Guid>>(), ownerUserId)
            .Returns(new HashSet<Guid>());

        // Act
        var result = await _sut.Create(request);

        // Assert
        Assert.True(result.IsError);
        Assert.Contains(result.Errors, e => e.Code == "TourInstance.VehicleNotOwnedByProvider");
    }

    [Fact]
    public async Task Create_ShouldReturnError_WhenSupplierIsInactive()
    {
        // Arrange
        var tourId = Guid.NewGuid();
        var classificationId = Guid.NewGuid();
        var providerId = Guid.NewGuid();

        SetupMocksForHappyPath(tourId, classificationId);

        var request = new CreateTourInstanceCommand(
            TourId: tourId,
            ClassificationId: classificationId,
            Title: "Test Tour",
            InstanceType: TourType.Public,
            StartDate: DateTimeOffset.UtcNow.AddDays(1),
            EndDate: DateTimeOffset.UtcNow.AddDays(5),
            MaxParticipation: 10,
            BasePrice: 1000,
            TransportProviderId: providerId,
            ActivityAssignments: new List<CreateTourInstanceActivityAssignmentDto>
            {
                new(Guid.NewGuid(), null, null, null, Guid.NewGuid())
            }
        );

        var supplier = new SupplierEntity { Id = providerId, Name = "Inactive Transport", IsActive = false };
        _supplierRepository.GetByIdAsync(providerId).Returns(supplier);

        // Act
        var result = await _sut.Create(request);

        // Assert
        Assert.True(result.IsError);
        Assert.Contains(result.Errors, e => e.Code == "TourInstance.SupplierInactive");
    }

    [Fact]
    public async Task Create_ShouldReturnError_WhenSupplierUserIsBanned()
    {
        // Arrange
        var tourId = Guid.NewGuid();
        var classificationId = Guid.NewGuid();
        var providerId = Guid.NewGuid();
        var ownerUserId = Guid.NewGuid();

        SetupMocksForHappyPath(tourId, classificationId);

        var request = new CreateTourInstanceCommand(
            TourId: tourId,
            ClassificationId: classificationId,
            Title: "Test Tour",
            InstanceType: TourType.Public,
            StartDate: DateTimeOffset.UtcNow.AddDays(1),
            EndDate: DateTimeOffset.UtcNow.AddDays(5),
            MaxParticipation: 10,
            BasePrice: 1000,
            TransportProviderId: providerId,
            ActivityAssignments: new List<CreateTourInstanceActivityAssignmentDto>
            {
                new(Guid.NewGuid(), null, null, null, Guid.NewGuid())
            }
        );

        var supplier = new SupplierEntity { Id = providerId, Name = "Banned Transport", IsActive = true, OwnerUserId = ownerUserId };
        _supplierRepository.GetByIdAsync(providerId).Returns(supplier);

        // Mock owner user BANNED
        _tourInstanceRepository.FindUserByIdAsync(ownerUserId).Returns(new UserEntity { Id = ownerUserId, Status = UserStatus.Banned });

        // Act
        var result = await _sut.Create(request);

        // Assert
        Assert.True(result.IsError);
        Assert.Contains(result.Errors, e => e.Code == "TourInstance.SupplierBanned");
    }
}
