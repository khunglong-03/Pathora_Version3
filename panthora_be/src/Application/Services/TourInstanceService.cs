using Contracts;
using Contracts.Interfaces;
using Application.Common.Constant;
using Application.Common.Localization;
using Application.Dtos;
using Application.Features.TourInstance.Commands;
using Application.Features.TourInstance.Queries;
using AutoMapper;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Entities.Translations;
using Domain.Enums;
using Domain.Mails;
using Domain.ValueObjects;
using Domain.UnitOfWork;
using ErrorOr;
using Microsoft.Extensions.Logging;

namespace Application.Services;

public interface ITourInstanceService
{
    Task<ErrorOr<Guid>> Create(CreateTourInstanceCommand request);
    Task<ErrorOr<Success>> Update(UpdateTourInstanceCommand request);
    Task<ErrorOr<Success>> Delete(Guid id);
    Task<ErrorOr<Success>> ChangeStatus(Guid id, TourInstanceStatus newStatus);
    Task<ErrorOr<Success>> ProviderApprove(
        Guid instanceId,
        bool isApproved,
        string? note,
        string providerType,
        IReadOnlyCollection<Guid>? accommodationActivityIds = null,
        IReadOnlyCollection<Guid>? transportationActivityIds = null,
        CancellationToken cancellationToken = default);
    Task<ErrorOr<PaginatedList<TourInstanceVm>>> GetProviderAssigned(int pageNumber, int pageSize, ProviderApprovalStatus? approvalStatus = null, CancellationToken cancellationToken = default);
    Task<ErrorOr<PaginatedList<TourInstanceVm>>> GetAll(GetAllTourInstancesQuery request);
    Task<ErrorOr<TourInstanceDto>> GetDetail(Guid id);
    Task<ErrorOr<TourInstanceStatsDto>> GetStats();
    Task<ErrorOr<PaginatedList<TourInstanceVm>>> GetPublicAvailable(string? destination, string? sortBy, int page, int pageSize, string? language = null);
    Task<ErrorOr<TourInstanceDto>> GetPublicDetail(Guid id, string? language = null);
    Task<ErrorOr<CheckDuplicateTourInstanceResultDto>> CheckDuplicate(Guid tourId, Guid classificationId, DateTimeOffset startDate);
    Task<ErrorOr<TourInstanceDayDto>> UpdateDay(UpdateTourInstanceDayCommand request);
    Task<ErrorOr<Guid>> AddCustomDay(CreateTourInstanceDayCommand request);
    Task<ErrorOr<TourDayActivityDto>> UpdateActivity(UpdateTourInstanceActivityCommand request);
    Task<ErrorOr<PaginatedList<TourInstanceVm>>> GetMyAssignedInstances(int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<ErrorOr<TourInstanceDto>> GetMyAssignedInstanceDetail(Guid id, CancellationToken cancellationToken = default);
}

public class TourInstanceService(
    ITourInstanceRepository tourInstanceRepository,
    ITourRepository tourRepository,
    ITourRequestRepository tourRequestRepository,
    ISupplierRepository supplierRepository,
    IVehicleRepository vehicleRepository,
    IMailRepository mailRepository,
    IRoomBlockRepository roomBlockRepository,
    IHotelRoomInventoryRepository hotelRoomInventoryRepository,
    IUser user,
    IMapper mapper,
    ILogger<TourInstanceService> logger,
    ITourInstanceNotificationBroadcaster? notificationBroadcaster = null,
    IVehicleBlockRepository? vehicleBlockRepository = null,
    IUnitOfWork? unitOfWork = null) : ITourInstanceService
{
    private readonly ITourInstanceRepository _tourInstanceRepository = tourInstanceRepository;
    private readonly ITourRepository _tourRepository = tourRepository;
    private readonly ITourRequestRepository _tourRequestRepository = tourRequestRepository;
    private readonly ISupplierRepository _supplierRepository = supplierRepository;
    private readonly IVehicleRepository _vehicleRepository = vehicleRepository;
    private readonly IMailRepository _mailRepository = mailRepository;
    private readonly IRoomBlockRepository _roomBlockRepository = roomBlockRepository;
    private readonly IHotelRoomInventoryRepository _hotelRoomInventoryRepository = hotelRoomInventoryRepository;
    private readonly IUser _user = user;
    private readonly IMapper _mapper = mapper;
    private readonly ILogger<TourInstanceService> _logger = logger;
    private readonly IUnitOfWork? _unitOfWork = unitOfWork;
    private readonly ITourInstanceNotificationBroadcaster? _notificationBroadcaster = notificationBroadcaster;
    private readonly IVehicleBlockRepository? _vehicleBlockRepository = vehicleBlockRepository;

    public async Task<ErrorOr<Guid>> Create(CreateTourInstanceCommand request)
    {
        var tour = await _tourRepository.FindById(request.TourId);
        if (tour is null)
            return Error.NotFound(ErrorConstants.Tour.NotFoundCode, ErrorConstants.Tour.NotFoundDescription);

        var classification = tour.Classifications.FirstOrDefault(c => c.Id == request.ClassificationId);
        if (classification is null)
            return Error.NotFound(ErrorConstants.Classification.NotFoundCode, ErrorConstants.Classification.NotFoundDescription);

        if (string.IsNullOrWhiteSpace(_user.Id))
            return Error.Unauthorized(ErrorConstants.User.UnauthorizedCode, ErrorConstants.User.UnauthorizedDescription);

        if (!Guid.TryParse(_user.Id, out var creatorUserId))
            return Error.Validation(ErrorConstants.User.InvalidIdCode, ErrorConstants.User.InvalidIdFormatDescription);

        var performedBy = _user.Id;
        // Room validation now deferred to accommodation-level supplier assignment
        var validatedRoomAssignments = new Dictionary<Guid, RoomType>();
        if (request.ActivityAssignments?.Any(a => !string.IsNullOrWhiteSpace(a.RoomType)) == true)
        {
            foreach (var assignment in request.ActivityAssignments.Where(a => !string.IsNullOrWhiteSpace(a.RoomType)))
            {
                if (!Enum.TryParse<RoomType>(assignment.RoomType, true, out var roomType))
                    return Error.Validation("RoomType.Invalid", "Invalid room type.");
                validatedRoomAssignments[assignment.OriginalActivityId] = roomType;
            }
        }

        // TC1.3: Validate vehicle assignments (Phase 1 contract)
        var validatedVehicleAssignmentsResult = await ValidateVehicleAssignmentsAsync(
            request.ActivityAssignments);
        if (validatedVehicleAssignmentsResult.IsError)
            return validatedVehicleAssignmentsResult.Errors;
        var validatedVehicleAssignments = validatedVehicleAssignmentsResult.Value;

        // Task 3.1: Validate all accommodation supplier assignments are active
        var accommodationValidationResult = await ValidateAccommodationSuppliersAsync(request.ActivityAssignments);
        if (accommodationValidationResult.IsError)
            return accommodationValidationResult.Errors;

        // Scope addendum 2026-04-23: reject if manager-requested vehicle count exceeds
        // the transport supplier's active fleet of that vehicle type.
        var fleetGuardResult = await ValidateRequestedVehicleCountAgainstFleetAsync(request.ActivityAssignments);
        if (fleetGuardResult.IsError)
            return fleetGuardResult.Errors;

        if (request.ActivityAssignments?.Any(static a =>
                a.TransportSupplierId.HasValue && !a.RequestedVehicleType.HasValue) == true)
        {
            return Error.Validation(
                "TourInstance.TransportPlanMissingVehicleType",
                "Phải chọn loại xe khi đã chọn nhà cung cấp vận chuyển.");
        }

        // Scope addendum 2026-04-23: reject if manager-requested accommodation quantity
        // exceeds the hotel supplier's configured room inventory of that room type.
        var roomGuardResult = await ValidateAccommodationQuantityAgainstInventoryAsync(request.ActivityAssignments);
        if (roomGuardResult.IsError)
            return roomGuardResult.Errors;

        // Validate TourRequestId if provided
        TourRequestEntity? tourRequest = null;
        if (request.TourRequestId.HasValue)
        {
            tourRequest = await _tourRequestRepository.GetByIdAsync(request.TourRequestId.Value);
            if (tourRequest is null)
                return Error.NotFound(ErrorConstants.TourRequest.NotFoundCode, ErrorConstants.TourRequest.NotFoundDescription);

            if (tourRequest.Status != TourRequestStatus.Approved)
                return Error.Validation(
                    ErrorConstants.TourRequest.InvalidStatusTransitionCode,
                    "Tour request must be approved before linking to a tour instance.");

            if (tourRequest.TourInstanceId.HasValue)
                return Error.Validation(
                    ErrorConstants.TourRequest.InvalidStatusTransitionCode,
                    "Tour request is already linked to a tour instance.");
        }

        var thumbnail = string.IsNullOrWhiteSpace(request.ThumbnailUrl)
            ? null
            : ImageEntity.Create(
                fileId: null!,
                originalFileName: null!,
                fileName: null!,
                publicURL: request.ThumbnailUrl);

        var entity = TourInstanceEntity.Create(
            tourId: request.TourId,
            classificationId: request.ClassificationId,
            title: request.Title,
            tourName: tour.TourName,
            tourCode: tour.TourCode,
            classificationName: classification.Name,
            instanceType: request.InstanceType,
            startDate: request.StartDate,
            endDate: request.EndDate,
            maxParticipation: request.MaxParticipation,
            basePrice: request.BasePrice,
            performedBy: performedBy,
            location: request.Location,
            thumbnail: thumbnail,
            images: request.ImageUrls?.Select(url => new ImageEntity { PublicURL = url }).ToList(),
            includedServices: request.IncludedServices,
            requiresApproval: request.ActivityAssignments?.Any(a => a.TransportSupplierId.HasValue || a.SupplierId.HasValue) == true);

        if (request.GuideUserIds?.Count > 0)
        {
            var conflictingInstances = await _tourInstanceRepository.FindConflictingInstancesForManagers(
                request.GuideUserIds, request.StartDate, request.EndDate);

            if (conflictingInstances.Count != 0)
            {
                return Error.Validation("TourInstance.GuideConflict", "Một trong những hướng dẫn viên đã có lịch vào ngày này.");
            }

            foreach (var userId in request.GuideUserIds.Distinct())
            {
                entity.Managers.Add(TourInstanceManagerEntity.Create(
                    entity.Id, userId, TourInstanceManagerRole.Guide, performedBy));
            }
        }

        entity.Managers.Add(TourInstanceManagerEntity.Create(
            entity.Id, creatorUserId, TourInstanceManagerRole.Manager, performedBy));

        // Clone InstanceDays from Classification.Plans BEFORE persisting
        // so all child entities are INSERTed in a single SaveChanges call.
        var tourDays = classification.Plans
            .Where(d => !d.IsDeleted)
            .OrderBy(d => d.DayNumber);

        foreach (var tourDay in tourDays)
        {
            var translations = ConvertTourDayTranslation(tourDay.Translations);
            var actualDate = DateOnly.FromDateTime(entity.StartDate.DateTime);

            var instanceDay = TourInstanceDayEntity.Create(
                tourInstanceId: entity.Id,
                tourDayId: tourDay.Id,
                instanceDayNumber: tourDay.DayNumber,
                actualDate: actualDate.AddDays(tourDay.DayNumber - 1),
                title: tourDay.Title,
                description: tourDay.Description,
                translations: translations,
                performedBy: performedBy);

            foreach (var templateActivity in tourDay.Activities.Where(a => !a.IsDeleted).OrderBy(a => a.Order))
            {
                var assignedData = request.ActivityAssignments?.FirstOrDefault(a => a.OriginalActivityId == templateActivity.Id);

                var instanceActivity = TourInstanceDayActivityEntity.Create(
                    tourInstanceDayId: instanceDay.Id,
                    order: templateActivity.Order,
                    activityType: templateActivity.ActivityType,
                    title: templateActivity.Title,
                    performedBy: performedBy,
                    description: templateActivity.Description,
                    note: templateActivity.Note ?? "",
                    startTime: templateActivity.StartTime,
                    endTime: templateActivity.EndTime,
                    isOptional: templateActivity.IsOptional,
                    // Transport plan fields — copy from template
                    fromLocationId: templateActivity.ActivityType == TourDayActivityType.Transportation ? templateActivity.FromLocationId : null,
                    toLocationId: templateActivity.ActivityType == TourDayActivityType.Transportation ? templateActivity.ToLocationId : null,
                    transportationType: templateActivity.ActivityType == TourDayActivityType.Transportation ? templateActivity.TransportationType : null,
                    transportationName: templateActivity.ActivityType == TourDayActivityType.Transportation ? templateActivity.TransportationName : null,
                    durationMinutes: templateActivity.ActivityType == TourDayActivityType.Transportation ? templateActivity.DurationMinutes : null,
                    distanceKm: templateActivity.ActivityType == TourDayActivityType.Transportation ? templateActivity.DistanceKm : null,
                    price: templateActivity.ActivityType == TourDayActivityType.Transportation ? templateActivity.Price : null,
                    bookingReference: templateActivity.ActivityType == TourDayActivityType.Transportation ? templateActivity.BookingReference : null
                );

                switch (templateActivity.ActivityType)
                {
                    case TourDayActivityType.Accommodation
                        when validatedRoomAssignments.TryGetValue(templateActivity.Id, out var roomType):
                        instanceActivity.Accommodation = TourInstancePlanAccommodationEntity.Create(
                            instanceActivity.Id,
                            roomType,
                            assignedData?.AccommodationQuantity ?? 1,
                            supplierId: assignedData?.SupplierId
                        );
                        break;
                    case TourDayActivityType.Transportation:
                        instanceActivity.VehicleId = assignedData?.VehicleId;
                        // Per-activity transport plan fields
                        if (assignedData?.TransportSupplierId.HasValue == true)
                        {
                            instanceActivity.AssignTransportSupplier(
                                assignedData.TransportSupplierId.Value,
                                assignedData.RequestedVehicleType!.Value,
                                assignedData.RequestedSeatCount ?? request.MaxParticipation,
                                assignedData.RequestedVehicleCount);
                        }
                        break;
                }

                instanceDay.Activities.Add(instanceActivity);
            }

            entity.InstanceDays.Add(instanceDay);
        }

        try
        {
            await _tourInstanceRepository.Create(entity);

            // Notify providers about their assignment (fire-and-forget, separate try-catch per provider)
            await NotifyProviderAssignmentAsync(entity);
            if (tourRequest is not null)
            {
                tourRequest.TourInstanceId = entity.Id;
                await _tourRequestRepository.UpdateAsync(tourRequest);
                await TryQueueTourReadyEmailAsync(tourRequest, entity, creatorUserId);
            }

            _logger.LogInformation("TourInstance {TourInstanceId} created with manager {ManagerId} bound by creator", entity.Id, creatorUserId);
            return entity.Id;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create TourInstance for TourId {TourId}, ClassificationId {ClassificationId}", request.TourId, request.ClassificationId);
            return Error.Failure("TourInstance.CreateFailed", "Failed to create tour instance");
        }
    }

    // NOTE: Room assignment validation is now deferred to accommodation-level supplier assignment
    // See AssignRoomToAccommodationCommand for per-activity room validation

    private async Task<ErrorOr<Dictionary<Guid, Guid>>> ValidateVehicleAssignmentsAsync(
        IReadOnlyCollection<CreateTourInstanceActivityAssignmentDto>? activityAssignments)
    {
        var vehicleAssignments = (activityAssignments ?? [])
            .Where(assignment => assignment.VehicleId.HasValue)
            .ToList();

        if (vehicleAssignments.Count == 0)
            return new Dictionary<Guid, Guid>();

        var validatedVehicleAssignments = new Dictionary<Guid, Guid>();

        // Group assignments by the effective supplier ID (per-activity or fallback to legacy)
        var assignmentsBySupplier = vehicleAssignments
            .GroupBy(a => a.TransportSupplierId)
            .ToList();

        foreach (var group in assignmentsBySupplier)
        {
            var supplierId = group.Key;
            if (!supplierId.HasValue)
            {
                return Error.Validation(
                    "TourInstance.TransportSupplierRequiredForVehicleAssignments",
                    "Transport supplier is required when assigning vehicles.");
            }

            var supplier = await _supplierRepository.GetByIdAsync(supplierId.Value);
            if (supplier is null || supplier.IsDeleted)
                return Error.NotFound(ErrorConstants.Supplier.NotFoundCode, ErrorConstants.Supplier.NotFoundDescription);

            if (!supplier.IsActive)
            {
                return Error.Validation(
                    "TourInstance.SupplierInactive",
                    $"Transport provider '{supplier.Name}' is inactive.");
            }

            if (supplier.OwnerUserId.HasValue)
            {
                var owner = await _tourInstanceRepository.FindUserByIdAsync(supplier.OwnerUserId.Value);
                if (owner?.Status == UserStatus.Banned)
                {
                    return Error.Validation("TourInstance.SupplierBanned", $"Tài khoản của nhà cung cấp '{supplier.Name}' đã bị khóa.");
                }
            }

            if (!supplier.OwnerUserId.HasValue)
            {
                return Error.Validation(
                    "TourInstance.SupplierMissingOwner",
                    $"Transport provider '{supplier.Name}' has no owner assigned.");
            }

            var requestedVehicleIds = group
                .Select(a => a.VehicleId!.Value)
                .Distinct()
                .ToList();

            var ownedVehicleIds = await _vehicleRepository.FindActiveIdsByOwnerAsync(
                requestedVehicleIds, supplier.OwnerUserId.Value);

            foreach (var assignment in group)
            {
                if (!ownedVehicleIds.Contains(assignment.VehicleId!.Value))
                {
                    return Error.Validation(
                        "TourInstance.VehicleNotOwnedByProvider",
                        $"Phương tiện ID '{assignment.VehicleId}' không thuộc quyền sở hữu của nhà cung cấp '{supplier.Name}' hoặc đã bị ngừng hoạt động.");
                }
                validatedVehicleAssignments[assignment.OriginalActivityId] = assignment.VehicleId!.Value;
            }
        }

        return validatedVehicleAssignments;
    }

    /// <summary>
    /// Scope addendum 2026-04-23: when manager sets <c>RequestedVehicleCount</c> on a transport
    /// activity and has already picked a supplier, reject the create if the count exceeds the
    /// supplier's assignable fleet (vehicles scoped to that supplier plus legacy owner-only rows),
    /// matching approve-time ownership rules.
    /// </summary>
    private async Task<ErrorOr<Success>> ValidateRequestedVehicleCountAgainstFleetAsync(
        IReadOnlyCollection<CreateTourInstanceActivityAssignmentDto>? activityAssignments)
    {
        var candidates = (activityAssignments ?? [])
            .Where(a => a.RequestedVehicleCount.HasValue
                && a.RequestedVehicleCount.Value > 0
                && a.TransportSupplierId.HasValue
                && a.RequestedVehicleType.HasValue)
            .ToList();

        if (candidates.Count == 0)
            return Result.Success;

        foreach (var assignment in candidates)
        {
            var supplier = await _supplierRepository.GetByIdAsync(assignment.TransportSupplierId!.Value);
            if (supplier is null || !supplier.OwnerUserId.HasValue)
                continue; // upstream supplier validator already handles missing supplier

            var fleetSize = await _vehicleRepository.CountActiveByTransportSupplierFleetAsync(
                assignment.TransportSupplierId!.Value,
                supplier.OwnerUserId,
                assignment.RequestedVehicleType!.Value);

            if (assignment.RequestedVehicleCount!.Value > fleetSize)
            {
                return Error.Validation(
                    TourInstanceTransportErrors.VehicleCountExceedsFleetCode,
                    TourInstanceTransportErrors.VehicleCountExceedsFleetDescription);
            }
        }

        return Result.Success;
    }

    /// <summary>
    /// Scope addendum 2026-04-23: when manager sets <c>AccommodationQuantity</c> + supplier +
    /// room type, reject create if the requested quantity exceeds the supplier's configured
    /// inventory total for that room type.
    /// </summary>
    private async Task<ErrorOr<Success>> ValidateAccommodationQuantityAgainstInventoryAsync(
        IReadOnlyCollection<CreateTourInstanceActivityAssignmentDto>? activityAssignments)
    {
        var candidates = (activityAssignments ?? [])
            .Where(a => a.AccommodationQuantity.HasValue
                && a.AccommodationQuantity.Value > 0
                && a.SupplierId.HasValue
                && !string.IsNullOrWhiteSpace(a.RoomType))
            .ToList();

        if (candidates.Count == 0)
            return Result.Success;

        foreach (var assignment in candidates)
        {
            if (!Enum.TryParse<RoomType>(assignment.RoomType, true, out var roomType))
                continue; // invalid room type already flagged earlier

            var inventory = await _hotelRoomInventoryRepository
                .FindByHotelAndRoomTypeAsync(assignment.SupplierId!.Value, roomType);

            var inventoryTotal = inventory?.TotalRooms ?? 0;
            if (assignment.AccommodationQuantity!.Value > inventoryTotal)
            {
                return Error.Validation(
                    TourInstanceTransportErrors.RoomCountExceedsInventoryCode,
                    TourInstanceTransportErrors.RoomCountExceedsInventoryDescription);
            }
        }

        return Result.Success;
    }

    private async Task<ErrorOr<Success>> ValidateAccommodationSuppliersAsync(
        IReadOnlyCollection<CreateTourInstanceActivityAssignmentDto>? activityAssignments)
    {
        var supplierIds = (activityAssignments ?? [])
            .Where(a => a.SupplierId.HasValue)
            .Select(a => a.SupplierId!.Value)
            .Distinct()
            .ToList();

        if (supplierIds.Count == 0)
            return Result.Success;

        foreach (var supplierId in supplierIds)
        {
            var supplier = await _supplierRepository.GetByIdAsync(supplierId);
            if (supplier == null || supplier.IsDeleted)
                return Error.NotFound(ErrorConstants.Supplier.NotFoundCode, $"Accommodation supplier ID '{supplierId}' not found.");

            if (!supplier.IsActive)
                return Error.Validation("TourInstance.SupplierInactive", $"Nhà cung cấp lưu trú '{supplier.Name}' đang ngừng hoạt động.");

            if (supplier.OwnerUserId.HasValue)
            {
                var owner = await _tourInstanceRepository.FindUserByIdAsync(supplier.OwnerUserId.Value);
                if (owner?.Status == UserStatus.Banned)
                    return Error.Validation("TourInstance.SupplierBanned", $"Tài khoản của nhà cung cấp lưu trú '{supplier.Name}' đã bị khóa.");
            }
        }

        return Result.Success;
    }

    private async Task TryQueueTourReadyEmailAsync(
        TourRequestEntity requestEntity,
        TourInstanceEntity instance,
        Guid performedBy)
    {
        var recipientEmail = !string.IsNullOrWhiteSpace(requestEntity.CustomerEmail)
            ? requestEntity.CustomerEmail
            : null;

        if (string.IsNullOrWhiteSpace(recipientEmail))
        {
            _logger.LogWarning(
                "Skipping tour ready email for request {RequestId} because recipient email is missing.",
                requestEntity.Id);
            return;
        }

        try
        {
            var includedServices = instance.IncludedServices?.Count > 0
                ? string.Join(", ", instance.IncludedServices)
                : "Not specified";

            var mail = new TourRequestTourReadyApprovedMail(
                CustomerName: requestEntity.CustomerName,
                TourTitle: instance.Title,
                ClassificationName: instance.ClassificationName,
                StartDate: instance.StartDate.ToString("yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture),
                EndDate: instance.EndDate.ToString("yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture),
                BasePrice: instance.BasePrice.ToString("N0"),
                IncludedServices: includedServices,
                TourInstanceDetailLink: $"/tours/instances/{instance.Id}",
                AdminNote: string.IsNullOrWhiteSpace(requestEntity.AdminNote)
                    ? "No additional note provided."
                    : requestEntity.AdminNote.Trim());

            var entity = mail.ToMail(recipientEmail);
            entity.Subject = "Your Tour Request Has Been Approved!";

            var addResult = await _mailRepository.Add(entity);
            if (addResult.IsError)
            {
                _logger.LogWarning(
                    "Failed to queue tour ready email for request {RequestId}: {ErrorDescription}",
                    requestEntity.Id,
                    addResult.FirstError.Description);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Failed to queue tour ready email for request {RequestId}",
                requestEntity.Id);
        }
    }

    private async Task NotifyProviderAssignmentAsync(TourInstanceEntity entity)
    {
        if (_notificationBroadcaster is null) return;

        // Notify TransportProviders (per-activity, collect distinct suppliers)
        var transportSupplierIds = entity.InstanceDays
            .Where(day => !day.IsDeleted)
            .SelectMany(day => day.Activities)
            .Where(act => act.TransportSupplierId.HasValue)
            .Select(act => act.TransportSupplierId!.Value)
            .Distinct()
            .ToList();

        foreach (var transportSupplierId in transportSupplierIds)
        {
            try
            {
                var transportSupplier = await _supplierRepository.GetByIdAsync(transportSupplierId);
                if (transportSupplier?.OwnerUserId is null)
                {
                    _logger.LogWarning(
                        "Cannot notify TransportProvider for TourInstance {TourInstanceId}: OwnerUserId is null on Supplier {SupplierId}",
                        entity.Id, transportSupplierId);
                }
                else
                {
                    await _notificationBroadcaster.NotifyProviderAssignmentAsync(
                        entity.Id, entity.Title, entity.TourName,
                        entity.StartDate, entity.EndDate, "Transport",
                        transportSupplier.OwnerUserId.Value);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Failed to send assignment notification to TransportProvider {SupplierId} for TourInstance {TourInstanceId}",
                    transportSupplierId, entity.Id);
            }
        }

        var hotelOwnerGroups = entity.InstanceDays
            .Where(day => !day.IsDeleted)
            .SelectMany(day => day.Activities)
            .Where(activity => activity.ActivityType == TourDayActivityType.Accommodation)
            .Select(activity => activity.Accommodation?.SupplierId)
            .Where(supplierId => supplierId.HasValue)
            .Select(supplierId => supplierId!.Value)
            .Distinct()
            .ToList();

        if (hotelOwnerGroups.Count == 0)
            return;

        try
        {
            var suppliers = await _supplierRepository.GetAllAsync(CancellationToken.None);
            var assignedHotelOwners = suppliers
                .Where(s => hotelOwnerGroups.Contains(s.Id) && s.OwnerUserId.HasValue)
                .GroupBy(s => s.OwnerUserId!.Value)
                .Select(group => group.Key)
                .ToList();

            foreach (var ownerUserId in assignedHotelOwners)
            {
                await _notificationBroadcaster.NotifyProviderAssignmentAsync(
                    entity.Id,
                    entity.Title,
                    entity.TourName,
                    entity.StartDate,
                    entity.EndDate,
                    "Hotel",
                    ownerUserId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Failed to send grouped hotel assignment notifications for TourInstance {TourInstanceId}",
                entity.Id);
        }
    }

    private async Task NotifyProviderApprovalResultAsync(TourInstanceEntity instance, string providerName, bool isApproved, string? reason)
    {
        if (_notificationBroadcaster is null) return;

        try
        {
            if (!Guid.TryParse(instance.CreatedBy, out _))
            {
                _logger.LogWarning(
                    "Cannot notify manager for TourInstance {TourInstanceId}: CreatedBy '{CreatedBy}' is not a valid Guid",
                    instance.Id, instance.CreatedBy);
                return;
            }

            await _notificationBroadcaster.NotifyProviderApprovalResultAsync(
                instance.Id, providerName, isApproved, reason, instance.CreatedBy);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Failed to send approval result notification for TourInstance {TourInstanceId}",
                instance.Id);
        }
    }

    private static string BuildHotelApprovalNotificationLabel(
        IReadOnlyCollection<SupplierEntity> ownerSuppliers,
        IEnumerable<Guid> approvedSupplierIds)
    {
        var supplierNames = ownerSuppliers
            .Where(supplier => approvedSupplierIds.Contains(supplier.Id))
            .Select(supplier => supplier.Name)
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(name => name, StringComparer.OrdinalIgnoreCase)
            .ToList();

        return supplierNames.Count switch
        {
            0 => "Hotel provider",
            1 => supplierNames[0],
            _ => $"Hotel properties: {string.Join(", ", supplierNames)}"
        };
    }

    public async Task<ErrorOr<Success>> Update(UpdateTourInstanceCommand request)
    {
        var entity = await _tourInstanceRepository.FindById(request.Id);
        if (entity is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        // ER-7: if MaxParticipation is increasing, ensure every vehicle already Approved for
        // a transportation activity still covers the new size. Only load the full graph when
        // a raise is actually requested.
        if (request.MaxParticipation > entity.MaxParticipation)
        {
            var fullEntity = await _tourInstanceRepository.FindByIdWithInstanceDays(request.Id);
            if (fullEntity is not null)
            {
                var vehicleIds = new HashSet<Guid>();
                foreach (var a in fullEntity.InstanceDays
                    .Where(d => !d.IsDeleted)
                    .SelectMany(d => d.Activities)
                    .Where(x => x.ActivityType == TourDayActivityType.Transportation
                                && x.TransportationApprovalStatus == ProviderApprovalStatus.Approved))
                {
                    if (a.TransportAssignments.Count > 0)
                    {
                        foreach (var t in a.TransportAssignments)
                            vehicleIds.Add(t.VehicleId);
                    }
                    else if (a.VehicleId.HasValue)
                    {
                        vehicleIds.Add(a.VehicleId.Value);
                    }
                }

                var capacityMap = new Dictionary<Guid, int>(vehicleIds.Count);
                foreach (var vid in vehicleIds)
                {
                    var vehicle = await _vehicleRepository.GetByIdAsync(vid);
                    capacityMap[vid] = vehicle?.SeatCapacity ?? 0;
                }

                try
                {
                    fullEntity.EnsureCapacityCoversAllApprovedTransports(
                        request.MaxParticipation,
                        id => capacityMap.TryGetValue(id, out var c) ? c : 0);
                }
                catch (InvalidOperationException ex)
                {
                    return Error.Validation("TourInstance.CapacityExceeded", ex.Message);
                }
            }
        }

        var performedBy = _user.Id ?? string.Empty;

        // Update Managers
        entity.Managers.Clear();
        if (request.GuideUserIds?.Count > 0)
        {
            var conflictingInstances = await _tourInstanceRepository.FindConflictingInstancesForManagers(
                request.GuideUserIds, request.StartDate, request.EndDate, request.Id);

            if (conflictingInstances.Count != 0)
            {
                return Error.Validation("TourInstance.GuideConflict", "Một trong những hướng dẫn viên đã có lịch vào ngày này.");
            }

            foreach (var userId in request.GuideUserIds)
            {
                entity.Managers.Add(TourInstanceManagerEntity.Create(
                    entity.Id, userId, TourInstanceManagerRole.Guide, performedBy));
            }
        }
        if (request.ManagerUserIds?.Count > 0)
        {
            foreach (var userId in request.ManagerUserIds)
            {
                entity.Managers.Add(TourInstanceManagerEntity.Create(
                    entity.Id, userId, TourInstanceManagerRole.Manager, performedBy));
            }
        }

        entity.Update(
            title: request.Title,
            startDate: request.StartDate,
            endDate: request.EndDate,
            maxParticipation: request.MaxParticipation,
            basePrice: request.BasePrice,
            performedBy: performedBy,
            location: request.Location,
            thumbnail: request.Thumbnail,
            images: request.Images,
            confirmationDeadline: request.ConfirmationDeadline,
            includedServices: request.IncludedServices);

        await _tourInstanceRepository.Update(entity);

        return Result.Success;
    }

    public async Task<ErrorOr<Success>> Delete(Guid id)
    {
        var entity = await _tourInstanceRepository.FindById(id);
        if (entity is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        // ER-3: clean up room/vehicle blocks tied to this tour instance before soft-delete,
        // so inventory is freed back to the supplier.
        await _roomBlockRepository.DeleteByTourInstanceAsync(id);
        if (_vehicleBlockRepository is not null)
            await _vehicleBlockRepository.DeleteByTourInstanceAsync(id);

        await _tourInstanceRepository.SoftDelete(id);
        return Result.Success;
    }

    public async Task<ErrorOr<Success>> ChangeStatus(Guid id, TourInstanceStatus newStatus)
    {
        var entity = await _tourInstanceRepository.FindById(id);
        if (entity is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        var performedBy = _user.Id ?? string.Empty;
        entity.ChangeStatus(newStatus, performedBy);
        await _tourInstanceRepository.Update(entity);

        // ER-3: whenever the tour transitions into Cancelled, free all inventory holds.
        if (newStatus == TourInstanceStatus.Cancelled)
        {
            await _roomBlockRepository.DeleteByTourInstanceAsync(id);
            if (_vehicleBlockRepository is not null)
                await _vehicleBlockRepository.DeleteByTourInstanceAsync(id);
        }

        return Result.Success;
    }

    public async Task<ErrorOr<Success>> ProviderApprove(
        Guid instanceId,
        bool isApproved,
        string? note,
        string providerType,
        IReadOnlyCollection<Guid>? accommodationActivityIds = null,
        IReadOnlyCollection<Guid>? transportationActivityIds = null,
        CancellationToken cancellationToken = default)
    {
        if (!Guid.TryParse(_user.Id, out var currentUserId))
            return Error.Unauthorized(ErrorConstants.User.UnauthorizedCode, ErrorConstants.User.UnauthorizedDescription);

        // For hotel providers, one owner may have multiple supplier records.
        // For transport, the single-supplier lookup is still correct.
        List<SupplierEntity> ownerSuppliers;
        SupplierEntity supplier;

        if (providerType == "Hotel")
        {
            ownerSuppliers = await _supplierRepository.FindAllByOwnerUserIdAsync(currentUserId, cancellationToken);
            if (ownerSuppliers.Count == 0)
                return Error.NotFound(ErrorConstants.Supplier.NotFoundCode, "Current user is not associated with any supplier.");
            // Use the first supplier as the "primary" for notification naming
            supplier = ownerSuppliers[0];
        }
        else
        {
            var suppliers = await _supplierRepository.FindAllByOwnerUserIdAsync(currentUserId, cancellationToken);
            if (suppliers.Count == 0)
                return Error.NotFound(ErrorConstants.Supplier.NotFoundCode, "Current user is not associated with any supplier.");
            supplier = suppliers[0];
            ownerSuppliers = suppliers;
        }

        var instance = await _tourInstanceRepository.FindById(instanceId, cancellationToken: cancellationToken);
        if (instance is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        var ownerSupplierIds = ownerSuppliers.Select(s => s.Id).ToHashSet();

        bool hasAccess = providerType switch
        {
            "Transport" => instance.InstanceDays
                .SelectMany(d => d.Activities)
                .Any(a => a.TransportSupplierId.HasValue && ownerSupplierIds.Contains(a.TransportSupplierId.Value)),
            "Hotel" => instance.InstanceDays
                .SelectMany(d => d.Activities)
                .Any(a => a.Accommodation?.SupplierId != null && ownerSupplierIds.Contains(a.Accommodation.SupplierId.Value)),
            _ => false
        };

        if (!hasAccess)
            return Error.Validation("TourInstance.ProviderNotAssigned", $"You are not assigned as the {providerType} provider for this tour instance.");


        if (providerType == "Hotel" && isApproved)
        {
            var fullInstance = await _tourInstanceRepository.FindByIdWithInstanceDays(instanceId, cancellationToken);
            if (fullInstance != null)
            {
                var requestedActivityIds = accommodationActivityIds?.Count > 0
                    ? accommodationActivityIds.ToHashSet()
                    : null;

                var accommodationActivities = fullInstance.InstanceDays
                    .Where(d => !d.IsDeleted)
                    .SelectMany(d => d.Activities)
                    .Where(a =>
                        a.ActivityType == TourDayActivityType.Accommodation
                        && a.Accommodation?.SupplierId != null
                        && ownerSupplierIds.Contains(a.Accommodation.SupplierId.Value)
                        && (requestedActivityIds is null || requestedActivityIds.Contains(a.Id)))
                    .ToList();

                var activityIds = accommodationActivities.Select(a => a.Id).ToList();
                var allBlocks = await _roomBlockRepository.GetByTourInstanceDayActivityIdsAsync(activityIds, cancellationToken);
                var blocksByActivity = allBlocks.GroupBy(b => b.TourInstanceDayActivityId)
                    .ToDictionary(g => g.Key!.Value, g => g.ToList());

                var underAllocated = new List<string>();
                foreach (var activity in accommodationActivities)
                {
                    var planAccom = activity.Accommodation;
                    if (planAccom == null || planAccom.Quantity <= 0) continue;

                    blocksByActivity.TryGetValue(activity.Id, out var blocks);
                    var totalBlocked = blocks?.Sum(b => b.RoomCountBlocked) ?? 0;

                    if (totalBlocked < planAccom.Quantity)
                        underAllocated.Add($"Ngày {activity.TourInstanceDay.InstanceDayNumber}: cần {planAccom.Quantity} phòng, đã gán {totalBlocked}");
                }

                if (underAllocated.Count > 0)
                    return Error.Validation("TourInstance.RoomsNotAllocated", $"Chưa đủ phòng: {string.Join("; ", underAllocated)}");
            }
        }

        var statusBeforeApprove = instance.Status;
        string notificationProviderName = supplier.Name;

        // ER-1/ER-8: prefer a RepeatableRead transaction; fall back to plain execution for
        // tests/test-harness where IUnitOfWork is not provided.
        async Task RunTransactional(Func<Task> work)
        {
            if (_unitOfWork is not null)
                await _unitOfWork.ExecuteTransactionAsync(System.Data.IsolationLevel.RepeatableRead, work);
            else
                await work();
        }

        try
        {
            if (providerType == "Transport")
            {
                await RunTransactional(async () =>
                {
                    var fullInstance = await _tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(instanceId, cancellationToken);
                    if (fullInstance is null) return;

                    var requestedTransportActivityIds = transportationActivityIds?.ToHashSet();
                    var transportActivities = fullInstance.InstanceDays
                        .Where(d => !d.IsDeleted)
                        .SelectMany(d => d.Activities)
                        .Where(a => a.ActivityType == TourDayActivityType.Transportation
                                 && a.TransportSupplierId.HasValue
                                 && ownerSupplierIds.Contains(a.TransportSupplierId.Value)
                                 && (requestedTransportActivityIds is null || requestedTransportActivityIds.Contains(a.Id)))
                        .ToList();

                    for (int i = 0; i < transportActivities.Count; i++)
                    {
                        var act = transportActivities[i];
                        if (isApproved)
                        {
                            if (!act.HasCompleteVehicleAndDriverAssignment())
                            {
                                throw new BulkApproveValidationException(
                                    "TourInstance.BulkApproveFailed",
                                    $"Activity '{act.Title}' (#{i}) chưa được gán xe/tài xế. Hãy gán trước khi duyệt.");
                            }

                            if (act.TransportAssignments.Count > 0)
                            {
                                var first = act.TransportAssignments.OrderBy(x => x.Id).First();
                                act.ApproveTransportation(first.VehicleId, first.DriverId, note);
                            }
                            else
                            {
                                act.ApproveTransportation(act.VehicleId!.Value, act.DriverId, note);
                            }
                        }
                        else
                        {
                            act.RejectTransportation(note);
                        }
                    }
                    fullInstance.CheckAndActivateTourInstance();
                    instance = fullInstance;
                });
            }
            else if (providerType == "Hotel")
            {
                // ER-1: accommodation approve path wrapped in RepeatableRead transaction so that
                // RoomBlock INSERT/DELETE and activity status flips commit atomically.
                await RunTransactional(async () =>
                {
                    var fullInst = await _tourInstanceRepository.FindByIdWithInstanceDays(instanceId, cancellationToken);
                    if (fullInst is null) return;

                    var requestedActivityIds = accommodationActivityIds?.Count > 0
                        ? accommodationActivityIds.ToHashSet()
                        : null;
                    var approvedSupplierIds = fullInst.InstanceDays
                        .Where(day => !day.IsDeleted)
                        .SelectMany(day => day.Activities)
                        .Where(act =>
                            act.Accommodation?.SupplierId != null
                            && ownerSupplierIds.Contains(act.Accommodation.SupplierId.Value)
                            && (requestedActivityIds is null || requestedActivityIds.Contains(act.Id)))
                        .Select(act => act.Accommodation!.SupplierId!.Value)
                        .Distinct()
                        .ToList();

                    foreach (var day in fullInst.InstanceDays)
                    {
                        foreach (var act in day.Activities)
                        {
                            if (act.Accommodation?.SupplierId != null
                                && ownerSupplierIds.Contains(act.Accommodation.SupplierId.Value)
                                && (requestedActivityIds is null || requestedActivityIds.Contains(act.Id)))
                            {
                                // ER-4.3: idempotent — if already at target status, skip
                                var alreadyAtTarget = isApproved
                                    ? act.Accommodation.SupplierApprovalStatus == ProviderApprovalStatus.Approved
                                    : act.Accommodation.SupplierApprovalStatus == ProviderApprovalStatus.Rejected;
                                if (alreadyAtTarget) continue;

                                act.Accommodation.ApproveBySupplier(isApproved, note);

                                if (isApproved)
                                {
                                    // Tour-level holds are always Hard. Soft holds reserved for unpaid customer bookings.
                                    var block = RoomBlockEntity.Create(
                                        supplierId: act.Accommodation.SupplierId.Value,
                                        roomType: act.Accommodation.RoomType ?? Domain.Enums.RoomType.Standard,
                                        blockedDate: act.TourInstanceDay.ActualDate,
                                        roomCountBlocked: act.Accommodation.Quantity,
                                        performedBy: currentUserId.ToString(),
                                        tourInstanceDayActivityId: act.Id,
                                        holdStatus: HoldStatus.Hard
                                    );
                                    await _roomBlockRepository.AddAsync(block, cancellationToken);
                                }
                                else
                                {
                                    await _roomBlockRepository.DeleteByTourInstanceDayActivityIdAsync(act.Id, cancellationToken);
                                }
                            }
                        }
                    }
                    fullInst.CheckAndActivateTourInstance();
                    instance = fullInst;
                    notificationProviderName = BuildHotelApprovalNotificationLabel(ownerSuppliers, approvedSupplierIds);
                });
            }
        }
        catch (BulkApproveValidationException bex)
        {
            // ER-8: middle-of-loop failure rolled back entire transaction.
            return Error.Validation(bex.Code, bex.Message);
        }

        await _tourInstanceRepository.Update(instance, cancellationToken);

        // Notify manager and admins about the approval result (fire-and-forget)
        await NotifyProviderApprovalResultAsync(instance, notificationProviderName, isApproved, note);

        // If both providers approved and instance became Available, notify admins
        if (statusBeforeApprove == TourInstanceStatus.PendingApproval && instance.Status == TourInstanceStatus.Available)
        {
            try
            {
                if (_notificationBroadcaster is not null)
                    await _notificationBroadcaster.NotifyTourInstanceStatusChangeAsync(instance.Id, instance.Status, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Failed to send status change notification for TourInstance {TourInstanceId}",
                    instance.Id);
            }
        }

        return Result.Success;
    }

    public async Task<ErrorOr<PaginatedList<TourInstanceVm>>> GetProviderAssigned(int pageNumber, int pageSize, ProviderApprovalStatus? approvalStatus = null, CancellationToken cancellationToken = default)
    {
        if (!Guid.TryParse(_user.Id, out var currentUserId))
            return Error.Unauthorized(ErrorConstants.User.UnauthorizedCode, ErrorConstants.User.UnauthorizedDescription);

        // Support multi-supplier owners: get all supplier records for this user
        var suppliers = await _supplierRepository.FindAllByOwnerUserIdAsync(currentUserId, cancellationToken);
        if (suppliers.Count == 0)
        {
            _logger.LogInformation("User {UserId} is not associated with any supplier. Returning empty list.", currentUserId);
            return new PaginatedList<TourInstanceVm>(0, [], pageNumber, pageSize);
        }

        // Use the first supplier ID for the repository query (which internally handles
        // hotel access via accommodation-level joins across all owner suppliers)
        var primarySupplierId = suppliers[0].Id;

        var entities = await _tourInstanceRepository.FindProviderAssigned(primarySupplierId, pageNumber, pageSize, approvalStatus, cancellationToken);
        var total = await _tourInstanceRepository.CountProviderAssigned(primarySupplierId, approvalStatus, cancellationToken);

        var vms = entities.Select(e => _mapper.Map<TourInstanceVm>(e)).ToList();
        return new PaginatedList<TourInstanceVm>(total, vms, pageNumber, pageSize);
    }

    public async Task<ErrorOr<PaginatedList<TourInstanceVm>>> GetMyAssignedInstances(int pageNumber, int pageSize, CancellationToken cancellationToken = default)
    {
        if (!Guid.TryParse(_user.Id, out var currentUserId))
            return Error.Unauthorized(ErrorConstants.User.UnauthorizedCode, ErrorConstants.User.UnauthorizedDescription);

        var total = await _tourInstanceRepository.CountByGuideUserId(currentUserId, cancellationToken);
        var entities = await _tourInstanceRepository.FindByGuideUserId(currentUserId, pageNumber, pageSize, cancellationToken);

        var vms = entities.Select(e => _mapper.Map<TourInstanceVm>(e)).ToList();
        return new PaginatedList<TourInstanceVm>(total, vms, pageNumber, pageSize);
    }

    public async Task<ErrorOr<TourInstanceDto>> GetMyAssignedInstanceDetail(Guid id, CancellationToken cancellationToken = default)
    {
        if (!Guid.TryParse(_user.Id, out var currentUserId))
            return Error.Unauthorized(ErrorConstants.User.UnauthorizedCode, ErrorConstants.User.UnauthorizedDescription);

        var entity = await _tourInstanceRepository.FindByIdWithInstanceDays(id, cancellationToken);
        if (entity is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        // Check if the current user owns a supplier that is the Transport or Hotel provider for this instance
        var suppliers = await _supplierRepository.FindAllByOwnerUserIdAsync(currentUserId, cancellationToken);
        if (suppliers.Count == 0)
            return Error.NotFound(ErrorConstants.Supplier.NotFoundCode, ErrorConstants.Supplier.NotFoundDescription);

        var supplierIds = suppliers.Select(s => s.Id).ToHashSet();
        // Check access: user owns a supplier that is transport or hotel provider for any activity
        var hasAccess = entity.InstanceDays
                .SelectMany(d => d.Activities)
                .Any(a => (a.TransportSupplierId.HasValue && supplierIds.Contains(a.TransportSupplierId.Value))
                        || (a.Accommodation?.SupplierId != null && supplierIds.Contains(a.Accommodation.SupplierId.Value)));
        if (!hasAccess)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        return _mapper.Map<TourInstanceDto>(entity);
    }

    public async Task<ErrorOr<PaginatedList<TourInstanceVm>>> GetAll(GetAllTourInstancesQuery request)
    {
        var entities = await _tourInstanceRepository.FindAll(request.SearchText, request.Status, request.PageNumber, request.PageSize, request.ExcludePast);
        var total = await _tourInstanceRepository.CountAll(request.SearchText, request.Status, request.ExcludePast);

        var vms = entities.Select(e => _mapper.Map<TourInstanceVm>(e)).ToList();
        return new PaginatedList<TourInstanceVm>(total, vms, request.PageNumber, request.PageSize);
    }

    public async Task<ErrorOr<TourInstanceDto>> GetDetail(Guid id)
    {
        var entity = await _tourInstanceRepository.FindByIdWithInstanceDays(id);
        if (entity is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        return _mapper.Map<TourInstanceDto>(entity);
    }

    public async Task<ErrorOr<TourInstanceStatsDto>> GetStats()
    {
        var (total, available, confirmed, soldOut, completed) = await _tourInstanceRepository.GetStats();
        return new TourInstanceStatsDto(total, available, confirmed, soldOut, completed);
    }

    public async Task<ErrorOr<PaginatedList<TourInstanceVm>>> GetPublicAvailable(string? destination, string? sortBy, int page, int pageSize, string? language = null)
    {
        var entities = await _tourInstanceRepository.FindPublicAvailable(destination, sortBy, page, pageSize);
        var total = await _tourInstanceRepository.CountPublicAvailable(destination);
        var resolvedLanguage = PublicLanguageResolver.Resolve(language);

        foreach (var entity in entities)
        {
            entity.ApplyResolvedTranslation(resolvedLanguage);
        }

        var vms = entities.Select(e => _mapper.Map<TourInstanceVm>(e)).ToList();
        return new PaginatedList<TourInstanceVm>(total, vms, page, pageSize);
    }

    public async Task<ErrorOr<TourInstanceDto>> GetPublicDetail(Guid id, string? language = null)
    {
        var entity = await _tourInstanceRepository.FindPublicById(id);
        if (entity is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.PublicNotFoundDescription);

        entity.ApplyResolvedTranslation(PublicLanguageResolver.Resolve(language));
        return _mapper.Map<TourInstanceDto>(entity);
    }

    private static Dictionary<string, TourInstanceDayTranslationData> ConvertTourDayTranslation(
        Dictionary<string, TourDayTranslationData> source)
    {
        var result = new Dictionary<string, TourInstanceDayTranslationData>();
        foreach (var (key, value) in source)
        {
            result[key] = new TourInstanceDayTranslationData
            {
                Title = value.Title,
                Description = value.Description
            };
        }
        return result;
    }

    public async Task<ErrorOr<CheckDuplicateTourInstanceResultDto>> CheckDuplicate(Guid tourId, Guid classificationId, DateTimeOffset startDate)
    {
        var instances = await _tourInstanceRepository.FindDuplicate(tourId, classificationId, startDate);
        var summaries = instances.Select(e => new DuplicateInstanceSummaryDto(
            e.Id,
            e.Title,
            e.StartDate,
            e.Status.ToString()
        )).ToList();

        return new CheckDuplicateTourInstanceResultDto(
            Exists: summaries.Count > 0,
            Count: summaries.Count,
            ExistingInstances: summaries
        );
    }

    public async Task<ErrorOr<TourInstanceDayDto>> UpdateDay(UpdateTourInstanceDayCommand request)
    {
        var instance = await _tourInstanceRepository.FindByIdWithInstanceDays(request.InstanceId);
        if (instance is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        var instanceDay = instance.InstanceDays.FirstOrDefault(d => d.Id == request.DayId);
        if (instanceDay is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, "Tour instance day not found.");

        // Validate actualDate within instance date range
        var actualDateOffset = new DateTimeOffset(request.ActualDate.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
        if (actualDateOffset.Date < instance.StartDate.Date || actualDateOffset.Date > instance.EndDate.Date)
            return Error.Validation("TourInstanceDay.DateOutOfRange", "Ngày thực tế phải nằm trong khoảng ngày bắt đầu và kết thúc của tour instance.");

        var performedBy = _user.Id ?? string.Empty;

        instanceDay.Update(
            title: request.Title,
            actualDate: request.ActualDate,
            description: request.Description,
            startTime: request.StartTime,
            endTime: request.EndTime,
            note: request.Note,
            performedBy: performedBy);

        await _tourInstanceRepository.UpdateInstanceDay(instanceDay);

        return _mapper.Map<TourInstanceDayDto>(instanceDay);
    }

    public async Task<ErrorOr<Guid>> AddCustomDay(CreateTourInstanceDayCommand request)
    {
        var instance = await _tourInstanceRepository.FindByIdWithInstanceDays(request.InstanceId);
        if (instance is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        if (instance.Status != TourInstanceStatus.Available)
            return Error.Validation("TourInstance.InvalidStatus", "Custom days can only be added when instance status is Available.");

        // Validate actualDate within instance date range
        var actualDateOffset = new DateTimeOffset(request.ActualDate.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
        if (actualDateOffset.Date < instance.StartDate.Date || actualDateOffset.Date > instance.EndDate.Date)
            return Error.Validation("TourInstanceDay.DateOutOfRange", "Ngày thực tế phải nằm trong khoảng ngày bắt đầu và kết thúc của tour instance.");

        // Check duplicate date
        if (instance.InstanceDays.Any(d => d.ActualDate == request.ActualDate))
            return Error.Validation("TourInstanceDay.DuplicateDate", "Đã tồn tại một ngày với ngày thực tế này trong lịch trình.");

        var maxDayNumber = instance.InstanceDays.Any()
            ? instance.InstanceDays.Max(d => d.InstanceDayNumber)
            : 0;

        var performedBy = _user.Id ?? string.Empty;

        var customDay = TourInstanceDayEntity.Create(
            request.InstanceId,
            Guid.Empty,
            maxDayNumber + 1,
            request.ActualDate,
            request.Title,
            performedBy,
            request.Description);

        await _tourInstanceRepository.AddDay(customDay);

        // Recalculate DurationDays
        instance.DurationDays = instance.InstanceDays.Count + 1; // +1 for the newly added day not yet in the collection
        await _tourInstanceRepository.Update(instance);

        _logger.LogInformation("Custom day added to TourInstance {InstanceId} with InstanceDayNumber {DayNumber}",
            request.InstanceId, customDay.InstanceDayNumber);

        return customDay.Id;
    }

    public async Task<ErrorOr<TourDayActivityDto>> UpdateActivity(UpdateTourInstanceActivityCommand request)
    {
        var instanceDay = await _tourInstanceRepository.FindInstanceDayById(request.InstanceId, request.DayId);
        if (instanceDay is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, "Tour instance day not found.");

        var activity = instanceDay.TourDay.Activities.FirstOrDefault(a => a.Id == request.ActivityId);
        if (activity is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, "Activity not found.");

        var performedBy = _user.Id ?? string.Empty;

        // Partial update: only apply non-null fields
        if (request.Note is not null)
            activity.Note = request.Note;
        if (request.StartTime.HasValue)
            activity.StartTime = request.StartTime;
        if (request.EndTime.HasValue)
            activity.EndTime = request.EndTime;
        if (request.IsOptional.HasValue)
            activity.IsOptional = request.IsOptional.Value;

        activity.LastModifiedBy = performedBy;
        activity.LastModifiedOnUtc = DateTimeOffset.UtcNow;

        await _tourInstanceRepository.UpdateTourDayActivity(activity);

        return _mapper.Map<TourDayActivityDto>(activity);
    }
}

/// <summary>
/// Sentinel thrown inside the bulk-approve transaction to roll back every pending
/// activity change and surface a structured validation error (ER-8).
/// </summary>
internal sealed class BulkApproveValidationException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}
