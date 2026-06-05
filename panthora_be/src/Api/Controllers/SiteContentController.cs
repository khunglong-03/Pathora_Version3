using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ErrorOr;
using Api.Endpoint;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;

namespace Api.Controllers;

[ApiController]
[Authorize(Policy = "AdminOnly")]
[Route(SiteContentEndpoint.Base)]
public class SiteContentController : ControllerBase
{
    private readonly ISiteContentRepository _repository;
    private readonly ILogger<SiteContentController> _logger;

    public SiteContentController(ISiteContentRepository repository, ILogger<SiteContentController> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    /// <summary>
    /// Get all content for a specific page (public endpoint)
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ResponseCache(Duration = 300, VaryByQueryKeys = new[] { "pageKey", "lang" })]
    public async Task<IActionResult> GetByPage(
        [FromQuery] string pageKey,
        [FromServices] ILanguageContext? languageContext = null)
    {
        if (string.IsNullOrWhiteSpace(pageKey))
        {
            return BadRequest(new { error = "pageKey is required" });
        }

        _logger.LogInformation("Fetching site content for page: {PageKey}", pageKey);
        var content = await _repository.GetByPageKeyAsync(pageKey);

        var language = languageContext?.CurrentLanguage;
        var result = content.ToDictionary(
            c => c.ContentKey,
            c => ResolveLocalizedJson(SiteContentValueCodec.ResolveContentElement(c.ContentValue, language), language));

        return Ok(new { items = result });
    }

    private static JsonElement ResolveLocalizedJson(JsonElement element, string? language)
    {
        if (element.ValueKind == JsonValueKind.Object)
        {
            if (element.TryGetProperty("en", out _) && element.TryGetProperty("vi", out _))
            {
                var normalizedLang = NormalizeLanguage(language);

                if (element.TryGetProperty(normalizedLang, out var resolved))
                {
                    return ResolveLocalizedJson(resolved, normalizedLang);
                }

                if (element.TryGetProperty("en", out var fallback))
                {
                    return ResolveLocalizedJson(fallback, "en");
                }
            }

            using var stream = new MemoryStream();
            using var writer = new Utf8JsonWriter(stream);
            writer.WriteStartObject();
            foreach (var prop in element.EnumerateObject())
            {
                writer.WritePropertyName(prop.Name);
                ResolveLocalizedJson(prop.Value, language).WriteTo(writer);
            }
            writer.WriteEndObject();
            writer.Flush();
            stream.Position = 0;
            using var doc = JsonDocument.Parse(stream);
            return doc.RootElement.Clone();
        }

        if (element.ValueKind == JsonValueKind.Array)
        {
            using var stream = new MemoryStream();
            using var writer = new Utf8JsonWriter(stream);
            writer.WriteStartArray();
            foreach (var item in element.EnumerateArray())
            {
                ResolveLocalizedJson(item, language).WriteTo(writer);
            }
            writer.WriteEndArray();
            writer.Flush();
            stream.Position = 0;
            using var doc = JsonDocument.Parse(stream);
            return doc.RootElement.Clone();
        }

        return element;
    }

