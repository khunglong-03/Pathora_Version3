using Application.Common.Constant;
using Application.Features.TourInstance.Commands;
using Application.Dtos;
using Application.Services;
using AutoMapper;
using Contracts.Interfaces;
using Contracts.ModelResponse;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.Mails;
using ErrorOr;
using Microsoft.Extensions.Logging;
using NSubstitute;
using NSubstitute.ReturnsExtensions;

namespace Domain.Specs.Application.Services;

public sealed class TourInstanceServiceTests
{
    private readonly ITourInstanceRepository _tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
    private readonly ITourRepository _tourRepository = Substitute.For<ITourRepository>();
    private readonly ITourRequestRepository _tourRequestRepository = Substitute.For<ITourRequestRepository>();
    private readonly IMailRepository _mailRepository = Substitute.For<IMailRepository>();
    private readonly ISupplierRepository _supplierRepository = Substitute.For<ISupplierRepository>();
    private readonly IUser _user = Substitute.For<IUser>();
    private readonly IMapper _mapper = Substitute.For<IMapper>();
    private readonly ILogger<TourInstanceService> _logger = Substitute.For<ILogger<TourInstanceService>>();
    private readonly ITourInstanceNotificationBroadcaster _broadcaster = Substitute.For<ITourInstanceNotificationBroadcaster>();
    private readonly ITourInstancePlanRouteRepository _routeRepository = Substitute.For<ITourInstancePlanRouteRepository>();
    private readonly IRoomBlockRepository _roomBlockRepository = Substitute.For<IRoomBlockRepository>();

    private TourInstanceService CreateService() =>
        new(_tourInstanceRepository, _routeRepository, _tourRepository, _tourRequestRepository, _supplierRepository, _mailRepository, _roomBlockRepository, _user, _mapper, _logger);

    private TourInstanceService CreateServiceWithBroadcaster() =>
        new(_tourInstanceRepository, _routeRepository, _tourRepository, _tourRequestRepository, _supplierRepository, _mailRepository, _roomBlockRepository, _user, _mapper, _logger, _broadcaster);

    private static TourEntity CreateTourWithClassification(Guid classificationId)
    {
        var tour = TourEntity.Create(
            tourName: "Ha Long Tour",
            shortDescription: "Short",
            longDescription: "Long",
            performedBy: "system");

        var classification = TourClassificationEntity.Create(
            tourId: tour.Id,
            name: "Standard",
            basePrice: 1000,
            description: "Desc",
            numberOfDay: 3,
            numberOfNight: 2,
            performedBy: "system");
        classification.Id = classificationId;
        tour.Classifications.Add(classification);

        return tour;
    }

    [Fact]
    public async Task Create_WithAuthenticatedUser_AutoBindsManagerAndUsesEntityId()
    {
        var classificationId = Guid.NewGuid();
        var creatorUserId = Guid.NewGuid();
        var tour = CreateTourWithClassification(classificationId);
        TourInstanceEntity? captured = null;

        _user.Id.Returns(creatorUserId.ToString());
        _tourRepository.FindById(Arg.Any<Guid>()).Returns(tour);
        _tourInstanceRepository.Create(Arg.Do<TourInstanceEntity>(e => captured = e)).Returns(Task.CompletedTask);

        var command = new CreateTourInstanceCommand(
            TourId: tour.Id,
            ClassificationId: classificationId,
            Title: "Instance 01",
            InstanceType: TourType.Public,
            StartDate: DateTimeOffset.UtcNow.AddDays(1),
            EndDate: DateTimeOffset.UtcNow.AddDays(3),
            MaxParticipation: 20,
            BasePrice: 1000,
            IncludedServices: ["shuttle"],
            GuideUserIds: []);

        var service = CreateService();
        var result = await service.Create(command);

        Assert.False(result.IsError);
        Assert.NotNull(captured);

        // Task 6.1: one manager row added with correct userId and TourInstanceManagerRole.Manager
        var manager = captured!.Managers.SingleOrDefault(m => m.Role == TourInstanceManagerRole.Manager);
        Assert.NotNull(manager);
        Assert.Equal(creatorUserId, manager!.UserId);
        Assert.Equal(TourInstanceManagerRole.Manager, manager.Role);

        // Task 6.3: manager entity has correct entity ID (not Guid.Empty)
        Assert.Equal(captured.Id, manager.TourInstanceId);
        Assert.NotEqual(Guid.Empty, manager.TourInstanceId);
    }

    [Fact]
    public async Task Create_WithGuideUserIds_AddsGuideManagerRole()
    {
        // Task 6.1 extension: guide assignment adds TourInstanceManagerRole.Guide
        var classificationId = Guid.NewGuid();
        var creatorUserId = Guid.NewGuid();
        var guideUserId = Guid.NewGuid();
        var tour = CreateTourWithClassification(classificationId);
        TourInstanceEntity? captured = null;

        _user.Id.Returns(creatorUserId.ToString());
        _tourRepository.FindById(Arg.Any<Guid>()).Returns(tour);
        _tourInstanceRepository.FindConflictingInstancesForManagers(Arg.Any<List<Guid>>(), Arg.Any<DateTimeOffset>(), Arg.Any<DateTimeOffset>())
            .Returns(new List<TourInstanceEntity>());
        _tourInstanceRepository.Create(Arg.Do<TourInstanceEntity>(e => captured = e)).Returns(Task.CompletedTask);

        var command = new CreateTourInstanceCommand(
            TourId: tour.Id,
            ClassificationId: classificationId,
            Title: "Instance With Guide",
            InstanceType: TourType.Public,
            StartDate: DateTimeOffset.UtcNow.AddDays(1),
            EndDate: DateTimeOffset.UtcNow.AddDays(3),
            MaxParticipation: 20,
            BasePrice: 1000,
            IncludedServices: [],
            GuideUserIds: [guideUserId]);

        var service = CreateService();
        var result = await service.Create(command);

        Assert.False(result.IsError);
        Assert.NotNull(captured);

        // Manager auto-bound
        var manager = captured!.Managers.SingleOrDefault(m => m.Role == TourInstanceManagerRole.Manager);
        Assert.NotNull(manager);
        Assert.Equal(creatorUserId, manager!.UserId);

        // Guide assigned
        var guide = captured.Managers.SingleOrDefault(m => m.Role == TourInstanceManagerRole.Guide);
        Assert.NotNull(guide);
        Assert.Equal(guideUserId, guide!.UserId);
        Assert.Equal(captured.Id, guide.TourInstanceId);
    }

