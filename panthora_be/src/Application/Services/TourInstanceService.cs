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
using ErrorOr;
using Microsoft.Extensions.Logging;

namespace Application.Services;

public interface ITourInstanceService
{
    Task<ErrorOr<Guid>> Create(CreateTourInstanceCommand request);
    Task<ErrorOr<Success>> Update(UpdateTourInstanceCommand request);
    Task<ErrorOr<Success>> Delete(Guid id);
    Task<ErrorOr<Success>> ChangeStatus(Guid id, TourInstanceStatus newStatus);
    Task<ErrorOr<Success>> ProviderApprove(Guid instanceId, bool isApproved, string? note, CancellationToken cancellationToken = default);
    Task<ErrorOr<PaginatedList<TourInstanceVm>>> GetProviderAssigned(int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<ErrorOr<PaginatedList<TourInstanceVm>>> GetAll(GetAllTourInstancesQuery request);
    Task<ErrorOr<TourInstanceDto>> GetDetail(Guid id);
    Task<ErrorOr<TourInstanceStatsDto>> GetStats();
    Task<ErrorOr<PaginatedList<TourInstanceVm>>> GetPublicAvailable(string? destination, string? sortBy, int page, int pageSize, string? language = null);
    Task<ErrorOr<TourInstanceDto>> GetPublicDetail(Guid id, string? language = null);
    Task<ErrorOr<CheckDuplicateTourInstanceResultDto>> CheckDuplicate(Guid tourId, Guid classificationId, DateTimeOffset startDate);
    Task<ErrorOr<TourInstanceDayDto>> UpdateDay(UpdateTourInstanceDayCommand request);
    Task<ErrorOr<Guid>> AddCustomDay(CreateTourInstanceDayCommand request);
    Task<ErrorOr<TourDayActivityDto>> UpdateActivity(UpdateTourInstanceActivityCommand request);
}

public class TourInstanceService(
    ITourInstanceRepository tourInstanceRepository,
    ITourRepository tourRepository,
    ITourRequestRepository tourRequestRepository,
    ISupplierRepository supplierRepository,
    IMailRepository mailRepository,
    IUser user,
    IMapper mapper,
    ILogger<TourInstanceService> logger) : ITourInstanceService
{
    private readonly ITourInstanceRepository _tourInstanceRepository = tourInstanceRepository;
    private readonly ITourRepository _tourRepository = tourRepository;
    private readonly ITourRequestRepository _tourRequestRepository = tourRequestRepository;
    private readonly ISupplierRepository _supplierRepository = supplierRepository;
    private readonly IMailRepository _mailRepository = mailRepository;
    private readonly IUser _user = user;
    private readonly IMapper _mapper = mapper;
    private readonly ILogger<TourInstanceService> _logger = logger;

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
            thumbnail: thumbnail,
            images: request.ImageUrls?.Select(url => new ImageEntity { PublicURL = url }).ToList(),
            includedServices: request.IncludedServices,
            hotelProviderId: request.HotelProviderId,
            transportProviderId: request.TransportProviderId);

        if (request.GuideUserIds?.Count > 0)
        {
            foreach (var userId in request.GuideUserIds.Distinct())
            {
                entity.Managers.Add(TourInstanceManagerEntity.Create(
                    entity.Id, userId, TourInstanceManagerRole.Guide, performedBy));
            }
        }

        entity.Managers.Add(TourInstanceManagerEntity.Create(
            entity.Id, creatorUserId, TourInstanceManagerRole.Manager, performedBy));

        try
        {
            await _tourInstanceRepository.Create(entity);

            // Clone InstanceDays from Classification.Plans
            var tourDays = classification.Plans
                .Where(d => !d.IsDeleted)
                .OrderBy(d => d.DayNumber);

            foreach (var tourDay in tourDays)
            {
                var translations = ConvertTourDayTranslation(tourDay.Translations);
                var actualDate = DateOnly.FromDateTime(entity.StartDate.DateTime);

                entity.InstanceDays.Add(TourInstanceDayEntity.Create(
                    tourInstanceId: entity.Id,
                    tourDayId: tourDay.Id,
                    instanceDayNumber: tourDay.DayNumber,
                    actualDate: actualDate.AddDays(tourDay.DayNumber - 1),
                    title: tourDay.Title,
                    description: tourDay.Description,
                    translations: translations,
                    performedBy: performedBy));
            }

            await _tourInstanceRepository.Update(entity);

            // Link TourRequest to this instance if TourRequestId was provided
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

    public async Task<ErrorOr<Success>> Update(UpdateTourInstanceCommand request)
    {
        var entity = await _tourInstanceRepository.FindById(request.Id);
        if (entity is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        var performedBy = _user.Id ?? string.Empty;

        // Update Managers
        entity.Managers.Clear();
        if (request.GuideUserIds?.Count > 0)
        {
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
        return Result.Success;
    }

    public async Task<ErrorOr<Success>> ProviderApprove(Guid instanceId, bool isApproved, string? note, CancellationToken cancellationToken = default)
    {
        if (!Guid.TryParse(_user.Id, out var currentUserId))
            return Error.Unauthorized(ErrorConstants.User.UnauthorizedCode, ErrorConstants.User.UnauthorizedDescription);

        var supplier = await _supplierRepository.FindByOwnerUserIdAsync(currentUserId, cancellationToken);
        if (supplier is null)
            return Error.NotFound(ErrorConstants.Supplier.NotFoundCode, "Current user is not associated with any supplier.");

        var instance = await _tourInstanceRepository.FindById(instanceId);
        if (instance is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        if (supplier.Id != instance.HotelProviderId && supplier.Id != instance.TransportProviderId)
            return Error.Validation("TourInstance.ProviderNotAssigned", "You are not assigned as a provider for this tour instance.");

        instance.ApproveByProvider(supplier.Id, isApproved, note);
        await _tourInstanceRepository.Update(instance);
        return Result.Success;
    }

    public async Task<ErrorOr<PaginatedList<TourInstanceVm>>> GetProviderAssigned(int pageNumber, int pageSize, CancellationToken cancellationToken = default)
    {
        if (!Guid.TryParse(_user.Id, out var currentUserId))
            return Error.Unauthorized(ErrorConstants.User.UnauthorizedCode, ErrorConstants.User.UnauthorizedDescription);

        var supplier = await _supplierRepository.FindByOwnerUserIdAsync(currentUserId, cancellationToken);
        if (supplier is null)
            return Error.NotFound(ErrorConstants.Supplier.NotFoundCode, "Current user is not associated with any supplier.");

        var entities = await _tourInstanceRepository.FindProviderAssigned(supplier.Id, pageNumber, pageSize, cancellationToken);
        var total = await _tourInstanceRepository.CountProviderAssigned(supplier.Id, cancellationToken);

        var vms = entities.Select(e => _mapper.Map<TourInstanceVm>(e)).ToList();
        return new PaginatedList<TourInstanceVm>(total, vms, pageNumber, pageSize);
    }

    public async Task<ErrorOr<PaginatedList<TourInstanceVm>>> GetAll(GetAllTourInstancesQuery request)
    {
        var entities = await _tourInstanceRepository.FindAll(request.SearchText, request.Status, request.PageNumber, request.PageSize);
        var total = await _tourInstanceRepository.CountAll(request.SearchText, request.Status);

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
        var (total, available, confirmed, soldOut) = await _tourInstanceRepository.GetStats();
        return new TourInstanceStatsDto(total, available, confirmed, soldOut);
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