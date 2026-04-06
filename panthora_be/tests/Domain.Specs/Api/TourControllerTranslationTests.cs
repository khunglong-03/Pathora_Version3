using Api.Controllers;
using Application.Common.Interfaces;
using Application.Contracts.File;
using Application.Dtos;
using Application.Features.Tour.Commands;
using Application.Services;
using Domain.Entities.Translations;
using Domain.Enums;
using ErrorOr;
using Microsoft.AspNetCore.Http;

namespace Domain.Specs.Api;

public sealed class TourControllerTranslationTests
{
    private static IFileService StubFileService()
    {
        return new StubFileServiceImpl();
    }

    private static IFileManager StubFileManager()
    {
        return new StubFileManagerImpl();
    }

    private sealed class StubFileServiceImpl : IFileService
    {
        public Task<FileMetadataVm> UploadFileAsync(UploadFileRequest request)
            => Task.FromResult(new FileMetadataVm(Guid.CreateVersion7(), "http://cdn/test.jpg", request.FileName, "image/jpeg", request.Length));

        public Task<IEnumerable<FileMetadataVm>> UploadMultipleFilesAsync(UploadMultipleFilesRequest request)
            => Task.FromResult<IEnumerable<FileMetadataVm>>([]);

        public Task DeleteMultipleFilesAsync(DeleteMultipleFilesRequest request)
            => Task.CompletedTask;

        public Task DeleteUploadedFilesAsync(List<string> objectNames)
            => Task.CompletedTask;
    }

    private sealed class StubFileManagerImpl : IFileManager
    {
        public Task<string> UploadFileAsync(Stream stream, string fileName, CancellationToken cancellationToken = default)
            => Task.FromResult("http://cdn/default");
        public Task<AvatarUploadResult> UploadAvatarAsync(Stream stream, string fileName, CancellationToken cancellationToken = default)
            => Task.FromResult(new AvatarUploadResult("http://cdn/default", "default-public-id"));
        public Task<IEnumerable<Domain.Entities.FileMetadataEntity>> UploadMultipleFilesAsync(Guid entityId, (Stream Stream, string FileName, string ContentType, long Length)[] files, CancellationToken cancellationToken = default)
            => Task.FromResult<IEnumerable<Domain.Entities.FileMetadataEntity>>([]);
        public Task<Dictionary<Guid, Domain.Entities.FileMetadataEntity[]>> FindFiles(string[] entityIds)
            => Task.FromResult(new Dictionary<Guid, Domain.Entities.FileMetadataEntity[]>());
        public Task DeleteMultipleFilesAsync(List<Guid> ids, CancellationToken cancellationToken = default)
            => Task.CompletedTask;
        public Task DeleteUploadedFilesAsync(List<string> objectNames, CancellationToken cancellationToken = default)
            => Task.CompletedTask;
        public Task<Stream> DownloadFileAsync(string fileUrl, CancellationToken cancellationToken = default)
            => Task.FromResult<Stream>(Stream.Null);
    }

    [Fact]
    public async Task Create_WhenCamelCaseTranslationsProvided_ShouldMapTranslationsToCommand()
    {
        var response = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<TourController, CreateTourCommand, Guid>(
                response, "/api/tour", StubFileService(), StubFileManager());

        var translationsJson = """
                               {
                                 "en": {
                                   "tourName": "English camel case",
                                   "shortDescription": "English short",
                                   "longDescription": "English long",
                                   "seoTitle": "SEO title",
                                   "seoDescription": "SEO description"
                                 }
                               }
                               """;

        await controller.Create(
            tourName: "Tour goc",
            shortDescription: "Mo ta goc",
            longDescription: "Mo ta dai goc",
            seoTitle: null,
            seoDescription: null,
            status: TourStatus.Active,
            thumbnail: null,
            images: null,
            translations: translationsJson);

        Assert.NotNull(probe.CapturedRequest);
        Assert.NotNull(probe.CapturedRequest.Translations);
        Assert.True(probe.CapturedRequest.Translations!.ContainsKey("en"));
        Assert.Equal("English camel case", probe.CapturedRequest.Translations["en"].TourName);
        Assert.Equal("SEO title", probe.CapturedRequest.Translations["en"].SEOTitle);
    }