    [Fact]
    public async Task Create_WithNullUserId_ReturnsUnauthorized()
    {
        var classificationId = Guid.NewGuid();
        var tour = CreateTourWithClassification(classificationId);

        _user.Id.Returns((string?)null);
        _tourRepository.FindById(Arg.Any<Guid>()).Returns(tour);

        var command = new CreateTourInstanceCommand(
            TourId: tour.Id,
            ClassificationId: classificationId,
            Title: "Instance 01",
            InstanceType: TourType.Public,
            StartDate: DateTimeOffset.UtcNow.AddDays(1),
            EndDate: DateTimeOffset.UtcNow.AddDays(3),
            MaxParticipation: 20,
            BasePrice: 1000,
            IncludedServices: ["shuttle"],
            GuideUserIds: []);

        var service = CreateService();
        var result = await service.Create(command);

        Assert.True(result.IsError);
        Assert.Equal("User.Unauthorized", result.FirstError.Code);
        await _tourInstanceRepository.DidNotReceive().Create(Arg.Any<TourInstanceEntity>());
    }

    [Fact]
    public async Task Create_WithWhitespaceUserId_ReturnsUnauthorized()
    {
        // Task 6.2: mock IUser returning whitespace, assert Error.Unauthorized()
        var classificationId = Guid.NewGuid();
        var tour = CreateTourWithClassification(classificationId);

        _user.Id.Returns("   ");
        _tourRepository.FindById(Arg.Any<Guid>()).Returns(tour);

        var command = new CreateTourInstanceCommand(
            TourId: tour.Id,
            ClassificationId: classificationId,
            Title: "Instance 01",
            InstanceType: TourType.Public,
            StartDate: DateTimeOffset.UtcNow.AddDays(1),
            EndDate: DateTimeOffset.UtcNow.AddDays(3),
            MaxParticipation: 20,
            BasePrice: 1000,
            IncludedServices: [],
            GuideUserIds: []);

        var service = CreateService();
        var result = await service.Create(command);

        Assert.True(result.IsError);
        Assert.Equal("User.Unauthorized", result.FirstError.Code);
        await _tourInstanceRepository.DidNotReceive().Create(Arg.Any<TourInstanceEntity>());
    }

    [Fact]
    public async Task Create_WithMissingUserId_ReturnsUnauthorized()
    {
        var classificationId = Guid.NewGuid();
        var tour = CreateTourWithClassification(classificationId);

        _user.Id.Returns((string?)null);
        _tourRepository.FindById(Arg.Any<Guid>()).Returns(tour);

        var command = new CreateTourInstanceCommand(
            TourId: tour.Id,
            ClassificationId: classificationId,
            Title: "Instance 01",
            InstanceType: TourType.Public,
            StartDate: DateTimeOffset.UtcNow.AddDays(1),
            EndDate: DateTimeOffset.UtcNow.AddDays(3),
            MaxParticipation: 20,
            BasePrice: 1000,
            IncludedServices: ["shuttle"],
            GuideUserIds: []);

        var service = CreateService();
        var result = await service.Create(command);

        Assert.True(result.IsError);
        Assert.Equal("User.Unauthorized", result.FirstError.Code);
        await _tourInstanceRepository.DidNotReceive().Create(Arg.Any<TourInstanceEntity>());
    }

    [Fact]
    public async Task Create_WithValidTourRequestId_LinksRequestAndQueuesEmail()
    {
        // TourRequestId provided, approved, not linked — should link and queue email
        var classificationId = Guid.NewGuid();
        var creatorUserId = Guid.NewGuid();
        var tourRequestId = Guid.NewGuid();
        var tour = CreateTourWithClassification(classificationId);
        TourInstanceEntity? capturedInstance = null;
        TourRequestEntity? capturedRequest = null;

        _user.Id.Returns(creatorUserId.ToString());
        _tourRepository.FindById(Arg.Any<Guid>()).Returns(tour);
        _tourInstanceRepository.Create(Arg.Do<TourInstanceEntity>(e => capturedInstance = e)).Returns(Task.CompletedTask);
        _tourInstanceRepository.Update(Arg.Any<TourInstanceEntity>()).Returns(Task.CompletedTask);

        var tourRequest = TourRequestEntity.Create(
            customerName: "John Doe",
            customerPhone: "0123456789",
            destination: "Ha Long",
            departureDate: DateTimeOffset.UtcNow.AddDays(10),
            numberAdult: 2,
            performedBy: "system",
            customerEmail: "john@example.com");
        tourRequest.Approve(creatorUserId, "admin"); // Status = Approved, TourInstanceId = null

        _tourRequestRepository.GetByIdAsync(tourRequestId).Returns(tourRequest);
        _tourRequestRepository.UpdateAsync(Arg.Do<TourRequestEntity>(r => capturedRequest = r)).Returns(Task.CompletedTask);
        _mailRepository.Add(Arg.Any<Domain.Mails.MailEntity>()).Returns(Result.Success);

        var command = new CreateTourInstanceCommand(
            TourId: tour.Id,
            ClassificationId: classificationId,
            Title: "Ha Long Trip",
            InstanceType: TourType.Public,
            StartDate: DateTimeOffset.UtcNow.AddDays(10),
            EndDate: DateTimeOffset.UtcNow.AddDays(12),
            MaxParticipation: 20,
            BasePrice: 500,
            IncludedServices: ["shuttle", "meal"],
            GuideUserIds: [],
            TourRequestId: tourRequestId);

        var service = CreateService();
        var result = await service.Create(command);

        Assert.False(result.IsError);

        // TourRequest.TourInstanceId should be linked
        Assert.NotNull(capturedRequest);
        Assert.Equal(capturedInstance!.Id, capturedRequest!.TourInstanceId);

        // Email should be queued
        await _mailRepository.Received(1).Add(Arg.Is<Domain.Mails.MailEntity>(m =>
            m.To == "john@example.com" &&
            m.Subject == "Your Tour Request Has Been Approved!"));
    }

