using System.Security.Claims;
using System.Text.Json;
using Api.Controllers;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;

namespace Domain.Specs.Api;

public sealed class SiteContentControllerTests
{
    [Fact]
    public async Task GetByPage_WhenLocalizedContentExists_ShouldReturnLanguageResolvedValues()
    {
        var repository = Substitute.For<ISiteContentRepository>();
        repository.GetByPageKeyAsync("about").Returns(
        [
            SiteContentEntity.Create(
                "about",
                "hero",
                "{\"en\":{\"headline\":\"Welcome\"},\"vi\":{\"headline\":\"Xin chao\"}}",
                "seed")
        ]);

        var controller = BuildController(repository);

        var actionResult = await controller.GetByPage("about", new TestLanguageContext("vi"));

        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var payload = ToJsonElement(okResult.Value);
        Assert.Equal("Xin chao", payload.GetProperty("items").GetProperty("hero").GetProperty("headline").GetString());
    }

    [Fact]
    public async Task GetAdminList_WhenRowsExist_ShouldReturnMetadataForTable()
    {
        var repository = Substitute.For<ISiteContentRepository>();
        repository.GetAdminListAsync("about", "hero").Returns(
        [
            SiteContentEntity.Create(
                "about",
                "hero",
                "{\"en\":{\"headline\":\"Welcome\"},\"vi\":{\"headline\":\"Xin chao\"}}",
                "seed")
        ]);

        var controller = BuildController(repository);

        var actionResult = await controller.GetAdminList("about", "hero");

        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var payload = ToJsonElement(okResult.Value);
        var row = payload.GetProperty("items")[0];

        Assert.Equal("about", row.GetProperty("pageKey").GetString());
        Assert.Equal("hero", row.GetProperty("contentKey").GetString());
        Assert.True(row.GetProperty("hasEnglish").GetBoolean());
        Assert.True(row.GetProperty("hasVietnamese").GetBoolean());
        Assert.True(row.GetProperty("isLocalized").GetBoolean());
    }

    [Fact]
    public async Task GetAdminById_WhenRecordMissing_ShouldReturnNotFound()
    {
        var repository = Substitute.For<ISiteContentRepository>();
        repository.GetByIdAsync(Arg.Any<Guid>()).Returns((SiteContentEntity?)null);

        var controller = BuildController(repository);

        var actionResult = await controller.GetAdminById(Guid.CreateVersion7());

        var notFound = Assert.IsType<NotFoundObjectResult>(actionResult);
        var payload = ToJsonElement(notFound.Value);
        Assert.Equal("Content not found", payload.GetProperty("error").GetString());
    }

    [Fact]
    public async Task GetByPage_WhenPoliciesPage_ShouldReturnPolicySectionsAsLocalizedArray()
    {
        var repository = Substitute.For<ISiteContentRepository>();
        var enContent = new[]
        {
            new { id = "booking", icon = "heroicons-outline:document-text", title = new { en = "Booking & Payment", vi = "Dat cho" }, items = new { en = new[] { "Pay now" }, vi = new[] { "Thanh toan ngay" } } }
        };

        Domain.Entities.SiteContentValueCodec.TryCreateLocalizedContentValue(
            JsonSerializer.Serialize(enContent),
            JsonSerializer.Serialize(enContent),
            out var localizedValue,
            out _);

        repository.GetByPageKeyAsync("policies").Returns(
        [
            SiteContentEntity.Create("policies", "policy-sections", localizedValue, "seed")
        ]);

        var controller = BuildController(repository);

        var actionResult = await controller.GetByPage("policies", new TestLanguageContext("vi"));

        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var payload = ToJsonElement(okResult.Value);
        var sections = payload.GetProperty("items").GetProperty("policy-sections");

        Assert.Equal(JsonValueKind.Array, sections.ValueKind);
        Assert.Equal(1, sections.GetArrayLength());

        var firstSection = sections[0];
        Assert.Equal("booking", firstSection.GetProperty("id").GetString());
        Assert.Equal("heroicons-outline:document-text", firstSection.GetProperty("icon").GetString());
        Assert.Equal("Dat cho", firstSection.GetProperty("title").GetString());
        var items = firstSection.GetProperty("items");
        Assert.Equal(JsonValueKind.Array, items.ValueKind);
        Assert.Equal("Thanh toan ngay", items[0].GetString());
    }

