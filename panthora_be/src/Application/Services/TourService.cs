using Contracts;
using Contracts.Interfaces;
using Application.Common;
using Application.Common.Constant;
using Application.Dtos;
using Application.Features.Tour.Commands;
using Application.Features.Tour.Queries;
using Application.Features.Admin.Queries;
using Application.Tours.Commands;
using Application.Features.Manager.DTOs;
using Application.Features.Manager.Queries;
using AutoMapper;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Entities.Translations;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using Microsoft.Extensions.Logging;

namespace Application.Services;

public interface ITourService
{
    Task<ErrorOr<Guid>> Create(CreateTourCommand request, bool isManager);
    Task<ErrorOr<Success>> Update(UpdateTourCommand request, bool isManager);
    Task<ErrorOr<Success>> Delete(Guid id);
    Task<ErrorOr<Success>> UpdateStatus(Guid id, TourStatus status);
    Task<ErrorOr<PaginatedList<TourVm>>> GetMyTours(GetMyToursQuery request);
    Task<ErrorOr<PaginatedList<TourVm>>> GetAdminTourManagement(GetAdminTourManagementQuery request);
    Task<ErrorOr<TourDto>> GetDetail(Guid id);
    Task<ErrorOr<TourDto>> ReviewTour(Guid tourId, TourReviewAction action, string? reason);
    Task<ErrorOr<TourManagementStatsDto>> GetAdminTourManagementStats(Application.Features.Manager.Queries.GetTourManagementStatsQuery request);
}