    [Fact]
    public async Task Create_WithoutTourRequestId_DoesNotLinkAndDoesNotQueueEmail()
    {
        // No TourRequestId — no linking, no email
        var classificationId = Guid.NewGuid();
        var creatorUserId = Guid.NewGuid();
        var tour = CreateTourWithClassification(classificationId);

        _user.Id.Returns(creatorUserId.ToString());
        _tourRepository.FindById(Arg.Any<Guid>()).Returns(tour);
        _tourInstanceRepository.Create(Arg.Any<TourInstanceEntity>()).Returns(Task.CompletedTask);

        var command = new CreateTourInstanceCommand(
            TourId: tour.Id,
            ClassificationId: classificationId,
            Title: "Normal Tour",
            InstanceType: TourType.Public,
            StartDate: DateTimeOffset.UtcNow.AddDays(5),
            EndDate: DateTimeOffset.UtcNow.AddDays(7),
            MaxParticipation: 15,
            BasePrice: 300,
            IncludedServices: [],
            GuideUserIds: [],
            TourRequestId: null); // explicitly null

        var service = CreateService();
        var result = await service.Create(command);

        Assert.False(result.IsError);
        await _tourRequestRepository.DidNotReceive().GetByIdAsync(Arg.Any<Guid>());
        await _mailRepository.DidNotReceive().Add(Arg.Any<Domain.Mails.MailEntity>());
    }

    [Fact]
    public async Task Create_WithNonExistentTourRequestId_ReturnsNotFound()
    {
        var classificationId = Guid.NewGuid();
        var creatorUserId = Guid.NewGuid();
        var tourRequestId = Guid.NewGuid();
        var tour = CreateTourWithClassification(classificationId);

        _user.Id.Returns(creatorUserId.ToString());
        _tourRepository.FindById(Arg.Any<Guid>()).Returns(tour);
        _tourRequestRepository.GetByIdAsync(tourRequestId).Returns((TourRequestEntity?)null);

        var command = new CreateTourInstanceCommand(
            TourId: tour.Id,
            ClassificationId: classificationId,
            Title: "Tour",
            InstanceType: TourType.Public,
            StartDate: DateTimeOffset.UtcNow.AddDays(1),
            EndDate: DateTimeOffset.UtcNow.AddDays(3),
            MaxParticipation: 10,
            BasePrice: 100,
            TourRequestId: tourRequestId);

        var service = CreateService();
        var result = await service.Create(command);

        Assert.True(result.IsError);
        Assert.Contains("NotFound", result.FirstError.Code);
        await _tourInstanceRepository.DidNotReceive().Create(Arg.Any<TourInstanceEntity>());
    }

    [Fact]
    public async Task Create_WithPendingTourRequestId_ReturnsValidationError()
    {
        var classificationId = Guid.NewGuid();
        var creatorUserId = Guid.NewGuid();
        var tourRequestId = Guid.NewGuid();
        var tour = CreateTourWithClassification(classificationId);

        var pendingRequest = TourRequestEntity.Create(
            customerName: "Jane",
            customerPhone: "0123456789",
            destination: "Da Nang",
            departureDate: DateTimeOffset.UtcNow.AddDays(5),
            numberAdult: 1,
            performedBy: "system");
        // Status remains Pending (default)

        _user.Id.Returns(creatorUserId.ToString());
        _tourRepository.FindById(Arg.Any<Guid>()).Returns(tour);
        _tourRequestRepository.GetByIdAsync(tourRequestId).Returns(pendingRequest);

        var command = new CreateTourInstanceCommand(
            TourId: tour.Id,
            ClassificationId: classificationId,
            Title: "Tour",
            InstanceType: TourType.Public,
            StartDate: DateTimeOffset.UtcNow.AddDays(1),
            EndDate: DateTimeOffset.UtcNow.AddDays(3),
            MaxParticipation: 10,
            BasePrice: 100,
            TourRequestId: tourRequestId);

        var service = CreateService();
        var result = await service.Create(command);

        Assert.True(result.IsError);
        Assert.Contains("approved", result.FirstError.Description, StringComparison.OrdinalIgnoreCase);
        await _tourInstanceRepository.DidNotReceive().Create(Arg.Any<TourInstanceEntity>());
    }

    [Fact]
    public async Task Create_WithAlreadyLinkedTourRequestId_ReturnsValidationError()
    {
        var classificationId = Guid.NewGuid();
        var creatorUserId = Guid.NewGuid();
        var tourRequestId = Guid.NewGuid();
        var existingInstanceId = Guid.NewGuid();
        var tour = CreateTourWithClassification(classificationId);

        var linkedRequest = TourRequestEntity.Create(
            customerName: "Bob",
            customerPhone: "0123456789",
            destination: "Sapa",
            departureDate: DateTimeOffset.UtcNow.AddDays(5),
            numberAdult: 2,
            performedBy: "system");
        linkedRequest.Approve(creatorUserId, "admin");
        linkedRequest.TourInstanceId = existingInstanceId; // already linked

        _user.Id.Returns(creatorUserId.ToString());
        _tourRepository.FindById(Arg.Any<Guid>()).Returns(tour);
        _tourRequestRepository.GetByIdAsync(tourRequestId).Returns(linkedRequest);

        var command = new CreateTourInstanceCommand(
            TourId: tour.Id,
            ClassificationId: classificationId,
            Title: "Tour",
            InstanceType: TourType.Public,
            StartDate: DateTimeOffset.UtcNow.AddDays(1),
            EndDate: DateTimeOffset.UtcNow.AddDays(3),
            MaxParticipation: 10,
            BasePrice: 100,
            TourRequestId: tourRequestId);

        var service = CreateService();
        var result = await service.Create(command);

        Assert.True(result.IsError);
        Assert.Contains("already linked", result.FirstError.Description, StringComparison.OrdinalIgnoreCase);
        await _tourInstanceRepository.DidNotReceive().Create(Arg.Any<TourInstanceEntity>());
    }

