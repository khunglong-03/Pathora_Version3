using System.Text.Json;
using ApiPublic.Endpoint;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiPublic.Controller;

/// <summary>
/// Public site content endpoints — read-only, no authentication required.
/// Admin CRUD endpoints stay in the main Api service.
/// </summary>
[ApiController]
[AllowAnonymous]
[Route(SiteContentEndpoint.Base)]
public class PublicSiteContentController : ControllerBase
{
    private readonly ISiteContentRepository _repository;
    private readonly ILogger<PublicSiteContentController> _logger;

    public PublicSiteContentController(ISiteContentRepository repository, ILogger<PublicSiteContentController> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    /// <summary>
    /// Get all content for a specific page (public endpoint)
    /// </summary>
    [HttpGet]
    [ResponseCache(Duration = 300, VaryByQueryKeys = ["pageKey", "lang"])]
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

    /// <summary>
    /// Get specific content item by page and content key (public endpoint)
    /// </summary>
    [HttpGet(SiteContentEndpoint.ByKey)]
    [ResponseCache(Duration = 300, VaryByQueryKeys = ["lang"])]
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
}