public class TourService(
    ITourRepository tourRepository,
    IUser user,
    IUnitOfWork unitOfWork,
    IMapper mapper,
    ILogger<TourService>? logger = null,
    ILanguageContext? languageContext = null) : ITourService
{
    private readonly ITourRepository _tourRepository = tourRepository;
    private readonly IUser _user = user;
    private readonly IUnitOfWork _unitOfWork = unitOfWork;
    private readonly IMapper _mapper = mapper;
    private readonly ILogger<TourService>? _logger = logger;
    private readonly ILanguageContext _languageContext = languageContext ?? new FallbackLanguageContext();

    // Tracks created locations within a single Create() call for deduplication.
    // Key: (normalized name, city, country). Value: created TourPlanLocationEntity.
    private Dictionary<(string Name, string? City, string? Country), TourPlanLocationEntity>? _locationCache;

    private static ImageEntity ToImageEntity(ImageInputDto dto) =>
        ImageEntity.Create(dto.FileId, dto.OriginalFileName, dto.FileName, dto.PublicURL);

    private static ImageDto? ToImageDto(ImageEntity? image)
    {
        if (image is null)
        {
            return null;
        }

        var hasValue = !string.IsNullOrWhiteSpace(image.FileId)
            || !string.IsNullOrWhiteSpace(image.OriginalFileName)
            || !string.IsNullOrWhiteSpace(image.FileName)
            || !string.IsNullOrWhiteSpace(image.PublicURL);

        return hasValue
            ? new ImageDto(image.FileId, image.OriginalFileName, image.FileName, image.PublicURL)
            : null;
    }

    public async Task<ErrorOr<Guid>> Create(CreateTourCommand request, bool isManager)
    {
        _locationCache = new Dictionary<(string Name, string? City, string? Country), TourPlanLocationEntity>();
        try
        {
            var thumbnail = request.Thumbnail is not null ? ToImageEntity(request.Thumbnail) : new ImageEntity();
            var images = request.Images?.Select(ToImageEntity).ToList() ?? [];

            var tourDesignerId = _user.Id is not null && Guid.TryParse(_user.Id, out var userIdGuid)
                ? (Guid?)userIdGuid
                : null;

            // Non-managers (TourDesigners) cannot set the status themselves —
            // tours must always start as Pending and go through the Manager review workflow.
            var effectiveStatus = isManager ? request.Status : TourStatus.Pending;

            var tour = TourEntity.Create(
            request.TourName,
            request.ShortDescription,
            request.LongDescription,
            _user.Id ?? string.Empty,
            effectiveStatus,
            tourScope: request.TourScope,
            customerSegment: request.CustomerSegment,
            seoTitle: request.SEOTitle,
            seoDescription: request.SEODescription,
            thumbnail: thumbnail,
            images: images,
            tourDesignerId: tourDesignerId,
            continent: request.Continent);

            const int maxTourCodeGenerationAttempts = 10;
            var tourCodeGenerationAttempts = 0;
            while (await _tourRepository.ExistsByTourCode(tour.TourCode) && tourCodeGenerationAttempts < maxTourCodeGenerationAttempts)
            {
                tour.TourCode = TourEntity.GenerateTourCode();
                tourCodeGenerationAttempts++;
            }

            if (await _tourRepository.ExistsByTourCode(tour.TourCode))
            {
                return Error.Conflict(
                    ErrorConstants.Tour.DuplicateCodeCode,
                    string.Format(ErrorConstants.Tour.DuplicateCodeDescriptionTemplate, tour.TourCode));
            }

            tour.Translations = NormalizeTranslations(request.Translations);

            // Add Classifications with Plans, Activities, Insurances
            if (request.Classifications != null)
            {
                foreach (var cls in request.Classifications)
                {
                    var classification = TourClassificationEntity.Create(
                        tour.Id,
                        cls.Name,
                        cls.BasePrice,
                        cls.Description,
                        cls.NumberOfDay,
                        cls.NumberOfNight,
                        _user.Id ?? string.Empty);
                    classification.Translations = NormalizeTranslationsFromPayload(cls.Translations);

                    // Add Plans (Days)
                    foreach (var plan in cls.Plans)
                    {
                        var day = TourDayEntity.Create(
                            classification.Id,
                            plan.DayNumber,
                            plan.Title,
                            _user.Id ?? string.Empty,
                            plan.Description);
                        day.Translations = NormalizeTranslationsFromPayload(plan.Translations);

                        // Add Activities
                        foreach (var act in plan.Activities)
                        {
                            var activityOrder = plan.Activities.IndexOf(act) + 1;
                            var activityType = Enum.TryParse<TourDayActivityType>(act.ActivityType, out var at) ? at : TourDayActivityType.Other;
                            TimeOnly? startTime = null;
                            TimeOnly? endTime = null;

                            if (!string.IsNullOrWhiteSpace(act.StartTime) && TimeOnly.TryParse(act.StartTime, out var st))
                            {
                                startTime = st;
                            }
                            if (!string.IsNullOrWhiteSpace(act.EndTime) && TimeOnly.TryParse(act.EndTime, out var et))
                            {
                                endTime = et;
                            }

                            var enTranslation = act.Translations?.GetValueOrDefault("en");
                            var viTranslation = act.Translations?.GetValueOrDefault("vi");
                            
                            var fromLocationName = enTranslation?.FromLocationName 
                                ?? viTranslation?.FromLocationName
                                ?? act.Translations?.Values.FirstOrDefault(t => !string.IsNullOrWhiteSpace(t.FromLocationName))?.FromLocationName;
                                
                            var toLocationName = enTranslation?.ToLocationName 
                                ?? viTranslation?.ToLocationName
                                ?? act.Translations?.Values.FirstOrDefault(t => !string.IsNullOrWhiteSpace(t.ToLocationName))?.ToLocationName;
                            
                            var fromLocation = await ResolveLocationAsync(act.FromLocationId, fromLocationName, tour);
                            var toLocation = await ResolveLocationAsync(act.ToLocationId, toLocationName, tour);

                            TransportationType? routeTransportType = null;
                            if (!string.IsNullOrWhiteSpace(act.TransportationType))
                            {
                                if (EnumHelper.TryParseDefinedEnum<TransportationType>(act.TransportationType, out var tType))
                                {
                                    routeTransportType = tType;
                                }
                            }

                            var activity = TourDayActivityEntity.Create(
                                day.Id,
                                activityOrder,
                                activityType,
                                act.Title,
                                _user.Id ?? string.Empty,
                                act.Description,
                                act.Note,
                                startTime,
                                endTime,
                                act.EstimatedCost,
                                act.IsOptional,
                                fromLocation?.Id ?? act.FromLocationId,
                                toLocation?.Id ?? act.ToLocationId,
                                routeTransportType,
                                act.TransportationName,
                                act.DurationMinutes,
                                act.DistanceKm,
                                act.Price,
                                act.BookingReference);

                            activity.Translations = NormalizeTranslationsFromPayload(act.Translations);
                            activity.FromLocation = fromLocation;
                            activity.ToLocation = toLocation;

                            // Add Accommodation
                            if (act.Accommodation != null && !string.IsNullOrWhiteSpace(act.Accommodation.AccommodationName))
                            {
                                var parsedRoomType = !string.IsNullOrWhiteSpace(act.Accommodation.RoomType)
                                    && Enum.TryParse<Domain.Enums.RoomType>(act.Accommodation.RoomType, ignoreCase: true, out var rt)
                                    ? rt
                                    : Domain.Enums.RoomType.Double;

                                var accommodation = TourPlanAccommodationEntity.Create(
                                    act.Accommodation.AccommodationName ?? "Unnamed Accommodation",
                                    parsedRoomType,
                                    act.Accommodation.RoomCapacity ?? 2,
                                    Domain.Enums.MealType.None,
                                    _user.Id ?? string.Empty,
                                    act.Accommodation.CheckInTime != null && TimeOnly.TryParse(act.Accommodation.CheckInTime, out var cit) ? cit : null,
                                    act.Accommodation.CheckOutTime != null && TimeOnly.TryParse(act.Accommodation.CheckOutTime, out var cot) ? cot : null,
                                    null, // roomPrice
                                    null, // numberOfRooms
                                    null, // numberOfNights
                                    null, // totalPrice
                                    null, // specialRequest
                                    act.Accommodation.Address,
                                    null, // city
                                    act.Accommodation.ContactPhone,
                                    null, // website
                                    null, // imageUrl
                                    null, // latitude
                                    null, // longitude
                                    act.Accommodation.Note);

                                accommodation.Translations = NormalizeTranslationsFromPayload(act.Accommodation.Translations);
                                activity.Accommodation = accommodation;
                            }

                            day.Activities.Add(activity);
                        }

                        classification.Plans.Add(day);
                    }

                    // Add Insurances
                    foreach (var ins in cls.Insurances)
                    {
                        var insuranceType = Enum.TryParse<InsuranceType>(ins.InsuranceType, out var it) ? it : InsuranceType.None;

                        var insurance = TourInsuranceEntity.Create(
                            ins.InsuranceName,
                            insuranceType,
                            ins.InsuranceProvider,
                            ins.CoverageDescription,
                            ins.CoverageAmount,
                            ins.CoverageFee,
                            _user.Id ?? string.Empty,
                            ins.IsOptional,
                            ins.Note);
                        insurance.Translations = NormalizeTranslationsFromPayload(ins.Translations);

                        classification.Insurances.Add(insurance);
                    }

                    tour.Classifications.Add(classification);
                }
            }

            // Standalone Accommodations, Locations, Transportations and Services are persisted as TourResources
            if (request.Accommodations?.Count > 0)
            {
                foreach (var acc in request.Accommodations.Where(a => !string.IsNullOrWhiteSpace(a.AccommodationName)))
                {
                    var resource = TourResourceEntity.Create(
                        tour.Id,
                        TourResourceType.Accommodation,
                        acc.AccommodationName!,
                        _user.Id ?? string.Empty,
                        address: acc.Address,
                        contactPhone: acc.ContactPhone,
                        checkInTime: acc.CheckInTime,
                        checkOutTime: acc.CheckOutTime,
                        note: acc.Note);
                    tour.Resources.Add(resource);
                }
            }
            if (request.Locations?.Count > 0)
            {
                foreach (var loc in request.Locations)
                {
                    // Validator guarantees LocationType is a valid enum
                    _ = EnumHelper.TryParseDefinedEnum<LocationType>(loc.LocationType, out var locType);
                    var entity = TourPlanLocationEntity.Create(
                        loc.LocationName,
                        locType,
                        _user.Id ?? string.Empty,
                        tour.Id,
                        locationDescription: loc.Description,
                        address: loc.Address,
                        city: loc.City,
                        country: loc.Country,
                        entranceFee: loc.EntranceFee);
                    entity.Translations = NormalizeTranslationsFromPayload(loc.Translations);
                    tour.PlanLocations.Add(entity);
                }
            }
            if (request.Transportations?.Count > 0)
            {
                foreach (var tr in request.Transportations)
                {
                    var name = NormalizeTransportationName(tr);
                    var resource = TourResourceEntity.Create(
                        tour.Id,
                        TourResourceType.Transportation,
                        name,
                        _user.Id ?? string.Empty,
                        transportationType: tr.TransportationType,
                        transportationName: tr.TransportationName,
                        durationMinutes: tr.DurationMinutes,
                        price: tr.Price,
                        pricingType: tr.PricingType,
                        requiresIndividualTicket: tr.RequiresIndividualTicket,
                        ticketInfo: tr.TicketInfo,
                        note: tr.Note,
                        fromLocationId: tr.FromLocationId,
                        toLocationId: tr.ToLocationId);
                    resource.Translations = NormalizeTransportationTranslations(tr.Translations);
                    tour.Resources.Add(resource);
                }
            }
            if (request.Services?.Count > 0)
            {
                foreach (var svc in request.Services)
                {
                    var resource = TourResourceEntity.Create(
                        tour.Id,
                        TourResourceType.Service,
                        svc.ServiceName,
                        _user.Id ?? string.Empty,
                        contactEmail: svc.Email,
                        contactPhone: svc.ContactNumber,
                        price: svc.Price ?? svc.SalePrice,
                        pricingType: svc.PricingType);
                    tour.Resources.Add(resource);
                }
            }

            await _tourRepository.Create(tour);
            await _unitOfWork.SaveChangeAsync();
            return tour.Id;
        }
        finally
        {
            _locationCache = null;
        }
    }

    public async Task<ErrorOr<Success>> Update(UpdateTourCommand request, bool isManager)
    {
        var tour = await _tourRepository.FindByIdForUpdate(request.Id);
        if (tour is null)
            return Error.NotFound(ErrorConstants.Tour.NotFoundCode, ErrorConstants.Tour.NotFoundDescription);

        if (await _tourRepository.ExistsByTourCode(tour.TourCode, request.Id))
        {
            _logger?.LogWarning("ExistsByTourCode check returned true for TourCode: {TourCode}, excluding Id: {Id}", tour.TourCode, request.Id);
            return Error.Conflict(
                ErrorConstants.Tour.DuplicateCodeCode,
                string.Format(ErrorConstants.Tour.DuplicateCodeDescriptionTemplate, tour.TourCode));
        }

        if (request.IfUnmodifiedSince.HasValue && tour.LastModifiedOnUtc.HasValue && (tour.LastModifiedOnUtc.Value - request.IfUnmodifiedSince.Value).TotalSeconds > 1)
        {
            _logger?.LogWarning("IfUnmodifiedSince check failed. DB time: {DbTime}, Request time: {ReqTime}", tour.LastModifiedOnUtc, request.IfUnmodifiedSince);
            return Error.Conflict(
                "Tour.ConcurrencyConflict",
                "Tour was modified by another user. Please refresh and try again.");
        }

        var isResubmission = !isManager
            && (tour.Status == TourStatus.Rejected || tour.Status == TourStatus.Active)
            && request.Status == TourStatus.Pending;

        // Access control for TourDesigners
        if (!isManager)
        {
            var currentUserIdGuid = Guid.TryParse(_user.Id, out var userIdGuid) ? userIdGuid : Guid.Empty;
            if (tour.TourDesignerId != currentUserIdGuid)
            {
                return Error.Unauthorized(ErrorConstants.User.UnauthorizedCode, ErrorConstants.User.UnauthorizedDescription);
            }
        }

        var effectiveStatus =
            isManager ? request.Status :
            isResubmission ? TourStatus.Pending :
            tour.Status;

        // Update thumbnail in-place if provided (avoids shared-type EF Core issue)
        // Update images in-place — EF Core can track owned entities this way
        if (request.Thumbnail is not null)
        {
            tour.Thumbnail ??= new ImageEntity();
            tour.Thumbnail.FileId = request.Thumbnail.FileId;
            tour.Thumbnail.OriginalFileName = request.Thumbnail.OriginalFileName;
            tour.Thumbnail.FileName = request.Thumbnail.FileName;
            tour.Thumbnail.PublicURL = request.Thumbnail.PublicURL;
        }

        // Update Images in-place — EF Core can track owned entities this way
        if (request.Images is not null)
        {
            var newFileIds = request.Images.Where(i => i.FileId is not null).Select(i => i.FileId!).ToHashSet();
            // Remove images not in the new list
            var toRemove = tour.Images.Where(i => i.FileId is null || !newFileIds.Contains(i.FileId)).ToList();
            foreach (var img in toRemove) tour.Images.Remove(img);

            // Update or add images
            foreach (var dto in request.Images)
            {
                var existing = tour.Images.FirstOrDefault(i => i.FileId == dto.FileId);
                if (existing is not null)
                {
                    existing.OriginalFileName = dto.OriginalFileName;
                    existing.FileName = dto.FileName;
                    existing.PublicURL = dto.PublicURL;
                }
                else
                {
                    tour.Images.Add(new ImageEntity
                    {
                        FileId = dto.FileId,
                        OriginalFileName = dto.OriginalFileName,
                        FileName = dto.FileName,
                        PublicURL = dto.PublicURL,
                    });
                }
            }
        }

        tour.Update(
            request.TourName,
            request.ShortDescription,
            request.LongDescription,
            effectiveStatus,
            _user.Id ?? string.Empty,
            tourScope: request.TourScope,
            customerSegment: request.CustomerSegment,
            seoTitle: request.SEOTitle,
            seoDescription: request.SEODescription,
            tourDesignerId: tour.TourDesignerId,
            continent: request.Continent);

        if (isResubmission)
        {
            tour.RejectionReason = null;
        }

        MergeTranslations(tour, request.Translations);

        // Nested classifications update (upsert)
        if (request.Classifications != null)
        {
            await UpdateClassificationsAsync(tour, request.Classifications);
        }

        // Cascade soft-delete removed classifications and their nested entities
        if (request.DeletedClassificationIds != null && request.DeletedClassificationIds.Count > 0)
        {
            await CascadeDeleteClassificationsAsync(tour, request.DeletedClassificationIds);
        }

        // Cascade soft-delete removed activities and their nested routes/accommodations
        if (request.DeletedActivityIds != null && request.DeletedActivityIds.Count > 0)
        {
            await CascadeDeleteActivitiesAsync(tour, request.DeletedActivityIds);
        }

        // Cascade soft-delete removed plans and their nested activities
        if (request.DeletedPlanIds != null && request.DeletedPlanIds.Count > 0)
        {
            await CascadeDeletePlansAsync(tour, request.DeletedPlanIds);
        }

        // Standalone Accommodations, Locations, Transportations and Services are merged as TourResources
        if (request.Accommodations?.Count > 0)
        {
            foreach (var acc in request.Accommodations.Where(a => !string.IsNullOrWhiteSpace(a.AccommodationName)))
            {
                var resource = TourResourceEntity.Create(
                    tour.Id,
                    TourResourceType.Accommodation,
                    acc.AccommodationName!,
                    _user.Id ?? string.Empty,
                    address: acc.Address,
                    contactPhone: acc.ContactPhone,
                    checkInTime: acc.CheckInTime,
                    checkOutTime: acc.CheckOutTime,
                    note: acc.Note);
                tour.Resources.Add(resource);
            }
        }
        if (request.Locations?.Count > 0)
        {
            foreach (var loc in request.Locations)
            {
                // Validator guarantees LocationType is a valid enum
                _ = EnumHelper.TryParseDefinedEnum<LocationType>(loc.LocationType, out var locType);
                var entity = TourPlanLocationEntity.Create(
                    loc.LocationName,
                    locType,
                    _user.Id ?? string.Empty,
                    tour.Id,
                    locationDescription: loc.Description,
                    address: loc.Address,
                    city: loc.City,
                    country: loc.Country,
                    entranceFee: loc.EntranceFee);
                entity.Translations = NormalizeTranslationsFromPayload(loc.Translations);
                tour.PlanLocations.Add(entity);
            }
        }
        if (request.Transportations?.Count > 0)
        {
            foreach (var tr in request.Transportations)
            {
                var name = NormalizeTransportationName(tr);
                var resource = TourResourceEntity.Create(
                    tour.Id,
                    TourResourceType.Transportation,
                    name,
                    _user.Id ?? string.Empty,
                    transportationType: tr.TransportationType,
                    transportationName: tr.TransportationName,
                    durationMinutes: tr.DurationMinutes,
                    price: tr.Price,
                    pricingType: tr.PricingType,
                    requiresIndividualTicket: tr.RequiresIndividualTicket,
                    ticketInfo: tr.TicketInfo,
                    note: tr.Note,
                    fromLocationId: tr.FromLocationId,
                    toLocationId: tr.ToLocationId);
                resource.Translations = NormalizeTransportationTranslations(tr.Translations);
                tour.Resources.Add(resource);
            }
        }
        // Update Services (replace-on-submit)
        var providedServiceIds = request.Services?.Where(s => s.Id.HasValue).Select(s => s.Id!.Value).ToHashSet() ?? new HashSet<Guid>();

        foreach (var existingSvc in tour.Resources.Where(r => !r.IsDeleted && r.Type == TourResourceType.Service))
        {
            if (!providedServiceIds.Contains(existingSvc.Id))
            {
                existingSvc.SoftDelete(_user.Id ?? string.Empty);
            }
        }

        if (request.Services?.Count > 0)
        {
            foreach (var svc in request.Services)
            {
                if (svc.Id.HasValue && svc.Id != Guid.Empty)
                {
                    var existingSvc = tour.Resources.FirstOrDefault(r => r.Id == svc.Id.Value && r.Type == TourResourceType.Service);
                    if (existingSvc != null)
                    {
                        existingSvc.Update(
                            svc.ServiceName,
                            _user.Id ?? string.Empty,
                            contactEmail: svc.Email,
                            contactPhone: svc.ContactNumber,
                            price: svc.Price ?? svc.SalePrice,
                            pricingType: svc.PricingType);
                        existingSvc.Translations = NormalizeTranslationsFromPayload(svc.Translations);
                        continue;
                    }
                }

                var resource = TourResourceEntity.Create(
                    tour.Id,
                    TourResourceType.Service,
                    svc.ServiceName,
                    _user.Id ?? string.Empty,
                    contactEmail: svc.Email,
                    contactPhone: svc.ContactNumber,
                    price: svc.Price ?? svc.SalePrice,
                    pricingType: svc.PricingType);
                resource.Translations = NormalizeTranslationsFromPayload(svc.Translations);
                tour.Resources.Add(resource);
            }
        }

        await _tourRepository.Update(tour);
        try
        {
            await _unitOfWork.SaveChangeAsync();
            return Result.Success;
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException ex)
        {
            var entries = ex.Entries.Select(e => e.Entity.GetType().Name + " (State: " + e.State + ")").ToList();
            var entriesStr = string.Join(", ", entries);

            // Return Failure instead of Conflict because stale requests are caught by IfUnmodifiedSince.
            // This represents an unexpected database-level concurrency issue (e.g., ID collision or ghost updates).
            return Error.Failure(
                "Tour.UpdateFailure.DbUpdate",
                $"Unexpected database update failure. Entities: {entriesStr}");
        }
    }

    public async Task<ErrorOr<Success>> Delete(Guid id)
    {
        var tour = await _tourRepository.FindById(id);
        if (tour is null)
            return Error.NotFound(ErrorConstants.Tour.NotFoundCode, ErrorConstants.Tour.NotFoundDescription);

        var performedBy = _user.Id ?? string.Empty;
        CascadeSoftDelete(tour, performedBy);
        await _unitOfWork.SaveChangeAsync();
        return Result.Success;
    }

    public async Task<ErrorOr<Success>> UpdateStatus(Guid id, TourStatus status)
    {
        var userId = _user.Id ?? string.Empty;
        var rowsAffected = await _tourRepository.UpdateStatus(id, status, userId);
        if (rowsAffected == 0)
            return Error.NotFound(ErrorConstants.Tour.NotFoundCode, ErrorConstants.Tour.NotFoundDescription);

        return Result.Success;
    }

    /// <summary>
    /// Recursively soft-deletes the tour entity and all its nested entities
    /// (Classifications, Plans, Activities, Routes, Locations, Insurances, Resources, Accommodations).
    /// </summary>
    private static void CascadeSoftDelete(TourEntity tour, string performedBy)
    {
        tour.SoftDelete(performedBy);

        foreach (var classification in tour.Classifications)
        {
            CascadeSoftDeleteClassification(classification, performedBy);
        }

        foreach (var resource in tour.Resources)
        {
            resource.SoftDelete(performedBy);
        }

        foreach (var location in tour.PlanLocations)
        {
            location.SoftDelete(performedBy);
        }
    }

    private static void CascadeSoftDeleteClassification(TourClassificationEntity classification, string performedBy)
    {
        classification.SoftDelete(performedBy);

        foreach (var plan in classification.Plans)
        {
            CascadeSoftDeletePlan(plan, performedBy);
        }

        foreach (var insurance in classification.Insurances)
        {
            insurance.SoftDelete(performedBy);
        }
    }

    private static void CascadeSoftDeletePlan(TourDayEntity plan, string performedBy)
    {
        plan.SoftDelete(performedBy);

        foreach (var activity in plan.Activities)
        {
            CascadeSoftDeleteActivity(activity, performedBy);
        }
    }

    private static void CascadeSoftDeleteActivity(TourDayActivityEntity activity, string performedBy)
    {
        activity.SoftDelete(performedBy);

        if (activity.Accommodation != null)
        {
            activity.Accommodation.SoftDelete(performedBy);
        }

        if (activity.FromLocation != null)
        {
            activity.FromLocation.SoftDelete(performedBy);
        }

        if (activity.ToLocation != null)
        {
            activity.ToLocation.SoftDelete(performedBy);
        }
    }

    public async Task<ErrorOr<PaginatedList<TourVm>>> GetMyTours(GetMyToursQuery request)
    {
        var userIdString = _user.Id;
        if (string.IsNullOrWhiteSpace(userIdString) || !Guid.TryParse(userIdString, out var userId))
        {
            return Error.Unauthorized(ErrorConstants.User.UnauthorizedCode, ErrorConstants.User.UnauthorizedDescription);
        }

        var tours = await _tourRepository.FindAll(request.SearchText, request.PageNumber, request.PageSize, principalId: userId, status: request.Status, tourScope: request.TourScope, continent: request.Continent);
        var total = await _tourRepository.CountAll(request.SearchText, principalId: userId, status: request.Status, tourScope: request.TourScope, continent: request.Continent);
        var currentLanguage = _languageContext.CurrentLanguage;

        var tourVms = tours.Select(t =>
        {
            var translated = t.ResolveTranslation(currentLanguage);
            return new TourVm(
                t.Id,
                t.TourCode,
                translated.TourName,
                translated.ShortDescription,
                t.Status.ToString(),
                ToImageDto(t.Thumbnail),
                t.CreatedOnUtc);
        }).ToList();

        return new PaginatedList<TourVm>(total, tourVms, request.PageNumber, request.PageSize);
    }

    public async Task<ErrorOr<PaginatedList<TourVm>>> GetAdminTourManagement(GetAdminTourManagementQuery request)
    {
        var tours = await _tourRepository.FindAllAdmin(request.SearchText, request.Status, request.PageNumber, request.PageSize, request.ManagerId, tourScope: request.TourScope, continent: request.Continent);
        var total = await _tourRepository.CountAllAdmin(request.SearchText, request.Status, request.ManagerId, tourScope: request.TourScope, continent: request.Continent);
        var currentLanguage = _languageContext.CurrentLanguage;

        var tourVms = tours.Select(t =>
        {
            var translated = t.ResolveTranslation(currentLanguage);
            return new TourVm(
                t.Id,
                t.TourCode,
                translated.TourName,
                translated.ShortDescription,
                t.Status.ToString(),
                ToImageDto(t.Thumbnail),
                t.CreatedOnUtc);
        }).ToList();

        return new PaginatedList<TourVm>(total, tourVms, request.PageNumber, request.PageSize);
    }

    public async Task<ErrorOr<TourDto>> GetDetail(Guid id)
    {
        var tour = await _tourRepository.FindById(id, asNoTracking: true);
        if (tour is null)
            return Error.NotFound(ErrorConstants.Tour.NotFoundCode, ErrorConstants.Tour.NotFoundDescription);

        tour.ApplyResolvedTranslations(_languageContext.CurrentLanguage);
        return _mapper.Map<TourDto>(tour);
    }

    public async Task<ErrorOr<TourDto>> ReviewTour(Guid tourId, TourReviewAction action, string? reason)
    {
        var tour = await _tourRepository.FindById(tourId);
        if (tour is null)
            return Error.NotFound(ErrorConstants.Tour.NotFoundCode, ErrorConstants.Tour.NotFoundDescription);

        if (tour.Status != TourStatus.Pending)
            return Error.Conflict("Tour.InvalidStatus", "Only pending tours can be reviewed.");

        switch (action)
        {
            case TourReviewAction.Approve:
                tour.Status = TourStatus.Active;
                tour.RejectionReason = null;
                break;

            case TourReviewAction.Reject:
                if (string.IsNullOrWhiteSpace(reason))
                    return Error.Validation("Tour.ReasonRequired", "Rejection reason is required.");
                tour.Status = TourStatus.Rejected;
                tour.RejectionReason = reason;
                break;

            default:
                return Error.Validation("Tour.InvalidAction", $"Invalid review action: {action}");
        }

        tour.LastModifiedBy = _user.Id ?? string.Empty;
        tour.LastModifiedOnUtc = DateTimeOffset.UtcNow;
        await _unitOfWork.SaveChangeAsync();

        tour.ApplyResolvedTranslations(_languageContext.CurrentLanguage);
        return _mapper.Map<TourDto>(tour);
    }

    private static Dictionary<string, TourTranslationData> NormalizeTranslations(
        Dictionary<string, TourTranslationData>? translations)
    {
        var result = new Dictionary<string, TourTranslationData>(StringComparer.OrdinalIgnoreCase);
        if (translations is null || translations.Count == 0)
        {
            return result;
        }

        foreach (var translation in translations)
        {
            if (string.IsNullOrWhiteSpace(translation.Key) || translation.Value is null)
            {
                continue;
            }

            result[translation.Key.ToLowerInvariant()] = translation.Value;
        }

        return result;
    }

    private static Dictionary<string, TTranslation> NormalizeTranslationsFromPayload<TTranslation>(
        Dictionary<string, TTranslation>? translations) where TTranslation : class
    {
        if (translations == null || translations.Count == 0)
            return [];
        return translations.ToDictionary(
            kvp => kvp.Key.ToLowerInvariant(),
            kvp => kvp.Value,
            StringComparer.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Resolves a location: uses the provided LocationId if available,
    /// otherwise looks up or creates a TourPlanLocationEntity for the given name.
    /// Returns null when neither an id nor a name is supplied so callers don't
    /// wire ghost "Unknown" locations onto entities. Newly-created locations are
    /// attached to <paramref name="tour"/> and marked added so EF inserts them
    /// on the Update path (where the graph is already tracked).
    /// </summary>
    private async Task<TourPlanLocationEntity?> ResolveLocationAsync(Guid? locationId, string? locationName, TourEntity tour)
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
                existingLocation.TourId = tour.Id;
                return existingLocation;
            }
            // Fallback stub — FK target did not exist; track as added.
            var stub = TourPlanLocationEntity.Create(
                locationName ?? "Referenced Location",
                LocationType.Other,
                _user.Id ?? string.Empty,
                tour.Id);
            AttachNewLocation(tour, stub);
            return stub;
        }

        _locationCache ??= new Dictionary<(string Name, string? City, string? Country), TourPlanLocationEntity>();
        var key = (locationName!.Trim(), (string?)null, (string?)null);
        if (_locationCache.TryGetValue(key, out var cached))
        {
            return cached;
        }

        var location = TourPlanLocationEntity.Create(
            locationName.Trim(),
            LocationType.Other,
            _user.Id ?? string.Empty,
            tour.Id);
        _locationCache[key] = location;
        AttachNewLocation(tour, location);
        return location;
    }

    private void AttachNewLocation(TourEntity tour, TourPlanLocationEntity location)
    {
        if (!tour.PlanLocations.Contains(location))
        {
            tour.PlanLocations.Add(location);
        }
        _unitOfWork.MarkAsAdded(location);
    }

    /// <summary>
    /// Builds the display name for a Transportation resource.
    /// If translations are provided, resolves the current language name; otherwise falls back to
    /// "FromLocationName -> ToLocationName" or the TransportationName.
    /// </summary>
    private static string NormalizeTransportationName(TransportationDto dto)
    {
        if (dto.Translations != null && dto.Translations.Count > 0)
        {
            var lang = dto.Translations.Keys.FirstOrDefault(k => k.Equals("vi", StringComparison.OrdinalIgnoreCase))
                ?? dto.Translations.Keys.First();
            if (dto.Translations.TryGetValue(lang, out var data) && data != null)
            {
                var from = data.FromLocationName ?? dto.FromLocationName ?? "";
                var to = data.ToLocationName ?? dto.ToLocationName ?? "";
                var name = data.TransportationName ?? dto.TransportationName;
                if (!string.IsNullOrWhiteSpace(name)) return name;
                if (!string.IsNullOrWhiteSpace(from) || !string.IsNullOrWhiteSpace(to))
                    return $"{from} -> {to}";
            }
        }

        if (!string.IsNullOrWhiteSpace(dto.FromLocationName) || !string.IsNullOrWhiteSpace(dto.ToLocationName))
        {
            return $"{dto.FromLocationName} -> {dto.ToLocationName}";
        }

        return dto.TransportationName ?? dto.TransportationType;
    }

    private static Dictionary<string, Domain.Entities.Translations.TourResourceTranslationData> NormalizeTransportationTranslations(
        Dictionary<string, TourTransportationTranslationData>? translations)
    {
        if (translations == null || translations.Count == 0)
            return [];
        return translations.ToDictionary(
            kvp => kvp.Key.ToLowerInvariant(),
            kvp => new Domain.Entities.Translations.TourResourceTranslationData
            {
                FromLocationName = kvp.Value.FromLocationName,
                ToLocationName = kvp.Value.ToLocationName,
                TransportationName = kvp.Value.TransportationName,
                TicketInfo = kvp.Value.TicketInfo,
                Note = kvp.Value.Note
            },
            StringComparer.OrdinalIgnoreCase);
    }

    private static void MergeTranslations(TourEntity tour, Dictionary<string, TourTranslationData>? translations)
    {
        if (translations is null || translations.Count == 0)
        {
            return;
        }

        var normalized = NormalizeTranslations(translations);
        foreach (var translation in normalized)
        {
            tour.Translations[translation.Key] = translation.Value;
        }
    }

    private async Task UpdateClassificationsAsync(TourEntity tour, List<ClassificationDto> classifications)
    {
        foreach (var cls in classifications)
        {
            TourClassificationEntity? classification = null;
            var classificationId = cls.Id;

            if (classificationId.HasValue && classificationId != Guid.Empty)
            {
                classification = tour.Classifications.FirstOrDefault(c => c.Id == classificationId!.Value);
            }

            if (classification != null)
            {
                classification.Update(cls.Name, cls.BasePrice, cls.Description, cls.NumberOfDay, cls.NumberOfNight, _user.Id ?? string.Empty);
                classification.Translations = NormalizeTranslationsFromPayload(cls.Translations);
            }
            else
            {
                classification = TourClassificationEntity.Create(
                    tour.Id, cls.Name, cls.BasePrice, cls.Description,
                    cls.NumberOfDay, cls.NumberOfNight, _user.Id ?? string.Empty);
                _unitOfWork.MarkAsAdded(classification);
                classification.Translations = NormalizeTranslationsFromPayload(cls.Translations);
                tour.Classifications.Add(classification);
            }

            await UpdatePlansAsync(tour, classification, cls.Plans);

            // Update Insurances (replace-on-submit)
            var providedInsuranceIds = cls.Insurances.Where(i => i.Id.HasValue).Select(i => i.Id!.Value).ToHashSet();
            foreach (var existingIns in classification.Insurances.Where(i => !i.IsDeleted))
            {
                if (!providedInsuranceIds.Contains(existingIns.Id))
                {
                    existingIns.SoftDelete(_user.Id ?? string.Empty);
                }
            }

            foreach (var ins in cls.Insurances)
            {
                var insuranceType = Enum.TryParse<InsuranceType>(ins.InsuranceType, out var it) ? it : InsuranceType.None;

                if (ins.Id.HasValue && ins.Id != Guid.Empty)
                {
                    var existingIns = classification.Insurances.FirstOrDefault(i => i.Id == ins.Id.Value);
                    if (existingIns != null)
                    {
                        existingIns.Update(
                            ins.InsuranceName,
                            insuranceType,
                            ins.InsuranceProvider,
                            ins.CoverageDescription,
                            ins.CoverageAmount,
                            ins.CoverageFee,
                            _user.Id ?? string.Empty,
                            ins.IsOptional,
                            ins.Note);
                        existingIns.Translations = NormalizeTranslationsFromPayload(ins.Translations);
                        continue;
                    }
                }

                var insurance = TourInsuranceEntity.Create(
                    ins.InsuranceName,
                    insuranceType,
                    ins.InsuranceProvider,
                    ins.CoverageDescription,
                    ins.CoverageAmount,
                    ins.CoverageFee,
                    _user.Id ?? string.Empty,
                    ins.IsOptional,
                    ins.Note);
                _unitOfWork.MarkAsAdded(insurance);
                insurance.Translations = NormalizeTranslationsFromPayload(ins.Translations);

                classification.Insurances.Add(insurance);
            }
        }
    }

    private async Task UpdatePlansAsync(TourEntity tour, TourClassificationEntity classification, List<DayPlanDto> plans)
    {
        foreach (var plan in plans)
        {
            TourDayEntity? day = null;
            var planId = plan.Id;

            if (planId.HasValue && planId != Guid.Empty)
            {
                day = classification.Plans.FirstOrDefault(p => p.Id == planId!.Value);
            }

            if (day != null)
            {
                day.Update(plan.DayNumber, plan.Title, _user.Id ?? string.Empty, plan.Description);
                day.Translations = NormalizeTranslationsFromPayload(plan.Translations);
            }
            else
            {
                day = TourDayEntity.Create(
                    classification.Id, plan.DayNumber, plan.Title,
                    _user.Id ?? string.Empty, plan.Description);
                _unitOfWork.MarkAsAdded(day);
                day.Translations = NormalizeTranslationsFromPayload(plan.Translations);
                classification.Plans.Add(day);
            }

            await UpdateActivitiesAsync(tour, day, plan.Activities);
        }
    }

    private async Task UpdateActivitiesAsync(TourEntity tour, TourDayEntity day, List<ActivityDto> activities)
    {
        foreach (var act in activities)
        {
            TourDayActivityEntity? activity = null;
            var activityId = act.Id;

            if (activityId.HasValue && activityId != Guid.Empty)
            {
                activity = day.Activities.FirstOrDefault(a => a.Id == activityId!.Value);
            }

            var activityType = Enum.TryParse<TourDayActivityType>(act.ActivityType, out var at) ? at : TourDayActivityType.Other;
            var activityOrder = activities.IndexOf(act) + 1;
            TimeOnly? startTime = null;
            TimeOnly? endTime = null;
            if (!string.IsNullOrWhiteSpace(act.StartTime) && TimeOnly.TryParse(act.StartTime, out var st)) startTime = st;
            if (!string.IsNullOrWhiteSpace(act.EndTime) && TimeOnly.TryParse(act.EndTime, out var et)) endTime = et;

            var enTranslation = act.Translations?.GetValueOrDefault("en");
            var viTranslation = act.Translations?.GetValueOrDefault("vi");
            
            var fromLocationName = enTranslation?.FromLocationName 
                ?? viTranslation?.FromLocationName
                ?? act.Translations?.Values.FirstOrDefault(t => !string.IsNullOrWhiteSpace(t.FromLocationName))?.FromLocationName;
                
            var toLocationName = enTranslation?.ToLocationName 
                ?? viTranslation?.ToLocationName
                ?? act.Translations?.Values.FirstOrDefault(t => !string.IsNullOrWhiteSpace(t.ToLocationName))?.ToLocationName;
            
            var fromLocation = await ResolveLocationAsync(act.FromLocationId, fromLocationName, tour);
            var toLocation = await ResolveLocationAsync(act.ToLocationId, toLocationName, tour);

            TransportationType? routeTransportType = null;
            if (!string.IsNullOrWhiteSpace(act.TransportationType))
            {
                if (EnumHelper.TryParseDefinedEnum<TransportationType>(act.TransportationType, out var tType))
                {
                    routeTransportType = tType;
                }
            }

            if (activity != null)
            {
                activity.Update(activityOrder, activityType, act.Title, _user.Id ?? string.Empty,
                    act.Description, act.Note, startTime, endTime, act.EstimatedCost, act.IsOptional,
                    fromLocation?.Id ?? act.FromLocationId,
                    toLocation?.Id ?? act.ToLocationId,
                    routeTransportType,
                    act.TransportationName,
                    act.DurationMinutes,
                    act.DistanceKm,
                    act.Price,
                    act.BookingReference);
                activity.Translations = NormalizeTranslationsFromPayload(act.Translations);
                activity.FromLocation = fromLocation;
                activity.ToLocation = toLocation;

                // Add or Update Accommodation
                if (act.Accommodation != null && !string.IsNullOrWhiteSpace(act.Accommodation.AccommodationName))
                {
                    var parsedRoomType = !string.IsNullOrWhiteSpace(act.Accommodation.RoomType)
                        && Enum.TryParse<Domain.Enums.RoomType>(act.Accommodation.RoomType, ignoreCase: true, out var rt)
                        ? rt : Domain.Enums.RoomType.Standard;

                    if (activity.Accommodation != null)
                    {
                        activity.Accommodation.Update(
                            act.Accommodation.AccommodationName,
                            parsedRoomType,
                            act.Accommodation.RoomCapacity ?? 2,
                            Domain.Enums.MealType.None,
                            _user.Id ?? string.Empty,
                            act.Accommodation.CheckInTime != null && TimeOnly.TryParse(act.Accommodation.CheckInTime, out var cit) ? cit : null,
                            act.Accommodation.CheckOutTime != null && TimeOnly.TryParse(act.Accommodation.CheckOutTime, out var cot) ? cot : null,
                            act.Accommodation.RoomPrice,
                            act.Accommodation.NumberOfRooms,
                            act.Accommodation.NumberOfNights,
                            null, // TotalPrice not in DTO
                            act.Accommodation.SpecialRequest,
                            act.Accommodation.Address,
                            null, // City not in DTO
                            act.Accommodation.ContactPhone,
                            null, // Website not in DTO
                            null, // ImageUrl not in DTO
                            act.Accommodation.Latitude,
                            act.Accommodation.Longitude,
                            act.Accommodation.Note);
                        activity.Accommodation.Translations = NormalizeTranslationsFromPayload(act.Accommodation.Translations);
                    }
                    else
                    {
                        var accommodation = TourPlanAccommodationEntity.Create(
                            act.Accommodation.AccommodationName ?? "Unnamed Accommodation",
                            parsedRoomType,
                            act.Accommodation.RoomCapacity ?? 2,
                            Domain.Enums.MealType.None,
                            _user.Id ?? string.Empty,
                            act.Accommodation.CheckInTime != null && TimeOnly.TryParse(act.Accommodation.CheckInTime, out var cit) ? cit : null,
                            act.Accommodation.CheckOutTime != null && TimeOnly.TryParse(act.Accommodation.CheckOutTime, out var cot) ? cot : null,
                            act.Accommodation.RoomPrice,
                            act.Accommodation.NumberOfRooms,
                            act.Accommodation.NumberOfNights,
                            null, // TotalPrice not in DTO
                            act.Accommodation.SpecialRequest,
                            act.Accommodation.Address,
                            null, // City not in DTO
                            act.Accommodation.ContactPhone,
                            null, // Website not in DTO
                            null, // ImageUrl not in DTO
                            act.Accommodation.Latitude,
                            act.Accommodation.Longitude,
                            act.Accommodation.Note);
                        _unitOfWork.MarkAsAdded(accommodation);
                        accommodation.Translations = NormalizeTranslationsFromPayload(act.Accommodation.Translations);
                        accommodation.TourDayActivityId = activity.Id;
                        activity.Accommodation = accommodation;
                    }
                }
                else if (activity.Accommodation != null)
                {
                    activity.Accommodation.SoftDelete(_user.Id ?? string.Empty);
                }
            }
            else
            {
                activity = TourDayActivityEntity.Create(
                    day.Id, activityOrder, activityType, act.Title,
                    _user.Id ?? string.Empty, act.Description, act.Note,
                    startTime, endTime, act.EstimatedCost, act.IsOptional,
                    fromLocation?.Id ?? act.FromLocationId,
                    toLocation?.Id ?? act.ToLocationId,
                    routeTransportType,
                    act.TransportationName,
                    act.DurationMinutes,
                    act.DistanceKm,
                    act.Price,
                    act.BookingReference);
                _unitOfWork.MarkAsAdded(activity);
                activity.Translations = NormalizeTranslationsFromPayload(act.Translations);
                activity.FromLocation = fromLocation;
                activity.ToLocation = toLocation;

                // Add Accommodation
                if (act.Accommodation != null && !string.IsNullOrWhiteSpace(act.Accommodation.AccommodationName))
                {
                    var parsedRoomType = !string.IsNullOrWhiteSpace(act.Accommodation.RoomType)
                        && Enum.TryParse<Domain.Enums.RoomType>(act.Accommodation.RoomType, ignoreCase: true, out var rt)
                        ? rt : Domain.Enums.RoomType.Standard;

                    var accommodation = TourPlanAccommodationEntity.Create(
                        act.Accommodation.AccommodationName ?? "Unnamed Accommodation",
                        parsedRoomType,
                        act.Accommodation.RoomCapacity ?? 2,
                        Domain.Enums.MealType.None,
                        _user.Id ?? string.Empty,
                        act.Accommodation.CheckInTime != null && TimeOnly.TryParse(act.Accommodation.CheckInTime, out var cit) ? cit : null,
                        act.Accommodation.CheckOutTime != null && TimeOnly.TryParse(act.Accommodation.CheckOutTime, out var cot) ? cot : null,
                        act.Accommodation.RoomPrice,
                        act.Accommodation.NumberOfRooms,
                        act.Accommodation.NumberOfNights,
                        null, // TotalPrice not in DTO
                        act.Accommodation.SpecialRequest,
                        act.Accommodation.Address,
                        null, // City not in DTO
                        act.Accommodation.ContactPhone,
                        null, // Website not in DTO
                        null, // ImageUrl not in DTO
                        act.Accommodation.Latitude,
                        act.Accommodation.Longitude,
                        act.Accommodation.Note);
                    _unitOfWork.MarkAsAdded(accommodation);
                    accommodation.Translations = NormalizeTranslationsFromPayload(act.Accommodation.Translations);
                    accommodation.TourDayActivityId = activity.Id;
                    activity.Accommodation = accommodation;
                }

                await Task.CompletedTask;
                day.Activities.Add(activity);
            }
        }
    }

    /// <summary>
    /// Cascade soft-deletes classifications and all their nested entities
    /// (Plans, Activities, Routes, Locations, Insurances, Accommodations).
    /// </summary>
    private async Task CascadeDeleteClassificationsAsync(TourEntity tour, List<Guid> deletedIds)
    {
        var deletedSet = new HashSet<Guid>(deletedIds);
        var toDelete = tour.Classifications.Where(c => deletedSet.Contains(c.Id)).ToList();

        foreach (var classification in toDelete)
        {
            CascadeSoftDeleteClassification(classification, _user.Id ?? string.Empty);
        }
        await Task.CompletedTask;
    }

    /// <summary>
    /// Cascade soft-deletes plans and all their nested activities.
    /// </summary>
    private async Task CascadeDeletePlansAsync(TourEntity tour, List<Guid> deletedIds)
    {
        var deletedSet = new HashSet<Guid>(deletedIds);
        foreach (var classification in tour.Classifications)
        {
            var toDelete = classification.Plans.Where(p => deletedSet.Contains(p.Id)).ToList();
            foreach (var plan in toDelete)
            {
                CascadeSoftDeletePlan(plan, _user.Id ?? string.Empty);
            }
        }
        await Task.CompletedTask;
    }

    /// <summary>
    /// Cascade soft-deletes standalone activities (from day plans) and their
    /// nested routes and accommodations.
    /// </summary>
    private async Task CascadeDeleteActivitiesAsync(TourEntity tour, List<Guid> deletedActivityIds)
    {
        var deletedSet = new HashSet<Guid>(deletedActivityIds);
        foreach (var classification in tour.Classifications)
        {
            foreach (var plan in classification.Plans)
            {
                var toDelete = plan.Activities.Where(a => deletedSet.Contains(a.Id)).ToList();
                foreach (var activity in toDelete)
                {
                    CascadeSoftDeleteActivity(activity, _user.Id ?? string.Empty);
                }
            }
        }
        await Task.CompletedTask;
    }

    public async Task<ErrorOr<Application.Features.Manager.DTOs.TourManagementStatsDto>> GetAdminTourManagementStats(Application.Features.Manager.Queries.GetTourManagementStatsQuery request)
    {
        var total = await _tourRepository.CountAllAdmin(request.SearchText, null, request.ManagerId, request.TourScope, request.Continent);
        var active = await _tourRepository.CountAllAdmin(request.SearchText, TourStatus.Active, request.ManagerId, request.TourScope, request.Continent);
        var inactive = await _tourRepository.CountAllAdmin(request.SearchText, TourStatus.Inactive, request.ManagerId, request.TourScope, request.Continent);
        var rejected = await _tourRepository.CountAllAdmin(request.SearchText, TourStatus.Rejected, request.ManagerId, request.TourScope, request.Continent);

        return new Application.Features.Manager.DTOs.TourManagementStatsDto(
            Total: total,
            Active: active,
            Inactive: inactive,
            Rejected: rejected
        );
    }

    private sealed class FallbackLanguageContext : ILanguageContext
    {
        public string CurrentLanguage { get; set; } = ILanguageContext.DefaultLanguage;
    }
}