    [Fact]
    public async Task GetByPage_WhenPoliciesPageEnglishFallback_ShouldReturnEnglishContent()
    {
        var repository = Substitute.For<ISiteContentRepository>();
        var enContent = new[]
        {
            new { id = "booking", icon = "heroicons-outline:document-text", title = new { en = "Booking & Payment", vi = "Dat cho" }, items = new { en = new[] { "Pay now" }, vi = new[] { "Thanh toan ngay" } } }
        };

        Domain.Entities.SiteContentValueCodec.TryCreateLocalizedContentValue(
            JsonSerializer.Serialize(enContent),
            JsonSerializer.Serialize(enContent),
            out var localizedValue,
            out _);

        repository.GetByPageKeyAsync("policies").Returns(
        [
            SiteContentEntity.Create("policies", "policy-sections", localizedValue, "seed")
        ]);

        var controller = BuildController(repository);

        var actionResult = await controller.GetByPage("policies", new TestLanguageContext("de"));

        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var payload = ToJsonElement(okResult.Value);
        var sections = payload.GetProperty("items").GetProperty("policy-sections");

        Assert.Equal("booking", sections[0].GetProperty("id").GetString());
        Assert.Equal("Booking & Payment", sections[0].GetProperty("title").GetString());
        Assert.Equal("Pay now", sections[0].GetProperty("items")[0].GetString());
    }

    [Fact]
    public async Task GetByPage_WhenPoliciesPage_ShouldReturnValidJsonArrayNotRawString()
    {
        var repository = Substitute.For<ISiteContentRepository>();
        var enContent = new[]
        {
            new { id = "booking", icon = "heroicons-outline:document-text", title = new { en = "Booking", vi = "Dat cho" }, items = new { en = new[] { "Item 1" }, vi = new[] { "Muc 1" } } }
        };

        Domain.Entities.SiteContentValueCodec.TryCreateLocalizedContentValue(
            JsonSerializer.Serialize(enContent),
            JsonSerializer.Serialize(enContent),
            out var localizedValue,
            out _);

        repository.GetByPageKeyAsync("policies").Returns(
        [
            SiteContentEntity.Create("policies", "policy-sections", localizedValue, "seed")
        ]);

        var controller = BuildController(repository);

        var actionResult = await controller.GetByPage("policies", new TestLanguageContext("en"));

        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var payload = ToJsonElement(okResult.Value);
        var sections = payload.GetProperty("items").GetProperty("policy-sections");

        Assert.Equal(JsonValueKind.Array, sections.ValueKind);
        Assert.Equal(JsonValueKind.String, sections[0].GetProperty("id").ValueKind);
        Assert.Equal(JsonValueKind.String, sections[0].GetProperty("icon").ValueKind);
        Assert.Equal(JsonValueKind.String, sections[0].GetProperty("title").ValueKind);
        Assert.Equal(JsonValueKind.Array, sections[0].GetProperty("items").ValueKind);
    }

    [Fact]
    public async Task GetByPage_WhenNoContentForPage_ShouldReturnEmptyItems()
    {
        var repository = Substitute.For<ISiteContentRepository>();
        repository.GetByPageKeyAsync("policies").Returns([]);

        var controller = BuildController(repository);

        var actionResult = await controller.GetByPage("policies", new TestLanguageContext("en"));

        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var payload = ToJsonElement(okResult.Value);
        Assert.Equal(JsonValueKind.Object, payload.GetProperty("items").ValueKind);
        Assert.Empty(payload.GetProperty("items").EnumerateObject().Select(p => p.Name).ToList());
    }