    private static string NormalizeLanguage(string? language)
    {
        if (string.IsNullOrWhiteSpace(language))
            return "en";

        var firstToken = language.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault();
        var languageValue = firstToken ?? language;
        var qualityTrimmed = languageValue.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault() ?? languageValue;
        var normalizedLanguage = qualityTrimmed.Split('-', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault() ?? qualityTrimmed;
        var languageCode = normalizedLanguage.ToLowerInvariant();

        return languageCode is "vi" or "en" ? languageCode : "en";
    }

    /// <summary>
    /// Get specific content item by page and content key (public endpoint)
    /// </summary>
    [HttpGet(SiteContentEndpoint.ByKey)]
    [AllowAnonymous]
    [ResponseCache(Duration = 300, VaryByQueryKeys = new[] { "lang" })]
    public async Task<IActionResult> GetByKey(
        string pageKey,
        string contentKey,
        [FromServices] ILanguageContext? languageContext = null)
    {
        if (string.IsNullOrWhiteSpace(pageKey) || string.IsNullOrWhiteSpace(contentKey))
        {
            return BadRequest(new { error = "pageKey and contentKey are required" });
        }

        var content = await _repository.GetByPageAndContentKeyAsync(pageKey, contentKey);
        if (content == null)
        {
            return NotFound(new { error = "Content not found" });
        }

        var resolved = SiteContentValueCodec.ResolveContentElement(content.ContentValue, languageContext?.CurrentLanguage);
        return Ok(new { key = content.ContentKey, value = resolved });
    }

    /// <summary>
    /// Get site content list for admin management table
    /// </summary>
    [HttpGet(SiteContentEndpoint.Admin)]
    [Authorize]
    public async Task<IActionResult> GetAdminList([FromQuery] string? pageKey, [FromQuery] string? search)
    {
        var items = await _repository.GetAdminListAsync(pageKey, search);

        var response = items
            .Select(item =>
            {
                var metadata = SiteContentValueCodec.GetMetadata(item.ContentValue);

                return new AdminSiteContentListItem(
                    item.Id,
                    item.PageKey,
                    item.ContentKey,
                    metadata.IsLocalized,
                    metadata.HasEnglish,
                    metadata.HasVietnamese,
                    item.LastModifiedOnUtc,
                    item.LastModifiedBy,
                    item.CreatedOnUtc,
                    item.CreatedBy);
            })
            .ToList();

        return Ok(new { items = response });
    }

    /// <summary>
    /// Get one site content record for admin editor
    /// </summary>
    [HttpGet(SiteContentEndpoint.AdminById)]
    [Authorize]
    public async Task<IActionResult> GetAdminById(Guid id)
    {
        var content = await _repository.GetByIdAsync(id);
        if (content is null)
        {
            return NotFound(new { error = "Content not found" });
        }

        var editableValues = SiteContentValueCodec.GetEditableValues(content.ContentValue);
        return Ok(new AdminSiteContentDetailItem(
            content.Id,
            content.PageKey,
            content.ContentKey,
            editableValues.EnglishContentValue,
            editableValues.VietnameseContentValue,
            editableValues.IsLocalized,
            editableValues.HasEnglish,
            editableValues.HasVietnamese,
            content.LastModifiedOnUtc,
            content.LastModifiedBy,
            content.CreatedOnUtc,
            content.CreatedBy));
    }

    /// <summary>
    /// Update or create content (admin only - requires authorization)
    /// </summary>
    [HttpPut(SiteContentEndpoint.ByKey)]
    [Authorize]
    public async Task<IActionResult> Upsert(string pageKey, string contentKey, [FromBody] UpsertSiteContentRequest? request)
    {
        if (string.IsNullOrWhiteSpace(pageKey) || string.IsNullOrWhiteSpace(contentKey))
        {
            return BadRequest(new { error = "pageKey and contentKey are required" });
        }

        if (request is null)
        {
            return BadRequest(new { error = "request body is required" });
        }

        string contentValueToPersist;

        if (!string.IsNullOrWhiteSpace(request.EnglishContentValue) || !string.IsNullOrWhiteSpace(request.VietnameseContentValue))
        {
            if (string.IsNullOrWhiteSpace(request.EnglishContentValue) || string.IsNullOrWhiteSpace(request.VietnameseContentValue))
            {
                return BadRequest(new { error = "englishContentValue and vietnameseContentValue are required" });
            }

            if (!SiteContentValueCodec.TryCreateLocalizedContentValue(
                    request.EnglishContentValue,
                    request.VietnameseContentValue,
                    out contentValueToPersist,
                    out var localizedError))
            {
                return BadRequest(new { error = localizedError });
            }
        }
        else
        {
            if (string.IsNullOrWhiteSpace(request.ContentValue))
            {
                return BadRequest(new { error = "contentValue is required" });
            }

            if (!SiteContentValueCodec.TryNormalizeJson(request.ContentValue, out contentValueToPersist))
            {
                return BadRequest(new { error = "contentValue must be valid JSON" });
            }
        }

        _logger.LogInformation("Updating site content for {PageKey}/{ContentKey} by user {UserId}",
            pageKey, contentKey, CurrentUserId);

        var result = await _repository.UpsertAsync(pageKey, contentKey, contentValueToPersist, CurrentUserId);
        if (result.IsError)
            return BadRequest(new { error = result.FirstError.Description });

        var entity = result.Value;
        return Ok(new
        {
            entity.PageKey,
            entity.ContentKey,
            entity.ContentValue,
            entity.Id,
            entity.CreatedOnUtc,
            entity.CreatedBy,
            entity.LastModifiedOnUtc,
            entity.LastModifiedBy
        });
    }

    /// <summary>
    /// Update content by id for admin editor
    /// </summary>
    [HttpPut(SiteContentEndpoint.AdminById)]
    [Authorize]
    public async Task<IActionResult> UpsertById(Guid id, [FromBody] UpdateAdminSiteContentRequest request)
    {
        if (!SiteContentValueCodec.TryCreateLocalizedContentValue(
                request.EnglishContentValue,
                request.VietnameseContentValue,
                out var contentValueToPersist,
                out var error))
        {
            return BadRequest(new { error });
        }

        var result = await _repository.UpsertByIdAsync(id, contentValueToPersist, CurrentUserId);
        if (result.IsError)
        {
            var firstError = result.FirstError;
            if (firstError.Type == ErrorType.NotFound)
            {
                return NotFound(new { error = firstError.Description });
            }

            return BadRequest(new { error = firstError.Description });
        }

        return Ok(result.Value);
    }

    private string CurrentUserId => User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst("sub")?.Value
        ?? "system";
}

public sealed record UpsertSiteContentRequest(
    string? ContentValue,
    string? EnglishContentValue,
    string? VietnameseContentValue);

public sealed record UpdateAdminSiteContentRequest(
    string EnglishContentValue,
    string VietnameseContentValue);

public sealed record AdminSiteContentListItem(
    Guid Id,
    string PageKey,
    string ContentKey,
    bool IsLocalized,
    bool HasEnglish,
    bool HasVietnamese,
    DateTimeOffset? LastModifiedOnUtc,
    string? LastModifiedBy,
    DateTimeOffset CreatedOnUtc,
    string? CreatedBy);

public sealed record AdminSiteContentDetailItem(
    Guid Id,
    string PageKey,
    string ContentKey,
    string EnglishContentValue,
    string VietnameseContentValue,
    bool IsLocalized,
    bool HasEnglish,
    bool HasVietnamese,
    DateTimeOffset? LastModifiedOnUtc,
    string? LastModifiedBy,
    DateTimeOffset CreatedOnUtc,
    string? CreatedBy);