    [Fact]
    public async Task Create_WhenTranslationsProvided_ShouldMapTranslationsToCommand()
    {
        var response = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<TourController, CreateTourCommand, Guid>(
                response, "/api/tour", StubFileService(), StubFileManager());

        var translationsJson = """
                               {
                                 "vi": {
                                   "description": "Tour tiếng Việt",
                                   "shortDescription": "Mô tả vi",
                                   "longDescription": "Mô tả dài vi"
                                 },
                                 "en": {
                                   "description": "English tour",
                                   "shortDescription": "English short",
                                   "longDescription": "English long"
                                 }
                               }
                               """;

        await controller.Create(
            tourName: "Tour gốc",
            shortDescription: "Mô tả gốc",
            longDescription: "Mô tả dài gốc",
            seoTitle: null,
            seoDescription: null,
            status: TourStatus.Active,
            thumbnail: null,
            images: null,
            translations: translationsJson);

        Assert.NotNull(probe.CapturedRequest);
        Assert.NotNull(probe.CapturedRequest.Translations);
        Assert.True(probe.CapturedRequest.Translations!.ContainsKey("vi"));
        Assert.True(probe.CapturedRequest.Translations!.ContainsKey("en"));
        Assert.Equal("English tour", probe.CapturedRequest.Translations["en"].TourName);
    }

    [Fact]
    public async Task Create_WhenPolicyIdsProvided_ShouldMapPolicyIdsToCommand()
    {
        var response = Guid.CreateVersion7();
        var visaPolicyId = Guid.CreateVersion7();
        var depositPolicyId = Guid.CreateVersion7();
        var pricingPolicyId = Guid.CreateVersion7();
        var cancellationPolicyId = Guid.CreateVersion7();

        var (controller, probe) = ApiControllerTestHelper
            .BuildController<TourController, CreateTourCommand, Guid>(
                response, "/api/tour", StubFileService(), StubFileManager());

        await controller.Create(
            tourName: "Tour goc",
            shortDescription: "Mo ta goc",
            longDescription: "Mo ta dai goc",
            seoTitle: null,
            seoDescription: null,
            status: TourStatus.Active,
            thumbnail: null,
            images: null,
            translations: null,
            classifications: null,
            visaPolicyId: visaPolicyId,
            depositPolicyId: depositPolicyId,
            pricingPolicyId: pricingPolicyId,
            cancellationPolicyId: cancellationPolicyId);

        Assert.NotNull(probe.CapturedRequest);
        Assert.Equal(visaPolicyId, probe.CapturedRequest.VisaPolicyId);
        Assert.Equal(depositPolicyId, probe.CapturedRequest.DepositPolicyId);
        Assert.Equal(pricingPolicyId, probe.CapturedRequest.PricingPolicyId);
        Assert.Equal(cancellationPolicyId, probe.CapturedRequest.CancellationPolicyId);
    }

    [Fact]
    public async Task Update_WhenTranslationsProvided_ShouldMapTranslationsToCommand()
    {
        var tourId = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<TourController, UpdateTourCommand, Success>(
                Result.Success, "/api/tour", StubFileService(), StubFileManager());

        var translationsJson = """
                               {
                                 "en": {
                                   "description": "English updated",
                                   "shortDescription": "English short updated",
                                   "longDescription": "English long updated"
                                 }
                               }
                               """;

        await controller.Update(
            id: tourId,
            tourName: "Tour gốc",
            shortDescription: "Mô tả gốc",
            longDescription: "Mô tả dài gốc",
            seoTitle: null,
            seoDescription: null,
            status: TourStatus.Active,
            thumbnail: null,
            images: null,
            translations: translationsJson);

        Assert.NotNull(probe.CapturedRequest);
        Assert.NotNull(probe.CapturedRequest.Translations);
        Assert.True(probe.CapturedRequest.Translations!.ContainsKey("en"));
        Assert.Equal("English updated", probe.CapturedRequest.Translations["en"].TourName);
    }

