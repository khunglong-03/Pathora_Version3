using System.Text.Json;

using Api.Endpoint;
using Application.Common.Constant;
using Application.Common.Interfaces;
using Application.Contracts.Booking;
using Application.Dtos;
using Application.Features.Tour.Commands;
using Application.Features.Tour.Commands.PurgeTour;
using Application.Features.Tour.Queries;
using Application.Services;
using Domain.Common.Repositories;
using Domain.Entities.Translations;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Authorize(Policy = "ManagerOnly")]
[Authorize(Roles = RoleConstants.Admin_Manager_TourDesigner)]
[Route(TourEndpoint.Base)]
public class TourController(
    IFileService fileService,
    IFileManager fileManager,
    ITourRepository tourRepository) : BaseApiController
{
    private static readonly HashSet<string> AllowedImageMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/avif"
    };

    private static readonly JsonSerializerOptions TranslationJsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private static readonly JsonSerializerOptions ClassificationJsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        NumberHandling = System.Text.Json.Serialization.JsonNumberHandling.AllowReadingFromString
    };

    private static readonly JsonSerializerOptions ImageInputJsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? searchText,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await Sender.Send(new GetAllToursQuery(searchText, pageNumber, pageSize));
        return HandleResult(result);
    }

    [HttpGet(TourEndpoint.Id)]
    public async Task<IActionResult> GetDetail(Guid id)
    {
        var result = await Sender.Send(new GetTourDetailQuery(id));
        return HandleResult(result);
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Create(
        [FromForm] string tourName,
        [FromForm] string shortDescription,
        [FromForm] string longDescription,
        [FromForm] string? seoTitle,
        [FromForm] string? seoDescription,
        [FromForm] TourStatus status,
        IFormFile? thumbnail,
        [FromForm] List<IFormFile>? images,
        [FromForm] string? translations = null,
        [FromForm] string? classifications = null,
        [FromForm] string? accommodations = null,
        [FromForm] string? locations = null,
        [FromForm] string? transportations = null,
        [FromForm] string? services = null,
        [FromForm] Guid? visaPolicyId = null,
        [FromForm] Guid? depositPolicyId = null,
        [FromForm] Guid? pricingPolicyId = null,
        [FromForm] Guid? cancellationPolicyId = null,
        [FromForm] TourScope tourScope = TourScope.Domestic,
        [FromForm] Domain.Enums.Continent? continent = null,
        [FromForm] CustomerSegment customerSegment = CustomerSegment.Group)
    {
        // Validate JSON fields before processing
        var validationErrors = new Dictionary<string, string[]>();

        if (!TryParseTranslations(translations, out _, out var translationError))
            validationErrors["translations"] = [translationError!];
        if (!TryParseClassifications(classifications, out _, out var classificationError))
            validationErrors["classifications"] = [classificationError!];
        if (!TryParseAccommodations(accommodations, out _, out var accommodationError))
            validationErrors["accommodations"] = [accommodationError!];
        if (!TryParseLocations(locations, out _, out var locationError))
            validationErrors["locations"] = [locationError!];
        if (!TryParseTransportations(transportations, out _, out var transportationError))
            validationErrors["transportations"] = [transportationError!];
        if (!TryParseServices(services, out _, out var serviceError))
            validationErrors["services"] = [serviceError!];

        if (validationErrors.Count > 0)
            return BadRequest(new ValidationProblemDetails(validationErrors));

        // Upload thumbnail and images in parallel
        ImageInputDto? thumbnailDto = null;
        List<ImageInputDto>? imageDtos = null;
        if (thumbnail is not null || (images is not null && images.Count > 0))
        {
            var tasks = new List<Task<ImageInputDto>>();
            if (thumbnail is not null)
                tasks.Add(UploadSingleFile(thumbnail));
            if (images is not null && images.Count > 0)
                tasks.AddRange(images.Select(f => UploadSingleFile(f)));

            var results = await Task.WhenAll(tasks);
            thumbnailDto = results[0];
            imageDtos = results.Length > 1 ? results.Skip(1).ToList() : null;
        }

        var translationData = ParseTranslations(translations);
        var classificationData = ParseClassifications(classifications);
        var accommodationData = ParseAccommodations(accommodations);
        var locationData = ParseLocations(locations);
        var transportationData = ParseTransportations(transportations);
        var serviceData = ParseServices(services);

        // Collect all uploaded object names for rollback on failure
        var uploadedObjectNames = new List<string>();
        if (thumbnailDto?.FileId is not null)
            uploadedObjectNames.Add(thumbnailDto.FileId);
        if (imageDtos is not null)
            uploadedObjectNames.AddRange(imageDtos.Select(i => i.FileId).Where(id => !string.IsNullOrEmpty(id)));

        try
        {
            var command = new CreateTourCommand(
                tourName,
                shortDescription ?? string.Empty,
                longDescription ?? string.Empty,
                seoTitle,
                seoDescription,
                status,
                thumbnailDto,
                imageDtos,
                translationData,
                classificationData,
                accommodationData,
                locationData,
                transportationData,
                serviceData,
                visaPolicyId,
                depositPolicyId,
                pricingPolicyId,
                cancellationPolicyId,
                tourScope,
                continent,
                customerSegment);

            var result = await Sender.Send(command);
            return HandleResult(result);
        }
        catch
        {
            // Rollback: delete any files that were uploaded before the command failed
            if (uploadedObjectNames.Count > 0)
            {
                try
                {
                    await fileManager.DeleteUploadedFilesAsync(uploadedObjectNames);
                }
                catch
                {
                    // Log but don't mask the original exception
                }
            }
            throw;
        }
    }

    [HttpPut]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Update(
        [FromForm] Guid id,
        [FromForm] string tourName,
        [FromForm] string shortDescription,
        [FromForm] string longDescription,
        [FromForm] string? seoTitle,
        [FromForm] string? seoDescription,
        [FromForm] TourStatus status,
        IFormFile? thumbnail,
        [FromForm] List<IFormFile>? images,
        [FromForm] string? existingImages = null,
        [FromForm] string? translations = null,
        [FromForm] string? classifications = null,
        [FromForm] string? accommodations = null,
        [FromForm] string? locations = null,
        [FromForm] string? transportations = null,
        [FromForm] string? services = null,
        [FromForm] Guid? visaPolicyId = null,
        [FromForm] Guid? depositPolicyId = null,
        [FromForm] Guid? pricingPolicyId = null,
        [FromForm] Guid? cancellationPolicyId = null,
        [FromForm] string? deletedClassificationIds = null,
        [FromForm] string? deletedActivityIds = null,
        [FromForm] TourScope tourScope = TourScope.Domestic,
        [FromForm] Domain.Enums.Continent? continent = null,
        [FromForm] CustomerSegment customerSegment = CustomerSegment.Group)
    {
        // Optional If-Unmodified-Since check for optimistic concurrency
        if (Request.Headers.TryGetValue("If-Unmodified-Since", out var unmodifiedSinceHeader)
            && DateTimeOffset.TryParse(unmodifiedSinceHeader, out var clientTimestamp))
        {
            var tour = await tourRepository.FindById(id, asNoTracking: true);
            if (tour?.LastModifiedOnUtc > clientTimestamp)
            {
                return Conflict(new { message = "Tour was modified by another user. Please refresh and try again." });
            }
        }

        // Validate JSON fields before processing
        var validationErrors = new Dictionary<string, string[]>();

        if (!TryParseTranslations(translations, out _, out var translationError))
            validationErrors["translations"] = [translationError!];
        if (!TryParseClassifications(classifications, out _, out var classificationError))
            validationErrors["classifications"] = [classificationError!];
        if (!TryParseAccommodations(accommodations, out _, out var accommodationError))
            validationErrors["accommodations"] = [accommodationError!];
        if (!TryParseLocations(locations, out _, out var locationError))
            validationErrors["locations"] = [locationError!];
        if (!TryParseTransportations(transportations, out _, out var transportationError))
            validationErrors["transportations"] = [transportationError!];
        if (!TryParseServices(services, out _, out var serviceError))
            validationErrors["services"] = [serviceError!];
        if (!string.IsNullOrEmpty(existingImages) && !TryParseExistingImages(existingImages, out _, out var existingImagesError))
            validationErrors["existingImages"] = [existingImagesError!];

        if (validationErrors.Count > 0)
            return BadRequest(new ValidationProblemDetails(validationErrors));

        // Upload new thumbnail
        ImageInputDto? thumbnailDto = null;
        if (thumbnail is not null)
            thumbnailDto = await UploadSingleFile(thumbnail);

        // Upload new images and merge with existing ones
        List<ImageInputDto>? imageDtos = null;
        var existingImageList = ParseExistingImages(existingImages);
        if (images is not null && images.Count > 0)
        {
            var uploaded = await UploadFiles(images);
            imageDtos = existingImageList is not null
                ? [.. existingImageList, .. uploaded]
                : uploaded;
        }
        else if (existingImageList is not null)
        {
            imageDtos = existingImageList;
        }

        var translationData = ParseTranslations(translations);
        var classificationData = ParseClassifications(classifications);
        var accommodationData = ParseAccommodations(accommodations);
        var locationData = ParseLocations(locations);
        var transportationData = ParseTransportations(transportations);
        var serviceData = ParseServices(services);

        // Parse deleted IDs for cascade soft-delete
        List<Guid>? parsedDeletedClassificationIds = null;
        if (!string.IsNullOrEmpty(deletedClassificationIds))
        {
            try
            {
                parsedDeletedClassificationIds = System.Text.Json.JsonSerializer
                    .Deserialize<List<Guid>>(deletedClassificationIds);
            }
            catch
            {
                // Ignore malformed JSON — service handles gracefully
            }
        }

        List<Guid>? parsedDeletedActivityIds = null;
        if (!string.IsNullOrEmpty(deletedActivityIds))
        {
            try
            {
                parsedDeletedActivityIds = System.Text.Json.JsonSerializer
                    .Deserialize<List<Guid>>(deletedActivityIds);
            }
            catch
            {
                // Ignore malformed JSON — service handles gracefully
            }
        }

        var command = new UpdateTourCommand(
            id, tourName, shortDescription, longDescription,
            seoTitle, seoDescription, status, thumbnailDto, imageDtos, translationData,
            classificationData, accommodationData, locationData, transportationData, serviceData,
            visaPolicyId, depositPolicyId, pricingPolicyId, cancellationPolicyId,
            parsedDeletedClassificationIds, parsedDeletedActivityIds,
            tourScope, continent, customerSegment);

        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [HttpDelete(TourEndpoint.Id)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await Sender.Send(new DeleteTourCommand(id));
        return HandleResult(result);
    }

    [Authorize(Roles = RoleConstants.Admin_Manager_TourDesigner)]
    [HttpPut(TourEndpoint.Status)]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateTourStatusRequestDto dto)
    {
        var result = await Sender.Send(new UpdateTourStatusCommand(id, dto.Status));
        return HandleResult(result);
    }

    [Authorize(Roles = RoleConstants.Admin)]
    [HttpDelete(TourEndpoint.Id + "/purge")]
    public async Task<IActionResult> Purge(Guid id)
    {
        var result = await Sender.Send(new PurgeTourCommand(id));
        return HandleResult(result);
    }

    private static bool IsValidImageFile(IFormFile file)
    {
        return file.Length > 0 && AllowedImageMimeTypes.Contains(file.ContentType ?? string.Empty);
    }

    private async Task<ImageInputDto> UploadSingleFile(IFormFile file)
    {
        if (!IsValidImageFile(file))
        {
            throw new BadHttpRequestException("Invalid file type. Allowed types: image/jpeg, image/png, image/webp, image/gif, image/avif.");
        }

        await using var stream = file.OpenReadStream();
        var meta = await fileService.UploadFileAsync(
            new Application.Contracts.File.UploadFileRequest(
                stream, file.FileName, file.ContentType ?? "application/octet-stream", file.Length));
        return new ImageInputDto(meta.Id.ToString(), meta.Name, meta.Name, meta.Url);
    }

    private async Task<List<ImageInputDto>> UploadFiles(List<IFormFile> files)
    {
        var result = new List<ImageInputDto>();
        foreach (var file in files)
        {
            result.Add(await UploadSingleFile(file));
        }
        return result;
    }

    private static Dictionary<string, TourTranslationData>? ParseTranslations(string? translations)
    {
        if (string.IsNullOrWhiteSpace(translations))
        {
            return null;
        }

        try
        {
            using var document = JsonDocument.Parse(translations);
            if (document.RootElement.ValueKind != JsonValueKind.Object)
            {
                return null;
            }

            var result = new Dictionary<string, TourTranslationData>(StringComparer.OrdinalIgnoreCase);

            foreach (var languageProperty in document.RootElement.EnumerateObject())
            {
                if (languageProperty.Value.ValueKind != JsonValueKind.Object)
                {
                    continue;
                }

                var translation = new TourTranslationData
                {
                    TourName = GetStringProperty(languageProperty.Value, "tourName", "description"),
                    ShortDescription = GetStringProperty(languageProperty.Value, "shortDescription"),
                    LongDescription = GetStringProperty(languageProperty.Value, "longDescription"),
                    SEOTitle = GetNullableStringProperty(languageProperty.Value, "seoTitle", "sEOTitle"),
                    SEODescription = GetNullableStringProperty(languageProperty.Value, "seoDescription", "sEODescription")
                };

                result[languageProperty.Name] = translation;
            }

            return result;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static string GetStringProperty(JsonElement element, params string[] propertyNames)
    {
        return GetNullableStringProperty(element, propertyNames) ?? string.Empty;
    }

    private static string? GetNullableStringProperty(JsonElement element, params string[] propertyNames)
    {
        foreach (var propertyName in propertyNames)
        {
            if (!TryGetPropertyIgnoreCase(element, propertyName, out var propertyValue))
            {
                continue;
            }

            if (propertyValue.ValueKind == JsonValueKind.Null)
            {
                return null;
            }

            if (propertyValue.ValueKind == JsonValueKind.String)
            {
                return propertyValue.GetString();
            }

            return propertyValue.ToString();
        }

        return null;
    }

    private static bool TryGetPropertyIgnoreCase(JsonElement element, string propertyName, out JsonElement propertyValue)
    {
        foreach (var candidate in element.EnumerateObject())
        {
            if (string.Equals(candidate.Name, propertyName, StringComparison.OrdinalIgnoreCase))
            {
                propertyValue = candidate.Value;
                return true;
            }
        }

        propertyValue = default;
        return false;
    }

    private static bool TryParseTranslations(string? translations, out Dictionary<string, TourTranslationData>? result, out string? error)
    {
        if (string.IsNullOrWhiteSpace(translations))
        {
            result = null;
            error = null;
            return true;
        }

        try
        {
            using var document = JsonDocument.Parse(translations);
            if (document.RootElement.ValueKind != JsonValueKind.Object)
            {
                result = null;
                error = "translations must be a JSON object.";
                return false;
            }

            var dict = new Dictionary<string, TourTranslationData>(StringComparer.OrdinalIgnoreCase);
            foreach (var languageProperty in document.RootElement.EnumerateObject())
            {
                if (languageProperty.Value.ValueKind != JsonValueKind.Object)
                    continue;

                var translation = new TourTranslationData
                {
                    TourName = GetStringProperty(languageProperty.Value, "tourName", "description"),
                    ShortDescription = GetStringProperty(languageProperty.Value, "shortDescription"),
                    LongDescription = GetStringProperty(languageProperty.Value, "longDescription"),
                    SEOTitle = GetNullableStringProperty(languageProperty.Value, "seoTitle", "sEOTitle"),
                    SEODescription = GetNullableStringProperty(languageProperty.Value, "seoDescription", "sEODescription")
                };

                dict[languageProperty.Name] = translation;
            }

            result = dict;
            error = null;
            return true;
        }
        catch (JsonException ex)
        {
            result = null;
            error = $"invalid JSON format: {ex.Message}";
            return false;
        }
    }

    private static bool TryParseClassifications(string? classifications, out List<ClassificationDto>? result, out string? error)
    {
        if (string.IsNullOrWhiteSpace(classifications))
        {
            result = null;
            error = null;
            return true;
        }

        try
        {
            result = JsonSerializer.Deserialize<List<ClassificationDto>>(classifications, ClassificationJsonOptions);
            error = null;
            return true;
        }
        catch (JsonException ex)
        {
            result = null;
            error = $"invalid JSON format: {ex.Message}";
            return false;
        }
    }

    private static bool TryParseAccommodations(string? accommodations, out List<AccommodationDto>? result, out string? error)
    {
        if (string.IsNullOrWhiteSpace(accommodations))
        {
            result = null;
            error = null;
            return true;
        }

        try
        {
            result = JsonSerializer.Deserialize<List<AccommodationDto>>(accommodations, TranslationJsonOptions);
            error = null;
            return true;
        }
        catch (JsonException ex)
        {
            result = null;
            error = $"invalid JSON format: {ex.Message}";
            return false;
        }
    }

    private static bool TryParseLocations(string? locations, out List<LocationDto>? result, out string? error)
    {
        if (string.IsNullOrWhiteSpace(locations))
        {
            result = null;
            error = null;
            return true;
        }

        try
        {
            result = JsonSerializer.Deserialize<List<LocationDto>>(locations, TranslationJsonOptions);
            error = null;
            return true;
        }
        catch (JsonException ex)
        {
            result = null;
            error = $"invalid JSON format: {ex.Message}";
            return false;
        }
    }

    private static bool TryParseTransportations(string? transportations, out List<TransportationDto>? result, out string? error)
    {
        if (string.IsNullOrWhiteSpace(transportations))
        {
            result = null;
            error = null;
            return true;
        }

        try
        {
            result = JsonSerializer.Deserialize<List<TransportationDto>>(transportations, TranslationJsonOptions);
            error = null;
            return true;
        }
        catch (JsonException ex)
        {
            result = null;
            error = $"invalid JSON format: {ex.Message}";
            return false;
        }
    }

    private static bool TryParseServices(string? services, out List<ServiceDto>? result, out string? error)
    {
        if (string.IsNullOrWhiteSpace(services))
        {
            result = null;
            error = null;
            return true;
        }

        try
        {
            result = JsonSerializer.Deserialize<List<ServiceDto>>(services, TranslationJsonOptions);
            error = null;
            return true;
        }
        catch (JsonException ex)
        {
            result = null;
            error = $"invalid JSON format: {ex.Message}";
            return false;
        }
    }

    private static bool TryParseExistingImages(string? existingImages, out List<ImageInputDto>? result, out string? error)
    {
        if (string.IsNullOrWhiteSpace(existingImages))
        {
            result = null;
            error = null;
            return true;
        }

        try
        {
            result = JsonSerializer.Deserialize<List<ImageInputDto>>(existingImages, ImageInputJsonOptions);
            error = null;
            return true;
        }
        catch (JsonException ex)
        {
            result = null;
            error = $"invalid JSON format: {ex.Message}";
            return false;
        }
    }

    private static List<ImageInputDto>? ParseExistingImages(string? existingImages)
    {
        if (string.IsNullOrWhiteSpace(existingImages))
        {
            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<List<ImageInputDto>>(existingImages, ImageInputJsonOptions);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static List<ClassificationDto>? ParseClassifications(string? classifications)
    {
        if (string.IsNullOrWhiteSpace(classifications))
        {
            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<List<ClassificationDto>>(
                classifications,
                ClassificationJsonOptions);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static List<AccommodationDto>? ParseAccommodations(string? accommodations)
    {
        if (string.IsNullOrWhiteSpace(accommodations))
        {
            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<List<AccommodationDto>>(
                accommodations,
                TranslationJsonOptions);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static List<LocationDto>? ParseLocations(string? locations)
    {
        if (string.IsNullOrWhiteSpace(locations))
        {
            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<List<LocationDto>>(
                locations,
                TranslationJsonOptions);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static List<TransportationDto>? ParseTransportations(string? transportations)
    {
        if (string.IsNullOrWhiteSpace(transportations))
        {
            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<List<TransportationDto>>(
                transportations,
                TranslationJsonOptions);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static List<ServiceDto>? ParseServices(string? services)
    {
        if (string.IsNullOrWhiteSpace(services))
        {
            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<List<ServiceDto>>(
                services,
                TranslationJsonOptions);
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