    // ─── Update Tests (RowVersion removal) ──────────────────────────────────────

    [Fact]
    public async Task Update_WithExistingEntity_ShouldSucceed()
    {
        // After removing xmin concurrency token, Update should work without RowVersion
        var instanceId = Guid.NewGuid();
        var entity = TourInstanceEntity.Create(
            tourId: Guid.NewGuid(),
            classificationId: Guid.NewGuid(),
            title: "Original Title",
            tourName: "Tour A",
            tourCode: "TA001",
            classificationName: "Standard",
            instanceType: TourType.Public,
            startDate: DateTimeOffset.UtcNow.AddDays(1),
            endDate: DateTimeOffset.UtcNow.AddDays(3),
            maxParticipation: 20,
            basePrice: 1000,
            performedBy: "system");

        _tourInstanceRepository.FindById(instanceId).Returns(entity);
        _tourInstanceRepository.Update(Arg.Any<TourInstanceEntity>()).Returns(Task.CompletedTask);

        var command = new UpdateTourInstanceCommand(
            Id: instanceId,
            Title: "Updated Title",
            StartDate: entity.StartDate,
            EndDate: entity.EndDate,
            MaxParticipation: 25,
            BasePrice: 1200);

        var service = CreateService();
        var result = await service.Update(command);

        Assert.False(result.IsError);
        await _tourInstanceRepository.Received(1).Update(Arg.Any<TourInstanceEntity>());
    }

    [Fact]
    public async Task Update_WithNonExistentEntity_ShouldReturnNotFound()
    {
        var instanceId = Guid.NewGuid();
        _tourInstanceRepository.FindById(instanceId).Returns((TourInstanceEntity?)null);

        var command = new UpdateTourInstanceCommand(
            Id: instanceId,
            Title: "Updated Title",
            StartDate: DateTimeOffset.UtcNow.AddDays(1),
            EndDate: DateTimeOffset.UtcNow.AddDays(3),
            MaxParticipation: 20,
            BasePrice: 1000);

        var service = CreateService();
        var result = await service.Update(command);

        Assert.True(result.IsError);
        Assert.Equal(ErrorConstants.TourInstance.NotFoundCode, result.FirstError.Code);
        await _tourInstanceRepository.DidNotReceive().Update(Arg.Any<TourInstanceEntity>());
    }

    [Fact]
    public async Task Update_WithGuideUserIds_ShouldUpdateManagerAssignments()
    {
        // Verify that guide IDs are properly assigned as TourInstanceManagerRole.Guide
        var instanceId = Guid.NewGuid();
        var entity = TourInstanceEntity.Create(
            tourId: Guid.NewGuid(),
            classificationId: Guid.NewGuid(),
            title: "Tour Instance",
            tourName: "Tour A",
            tourCode: "TA001",
            classificationName: "Standard",
            instanceType: TourType.Public,
            startDate: DateTimeOffset.UtcNow.AddDays(1),
            endDate: DateTimeOffset.UtcNow.AddDays(3),
            maxParticipation: 20,
            basePrice: 1000,
            performedBy: "system");
        TourInstanceEntity? captured = null;

        var guideId = Guid.NewGuid();
        var managerId = Guid.NewGuid();
        _tourInstanceRepository.FindById(instanceId).Returns(entity);
        _tourInstanceRepository.FindConflictingInstancesForManagers(
            Arg.Any<IEnumerable<Guid>>(), Arg.Any<DateTimeOffset>(), Arg.Any<DateTimeOffset>(), Arg.Any<Guid?>()
        ).Returns(new List<TourInstanceEntity>());
        _tourInstanceRepository.Update(Arg.Do<TourInstanceEntity>(e => captured = e))
            .Returns(Task.CompletedTask);

        var command = new UpdateTourInstanceCommand(
            Id: instanceId,
            Title: "Updated",
            StartDate: entity.StartDate,
            EndDate: entity.EndDate,
            MaxParticipation: 20,
            BasePrice: 1000,
            GuideUserIds: [guideId],
            ManagerUserIds: [managerId]);

        var service = CreateService();
        var result = await service.Update(command);

        Assert.False(result.IsError);
        Assert.NotNull(captured);
        var guide = captured!.Managers.SingleOrDefault(m => m.Role == TourInstanceManagerRole.Guide);
        Assert.NotNull(guide);
        Assert.Equal(guideId, guide!.UserId);
        var manager = captured.Managers.SingleOrDefault(m => m.Role == TourInstanceManagerRole.Manager);
        Assert.NotNull(manager);
        Assert.Equal(managerId, manager!.UserId);
    }