    [Fact]
    public async Task GetByPage_WhenPoliciesSeedData_ShouldHaveSixSectionsWithCorrectStructure()
    {
        var repository = Substitute.For<ISiteContentRepository>();
        var enContent = new[]
        {
            new { id = "booking-payment", icon = "heroicons-outline:document-text", title = new { en = "Booking & Payment", vi = "Dat cho" }, items = new { en = new[] { "Item1" }, vi = new[] { "Muc 1" } } },
            new { id = "cancellation-refund", icon = "heroicons-outline:arrow-path", title = new { en = "Cancellation & Refund", vi = "Huy bo" }, items = new { en = new[] { "Item1" }, vi = new[] { "Muc 1" } } },
            new { id = "modification-rescheduling", icon = "heroicons-outline:clock", title = new { en = "Modification & Rescheduling", vi = "Thay doi" }, items = new { en = new[] { "Item1" }, vi = new[] { "Muc 1" } } },
            new { id = "health-safety", icon = "heroicons-outline:shield-check", title = new { en = "Health & Safety", vi = "Suc khoe" }, items = new { en = new[] { "Item1" }, vi = new[] { "Muc 1" } } },
            new { id = "privacy-policy", icon = "heroicons-outline:lock-closed", title = new { en = "Privacy Policy", vi = "Bao mat" }, items = new { en = new[] { "Item1" }, vi = new[] { "Muc 1" } } },
            new { id = "liability-disclaimer", icon = "heroicons-outline:exclamation-circle", title = new { en = "Liability Disclaimer", vi = "Mien trac" }, items = new { en = new[] { "Item1" }, vi = new[] { "Muc 1" } } }
        };

        Domain.Entities.SiteContentValueCodec.TryCreateLocalizedContentValue(
            JsonSerializer.Serialize(enContent),
            JsonSerializer.Serialize(enContent),
            out var localizedValue,
            out _);

        repository.GetByPageKeyAsync("policies").Returns(
        [
            SiteContentEntity.Create("policies", "policy-sections", localizedValue, "seed")
        ]);

        var controller = BuildController(repository);

        var actionResult = await controller.GetByPage("policies", new TestLanguageContext("vi"));

        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var payload = ToJsonElement(okResult.Value);
        var sections = payload.GetProperty("items").GetProperty("policy-sections");

        Assert.Equal(6, sections.GetArrayLength());

        var expectedIds = new[] { "booking-payment", "cancellation-refund", "modification-rescheduling", "health-safety", "privacy-policy", "liability-disclaimer" };

        for (var i = 0; i < 6; i++)
        {
            var section = sections[i];
            Assert.Equal(expectedIds[i], section.GetProperty("id").GetString());
            Assert.Equal(JsonValueKind.String, section.GetProperty("icon").ValueKind);
            Assert.Equal(JsonValueKind.String, section.GetProperty("title").ValueKind);
            Assert.Equal(JsonValueKind.Array, section.GetProperty("items").ValueKind);
            Assert.True(section.GetProperty("items").GetArrayLength() > 0);
        }
    }

    [Fact]
    public async Task Upsert_WhenLocalizedPayloadInvalid_ShouldReturnBadRequest()
    {
        var repository = Substitute.For<ISiteContentRepository>();
        var controller = BuildController(repository);

        var actionResult = await controller.Upsert(
            "about",
            "hero",
            new UpsertSiteContentRequest(null, "{\"headline\":\"Welcome\"", "{\"headline\":\"Xin chao\"}"));

        var badRequest = Assert.IsType<BadRequestObjectResult>(actionResult);
        var payload = ToJsonElement(badRequest.Value);
        Assert.Equal("englishContentValue must be valid JSON", payload.GetProperty("error").GetString());

        await repository.DidNotReceiveWithAnyArgs().UpsertAsync(default!, default!, default!, default!);
    }

    [Fact]
    public async Task UpsertById_WhenLocalizedPayloadValid_ShouldPersistCanonicalLocalizedPayload()
    {
        var repository = Substitute.For<ISiteContentRepository>();
        var id = Guid.CreateVersion7();
        repository.UpsertByIdAsync(Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<string>())
            .Returns(callInfo =>
            {
                var entity = SiteContentEntity.Create("about", "hero", callInfo.ArgAt<string>(1), "seed");
                entity.Id = callInfo.ArgAt<Guid>(0);
                return entity;
            });

        var controller = BuildController(repository);

        var actionResult = await controller.UpsertById(
            id,
            new UpdateAdminSiteContentRequest("{\"headline\":\"Welcome\"}", "{\"headline\":\"Xin chao\"}"));

        var ok = Assert.IsType<OkObjectResult>(actionResult);
        _ = Assert.IsType<SiteContentEntity>(ok.Value);

        await repository.Received(1).UpsertByIdAsync(
            id,
            Arg.Is<string>(value =>
                value.Contains("\"en\"", StringComparison.Ordinal) &&
                value.Contains("\"vi\"", StringComparison.Ordinal)),
            Arg.Any<string>());
    }

    private static SiteContentController BuildController(ISiteContentRepository repository)
    {
        var controller = new SiteContentController(repository, NullLogger<SiteContentController>.Instance)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(
                        new ClaimsIdentity(
                        [
                            new Claim(ClaimTypes.NameIdentifier, "admin-user")
                        ],
                        "TestAuth"))
                }
            }
        };

        return controller;
    }

    private static JsonElement ToJsonElement(object? value)
    {
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        using var document = JsonDocument.Parse(JsonSerializer.Serialize(value, options));
        return document.RootElement.Clone();
    }

    private sealed class TestLanguageContext(string language) : ILanguageContext
    {
        public string CurrentLanguage { get; set; } = language;
    }
}
