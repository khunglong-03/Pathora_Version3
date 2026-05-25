using Contracts;
using Contracts.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Application.Common.Interfaces;
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
    Task<ErrorOr<Success>> Delete(Guid id, CancellationToken cancellationToken = default);
    Task<ErrorOr<Success>> ChangeStatus(Guid id, TourInstanceStatus newStatus, CancellationToken cancellationToken = default);
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
    Task<ErrorOr<TourInstanceStatsDto>> GetStats(TourType? instanceType = null);
    Task<ErrorOr<PaginatedList<TourInstanceVm>>> GetPublicAvailable(string? destination, string? sortBy, int page, int pageSize, string? language = null, string? catalogInstanceType = null);
    Task<ErrorOr<TourInstanceDto>> GetPublicDetail(Guid id, string? language = null);
    Task<ErrorOr<CheckDuplicateTourInstanceResultDto>> CheckDuplicate(Guid tourId, Guid classificationId, DateTimeOffset startDate);
    Task<ErrorOr<TourInstanceDayDto>> UpdateDay(UpdateTourInstanceDayCommand request);
    Task<ErrorOr<Guid>> AddCustomDay(CreateTourInstanceDayCommand request);
    Task<ErrorOr<TourInstanceDayActivityDto>> UpdateActivity(UpdateTourInstanceActivityCommand request);
    Task<ErrorOr<TourInstanceDayActivityDto>> CreateActivity(CreateTourInstanceActivityCommand request);
    Task<ErrorOr<Success>> DeleteActivity(DeleteTourInstanceActivityCommand request);
    Task<ErrorOr<PaginatedList<TourInstanceVm>>> GetMyAssignedInstances(int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<ErrorOr<TourInstanceDto>> GetMyAssignedInstanceDetail(Guid id, CancellationToken cancellationToken = default);
    /// <summary>
    /// Public flow: create a private <see cref="TourInstanceStatus.Draft"/> instance; manager is the tour operator.
    /// </summary>
    Task<ErrorOr<Guid>> CreatePublicPrivateDraftAsync(CreateTourInstanceCommand request);
    Task TriggerProviderAssignmentsAsync(Guid instanceId, CancellationToken cancellationToken = default);
    Task HandleSupplierRejectionAsync(Guid instanceId, string reason, CancellationToken cancellationToken = default);
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
    ICloudinaryService cloudinaryService,
    IServiceProvider? serviceProvider = null,
    ITourInstanceNotificationBroadcaster? notificationBroadcaster = null,
    IVehicleBlockRepository? vehicleBlockRepository = null,
    Domain.Common.Repositories.IBookingRepository? bookingRepository = null,
    IUnitOfWork? unitOfWork = null,
    Domain.Common.Repositories.ITourManagerAssignmentRepository? tourManagerAssignmentRepository = null,
    Domain.Common.Repositories.IPaymentTransactionRepository? paymentTransactionRepository = null,
    Domain.Common.Repositories.IBookingCancellationRequestRepository? bookingCancellationRequestRepository = null,
    Domain.Common.Repositories.ITaxConfigRepository? taxConfigRepository = null,
    Domain.Common.Repositories.IPricingPolicyRepository? pricingPolicyRepository = null,
    Application.Common.Pricing.IBookingPriceCalculator? priceCalculator = null) : ITourInstanceService
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
    private readonly ICloudinaryService _cloudinaryService = cloudinaryService;
    private readonly IServiceProvider? _serviceProvider = serviceProvider;
    private readonly IUnitOfWork? _unitOfWork = unitOfWork;
    private readonly ITourInstanceNotificationBroadcaster? _notificationBroadcaster = notificationBroadcaster;
    private readonly IVehicleBlockRepository? _vehicleBlockRepository = vehicleBlockRepository;
    private readonly Domain.Common.Repositories.IBookingRepository? _bookingRepository = bookingRepository;
    private readonly Domain.Common.Repositories.ITourManagerAssignmentRepository? _tourManagerAssignmentRepository = tourManagerAssignmentRepository;
    private readonly Domain.Common.Repositories.IPaymentTransactionRepository? _paymentTransactionRepository = paymentTransactionRepository;
    private readonly Domain.Common.Repositories.IBookingCancellationRequestRepository? _bookingCancellationRequestRepository = bookingCancellationRequestRepository;
    private readonly Domain.Common.Repositories.ITaxConfigRepository? _taxConfigRepository = taxConfigRepository;
    private readonly Domain.Common.Repositories.IPricingPolicyRepository? _pricingPolicyRepository = pricingPolicyRepository;
    private readonly Application.Common.Pricing.IBookingPriceCalculator? _priceCalculator = priceCalculator;

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

        return await CreateCoreAsync(request, tour, classification, creatorUserId, _user.Id);
    }

    /// <inheritdoc />
    public async Task<ErrorOr<Guid>> CreatePublicPrivateDraftAsync(CreateTourInstanceCommand request)
    {
        var tour = await _tourRepository.FindById(request.TourId);
        if (tour is null)
            return Error.NotFound(ErrorConstants.Tour.NotFoundCode, ErrorConstants.Tour.NotFoundDescription);

        var classification = tour.Classifications.FirstOrDefault(c => c.Id == request.ClassificationId);
        if (classification is null)
            return Error.NotFound(ErrorConstants.Classification.NotFoundCode, ErrorConstants.Classification.NotFoundDescription);

        if (tour.Status != TourStatus.Active)
            return Error.Validation("Tour.NotActive", "Tour không khả dụng để đặt riêng.");

        if (!tour.TourOperatorId.HasValue)
            return Error.Validation("Tour.TourOperatorRequired", "Tour chưa gán điều hành viên; không thể đặt tour riêng.");

        if (request.InstanceType != TourType.Private)
            return Error.Validation("TourInstance.PrivateTypeRequired", "Yêu cầu tour riêng phải dùng loại Private.");

        var operatorId = tour.TourOperatorId.Value;

        Guid? managerId = null;
        if (_tourManagerAssignmentRepository is not null)
        {
            managerId = await _tourManagerAssignmentRepository.FindManagerForOperatorAsync(operatorId);
        }

        if (!managerId.HasValue)
        {
            _logger.LogWarning(
                "No Manager could be resolved for TourOperator {OperatorId}; private tour request will fall back to operator as manager.",
                operatorId);
        }

        var resolvedManagerId = managerId ?? operatorId;
        return await CreateCoreAsync(request, tour, classification, resolvedManagerId, resolvedManagerId.ToString());
    }

    private async Task<ErrorOr<Guid>> CreateCoreAsync(
        CreateTourInstanceCommand request,
        TourEntity tour,
        TourClassificationEntity classification,
        Guid creatorUserId,
        string performedBy)
    {
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
            requiresApproval: request.ActivityAssignments?.Any(a => a.TransportSupplierId.HasValue || a.SupplierId.HasValue) == true,
            wantsCustomization: request.WantsCustomization,
            customizationNotes: request.CustomizationNotes);

        if (request.Translations is not null)
        {
            entity.Translations = request.Translations;
        }

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
                    fromLocationId: templateActivity.FromLocationId,
                    toLocationId: templateActivity.ToLocationId,
                    transportationType: templateActivity.ActivityType == TourDayActivityType.Transportation ? templateActivity.TransportationType : null,
                    transportationName: templateActivity.ActivityType == TourDayActivityType.Transportation ? templateActivity.TransportationName : null,
                    durationMinutes: templateActivity.DurationMinutes,
                    price: templateActivity.Price ?? templateActivity.EstimatedCost
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
            if (entity.InstanceType != TourType.Private)
            {
                await NotifyProviderAssignmentAsync(entity);
            }
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

        var supplierIds = candidates.Select(a => a.TransportSupplierId!.Value).Distinct().ToList();
        var suppliers = await _supplierRepository.GetByIdsAsync(supplierIds);
        var supplierMap = suppliers.Where(s => s != null).ToDictionary(s => s!.Id);

        foreach (var assignment in candidates)
        {
            if (!supplierMap.TryGetValue(assignment.TransportSupplierId!.Value, out var supplier) || supplier is null)
                continue;

            if (!supplier.OwnerUserId.HasValue)
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

        var inventoryKeys = new List<(Guid SupplierId, RoomType RoomType)>();
        var assignmentRoomTypes = new Dictionary<int, RoomType>();
        for (var i = 0; i < candidates.Count; i++)
        {
            var assignment = candidates[i];
            if (Enum.TryParse<RoomType>(assignment.RoomType, true, out var roomType))
            {
                inventoryKeys.Add((assignment.SupplierId!.Value, roomType));
                assignmentRoomTypes[i] = roomType;
            }
        }

        if (inventoryKeys.Count == 0)
            return Result.Success;

        var inventoryMap = await _hotelRoomInventoryRepository.FindByHotelAndRoomTypesAsync(inventoryKeys);

        for (var i = 0; i < candidates.Count; i++)
        {
            var assignment = candidates[i];
            if (!assignmentRoomTypes.TryGetValue(i, out var roomType))
                continue; // invalid room type already flagged earlier

            var key = (assignment.SupplierId!.Value, roomType);
            var inventory = inventoryMap.TryGetValue(key, out var inv) ? inv : null;

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

        var suppliers = await _supplierRepository.GetByIdsAsync(supplierIds);
        var supplierMap = suppliers.Where(s => s != null).ToDictionary(s => s!.Id);
        var ownerUserIds = suppliers
            .Where(s => s != null && s.OwnerUserId.HasValue)
            .Select(s => s!.OwnerUserId!.Value)
            .Distinct()
            .ToList();

        var ownerMap = new Dictionary<Guid, UserEntity>();
        if (ownerUserIds.Count > 0)
        {
            var owners = await _tourInstanceRepository.FindUserByIdsAsync(ownerUserIds);
            ownerMap = owners.Where(o => o != null).ToDictionary(o => o!.Id);
        }

        foreach (var supplierId in supplierIds)
        {
            if (!supplierMap.TryGetValue(supplierId, out var supplier) || supplier is null)
                return Error.NotFound(ErrorConstants.Supplier.NotFoundCode, $"Accommodation supplier ID '{supplierId}' not found.");

            if (!supplier.IsActive)
                return Error.Validation("TourInstance.SupplierInactive", $"Nhà cung cấp lưu trú '{supplier.Name}' đang ngừng hoạt động.");

            if (supplier.OwnerUserId.HasValue && ownerMap.TryGetValue(supplier.OwnerUserId.Value, out var owner))
            {
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

    public async Task TriggerProviderAssignmentsAsync(Guid instanceId, CancellationToken cancellationToken = default)
    {
        var entity = await _tourInstanceRepository.FindByIdWithInstanceDays(instanceId, cancellationToken);
        if (entity is not null)
        {
            await NotifyProviderAssignmentAsync(entity);
        }
    }

    public async Task HandleSupplierRejectionAsync(Guid instanceId, string reason, CancellationToken cancellationToken = default)
    {
        var instance = await _tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(instanceId, cancellationToken);
        if (instance is null) return;

        if (instance.InstanceType == TourType.Private && instance.Status == TourInstanceStatus.Confirmed)
        {
            // The fallback mechanism: if any supplier rejects an assigned activity after the tour is confirmed, cancel it.
            instance.Cancel(reason, "SYSTEM");

            // Release RoomBlock and VehicleBlock records
            if (_vehicleBlockRepository is not null)
            {
                var activityIds = instance.InstanceDays.SelectMany(d => d.Activities).Select(a => a.Id).ToList();
                foreach (var actId in activityIds)
                {
                    await _vehicleBlockRepository.DeleteByActivityAsync(actId, cancellationToken);
                }
            }
            if (_roomBlockRepository is not null)
            {
                await _roomBlockRepository.DeleteByTourInstanceAsync(instanceId, cancellationToken);
            }

            await _tourInstanceRepository.Update(instance, cancellationToken);

            // Refund from Manager's balance to Customer's wallet
            if (_serviceProvider != null)
            {
                using var scope = _serviceProvider.CreateScope();
                var bookingRepo = scope.ServiceProvider.GetRequiredService<IBookingRepository>();
                var paymentTxRepo = scope.ServiceProvider.GetRequiredService<IPaymentTransactionRepository>();
                var userRepo = scope.ServiceProvider.GetRequiredService<IUserRepository>();
                var txHistoryRepo = scope.ServiceProvider.GetRequiredService<ITransactionHistoryRepository>();
                var localUnitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

                var bookings = await bookingRepo.GetByTourInstanceIdAsync(instance.Id, cancellationToken);
                var booking = bookings.FirstOrDefault();
                if (booking != null && booking.UserId.HasValue)
                {
                    var customerId = booking.UserId.Value;
                    var managerId = instance.Managers.FirstOrDefault(m => m.Role == TourInstanceManagerRole.Manager)?.UserId;

                    if (managerId.HasValue)
                    {
                        var manager = await userRepo.FindById(managerId.Value, cancellationToken);
                        var customer = await userRepo.FindById(customerId, cancellationToken);

                        if (manager != null && customer != null)
                        {
                            var txs = await paymentTxRepo.GetByBookingIdListAsync(booking.Id, cancellationToken);
                            var totalPaid = txs.Where(t => t.Status == TransactionStatus.Completed).Sum(t => t.PaidAmount ?? t.Amount);

                            if (totalPaid > 0)
                            {
                                manager.Balance -= totalPaid;
                                customer.CreditBalance(totalPaid);

                                userRepo.Update(manager);
                                userRepo.Update(customer);

                                // Record transaction histories
                                var mgrHistory = TransactionHistoryEntity.CreateDebit(
                                    managerId.Value, totalPaid, $"Hoàn tiền tour {instance.TourCode} do nhà cung cấp từ chối", "SYSTEM", booking.Id);
                                var cusHistory = TransactionHistoryEntity.CreateCredit(
                                    customerId, totalPaid, $"Nhận hoàn tiền tour {instance.TourCode} do bị huỷ", "SYSTEM", booking.Id);

                                await txHistoryRepo.AddAsync(mgrHistory, cancellationToken);
                                await txHistoryRepo.AddAsync(cusHistory, cancellationToken);
                            }
                        }
                    }
                    booking.Cancel("Supplier rejected assignment", "SYSTEM");
                    await bookingRepo.UpdateAsync(booking, cancellationToken);
                }
                if (_unitOfWork is null)
                {
                    await localUnitOfWork.SaveChangeAsync(cancellationToken);
                }
            }
            // (If _unitOfWork is not null, caller is expected to save changes)
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

        if (transportSupplierIds.Count > 0)
        {
            var suppliers = await _supplierRepository.GetByIdsAsync(transportSupplierIds);
            var supplierMap = suppliers.Where(s => s != null).ToDictionary(s => s!.Id);

            foreach (var transportSupplierId in transportSupplierIds)
            {
                try
                {
                    if (!supplierMap.TryGetValue(transportSupplierId, out var transportSupplier) || transportSupplier?.OwnerUserId is null)
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

        if (entity.IsLockedForOperatorEdit())
            return Error.Validation("TourInstance.LockedForEdit", "Lịch trình đang chờ duyệt, không thể chỉnh sửa.");

        // For Private tours, the max participation is fixed by the customer's request and cannot be changed.
        if (entity.InstanceType == TourType.Private && request.MaxParticipation != entity.MaxParticipation)
        {
            return Error.Validation("TourInstance.MaxParticipation", "Không thể thay đổi số lượng khách tối đa của Tour Riêng (Private Tour).");
        }

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
                if (vehicleIds.Count > 0)
                {
                    var vehicles = await _vehicleRepository.FindByIdsAsync(vehicleIds);
                    capacityMap = vehicles.ToDictionary(v => v.Id, v => v.SeatCapacity);
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

        var existingManagers = entity.Managers.ToList();
        var desiredManagers = new List<(Guid UserId, TourInstanceManagerRole Role)>();

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
                desiredManagers.Add((userId, TourInstanceManagerRole.Guide));
            }
        }

        if (request.ManagerUserIds?.Count > 0)
        {
            foreach (var userId in request.ManagerUserIds)
            {
                desiredManagers.Add((userId, TourInstanceManagerRole.Manager));
            }
        }

        // Remove managers that are no longer desired
        foreach (var existing in existingManagers)
        {
            if (!desiredManagers.Any(d => d.UserId == existing.UserId && d.Role == existing.Role))
            {
                entity.Managers.Remove(existing);
            }
        }

        // Add managers that are newly desired
        foreach (var desired in desiredManagers)
        {
            if (!existingManagers.Any(e => e.UserId == desired.UserId && e.Role == desired.Role))
            {
                entity.Managers.Add(TourInstanceManagerEntity.Create(
                    entity.Id, desired.UserId, desired.Role, performedBy));
            }
        }

        var publicIdsToDelete = new List<string>();

        // Collect old thumbnail if changed
        if (request.Thumbnail is not null && !string.IsNullOrEmpty(entity.Thumbnail?.FileId) && entity.Thumbnail.FileId != request.Thumbnail.FileId)
        {
            publicIdsToDelete.Add(entity.Thumbnail.FileId);
        }

        // Collect old gallery images if removed
        if (request.Images is not null)
        {
            var newFileIds = request.Images.Where(i => i.FileId is not null).Select(i => i.FileId!).ToHashSet();
            var removedImages = entity.Images
                .Where(i => !string.IsNullOrEmpty(i.FileId) && !newFileIds.Contains(i.FileId))
                .ToList();

            publicIdsToDelete.AddRange(removedImages.Select(i => i.FileId!));
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

        // Physical deletion from Cloudinary after DB success
        if (publicIdsToDelete.Count > 0)
        {
            try
            {
                await _cloudinaryService.DeleteFilesAsync(publicIdsToDelete);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete old images from Cloudinary for TourInstance {InstanceId}", entity.Id);
            }
        }

        return Result.Success;
    }

    public async Task<ErrorOr<Success>> Delete(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _tourInstanceRepository.FindById(id);
        if (entity is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        // Check for active bookings before delete — cascade cancel if any
        if (_bookingRepository is not null)
        {
            var bookings = await _bookingRepository.GetByTourInstanceIdAsync(id, cancellationToken);
            var hasActiveBookings = bookings.Any(b => b.Status is not (BookingStatus.Completed or BookingStatus.Cancelled));
            var hasInProgressOrCompleted = bookings.Any(b => b.Status is BookingStatus.Completed);

            if (hasInProgressOrCompleted)
                return Error.Validation(ErrorConstants.TourInstance.CannotCancelAfterStartCode, ErrorConstants.TourInstance.CannotCancelAfterStartDescription);

            if (hasActiveBookings)
            {
                var performedBy = _user.Id ?? string.Empty;
                async Task DoDelete()
                {
                    await _roomBlockRepository.DeleteByTourInstanceAsync(id);
                    if (_vehicleBlockRepository is not null)
                        await _vehicleBlockRepository.DeleteByTourInstanceAsync(id);
                    await CascadeCancelBookingsAsync(entity, "Tour bị xoá bởi Manager", performedBy, cancellationToken);
                    await _tourInstanceRepository.SoftDelete(id);
                    if (_unitOfWork is not null)
                        await _unitOfWork.SaveChangeAsync(cancellationToken);
                }

                if (_unitOfWork is not null)
                {
                    await _unitOfWork.ExecuteTransactionAsync(System.Data.IsolationLevel.RepeatableRead, DoDelete);
                }
                else
                {
                    await DoDelete();
                }
                return Result.Success;
            }
        }

        // No active bookings — proceed with original soft-delete
        await _roomBlockRepository.DeleteByTourInstanceAsync(id);
        if (_vehicleBlockRepository is not null)
            await _vehicleBlockRepository.DeleteByTourInstanceAsync(id);

        await _tourInstanceRepository.SoftDelete(id);
        return Result.Success;
    }

    public async Task<ErrorOr<Success>> ChangeStatus(Guid id, TourInstanceStatus newStatus, CancellationToken cancellationToken = default)
    {
        var entity = await _tourInstanceRepository.FindById(id);
        if (entity is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        // ER-Security: If the user is a TourGuide (and not an Admin/Manager/TourOperator), they can only start/complete their assigned instances.
        if (_user.Roles.Contains("TourGuide") && !_user.Roles.Contains("Admin") && !_user.Roles.Contains("Manager") && !_user.Roles.Contains("TourOperator"))
        {
            if (!Guid.TryParse(_user.Id, out var currentUserId))
                return Error.Unauthorized(ErrorConstants.User.UnauthorizedCode, ErrorConstants.User.UnauthorizedDescription);

            var isAssigned = entity.Managers.Any(m => m.UserId == currentUserId && m.Role == TourInstanceManagerRole.Guide);
            if (!isAssigned)
                return Error.Unauthorized(ErrorConstants.User.UnauthorizedCode, "Bạn không được phân công hướng dẫn tour này.");

            // TourGuide can only transition to InProgress or Completed
            if (newStatus != TourInstanceStatus.InProgress && newStatus != TourInstanceStatus.Completed)
                return Error.Validation("TourInstance.InvalidStatus", "Hướng dẫn viên chỉ có thể Bắt đầu (InProgress) hoặc Kết thúc (Completed) tour.");
        }

        // Guard: cannot cancel instance that has already started or completed
        if (newStatus == TourInstanceStatus.Cancelled && entity.Status is TourInstanceStatus.InProgress or TourInstanceStatus.Completed or TourInstanceStatus.Cancelled)
            return Error.Validation(ErrorConstants.TourInstance.CannotCancelAfterStartCode, ErrorConstants.TourInstance.CannotCancelAfterStartDescription);

        var performedBy = _user.Id ?? string.Empty;

        // Cancelled branch: wrap in transaction with cascade
        if (newStatus == TourInstanceStatus.Cancelled)
        {
            async Task DoCancel()
            {
                try
                {
                    entity.ChangeStatus(newStatus, performedBy);
                }
                catch (InvalidOperationException ex)
                {
                    throw new InvalidOperationException(ex.Message, ex);
                }

                await _tourInstanceRepository.Update(entity);

                // ER-3: free all inventory holds
                await _roomBlockRepository.DeleteByTourInstanceAsync(id);
                if (_vehicleBlockRepository is not null)
                    await _vehicleBlockRepository.DeleteByTourInstanceAsync(id);

                // Cascade cancel bookings
                if (_bookingRepository is not null)
                    await CascadeCancelBookingsAsync(entity, "Tour bị huỷ bởi Manager", performedBy, cancellationToken);

                // Notify assigned providers (fire-and-forget inside tx — failures are logged, not thrown)
                await NotifyProvidersOnCancelAsync(entity, cancellationToken);

                if (_unitOfWork is not null)
                    await _unitOfWork.SaveChangeAsync(cancellationToken);
            }

            try
            {
                if (_unitOfWork is not null)
                    await _unitOfWork.ExecuteTransactionAsync(System.Data.IsolationLevel.RepeatableRead, DoCancel);
                else
                    await DoCancel();
            }
            catch (InvalidOperationException ex)
            {
                // Unwrap inner exception message if present (thrown from entity.ChangeStatus inside DoCancel)
                var message = ex.InnerException?.Message ?? ex.Message;
                return Error.Validation("TourInstance.InvalidTransition", message);
            }

            return Result.Success;
        }

        // Non-cancelled branch: original logic
        try
        {
            entity.ChangeStatus(newStatus, performedBy);
        }
        catch (InvalidOperationException ex)
        {
            return Error.Validation("TourInstance.InvalidTransition", ex.Message);
        }

        await _tourInstanceRepository.Update(entity);

        return Result.Success;
    }

    /// <summary>
    /// Cascade huỷ tất cả booking active của instance về Cancelled, khởi tạo refund tracking,
    /// và auto-reject các booking cancellation request đang pending.
    /// </summary>
    private async Task CascadeCancelBookingsAsync(TourInstanceEntity instance, string reason, string performedBy, CancellationToken ct)
    {
        if (_bookingRepository is null || _paymentTransactionRepository is null)
            return;

        var bookings = await _bookingRepository.GetByTourInstanceIdAsync(instance.Id, ct);

        foreach (var booking in bookings)
        {
            if (booking.Status is BookingStatus.Completed or BookingStatus.Cancelled)
                continue;

            // Fix EF Core tracking conflict: replace detached TourInstance with the tracked instance
            // to prevent "cannot be tracked because another instance... is already being tracked" error.
            booking.TourInstance = instance;

            // Compute net paid amount
            var txs = await _paymentTransactionRepository.GetByBookingIdListAsync(booking.Id, ct);
            var paidIn = txs
                .Where(t => t.Status == TransactionStatus.Completed && t.Type is TransactionType.Deposit or TransactionType.FullPayment)
                .Sum(t => t.PaidAmount ?? t.Amount);
            var refundOut = txs
                .Where(t => t.Status == TransactionStatus.Completed && t.Type == TransactionType.Refund)
                .Sum(t => t.PaidAmount ?? t.Amount);
            var netPaid = Math.Max(0, paidIn - refundOut);

            booking.Cancel(reason, performedBy);
            booking.InitializeRefundTracking(netPaid, performedBy);
            await _bookingRepository.UpdateAsync(booking, ct);

            // Auto-reject pending cancellation requests for this booking
            if (_bookingCancellationRequestRepository is not null && Guid.TryParse(performedBy, out var managerId))
            {
                var pendingRequest = await _bookingCancellationRequestRepository.GetPendingByBookingId(booking.Id, ct);
                if (pendingRequest is not null)
                {
                    pendingRequest.Reject(managerId, "Tour bị huỷ bởi Manager — yêu cầu huỷ tự động đóng.");
                    if (_unitOfWork is not null)
                        _unitOfWork.GenericRepository<BookingCancellationRequestEntity>().Update(pendingRequest);
                }
            }
        }
    }

    /// <summary>
    /// Queue background email notifications to all unique assigned providers (transport + accommodation)
    /// when a tour instance is cancelled. Failures are logged and swallowed — must not affect the main cancel flow.
    /// </summary>
    private async Task NotifyProvidersOnCancelAsync(TourInstanceEntity instance, CancellationToken ct)
    {
        try
        {
            // Load instance days with supplier navigation if not already loaded
            var instanceWithDays = instance.InstanceDays.Count > 0
                ? instance
                : await _tourInstanceRepository.FindByIdWithInstanceDays(instance.Id, ct);

            if (instanceWithDays is null)
                return;

            var startDate = instanceWithDays.StartDate.ToString("dd/MM/yyyy", System.Globalization.CultureInfo.InvariantCulture);
            var endDate = instanceWithDays.EndDate.ToString("dd/MM/yyyy", System.Globalization.CultureInfo.InvariantCulture);

            // Collect unique suppliers with email from all activities
            var suppliersToNotify = new Dictionary<Guid, (string Name, string Email)>();

            foreach (var day in instanceWithDays.InstanceDays)
            {
                foreach (var activity in day.Activities)
                {
                    // Transport supplier
                    if (activity.TransportSupplier is { Email: not null } ts
                        && !string.IsNullOrWhiteSpace(ts.Email)
                        && !suppliersToNotify.ContainsKey(ts.Id))
                    {
                        suppliersToNotify[ts.Id] = (ts.Name, ts.Email);
                    }

                    // Accommodation supplier
                    if (activity.Accommodation?.Supplier is { Email: not null } accSupplier
                        && !string.IsNullOrWhiteSpace(accSupplier.Email)
                        && !suppliersToNotify.ContainsKey(accSupplier.Id))
                    {
                        suppliersToNotify[accSupplier.Id] = (accSupplier.Name, accSupplier.Email);
                    }
                }
            }

            foreach (var (_, (name, email)) in suppliersToNotify)
            {
                try
                {
                    var mailDto = new Domain.Mails.TourCancelledProviderMail(
                        ProviderName: name,
                        TourName: instanceWithDays.TourName,
                        TourCode: instanceWithDays.TourCode,
                        StartDate: startDate,
                        EndDate: endDate,
                        HotlinePhone: "1900 xxxx");

                    var mail = mailDto.ToMail(email);
                    await _mailRepository.Add(mail, ct);

                    _logger.LogInformation(
                        "Queued tour-cancelled provider email to {ProviderEmail} for TourInstance {TourInstanceId}",
                        email, instance.Id);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex,
                        "Failed to queue tour-cancelled provider email to {ProviderEmail} for TourInstance {TourInstanceId}",
                        email, instance.Id);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "NotifyProvidersOnCancelAsync failed for TourInstance {TourInstanceId} — provider emails skipped",
                instance.Id);
        }
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

        var instance = await _tourInstanceRepository.FindByIdWithInstanceDays(instanceId, cancellationToken);
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

        // NOTE: No pre-validation for room blocks needed here.
        // When the hotel provider approves, RoomBlocks are auto-created inside the
        // transaction below (line ~1280) based on the accommodation requirements
        // (RoomType + Quantity) set by the Tour Operator.

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
                    var fullInst = await _tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(instanceId, cancellationToken);
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
                                // ER-4.3: idempotent status flip — skip ApproveBySupplier when already at target,
                                // but still repair missing RoomBlocks (Approved + 0 blocks is a known bad state).
                                var alreadyAtTarget = isApproved
                                    ? act.Accommodation.SupplierApprovalStatus == ProviderApprovalStatus.Approved
                                    : act.Accommodation.SupplierApprovalStatus == ProviderApprovalStatus.Rejected;

                                if (!alreadyAtTarget)
                                {
                                    act.Accommodation.ApproveBySupplier(isApproved, note);
                                }

                                if (isApproved)
                                {
                                    var requiredRooms = act.Accommodation.Quantity;
                                    if (requiredRooms > 0)
                                    {
                                        var existingBlocks = await _roomBlockRepository.GetByTourInstanceDayActivityIdAsync(
                                            act.Id, cancellationToken);
                                        var blockedTotal = existingBlocks.Sum(b => b.RoomCountBlocked);

                                        if (blockedTotal < requiredRooms)
                                        {
                                            await _roomBlockRepository.DeleteByTourInstanceDayActivityIdAsync(act.Id, cancellationToken);

                                            // Tour-level holds are always Hard. Soft holds reserved for unpaid customer bookings.
                                            var block = RoomBlockEntity.Create(
                                                supplierId: act.Accommodation.SupplierId.Value,
                                                roomType: act.Accommodation.RoomType ?? Domain.Enums.RoomType.Standard,
                                                blockedDate: act.TourInstanceDay.ActualDate,
                                                roomCountBlocked: requiredRooms,
                                                performedBy: currentUserId.ToString(),
                                                tourInstanceDayActivityId: act.Id,
                                                holdStatus: HoldStatus.Hard);
                                            await _roomBlockRepository.AddAsync(block, cancellationToken);
                                        }
                                    }
                                }
                                else if (!alreadyAtTarget)
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

        if (!isApproved && instance.InstanceType == TourType.Private && instance.Status == TourInstanceStatus.Confirmed)
        {
            // Fallback for private tour: if supplier rejects after confirmation, cancel tour and refund
            await HandleSupplierRejectionAsync(instance.Id, note ?? "Supplier rejected assignment", cancellationToken);
            var updatedInstance = await _tourInstanceRepository.FindById(instance.Id, cancellationToken: cancellationToken);
            if (updatedInstance != null) instance = updatedInstance;
        }
        else
        {
            await _tourInstanceRepository.Update(instance, cancellationToken);
        }

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

        var supplierIds = suppliers.Select(s => s.Id).ToList();

        var entities = await _tourInstanceRepository.FindProviderAssigned(supplierIds, pageNumber, pageSize, approvalStatus, cancellationToken);
        var total = await _tourInstanceRepository.CountProviderAssigned(supplierIds, approvalStatus, cancellationToken);

        var vms = entities.Select(e =>
        {
            var vm = _mapper.Map<TourInstanceVm>(e);
            var supplierIdSet = new HashSet<Guid>(supplierIds);
            var rollup = ComputeTransportApprovalRollup(e, supplierIdSet);
            var assignedRevenue = ComputeAssignedRevenue(e, supplierIdSet);
            return vm with { TransportApprovalStatus = rollup, AssignedRevenue = assignedRevenue };
        }).ToList();
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

        var dto = _mapper.Map<TourInstanceDto>(entity);
        if (_bookingRepository is not null)
        {
            var bookings = await _bookingRepository.GetByTourInstanceIdAsync(id, cancellationToken);
            var totalBookings = bookings.Count(b => b.Status != BookingStatus.Cancelled);
            var revenue = bookings.Where(b => b.Status is BookingStatus.Confirmed or BookingStatus.Deposited or BookingStatus.Paid or BookingStatus.Completed).Sum(b => b.TotalPrice);
            dto = dto with { TotalBookings = totalBookings, Revenue = revenue };
        }
        return dto;
    }

    public async Task<ErrorOr<PaginatedList<TourInstanceVm>>> GetAll(GetAllTourInstancesQuery request)
    {
        // Scope results to the current user's managed tours/instances.
        if (!Guid.TryParse(_user.Id, out var principalId))
        {
            _logger.LogInformation("Tour instance list request skipped because the current user id is missing or invalid.");
            return new PaginatedList<TourInstanceVm>(0, [], request.PageNumber, request.PageSize);
        }

        var isAdminOrManager = _user.Roles != null && (_user.Roles.Contains("Admin") || _user.Roles.Contains("Manager"));
        
        // Determine effective principal ID for scoping:
        // 1. Admin/Manager viewing custom requests (wantsCustomization = true) → see all (null)
        // 2. Tour Operator viewing public tours (wantsCustomization = false) → see all public tours (null)
        // 3. Otherwise → scope to user's managed tours/instances (principalId)
        Guid? effectivePrincipalId = null;
        if (isAdminOrManager && request.WantsCustomization == true)
        {
            // Admin/Manager can see all custom tour requests
            effectivePrincipalId = null;
        }
        else if (request.WantsCustomization == false)
        {
            // Public tours: all users (including tour operators) can see all public tours
            effectivePrincipalId = null;
        }
        else
        {
            // Private/custom tours or no filter: scope to user's managed tours
            effectivePrincipalId = principalId;
        }

        var entities = await _tourInstanceRepository.FindAll(request.SearchText, request.Status, request.PageNumber, request.PageSize, request.ExcludePast, request.WantsCustomization, request.InstanceType, effectivePrincipalId, request.Statuses);
        var total = await _tourInstanceRepository.CountAll(request.SearchText, request.Status, request.ExcludePast, request.WantsCustomization, request.InstanceType, effectivePrincipalId, request.Statuses);

        var vms = entities.Select(e => _mapper.Map<TourInstanceVm>(e)).ToList();
        return new PaginatedList<TourInstanceVm>(total, vms, request.PageNumber, request.PageSize);
    }

    public async Task<ErrorOr<TourInstanceDto>> GetDetail(Guid id)
    {
        var entity = await _tourInstanceRepository.FindByIdWithInstanceDays(id);
        if (entity is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        var dto = _mapper.Map<TourInstanceDto>(entity);
        if (_bookingRepository is not null)
        {
            var bookings = await _bookingRepository.GetByTourInstanceIdAsync(id);
            var totalBookings = bookings.Count(b => b.Status != BookingStatus.Cancelled);
            var revenue = bookings.Where(b => b.Status is BookingStatus.Confirmed or BookingStatus.Deposited or BookingStatus.Paid or BookingStatus.Completed).Sum(b => b.TotalPrice);
            dto = dto with { TotalBookings = totalBookings, Revenue = revenue };
        }
        return dto;
    }

    public async Task<ErrorOr<TourInstanceStatsDto>> GetStats(TourType? instanceType = null)
    {
        var (total, available, confirmed, soldOut, completed) = await _tourInstanceRepository.GetStats(instanceType);
        return new TourInstanceStatsDto(total, available, confirmed, soldOut, completed);
    }

    public async Task<ErrorOr<PaginatedList<TourInstanceVm>>> GetPublicAvailable(
        string? destination,
        string? sortBy,
        int page,
        int pageSize,
        string? language = null,
        string? catalogInstanceType = null)
    {
        TourType? instanceTypeFilter = catalogInstanceType?.Trim().ToLowerInvariant() switch
        {
            "private" => TourType.Private,
            "public" => TourType.Public,
            _ => null,
        };
        var entities = await _tourInstanceRepository.FindPublicAvailable(destination, sortBy, page, pageSize, instanceTypeFilter);
        var total = await _tourInstanceRepository.CountPublicAvailable(destination, instanceTypeFilter);
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
        var dto = _mapper.Map<TourInstanceDto>(entity);
        if (_bookingRepository is not null)
        {
            var bookings = await _bookingRepository.GetByTourInstanceIdAsync(id);
            var totalBookings = bookings.Count(b => b.Status != BookingStatus.Cancelled);
            var revenue = bookings.Where(b => b.Status is BookingStatus.Confirmed or BookingStatus.Deposited or BookingStatus.Paid or BookingStatus.Completed).Sum(b => b.TotalPrice);
            dto = dto with { TotalBookings = totalBookings, Revenue = revenue };
        }
        return dto;
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

        if (instance.IsLockedForOperatorEdit())
            return Error.Validation("TourInstance.LockedForEdit", "Lịch trình đang chờ duyệt, không thể chỉnh sửa.");

        var instanceDay = instance.InstanceDays.FirstOrDefault(d => d.Id == request.DayId);
        if (instanceDay is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, "Tour instance day not found.");

        var performedBy = _user.Id ?? string.Empty;

        // Reject duplicate ActualDate against OTHER days (parity with AddCustomDay).
        if (instance.InstanceDays.Any(d => d.Id != request.DayId && d.ActualDate == request.ActualDate))
            return Error.Validation("TourInstanceDay.DuplicateDate", "Đã tồn tại một ngày với ngày thực tế này trong lịch trình.");

        // Auto-extend instance bounds if the new ActualDate is outside (parity with AddCustomDay).
        var actualDateOffset = new DateTimeOffset(request.ActualDate.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
        instance.ExtendDateRangeIfNecessary(actualDateOffset, performedBy);

        instanceDay.Update(
            title: request.Title,
            actualDate: request.ActualDate,
            description: request.Description,
            startTime: request.StartTime,
            endTime: request.EndTime,
            note: request.Note,
            performedBy: performedBy);

        await _tourInstanceRepository.UpdateInstanceDay(instanceDay);
        await _tourInstanceRepository.Update(instance);

        return _mapper.Map<TourInstanceDayDto>(instanceDay);
    }

    public async Task<ErrorOr<Guid>> AddCustomDay(CreateTourInstanceDayCommand request)
    {
        var instance = await _tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(request.InstanceId);
        if (instance is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        if (instance.IsLockedForOperatorEdit())
            return Error.Validation("TourInstance.LockedForEdit", "Lịch trình đang chờ duyệt, không thể chỉnh sửa.");

        var actualDateOffset = new DateTimeOffset(request.ActualDate.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
        var performedBy = _user.Id ?? string.Empty;

        // Auto extend the start/end date bounds if the day added is out of current bounds
        instance.ExtendDateRangeIfNecessary(actualDateOffset, performedBy);

        // Check duplicate date
        if (instance.InstanceDays.Any(d => d.ActualDate == request.ActualDate))
            return Error.Validation("TourInstanceDay.DuplicateDate", "Đã tồn tại một ngày với ngày thực tế này trong lịch trình.");

        var maxDayNumber = instance.InstanceDays.Any()
            ? instance.InstanceDays.Max(d => d.InstanceDayNumber)
            : 0;

        var customDay = TourInstanceDayEntity.Create(
            request.InstanceId,
            null,
            maxDayNumber + 1,
            request.ActualDate,
            request.Title,
            performedBy,
            request.Description);

        await _tourInstanceRepository.AddDay(customDay);

        await _tourInstanceRepository.Update(instance);

        _logger.LogInformation("Custom day added to TourInstance {InstanceId} with InstanceDayNumber {DayNumber}",
            request.InstanceId, customDay.InstanceDayNumber);

        return customDay.Id;
    }

    private async Task<TourPlanLocationEntity?> ResolveLocationAsync(Guid? locationId, string? locationName, Guid tourId)
    {
        var hasId = locationId.HasValue && locationId != Guid.Empty;
        var hasName = !string.IsNullOrWhiteSpace(locationName);
        if (!hasId && !hasName)
        {
            return null;
        }

        if (hasId)
        {
            var existingLocation = await _tourRepository.FindLocationByIdAsync(locationId!.Value);
            if (existingLocation != null)
            {
                existingLocation.TourId = tourId;
                return existingLocation;
            }
            var stub = TourPlanLocationEntity.Create(
                locationName ?? "Referenced Location",
                LocationType.Other,
                _user.Id ?? string.Empty,
                tourId);
            _unitOfWork?.MarkAsAdded(stub);
            return stub;
        }

        var tour = await _tourRepository.FindByIdForUpdate(tourId);
        if (tour != null)
        {
            var existingByName = tour.PlanLocations.FirstOrDefault(l => 
                !l.IsDeleted && 
                l.LocationName.Trim().Equals(locationName!.Trim(), StringComparison.OrdinalIgnoreCase));
            if (existingByName != null)
            {
                return existingByName;
            }
        }

        var location = TourPlanLocationEntity.Create(
            locationName!.Trim(),
            LocationType.Other,
            _user.Id ?? string.Empty,
            tourId);
        if (tour != null)
        {
            tour.PlanLocations.Add(location);
        }
        _unitOfWork?.MarkAsAdded(location);
        return location;
    }

    public async Task<ErrorOr<TourInstanceDayActivityDto>> UpdateActivity(UpdateTourInstanceActivityCommand request)
    {
        var instance = await _tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(request.InstanceId);
        if (instance is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        if (instance.IsLockedForOperatorEdit())
            return Error.Validation("TourInstance.LockedForEdit", "Lịch trình đang chờ duyệt, không thể chỉnh sửa.");

        var instanceDay = instance.InstanceDays.FirstOrDefault(d => d.Id == request.DayId);
        if (instanceDay is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, "Tour instance day not found.");

        var activity = instanceDay.Activities.FirstOrDefault(a => a.Id == request.ActivityId);
        if (activity is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, "Activity not found.");

        var performedBy = _user.Id ?? string.Empty;

        if (request.Note is not null)
            activity.Note = request.Note;
        if (request.StartTime.HasValue)
            activity.StartTime = request.StartTime;
        if (request.EndTime.HasValue)
            activity.EndTime = request.EndTime;
        if (request.IsOptional.HasValue)
            activity.IsOptional = request.IsOptional.Value;
        if (request.Price.HasValue)
            activity.Price = request.Price.Value;

        if (activity.ActivityType == TourDayActivityType.Accommodation)
        {
            var nextRoomType = request.RoomType ?? activity.Accommodation?.RoomType;
            var nextQuantity = request.RoomCount ?? activity.Accommodation?.Quantity ?? 1;

            var nextStartTime = activity.StartTime;
            var nextEndTime = activity.EndTime;

            DateTimeOffset? checkInTime = nextStartTime.HasValue
                ? new DateTimeOffset(instanceDay.ActualDate.ToDateTime(nextStartTime.Value), TimeSpan.Zero)
                : null;
            DateTimeOffset? checkOutTime = nextEndTime.HasValue
                ? new DateTimeOffset(instanceDay.ActualDate.ToDateTime(nextEndTime.Value), TimeSpan.Zero)
                : null;

            if (checkInTime.HasValue && checkOutTime.HasValue && checkOutTime.Value < checkInTime.Value)
            {
                checkOutTime = checkOutTime.Value.AddDays(1);
            }

            if (activity.Accommodation is null)
            {
                activity.Accommodation = TourInstancePlanAccommodationEntity.Create(
                    tourInstanceDayActivityId: activity.Id,
                    roomType: nextRoomType,
                    quantity: nextQuantity,
                    checkInTime: checkInTime,
                    checkOutTime: checkOutTime);
            }
            else
            {
                activity.Accommodation.RoomType = nextRoomType;
                activity.Accommodation.Quantity = nextQuantity;
                activity.Accommodation.CheckInTime = checkInTime;
                activity.Accommodation.CheckOutTime = checkOutTime;
            }
        }

        if (activity.ActivityType == TourDayActivityType.Transportation && request.TransportationType.HasValue)
        {
            var oldIsExternal = activity.TransportationType.IsExternalOnly();
            var newIsExternal = request.TransportationType.IsExternalOnly();

            if (oldIsExternal != newIsExternal && activity.TransportSupplierId.HasValue)
            {
                return Error.Validation(
                    TourInstanceTransportErrors.CannotChangeTransportGroupWithSupplierAssignedCode,
                    TourInstanceTransportErrors.CannotChangeTransportGroupWithSupplierAssignedDescription.En);
            }

            var tourId = instance.TourId;
            var fromLocId = activity.FromLocationId;
            var toLocId = activity.ToLocationId;

            if (request.FromLocationId.HasValue || !string.IsNullOrWhiteSpace(request.FromLocationName))
            {
                var resolvedFrom = await ResolveLocationAsync(request.FromLocationId, request.FromLocationName, tourId);
                fromLocId = resolvedFrom?.Id;
            }
            else if (request.FromLocationId == Guid.Empty)
            {
                fromLocId = null;
            }

            if (request.ToLocationId.HasValue || !string.IsNullOrWhiteSpace(request.ToLocationName))
            {
                var resolvedTo = await ResolveLocationAsync(request.ToLocationId, request.ToLocationName, tourId);
                toLocId = resolvedTo?.Id;
            }
            else if (request.ToLocationId == Guid.Empty)
            {
                toLocId = null;
            }

            activity.UpdateTransportPlan(
                request.TransportationType,
                request.TransportationName ?? activity.TransportationName,
                fromLocId,
                toLocId,
                request.DepartureTime,
                request.ArrivalTime,
                request.RequestedVehicleType,
                request.RequestedSeatCount,
                request.ExternalTransportReference,
                performedBy);
        }

        activity.LastModifiedBy = performedBy;
        activity.LastModifiedOnUtc = DateTimeOffset.UtcNow;

        // Recalc uses the already-tracked `instance`; SaveChanges happens inside Recalc.
        // Avoid loading TourInstance twice (would throw "instance already being tracked").
        await RecalculatePrivateTourFinalPriceAsync(request.InstanceId, instance);

        return _mapper.Map<TourInstanceDayActivityDto>(activity);
    }

    public async Task<ErrorOr<TourInstanceDayActivityDto>> CreateActivity(CreateTourInstanceActivityCommand request)
    {
        var instance = await _tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(request.InstanceId);
        if (instance is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        if (instance.IsLockedForOperatorEdit())
            return Error.Validation("TourInstance.LockedForEdit", "Lịch trình đang chờ duyệt, không thể chỉnh sửa.");

        var day = instance.InstanceDays.FirstOrDefault(d => d.Id == request.DayId);
        if (day is null)
            return Error.NotFound("TourInstanceDay.NotFound", "Day not found.");

        int order = day.Activities.Count > 0 ? day.Activities.Max(a => a.Order) + 1 : 1;

        Guid? fromLocId = null;
        Guid? toLocId = null;

        if (request.ActivityType == TourDayActivityType.Transportation)
        {
            var tourId = instance.TourId;
            if (request.FromLocationId.HasValue || !string.IsNullOrWhiteSpace(request.FromLocationName))
            {
                var resolvedFrom = await ResolveLocationAsync(request.FromLocationId, request.FromLocationName, tourId);
                fromLocId = resolvedFrom?.Id;
            }

            if (request.ToLocationId.HasValue || !string.IsNullOrWhiteSpace(request.ToLocationName))
            {
                var resolvedTo = await ResolveLocationAsync(request.ToLocationId, request.ToLocationName, tourId);
                toLocId = resolvedTo?.Id;
            }
        }

        var activity = TourInstanceDayActivityEntity.Create(
            request.DayId,
            order,
            request.ActivityType,
            request.Title,
            _user.Id ?? "system",
            request.Description,
            request.Note,
            request.StartTime,
            request.EndTime,
            request.IsOptional,
            fromLocId,
            toLocId,
            request.TransportationType,
            request.TransportationName,
            null, // durationMinutes
            request.Price,
            request.ExternalTransportReference
        );

        if (request.ActivityType == TourDayActivityType.Transportation)
        {
            if (request.TransportationType.HasValue)
            {
                activity.UpdateTransportPlan(
                    request.TransportationType,
                    request.TransportationName,
                    fromLocId,
                    toLocId,
                    request.DepartureTime,
                    request.ArrivalTime,
                    request.RequestedVehicleType,
                    request.RequestedSeatCount,
                    request.ExternalTransportReference,
                    _user.Id ?? "system");
            }
        }
        else if (request.ActivityType == TourDayActivityType.Accommodation)
        {
            DateTimeOffset? checkInTime = request.StartTime.HasValue
                ? new DateTimeOffset(day.ActualDate.ToDateTime(request.StartTime.Value), TimeSpan.Zero)
                : null;
            DateTimeOffset? checkOutTime = request.EndTime.HasValue
                ? new DateTimeOffset(day.ActualDate.ToDateTime(request.EndTime.Value), TimeSpan.Zero)
                : null;

            if (checkInTime.HasValue && checkOutTime.HasValue && checkOutTime.Value < checkInTime.Value)
            {
                checkOutTime = checkOutTime.Value.AddDays(1);
            }

            activity.Accommodation = TourInstancePlanAccommodationEntity.Create(
                tourInstanceDayActivityId: activity.Id,
                roomType: request.RoomType,
                quantity: request.RoomCount ?? 1,
                checkInTime: checkInTime,
                checkOutTime: checkOutTime);
        }

        // Use AddAsync (via repo) to explicitly mark the entry as Added — adding to the
        // tracked Activities collection leaves EF guessing the state, and because the
        // entity's CreatedOnUtc is set in Create(), the Update fixup heuristic won't flip
        // it back to Added, causing EF to emit UPDATE (0 rows) instead of INSERT.
        await _tourInstanceRepository.AddInstanceDayActivity(activity);

        await RecalculatePrivateTourFinalPriceAsync(request.InstanceId, instance);

        return _mapper.Map<TourInstanceDayActivityDto>(activity);
    }

    public async Task<ErrorOr<Success>> DeleteActivity(DeleteTourInstanceActivityCommand request)
    {
        var instance = await _tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(request.InstanceId);
        if (instance is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        if (instance.IsLockedForOperatorEdit())
            return Error.Validation("TourInstance.LockedForEdit", "Lịch trình đang chờ duyệt, không thể chỉnh sửa.");

        var day = instance.InstanceDays.FirstOrDefault(d => d.Id == request.DayId);
        if (day is null)
            return Error.NotFound("TourInstanceDay.NotFound", "Day not found.");

        var activity = day.Activities.FirstOrDefault(a => a.Id == request.ActivityId);
        if (activity is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, "Activity not found.");

        await _tourInstanceRepository.DeleteInstanceDayActivity(activity);

        await RecalculatePrivateTourFinalPriceAsync(request.InstanceId, instance);

        return Result.Success;
    }
    private async Task RecalculatePrivateTourFinalPriceAsync(Guid instanceId, TourInstanceEntity? loadedInstance = null)
    {
        var instance = loadedInstance ?? await _tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(instanceId);
        if (instance == null) return;

        if (instance.InstanceType != TourType.Private)
        {
            await _tourInstanceRepository.Update(instance);
            if (_unitOfWork != null)
            {
                await _unitOfWork.SaveChangeAsync();
            }
            return;
        }

        // OriginalBasePrice is the immutable per-person snapshot set at creation time
        // (kept for historical reference). The displayed BasePrice for a private custom
        // tour reflects the sum of all activity prices designed by the operator.
        decimal totalActivitiesPrice = instance.InstanceDays
            .Where(d => !d.IsDeleted)
            .SelectMany(d => d.Activities)
            .Sum(a => a.Price ?? 0);

        instance.BasePrice = totalActivitiesPrice;

        // Always invoke repo Update — runs the ICreationAuditable state-fixup that flips
        // newly-added entities (with client-generated keys like Guid.CreateVersion7) from
        // Modified back to Added. Without this, EF emits UPDATE for inserts → 0 rows affected.
        await _tourInstanceRepository.Update(instance);

        // Sync associated booking TotalPrice so the booking detail view stays accurate.
        if (_bookingRepository != null)
        {
            var bookings = await _bookingRepository.GetByTourInstanceIdAsync(instanceId);
            var booking = bookings.FirstOrDefault();
            if (booking != null)
            {
                // Tính lại TotalPrice đầy đủ: pricing tier (trẻ em/trẻ nhỏ) + thuế
                // Giống RequestPublicPrivateTourCommand dùng priceCalculator.Calculate
                decimal totalPrice;
                if (_priceCalculator != null && _taxConfigRepository != null)
                {
                    var taxConfigs = await _taxConfigRepository.GetListAsync(t => t.IsActive);
                    var activeTaxConfig = taxConfigs.FirstOrDefault();

                    IReadOnlyList<Domain.ValueObjects.PricingPolicyTier>? tiers = null;
                    if (_pricingPolicyRepository != null)
                    {
                        var policy = await _pricingPolicyRepository.GetActivePolicyByTourType(instance.InstanceType)
                            ?? await _pricingPolicyRepository.GetDefaultPolicy();
                        tiers = policy?.Tiers;
                    }

                    var breakdown = _priceCalculator.Calculate(booking, instance, tiers, activeTaxConfig, paidAmount: 0m);
                    totalPrice = breakdown.TotalAmount;
                }
                else
                {
                    // Fallback: chỉ nhân đơn giản nếu thiếu dependencies (không nên xảy ra trong production)
                    totalPrice = (instance.BasePrice * booking.NumberAdult + instance.BasePrice * booking.NumberChild * 0.75m) + instance.BasePrice*0.1m;
                }

                booking.TotalPrice = totalPrice;
                // Detach navigation graph so EF's Update(...) graph-attacher does not try to
                // re-attach the TourInstance (which is already tracked by Recalc above).
                booking.TourInstance = null!;
                booking.User = null!;
                booking.BookingParticipants = null!;
                await _bookingRepository.UpdateWithoutSaveAsync(booking);
            }
        }

        if (_unitOfWork != null)
        {
            await _unitOfWork.SaveChangeAsync();
        }
    }

    /// <summary>
    /// Compute a worst-status-wins rollup from per-activity <c>TransportationApprovalStatus</c>.
    /// Returns <see cref="ProviderApprovalStatus"/> as int: 0 = unassigned, 1 = Pending, 2 = Approved, 3 = Rejected.
    /// </summary>
    private static int ComputeTransportApprovalRollup(TourInstanceEntity entity, HashSet<Guid> supplierIds)
    {
        var activities = entity.InstanceDays
            .Where(d => !d.IsDeleted)
            .SelectMany(d => d.Activities)
            .Where(a => a.ActivityType == TourDayActivityType.Transportation
                     && a.TransportSupplierId.HasValue
                     && supplierIds.Contains(a.TransportSupplierId.Value))
            .ToList();

        if (activities.Count == 0) return 0;

        var hasRejected = false;
        var hasPending = false;
        var hasApproved = false;
        var allApproved = true;

        foreach (var a in activities)
        {
            switch (a.TransportationApprovalStatus)
            {
                case ProviderApprovalStatus.Rejected:
                    hasRejected = true;
                    allApproved = false;
                    break;
                case ProviderApprovalStatus.Pending:
                    hasPending = true;
                    allApproved = false;
                    break;
                case ProviderApprovalStatus.Approved:
                    hasApproved = true;
                    break;
                default:
                    allApproved = false;
                    break;
            }
        }

        // Worst-status-wins: Rejected > Pending > Approved > Unassigned
        if (hasRejected) return (int)ProviderApprovalStatus.Rejected;
        if (hasPending) return (int)ProviderApprovalStatus.Pending;
        if (allApproved && hasApproved) return (int)ProviderApprovalStatus.Approved;
        return 0;
    }

    private static decimal ComputeAssignedRevenue(TourInstanceEntity entity, HashSet<Guid> supplierIds)
    {
        return entity.InstanceDays
            .Where(d => !d.IsDeleted)
            .SelectMany(d => d.Activities)
            .Where(a => (a.TransportSupplierId.HasValue && supplierIds.Contains(a.TransportSupplierId.Value))
                     || (a.Accommodation?.SupplierId != null && supplierIds.Contains(a.Accommodation.SupplierId.Value)))
            .Sum(a => a.Price ?? 0);
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