    [Fact]
    public async Task Update_DoesNotSetRowVersion()
    {
        // After removing xmin, Update should NOT try to set RowVersion on the entity
        var instanceId = Guid.NewGuid();
        var entity = TourInstanceEntity.Create(
            tourId: Guid.NewGuid(),
            classificationId: Guid.NewGuid(),
            title: "Title",
            tourName: "Tour A",
            tourCode: "TA001",
            classificationName: "Standard",
            instanceType: TourType.Public,
            startDate: DateTimeOffset.UtcNow.AddDays(1),
            endDate: DateTimeOffset.UtcNow.AddDays(3),
            maxParticipation: 20,
            basePrice: 1000,
            performedBy: "system");

        // Store original RowVersion value (should be 0 since the property was removed)
        TourInstanceEntity? captured = null;
        _tourInstanceRepository.FindById(instanceId).Returns(entity);
        _tourInstanceRepository.Update(Arg.Do<TourInstanceEntity>(e => captured = e))
            .Returns(Task.CompletedTask);

        var command = new UpdateTourInstanceCommand(
            Id: instanceId,
            Title: "Updated",
            StartDate: entity.StartDate,
            EndDate: entity.EndDate,
            MaxParticipation: 20,
            BasePrice: 1000);

        var service = CreateService();
        var result = await service.Update(command);

        Assert.False(result.IsError);
        Assert.NotNull(captured);
        // Verify UpdateTourInstanceCommand does NOT have RowVersion parameter
        var cmdType = typeof(UpdateTourInstanceCommand);
        var ctors = cmdType.GetConstructors();
        Assert.True(ctors.Length > 0);
        var ctorParams = ctors[0].GetParameters();
        var hasRowVersion = ctorParams.Any(p => p.Name == "RowVersion");
        Assert.False(hasRowVersion);
    }

    // ─── Provider Notification Verification Tests (5.1–5.11) ─────────────────────

    private static SupplierEntity CreateSupplier(SupplierType type, Guid? ownerUserId = null)
    {
        return SupplierEntity.Create(
            supplierCode: $"SUP-{Guid.NewGuid():N}"[..16],
            supplierType: type,
            name: $"{type} Supplier",
            performedBy: "system",
            ownerUserId: ownerUserId);
    }