    [Fact]
    public async Task Create_WhenClassificationWithNestedTranslations_ShouldMapToCommand()
    {
        var response = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<TourController, CreateTourCommand, Guid>(
                response, "/api/tour", StubFileService(), StubFileManager());

        var classificationsJson = """
                                  [
                                    {
                                      "name": "Standard VI",
                                      "description": "Desc VI",
                                      "basePrice": 1000,
                                      "numberOfDay": 3,
                                      "numberOfNight": 2,
                                      "plans": [],
                                      "insurances": [],
                                      "translations": {
                                        "vi": { "name": "Standard VI", "description": "Desc VI" },
                                        "en": { "name": "Standard EN", "description": "Desc EN" }
                                      }
                                    }
                                  ]
                                  """;

        await controller.Create(
            tourName: "Tour goc",
            shortDescription: "Short",
            longDescription: "Long",
            seoTitle: null,
            seoDescription: null,
            status: TourStatus.Active,
            thumbnail: null,
            images: null,
            translations: null,
            classifications: classificationsJson);

        Assert.NotNull(probe.CapturedRequest);
        Assert.NotNull(probe.CapturedRequest.Classifications);
        Assert.Single(probe.CapturedRequest.Classifications!);
        var cls = probe.CapturedRequest.Classifications![0];
        Assert.Equal("Standard VI", cls.Name);
        Assert.NotNull(cls.Translations);
        Assert.True(cls.Translations!.ContainsKey("vi"));
        Assert.True(cls.Translations.ContainsKey("en"));
        Assert.Equal("Standard EN", cls.Translations["en"].Name);
        Assert.Equal("Desc EN", cls.Translations["en"].Description);
    }

    [Fact]
    public async Task Create_WhenClassificationWithDayPlanTranslations_ShouldMapNestedPlans()
    {
        var response = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<TourController, CreateTourCommand, Guid>(
                response, "/api/tour", StubFileService(), StubFileManager());

        var classificationsJson = """
                                  [
                                    {
                                      "name": "Pkg",
                                      "description": "Desc",
                                      "basePrice": 500,
                                      "numberOfDay": 1,
                                      "numberOfNight": 0,
                                      "plans": [
                                        {
                                          "dayNumber": 1,
                                          "title": "Day 1 VI",
                                          "description": "Day Desc VI",
                                          "activities": [],
                                          "translations": {
                                            "vi": { "title": "Day 1 VI", "description": "Day Desc VI" },
                                            "en": { "title": "Day 1 EN", "description": "Day Desc EN" }
                                          }
                                        }
                                      ],
                                      "insurances": []
                                    }
                                  ]
                                  """;

        await controller.Create(
            tourName: "Tour",
            shortDescription: "Short",
            longDescription: "Long",
            seoTitle: null,
            seoDescription: null,
            status: TourStatus.Active,
            thumbnail: null,
            images: null,
            classifications: classificationsJson);

        Assert.NotNull(probe.CapturedRequest);
        var cls = probe.CapturedRequest.Classifications![0];
        Assert.Single(cls.Plans);
        var plan = cls.Plans[0];
        Assert.Equal("Day 1 VI", plan.Title);
        Assert.NotNull(plan.Translations);
        Assert.True(plan.Translations!.ContainsKey("en"));
        Assert.Equal("Day 1 EN", plan.Translations["en"].Title);
    }

    [Fact]
    public async Task Create_WhenClassificationWithActivityTranslations_ShouldMapNestedActivities()
    {
        var response = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<TourController, CreateTourCommand, Guid>(
                response, "/api/tour", StubFileService(), StubFileManager());

        var classificationsJson = """
                                  [
                                    {
                                      "name": "Pkg",
                                      "description": "Desc",
                                      "basePrice": 500,
                                      "numberOfDay": 1,
                                      "numberOfNight": 0,
                                      "plans": [
                                        {
                                          "dayNumber": 1,
                                          "title": "Day VI",
                                          "description": "Desc",
                                          "activities": [
                                            {
                                              "activityType": "Sightseeing",
                                              "title": "Activity VI",
                                              "description": "Act Desc VI",
                                              "note": "Note VI",
                                              "estimatedCost": 100,
                                              "isOptional": false,
                                              "routes": [],
                                              "translations": {
                                                "vi": { "title": "Activity VI", "description": "Act Desc VI", "note": "Note VI" },
                                                "en": { "title": "Activity EN", "description": "Act Desc EN", "note": "Note EN" }
                                              }
                                            }
                                          ]
                                        }
                                      ],
                                      "insurances": []
                                    }
                                  ]
                                  """;

        await controller.Create(
            tourName: "Tour",
            shortDescription: "Short",
            longDescription: "Long",
            seoTitle: null,
            seoDescription: null,
            status: TourStatus.Active,
            thumbnail: null,
            images: null,
            classifications: classificationsJson);

        Assert.NotNull(probe.CapturedRequest);
        var activity = probe.CapturedRequest.Classifications![0].Plans[0].Activities[0];
        Assert.Equal("Activity VI", activity.Title);
        Assert.NotNull(activity.Translations);
        Assert.True(activity.Translations!.ContainsKey("en"));
        Assert.Equal("Activity EN", activity.Translations["en"].Title);
        Assert.Equal("Note EN", activity.Translations["en"].Note);
    }

    [Fact]
    public async Task Create_WhenClassificationWithInsuranceTranslations_ShouldMapNestedInsurances()
    {
        var response = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<TourController, CreateTourCommand, Guid>(
                response, "/api/tour", StubFileService(), StubFileManager());

        var classificationsJson = """
                                  [
                                    {
                                      "name": "Pkg",
                                      "description": "Desc",
                                      "basePrice": 500,
                                      "numberOfDay": 1,
                                      "numberOfNight": 0,
                                      "plans": [],
                                      "insurances": [
                                        {
                                          "insuranceName": "Ins VI",
                                          "insuranceType": "Basic",
                                          "insuranceProvider": "Provider",
                                          "coverageDescription": "Cov VI",
                                          "coverageAmount": 5000,
                                          "coverageFee": 100,
                                          "isOptional": false,
                                          "translations": {
                                            "vi": { "name": "Ins VI", "description": "Cov VI" },
                                            "en": { "name": "Ins EN", "description": "Cov EN" }
                                          }
                                        }
                                      ]
                                    }
                                  ]
                                  """;

        await controller.Create(
            tourName: "Tour",
            shortDescription: "Short",
            longDescription: "Long",
            seoTitle: null,
            seoDescription: null,
            status: TourStatus.Active,
            thumbnail: null,
            images: null,
            classifications: classificationsJson);

        Assert.NotNull(probe.CapturedRequest);
        var ins = probe.CapturedRequest.Classifications![0].Insurances[0];
        Assert.Equal("Ins VI", ins.InsuranceName);
        Assert.NotNull(ins.Translations);
        Assert.True(ins.Translations!.ContainsKey("en"));
        Assert.Equal("Ins EN", ins.Translations["en"].Name);
    }

    [Fact]
    public async Task Create_WhenStandaloneAccommodationsProvided_ShouldMapToCommand()
    {
        var response = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<TourController, CreateTourCommand, Guid>(
                response, "/api/tour", StubFileService(), StubFileManager());

        var accommodationsJson = """
                                 [
                                   {
                                     "accommodationName": "Hotel VI",
                                     "address": "123 VI",
                                     "contactPhone": "0123456789",
                                     "checkInTime": "14:00",
                                     "checkOutTime": "12:00",
                                     "note": "Note VI",
                                     "translations": {
                                       "vi": { "accommodationName": "Hotel VI", "address": "123 VI", "note": "Note VI" },
                                       "en": { "accommodationName": "Hotel EN", "address": "123 EN", "note": "Note EN" }
                                     }
                                   }
                                 ]
                                 """;

        await controller.Create(
            tourName: "Tour",
            shortDescription: "Short",
            longDescription: "Long",
            seoTitle: null,
            seoDescription: null,
            status: TourStatus.Active,
            thumbnail: null,
            images: null,
            accommodations: accommodationsJson);

        Assert.NotNull(probe.CapturedRequest);
        Assert.NotNull(probe.CapturedRequest.Accommodations);
        Assert.Single(probe.CapturedRequest.Accommodations!);
        var acc = probe.CapturedRequest.Accommodations![0];
        Assert.Equal("Hotel VI", acc.AccommodationName);
        Assert.NotNull(acc.Translations);
        Assert.True(acc.Translations!.ContainsKey("vi"));
        Assert.True(acc.Translations.ContainsKey("en"));
        Assert.Equal("Hotel EN", acc.Translations["en"].AccommodationName);
    }