    [Fact]
    public async Task Create_WithHotelProvider_SendsAssignmentNotificationToOwner()
    {
        // Task 5.1: Verify ReceiveProviderAssignment sent to correct OwnerUserId
        var classificationId = Guid.NewGuid();
        var creatorUserId = Guid.NewGuid();
        var hotelOwnerUserId = Guid.NewGuid();
        var tour = CreateTourWithClassification(classificationId);

        var hotelSupplier = CreateSupplier(SupplierType.Accommodation, hotelOwnerUserId);

        _user.Id.Returns(creatorUserId.ToString());
        _tourRepository.FindById(Arg.Any<Guid>()).Returns(tour);
        _tourInstanceRepository.Create(Arg.Any<TourInstanceEntity>()).Returns(Task.CompletedTask);
        _tourInstanceRepository.Update(Arg.Any<TourInstanceEntity>()).Returns(Task.CompletedTask);
        _supplierRepository.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns(hotelSupplier);

        var command = new CreateTourInstanceCommand(
            TourId: tour.Id,
            ClassificationId: classificationId,
            Title: "Hotel Notification Test",
            InstanceType: TourType.Public,
            StartDate: DateTimeOffset.UtcNow.AddDays(5),
            EndDate: DateTimeOffset.UtcNow.AddDays(7),
            MaxParticipation: 20,
            BasePrice: 1000,
            IncludedServices: [],
            GuideUserIds: [],
            HotelProviderId: hotelSupplier.Id);

        var service = CreateServiceWithBroadcaster();
        var result = await service.Create(command);

        Assert.False(result.IsError);

        await _broadcaster.Received(1).NotifyProviderAssignmentAsync(
            Arg.Any<Guid>(),
            Arg.Is("Hotel Notification Test"),
            Arg.Is(tour.TourName),
            Arg.Any<DateTimeOffset>(),
            Arg.Any<DateTimeOffset>(),
            Arg.Is("Hotel"),
            Arg.Is(hotelOwnerUserId),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Create_WithBothProviders_SendsTwoSeparateNotifications()
    {
        // Task 5.2: Both hotel and transport owner users receive separate notifications
        var classificationId = Guid.NewGuid();
        var creatorUserId = Guid.NewGuid();
        var hotelOwnerUserId = Guid.NewGuid();
        var transportOwnerUserId = Guid.NewGuid();
        var tour = CreateTourWithClassification(classificationId);

        var hotelSupplier = CreateSupplier(SupplierType.Accommodation, hotelOwnerUserId);
        var transportSupplier = CreateSupplier(SupplierType.Transport, transportOwnerUserId);

        _user.Id.Returns(creatorUserId.ToString());
        _tourRepository.FindById(Arg.Any<Guid>()).Returns(tour);
        _tourInstanceRepository.Create(Arg.Any<TourInstanceEntity>()).Returns(Task.CompletedTask);
        _tourInstanceRepository.Update(Arg.Any<TourInstanceEntity>()).Returns(Task.CompletedTask);
        _supplierRepository.GetByIdAsync(hotelSupplier.Id, Arg.Any<CancellationToken>()).Returns(hotelSupplier);
        _supplierRepository.GetByIdAsync(transportSupplier.Id, Arg.Any<CancellationToken>()).Returns(transportSupplier);

        var command = new CreateTourInstanceCommand(
            TourId: tour.Id,
            ClassificationId: classificationId,
            Title: "Dual Provider Test",
            InstanceType: TourType.Public,
            StartDate: DateTimeOffset.UtcNow.AddDays(5),
            EndDate: DateTimeOffset.UtcNow.AddDays(7),
            MaxParticipation: 20,
            BasePrice: 1000,
            IncludedServices: [],
            GuideUserIds: [],
            HotelProviderId: hotelSupplier.Id,
            TransportProviderId: transportSupplier.Id);

        var service = CreateServiceWithBroadcaster();
        var result = await service.Create(command);

        Assert.False(result.IsError);

        // Hotel notification
        await _broadcaster.Received(1).NotifyProviderAssignmentAsync(
            Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<string>(),
            Arg.Any<DateTimeOffset>(), Arg.Any<DateTimeOffset>(),
            Arg.Is("Hotel"), Arg.Is(hotelOwnerUserId), Arg.Any<CancellationToken>());

        // Transport notification
        await _broadcaster.Received(1).NotifyProviderAssignmentAsync(
            Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<string>(),
            Arg.Any<DateTimeOffset>(), Arg.Any<DateTimeOffset>(),
            Arg.Is("Transport"), Arg.Is(transportOwnerUserId), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ProviderApprove_Approved_NotifiesManagerWithResult()
    {
        // Task 5.3: Provider approve => Manager receives ReceiveProviderApprovalResult
        var managerUserId = Guid.NewGuid();
        var supplierOwnerUserId = Guid.NewGuid();
        var hotelSupplierId = Guid.NewGuid();

        var supplier = CreateSupplier(SupplierType.Accommodation, supplierOwnerUserId);
        // Override the auto-generated Id to match what we set on the entity
        typeof(SupplierEntity).GetProperty("Id")!.SetValue(supplier, hotelSupplierId);

        var instance = TourInstanceEntity.Create(
            tourId: Guid.NewGuid(), classificationId: Guid.NewGuid(),
            title: "Approval Test", tourName: "Tour", tourCode: "T001",
            classificationName: "Standard", instanceType: TourType.Public,
            startDate: DateTimeOffset.UtcNow.AddDays(5), endDate: DateTimeOffset.UtcNow.AddDays(7),
            maxParticipation: 20, basePrice: 1000,
            performedBy: managerUserId.ToString(),
            hotelProviderId: hotelSupplierId);

        _user.Id.Returns(supplierOwnerUserId.ToString());
        _supplierRepository.FindByOwnerUserIdAsync(supplierOwnerUserId, Arg.Any<CancellationToken>()).Returns(supplier);
        _tourInstanceRepository.FindById(instance.Id).Returns(instance);
        _tourInstanceRepository.Update(Arg.Any<TourInstanceEntity>()).Returns(Task.CompletedTask);

        var service = CreateServiceWithBroadcaster();
        var result = await service.ProviderApprove(instance.Id, isApproved: true, note: null, providerType: "Hotel");

        Assert.False(result.IsError);

        await _broadcaster.Received(1).NotifyProviderApprovalResultAsync(
            Arg.Is(instance.Id),
            Arg.Is(supplier.Name),
            Arg.Is(true),
            Arg.Is((string?)null),
            Arg.Is(managerUserId.ToString()),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ProviderApprove_Rejected_NotifiesManagerWithReason()
    {
        // Task 5.4: Provider reject => Manager receives result with reason
        var managerUserId = Guid.NewGuid();
        var supplierOwnerUserId = Guid.NewGuid();
        var hotelSupplierId = Guid.NewGuid();

        var supplier = CreateSupplier(SupplierType.Accommodation, supplierOwnerUserId);
        typeof(SupplierEntity).GetProperty("Id")!.SetValue(supplier, hotelSupplierId);

        var instance = TourInstanceEntity.Create(
            tourId: Guid.NewGuid(), classificationId: Guid.NewGuid(),
            title: "Reject Test", tourName: "Tour", tourCode: "T001",
            classificationName: "Standard", instanceType: TourType.Public,
            startDate: DateTimeOffset.UtcNow.AddDays(5), endDate: DateTimeOffset.UtcNow.AddDays(7),
            maxParticipation: 20, basePrice: 1000,
            performedBy: managerUserId.ToString(),
            hotelProviderId: hotelSupplierId);

        _user.Id.Returns(supplierOwnerUserId.ToString());
        _supplierRepository.FindByOwnerUserIdAsync(supplierOwnerUserId, Arg.Any<CancellationToken>()).Returns(supplier);
        _tourInstanceRepository.FindById(instance.Id).Returns(instance);
        _tourInstanceRepository.Update(Arg.Any<TourInstanceEntity>()).Returns(Task.CompletedTask);

        var service = CreateServiceWithBroadcaster();
        var result = await service.ProviderApprove(instance.Id, isApproved: false, note: "Rooms fully booked", providerType: "Hotel");

        Assert.False(result.IsError);

        await _broadcaster.Received(1).NotifyProviderApprovalResultAsync(
            Arg.Is(instance.Id),
            Arg.Is(supplier.Name),
            Arg.Is(false),
            Arg.Is("Rooms fully booked"),
            Arg.Is(managerUserId.ToString()),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetProviderAssigned_WithPendingFilter_OnlyReturnsPending()
    {
        // Task 5.5: GET provider-assigned?approvalStatus=Pending returns only pending instances
        var supplierOwnerUserId = Guid.NewGuid();
        var supplier = CreateSupplier(SupplierType.Accommodation, supplierOwnerUserId);

        var pendingInstance = TourInstanceEntity.Create(
            tourId: Guid.NewGuid(), classificationId: Guid.NewGuid(),
            title: "Pending Instance", tourName: "Tour", tourCode: "T001",
            classificationName: "Standard", instanceType: TourType.Public,
            startDate: DateTimeOffset.UtcNow.AddDays(5), endDate: DateTimeOffset.UtcNow.AddDays(7),
            maxParticipation: 20, basePrice: 1000, performedBy: "system",
            hotelProviderId: supplier.Id);

        _user.Id.Returns(supplierOwnerUserId.ToString());
        _supplierRepository.FindByOwnerUserIdAsync(supplierOwnerUserId, Arg.Any<CancellationToken>()).Returns(supplier);
        _tourInstanceRepository.FindProviderAssigned(supplier.Id, 1, 10, ProviderApprovalStatus.Pending, Arg.Any<CancellationToken>())
            .Returns(new List<TourInstanceEntity> { pendingInstance });
        _tourInstanceRepository.CountProviderAssigned(supplier.Id, ProviderApprovalStatus.Pending, Arg.Any<CancellationToken>())
            .Returns(1);
        _mapper.Map<TourInstanceVm>(Arg.Any<TourInstanceEntity>()).Returns((TourInstanceVm)null!);

        var service = CreateServiceWithBroadcaster();
        var result = await service.GetProviderAssigned(1, 10, ProviderApprovalStatus.Pending);

        Assert.False(result.IsError);
        Assert.Single(result.Value.Items);

        // Verify the repository was called with the correct filter
        await _tourInstanceRepository.Received(1).FindProviderAssigned(
            supplier.Id, 1, 10, ProviderApprovalStatus.Pending, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetProviderAssigned_WithoutFilter_ReturnsAll()
    {
        // Task 5.6: GET provider-assigned without filter returns all (backward compatible)
        var supplierOwnerUserId = Guid.NewGuid();
        var supplier = CreateSupplier(SupplierType.Accommodation, supplierOwnerUserId);

        _user.Id.Returns(supplierOwnerUserId.ToString());
        _supplierRepository.FindByOwnerUserIdAsync(supplierOwnerUserId, Arg.Any<CancellationToken>()).Returns(supplier);
        _tourInstanceRepository.FindProviderAssigned(supplier.Id, 1, 10, null, Arg.Any<CancellationToken>())
            .Returns(new List<TourInstanceEntity>());
        _tourInstanceRepository.CountProviderAssigned(supplier.Id, null, Arg.Any<CancellationToken>())
            .Returns(0);

        var service = CreateServiceWithBroadcaster();
        var result = await service.GetProviderAssigned(1, 10, approvalStatus: null);

        Assert.False(result.IsError);

        // Verify null was passed as filter (backward compatible)
        await _tourInstanceRepository.Received(1).FindProviderAssigned(
            supplier.Id, 1, 10, null, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Create_WithNullOwnerUserId_LogsWarningAndSkipsNotification()
    {
        // Task 5.7: Provider supplier with OwnerUserId = null — no notification, no exception
        var classificationId = Guid.NewGuid();
        var creatorUserId = Guid.NewGuid();
        var tour = CreateTourWithClassification(classificationId);

        var hotelSupplier = CreateSupplier(SupplierType.Accommodation, ownerUserId: null);

        _user.Id.Returns(creatorUserId.ToString());
        _tourRepository.FindById(Arg.Any<Guid>()).Returns(tour);
        _tourInstanceRepository.Create(Arg.Any<TourInstanceEntity>()).Returns(Task.CompletedTask);
        _tourInstanceRepository.Update(Arg.Any<TourInstanceEntity>()).Returns(Task.CompletedTask);
        _supplierRepository.GetByIdAsync(hotelSupplier.Id, Arg.Any<CancellationToken>()).Returns(hotelSupplier);

        var command = new CreateTourInstanceCommand(
            TourId: tour.Id,
            ClassificationId: classificationId,
            Title: "Null Owner Test",
            InstanceType: TourType.Public,
            StartDate: DateTimeOffset.UtcNow.AddDays(5),
            EndDate: DateTimeOffset.UtcNow.AddDays(7),
            MaxParticipation: 20,
            BasePrice: 1000,
            IncludedServices: [],
            GuideUserIds: [],
            HotelProviderId: hotelSupplier.Id);

        var service = CreateServiceWithBroadcaster();
        var result = await service.Create(command);

        // Should succeed without error
        Assert.False(result.IsError);

        // Notification should NOT have been sent
        await _broadcaster.DidNotReceive().NotifyProviderAssignmentAsync(
            Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<string>(),
            Arg.Any<DateTimeOffset>(), Arg.Any<DateTimeOffset>(),
            Arg.Any<string>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Create_SameSupplierAsHotelAndTransport_SendsTwoNotifications()
    {
        // Task 5.8: Same supplier is both HotelProvider and TransportProvider
        var classificationId = Guid.NewGuid();
        var creatorUserId = Guid.NewGuid();
        var ownerUserId = Guid.NewGuid();
        var tour = CreateTourWithClassification(classificationId);

        var supplier = CreateSupplier(SupplierType.Accommodation, ownerUserId);

        _user.Id.Returns(creatorUserId.ToString());
        _tourRepository.FindById(Arg.Any<Guid>()).Returns(tour);
        _tourInstanceRepository.Create(Arg.Any<TourInstanceEntity>()).Returns(Task.CompletedTask);
        _tourInstanceRepository.Update(Arg.Any<TourInstanceEntity>()).Returns(Task.CompletedTask);
        _supplierRepository.GetByIdAsync(supplier.Id, Arg.Any<CancellationToken>()).Returns(supplier);

        var command = new CreateTourInstanceCommand(
            TourId: tour.Id,
            ClassificationId: classificationId,
            Title: "Same Supplier Test",
            InstanceType: TourType.Public,
            StartDate: DateTimeOffset.UtcNow.AddDays(5),
            EndDate: DateTimeOffset.UtcNow.AddDays(7),
            MaxParticipation: 20,
            BasePrice: 1000,
            IncludedServices: [],
            GuideUserIds: [],
            HotelProviderId: supplier.Id,
            TransportProviderId: supplier.Id);

        var service = CreateServiceWithBroadcaster();
        var result = await service.Create(command);

        Assert.False(result.IsError);

        // Both Hotel and Transport notifications should be sent (even to same user)
        await _broadcaster.Received(2).NotifyProviderAssignmentAsync(
            Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<string>(),
            Arg.Any<DateTimeOffset>(), Arg.Any<DateTimeOffset>(),
            Arg.Any<string>(), Arg.Is(ownerUserId), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ProviderApprove_WithNonGuidCreatedBy_SkipsManagerNotification()
    {
        // Task 5.9: CreatedBy is non-Guid => gracefully skip manager notification
        var supplierOwnerUserId = Guid.NewGuid();
        var hotelSupplierId = Guid.NewGuid();

        var supplier = CreateSupplier(SupplierType.Accommodation, supplierOwnerUserId);
        typeof(SupplierEntity).GetProperty("Id")!.SetValue(supplier, hotelSupplierId);

        var instance = TourInstanceEntity.Create(
            tourId: Guid.NewGuid(), classificationId: Guid.NewGuid(),
            title: "Non-Guid CreatedBy", tourName: "Tour", tourCode: "T001",
            classificationName: "Standard", instanceType: TourType.Public,
            startDate: DateTimeOffset.UtcNow.AddDays(5), endDate: DateTimeOffset.UtcNow.AddDays(7),
            maxParticipation: 20, basePrice: 1000,
            performedBy: "system-seed", // non-Guid
            hotelProviderId: hotelSupplierId);

        _user.Id.Returns(supplierOwnerUserId.ToString());
        _supplierRepository.FindByOwnerUserIdAsync(supplierOwnerUserId, Arg.Any<CancellationToken>()).Returns(supplier);
        _tourInstanceRepository.FindById(instance.Id).Returns(instance);
        _tourInstanceRepository.Update(Arg.Any<TourInstanceEntity>()).Returns(Task.CompletedTask);

        var service = CreateServiceWithBroadcaster();
        var result = await service.ProviderApprove(instance.Id, isApproved: true, note: null, providerType: "Hotel");

        Assert.False(result.IsError);

        // Approval result notification should NOT be sent because CreatedBy is not a valid Guid
        await _broadcaster.DidNotReceive().NotifyProviderApprovalResultAsync(
            Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<bool>(),
            Arg.Any<string?>(), Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetProviderAssigned_DualProviderFilter_ReturnsCorrectResults()
    {
        // Task 5.10: hotel approved, transport pending — verify per-role filtering works
        var supplierOwnerUserId = Guid.NewGuid();
        var supplier = CreateSupplier(SupplierType.Accommodation, supplierOwnerUserId);

        _user.Id.Returns(supplierOwnerUserId.ToString());
        _supplierRepository.FindByOwnerUserIdAsync(supplierOwnerUserId, Arg.Any<CancellationToken>()).Returns(supplier);

        // When filtering by Pending, repo returns the instance (because transport is pending)
        _tourInstanceRepository.FindProviderAssigned(supplier.Id, 1, 10, ProviderApprovalStatus.Pending, Arg.Any<CancellationToken>())
            .Returns(new List<TourInstanceEntity> { TourInstanceEntity.Create(
                tourId: Guid.NewGuid(), classificationId: Guid.NewGuid(),
                title: "Dual Instance", tourName: "Tour", tourCode: "T001",
                classificationName: "Standard", instanceType: TourType.Public,
                startDate: DateTimeOffset.UtcNow.AddDays(5), endDate: DateTimeOffset.UtcNow.AddDays(7),
                maxParticipation: 20, basePrice: 1000, performedBy: "system",
                hotelProviderId: supplier.Id, transportProviderId: supplier.Id) });
        _tourInstanceRepository.CountProviderAssigned(supplier.Id, ProviderApprovalStatus.Pending, Arg.Any<CancellationToken>())
            .Returns(1);
        _mapper.Map<TourInstanceVm>(Arg.Any<TourInstanceEntity>()).Returns((TourInstanceVm)null!);

        var service = CreateServiceWithBroadcaster();
        var pendingResult = await service.GetProviderAssigned(1, 10, ProviderApprovalStatus.Pending);

        Assert.False(pendingResult.IsError);
        Assert.Single(pendingResult.Value.Items);

        // Verify correct filter was passed
        await _tourInstanceRepository.Received(1).FindProviderAssigned(
            supplier.Id, 1, 10, ProviderApprovalStatus.Pending, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GetProviderAssigned_CountMatchesFind()
    {
        // Task 5.11: CountProviderAssigned matches FindProviderAssigned count when filter applied
        var supplierOwnerUserId = Guid.NewGuid();
        var supplier = CreateSupplier(SupplierType.Accommodation, supplierOwnerUserId);

        var instances = new List<TourInstanceEntity>
        {
            TourInstanceEntity.Create(
                tourId: Guid.NewGuid(), classificationId: Guid.NewGuid(),
                title: "Instance 1", tourName: "Tour", tourCode: "T001",
                classificationName: "Standard", instanceType: TourType.Public,
                startDate: DateTimeOffset.UtcNow.AddDays(5), endDate: DateTimeOffset.UtcNow.AddDays(7),
                maxParticipation: 20, basePrice: 1000, performedBy: "system",
                hotelProviderId: supplier.Id),
            TourInstanceEntity.Create(
                tourId: Guid.NewGuid(), classificationId: Guid.NewGuid(),
                title: "Instance 2", tourName: "Tour", tourCode: "T002",
                classificationName: "Standard", instanceType: TourType.Public,
                startDate: DateTimeOffset.UtcNow.AddDays(10), endDate: DateTimeOffset.UtcNow.AddDays(12),
                maxParticipation: 20, basePrice: 1000, performedBy: "system",
                hotelProviderId: supplier.Id)
        };

        _user.Id.Returns(supplierOwnerUserId.ToString());
        _supplierRepository.FindByOwnerUserIdAsync(supplierOwnerUserId, Arg.Any<CancellationToken>()).Returns(supplier);
        _tourInstanceRepository.FindProviderAssigned(supplier.Id, 1, 10, ProviderApprovalStatus.Approved, Arg.Any<CancellationToken>())
            .Returns(instances);
        _tourInstanceRepository.CountProviderAssigned(supplier.Id, ProviderApprovalStatus.Approved, Arg.Any<CancellationToken>())
            .Returns(instances.Count);
        _mapper.Map<TourInstanceVm>(Arg.Any<TourInstanceEntity>()).Returns((TourInstanceVm)null!);

        var service = CreateServiceWithBroadcaster();
        var result = await service.GetProviderAssigned(1, 10, ProviderApprovalStatus.Approved);

        Assert.False(result.IsError);

        Assert.Equal(instances.Count, result.Value.Items.Count);

        // Both Find and Count were called with the same filter
        await _tourInstanceRepository.Received(1).FindProviderAssigned(
            supplier.Id, 1, 10, ProviderApprovalStatus.Approved, Arg.Any<CancellationToken>());
        await _tourInstanceRepository.Received(1).CountProviderAssigned(
            supplier.Id, ProviderApprovalStatus.Approved, Arg.Any<CancellationToken>());
    }
}