    [Fact]
    public async Task Create_WhenStandaloneLocationsProvided_ShouldMapToCommand()
    {
        var response = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<TourController, CreateTourCommand, Guid>(
                response, "/api/tour", StubFileService(), StubFileManager());

        var locationsJson = """
                            [
                              {
                                "locationName": "Museum VI",
                                "locationType": "Museum",
                                "description": "Desc VI",
                                "city": "Da Nang VI",
                                "country": "Vietnam",
                                "address": "Addr VI",
                                "translations": {
                                  "vi": { "locationName": "Museum VI", "locationDescription": "Desc VI", "city": "Da Nang VI", "country": "Vietnam", "address": "Addr VI" },
                                  "en": { "locationName": "Museum EN", "locationDescription": "Desc EN", "city": "Da Nang EN", "country": "", "address": "Addr EN" }
                                }
                              }
                            ]
                            """;

        await controller.Create(
            tourName: "Tour",
            shortDescription: "Short",
            longDescription: "Long",
            seoTitle: null,
            seoDescription: null,
            status: TourStatus.Active,
            thumbnail: null,
            images: null,
            locations: locationsJson);

        Assert.NotNull(probe.CapturedRequest);
        Assert.NotNull(probe.CapturedRequest.Locations);
        Assert.Single(probe.CapturedRequest.Locations!);
        var loc = probe.CapturedRequest.Locations![0];
        Assert.Equal("Museum VI", loc.LocationName);
        Assert.NotNull(loc.Translations);
        Assert.True(loc.Translations!.ContainsKey("vi"));
        Assert.True(loc.Translations.ContainsKey("en"));
        Assert.Equal("Museum EN", loc.Translations["en"].LocationName);
    }

    [Fact]
    public async Task Create_WhenStandaloneTransportationsProvided_ShouldMapToCommand()
    {
        var response = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<TourController, CreateTourCommand, Guid>(
                response, "/api/tour", StubFileService(), StubFileManager());

        var transportationsJson = """
                                  [
                                    {
                                      "fromLocationName": "From VI",
                                      "toLocationName": "To VI",
                                      "transportationType": "Bus",
                                      "transportationName": "Name VI",
                                      "durationMinutes": 120,
                                      "price": 50,
                                      "requiresIndividualTicket": false,
                                      "ticketInfo": "Info VI",
                                      "note": "Note VI",
                                      "translations": {
                                        "vi": { "fromLocationName": "From VI", "toLocationName": "To VI", "transportationType": "Bus", "transportationName": "Name VI", "ticketInfo": "Info VI", "note": "Note VI" },
                                        "en": { "fromLocationName": "From EN", "toLocationName": "To EN", "transportationType": "Bus EN", "transportationName": "Name EN", "ticketInfo": "Info EN", "note": "Note EN" }
                                      }
                                    }
                                  ]
                                  """;

        await controller.Create(
            tourName: "Tour",
            shortDescription: "Short",
            longDescription: "Long",
            seoTitle: null,
            seoDescription: null,
            status: TourStatus.Active,
            thumbnail: null,
            images: null,
            transportations: transportationsJson);

        Assert.NotNull(probe.CapturedRequest);
        Assert.NotNull(probe.CapturedRequest.Transportations);
        Assert.Single(probe.CapturedRequest.Transportations!);
        var tr = probe.CapturedRequest.Transportations![0];
        Assert.Equal("From VI", tr.FromLocationName);
        Assert.NotNull(tr.Translations);
        Assert.True(tr.Translations!.ContainsKey("vi"));
        Assert.True(tr.Translations.ContainsKey("en"));
        Assert.Equal("From EN", tr.Translations["en"].FromLocationName);
    }

    [Fact]
    public async Task Create_WhenEnglishTranslationsOmitted_ShouldOnlyContainVietnamese()
    {
        var response = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<TourController, CreateTourCommand, Guid>(
                response, "/api/tour", StubFileService(), StubFileManager());

        var classificationsJson = """
                                  [
                                    {
                                      "name": "Cls VI",
                                      "description": "Desc VI",
                                      "basePrice": 500,
                                      "numberOfDay": 1,
                                      "numberOfNight": 0,
                                      "plans": [],
                                      "insurances": [],
                                      "translations": {
                                        "vi": { "name": "Cls VI", "description": "Desc VI" }
                                      }
                                    }
                                  ]
                                  """;

        await controller.Create(
            tourName: "Tour",
            shortDescription: "Short",
            longDescription: "Long",
            seoTitle: null,
            seoDescription: null,
            status: TourStatus.Active,
            thumbnail: null,
            images: null,
            classifications: classificationsJson);

        Assert.NotNull(probe.CapturedRequest);
        var cls = probe.CapturedRequest.Classifications![0];
        Assert.True(cls.Translations!.ContainsKey("vi"));
        Assert.False(cls.Translations.ContainsKey("en"));
    }
}
