using Api.Controllers;
using Application.Contracts.Booking;
using Application.Features.Tour.Commands;
using Application.Common.Interfaces;
using Contracts;
using Application.Contracts.File;
using Application.Dtos;
using Application.Features.Tour.Queries;
using Application.Services;
using Domain.Enums;
using ErrorOr;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Domain.Specs.Api;

public sealed class TourControllerTests
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
        {
            return Task.FromResult(new FileMetadataVm(Guid.CreateVersion7(), "http://cdn/test.jpg", request.FileName, "image/jpeg", request.Length));
        }

        public Task<IEnumerable<FileMetadataVm>> UploadMultipleFilesAsync(UploadMultipleFilesRequest request)
            => Task.FromResult<IEnumerable<FileMetadataVm>>([]);

        public Task DeleteMultipleFilesAsync(DeleteMultipleFilesRequest request)
            => Task.CompletedTask;

        public Task DeleteUploadedFilesAsync(List<string> objectNames)
            => Task.CompletedTask;
    }

    /// <summary>
    /// Minimal IFormFile that works without HttpContext (unlike FormFile which requires it for ContentType).
    /// </summary>
    private sealed class StubFormFile : IFormFile
    {
        private readonly byte[] _bytes;
        private readonly string _fileName;
        private readonly string _contentType;

        public StubFormFile(string fileName, string contentType)
        {
            _bytes = "fake image bytes"u8.ToArray();
            _fileName = fileName;
            _contentType = contentType;
        }

        public Stream OpenReadStream() => new MemoryStream(_bytes);
        public string ContentType => _contentType;
        public string FileName => _fileName;
        public long Length => _bytes.Length;
        public string Name => "file";
        public DateTimeOffset LastModified => DateTimeOffset.UtcNow;
        public IHeaderDictionary Headers => new HeaderDictionary();
        public string ContentDisposition => $"form-data; name=\"{Name}\"; filename=\"{FileName}\"";
        public void CopyTo(Stream target) => target.Write(_bytes);
        public Task CopyToAsync(Stream target, CancellationToken cancellationToken = default)
        {
            target.Write(_bytes);
            return Task.CompletedTask;
        }
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
    public async Task GetAll_WhenQuerySucceeds_ShouldReturnOkAndPayload()
    {
        var tours = new List<TourVm>
        {
            new(
                Guid.CreateVersion7(),
                "TOUR-001",
                "Tour Đà Nẵng",
                "Mô tả ngắn",
                "Active",
                null,
                DateTimeOffset.UtcNow)
        };
        var response = new PaginatedList<TourVm>(tours.Count, tours, 1, 10);
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<TourController, GetAllToursQuery, PaginatedList<TourVm>>(
                response, "/api/tour", StubFileService(), StubFileManager());

        var actionResult = await controller.GetAll(searchText: "Đà Nẵng", pageNumber: 2, pageSize: 5);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/tour",
            expectedData: response);
        Assert.Equal(new GetAllToursQuery("Đà Nẵng", 2, 5), probe.CapturedRequest);
    }

    [Fact]
    public async Task GetDetail_WhenTourMissing_ShouldReturnNotFoundResponse()
    {
        var id = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<TourController, GetTourDetailQuery, TourDto>(
                Error.NotFound("Tour.NotFound", "Không tìm thấy tour"),
                $"/api/tour/{id}",
                StubFileService(), StubFileManager());

        var actionResult = await controller.GetDetail(id);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "Tour.NotFound",
            expectedMessage: "Không tìm thấy tour",
            expectedInstance: $"/api/tour/{id}");
        Assert.Equal(new GetTourDetailQuery(id), probe.CapturedRequest);
    }

    [Fact]
    public async Task Create_WhenCommandSucceeds_ShouldReturnOkAndPayload()
    {
        var response = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<TourController, CreateTourCommand, Guid>(
                response, "/api/tour", StubFileService(), StubFileManager());

        var actionResult = await controller.Create(
            tourName: "Tour Đà Nẵng",
            shortDescription: "Mô tả ngắn",
            longDescription: "Mô tả dài",
            seoTitle: "SEO title",
            seoDescription: "SEO description",
            status: TourStatus.Active,
            thumbnail: null,
            images: null);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/tour",
            expectedData: response);
        Assert.NotNull(probe.CapturedRequest);
        Assert.Equal("Tour Đà Nẵng", probe.CapturedRequest.TourName);
    }

    [Fact]
    public async Task Update_WhenCommandSucceeds_ShouldReturnOkAndPayload()
    {
        var tourId = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<TourController, UpdateTourCommand, Success>(
                Result.Success, "/api/tour", StubFileService(), StubFileManager());

        var actionResult = await controller.Update(
            id: tourId,
            tourName: "Tour Đà Nẵng",
            shortDescription: "Mô tả ngắn",
            longDescription: "Mô tả dài",
            seoTitle: "SEO title",
            seoDescription: "SEO description",
            status: TourStatus.Active,
            thumbnail: null,
            images: null);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/tour",
            expectedData: Result.Success);
        Assert.NotNull(probe.CapturedRequest);
        Assert.Equal(tourId, probe.CapturedRequest.Id);
    }

    [Fact]
    public async Task Delete_WhenTourMissing_ShouldReturnNotFoundResponse()
    {
        var id = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<TourController, DeleteTourCommand, Success>(
                Error.NotFound("Tour.NotFound", "Không tìm thấy tour"),
                $"/api/tour/{id}",
                StubFileService(), StubFileManager());

        var actionResult = await controller.Delete(id);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "Tour.NotFound",
            expectedMessage: "Không tìm thấy tour",
            expectedInstance: $"/api/tour/{id}");
        Assert.Equal(new DeleteTourCommand(id), probe.CapturedRequest);
    }

    #region Parallel Upload Tests

    [Fact]
    public async Task Create_WhenThumbnailAndImagesProvided_ShouldNotThrow()
    {
        var (controller, _) = ApiControllerTestHelper
            .BuildController<TourController, CreateTourCommand, Guid>(
                Guid.CreateVersion7(), "/api/tour", StubFileService(), StubFileManager());

        var thumbnail = new StubFormFile("thumb.jpg", "image/jpeg");
        var image1 = new StubFormFile("img1.jpg", "image/jpeg");
        var image2 = new StubFormFile("img2.jpg", "image/jpeg");

        var actionResult = await controller.Create(
            tourName: "Tour Test",
            shortDescription: "Short",
            longDescription: "Long",
            seoTitle: null,
            seoDescription: null,
            status: TourStatus.Active,
            thumbnail: thumbnail,
            images: [image1, image2]);

        // Should return 200 OK (command succeeds), not throw during parallel upload
        Assert.IsNotType<BadRequestObjectResult>(actionResult);
    }

    #endregion

    #region JSON Parse Error Handling Tests

    [Fact]
    public async Task Create_WhenClassificationsJsonInvalid_ShouldReturnBadRequest()
    {
        var (controller, _) = ApiControllerTestHelper
            .BuildController<TourController, CreateTourCommand, Guid>(
                Guid.CreateVersion7(), "/api/tour", StubFileService(), StubFileManager());

        var actionResult = await controller.Create(
            tourName: "Tour Test",
            shortDescription: "Short",
            longDescription: "Long",
            seoTitle: null,
            seoDescription: null,
            status: TourStatus.Active,
            thumbnail: null,
            images: null,
            classifications: "{ invalid json");

        var badRequest = Assert.IsType<BadRequestObjectResult>(actionResult);
        var validation = Assert.IsType<ValidationProblemDetails>(badRequest.Value);
        Assert.Contains("classifications", validation.Errors.Keys);
        Assert.Contains("invalid JSON format", validation.Errors["classifications"][0]);
    }

    [Fact]
    public async Task Create_WhenAccommodationsJsonInvalid_ShouldReturnBadRequest()
    {
        var (controller, _) = ApiControllerTestHelper
            .BuildController<TourController, CreateTourCommand, Guid>(
                Guid.CreateVersion7(), "/api/tour", StubFileService(), StubFileManager());

        var actionResult = await controller.Create(
            tourName: "Tour Test",
            shortDescription: "Short",
            longDescription: "Long",
            seoTitle: null,
            seoDescription: null,
            status: TourStatus.Active,
            thumbnail: null,
            images: null,
            accommodations: "[{ broken");

        var badRequest = Assert.IsType<BadRequestObjectResult>(actionResult);
        var validation = Assert.IsType<ValidationProblemDetails>(badRequest.Value);
        Assert.Contains("accommodations", validation.Errors.Keys);
        Assert.Contains("invalid JSON format", validation.Errors["accommodations"][0]);
    }

    [Fact]
    public async Task Create_WhenLocationsJsonInvalid_ShouldReturnBadRequest()
    {
        var (controller, _) = ApiControllerTestHelper
            .BuildController<TourController, CreateTourCommand, Guid>(
                Guid.CreateVersion7(), "/api/tour", StubFileService(), StubFileManager());

        var actionResult = await controller.Create(
            tourName: "Tour Test",
            shortDescription: "Short",
            longDescription: "Long",
            seoTitle: null,
            seoDescription: null,
            status: TourStatus.Active,
            thumbnail: null,
            images: null,
            locations: "[{");

        var badRequest = Assert.IsType<BadRequestObjectResult>(actionResult);
        var validation = Assert.IsType<ValidationProblemDetails>(badRequest.Value);
        Assert.Contains("locations", validation.Errors.Keys);
        Assert.Contains("invalid JSON format", validation.Errors["locations"][0]);
    }

    [Fact]
    public async Task Create_WhenTransportationsJsonInvalid_ShouldReturnBadRequest()
    {
        var (controller, _) = ApiControllerTestHelper
            .BuildController<TourController, CreateTourCommand, Guid>(
                Guid.CreateVersion7(), "/api/tour", StubFileService(), StubFileManager());

        var actionResult = await controller.Create(
            tourName: "Tour Test",
            shortDescription: "Short",
            longDescription: "Long",
            seoTitle: null,
            seoDescription: null,
            status: TourStatus.Active,
            thumbnail: null,
            images: null,
            transportations: "{ broken");

        var badRequest = Assert.IsType<BadRequestObjectResult>(actionResult);
        var validation = Assert.IsType<ValidationProblemDetails>(badRequest.Value);
        Assert.Contains("transportations", validation.Errors.Keys);
        Assert.Contains("invalid JSON format", validation.Errors["transportations"][0]);
    }

    [Fact]
    public async Task Create_WhenServicesJsonInvalid_ShouldReturnBadRequest()
    {
        var (controller, _) = ApiControllerTestHelper
            .BuildController<TourController, CreateTourCommand, Guid>(
                Guid.CreateVersion7(), "/api/tour", StubFileService(), StubFileManager());

        var actionResult = await controller.Create(
            tourName: "Tour Test",
            shortDescription: "Short",
            longDescription: "Long",
            seoTitle: null,
            seoDescription: null,
            status: TourStatus.Active,
            thumbnail: null,
            images: null,
            services: "invalid");

        var badRequest = Assert.IsType<BadRequestObjectResult>(actionResult);
        var validation = Assert.IsType<ValidationProblemDetails>(badRequest.Value);
        Assert.Contains("services", validation.Errors.Keys);
        // whitespace-only: TryParseServices returns true (no error), but ParseServices will
        // throw on actual invalid JSON. Since the validation step passes (whitespace = null),
        // the test for invalid JSON should use a non-whitespace but non-array value.
        // Actually, "invalid" isn't valid JSON for List<ServiceDto> so we expect the method to fail.
        Assert.Contains("invalid JSON format", validation.Errors["services"][0]);
    }

    [Fact]
    public async Task Create_WhenMultipleJsonFieldsInvalid_ShouldReturnAllErrors()
    {
        var (controller, _) = ApiControllerTestHelper
            .BuildController<TourController, CreateTourCommand, Guid>(
                Guid.CreateVersion7(), "/api/tour", StubFileService(), StubFileManager());

        var actionResult = await controller.Create(
            tourName: "Tour Test",
            shortDescription: "Short",
            longDescription: "Long",
            seoTitle: null,
            seoDescription: null,
            status: TourStatus.Active,
            thumbnail: null,
            images: null,
            classifications: "{ bad",
            accommodations: "[ broken",
            locations: "not array",
            transportations: "also bad",
            services: "broken");

        var badRequest = Assert.IsType<BadRequestObjectResult>(actionResult);
        var validation = Assert.IsType<ValidationProblemDetails>(badRequest.Value);
        Assert.Contains("classifications", validation.Errors.Keys);
        Assert.Contains("accommodations", validation.Errors.Keys);
        Assert.Contains("locations", validation.Errors.Keys);
        Assert.Contains("transportations", validation.Errors.Keys);
        Assert.Contains("services", validation.Errors.Keys);
    }

    [Fact]
    public async Task Create_WhenTranslationsJsonInvalid_ShouldReturnBadRequest()
    {
        var (controller, _) = ApiControllerTestHelper
            .BuildController<TourController, CreateTourCommand, Guid>(
                Guid.CreateVersion7(), "/api/tour", StubFileService(), StubFileManager());

        var actionResult = await controller.Create(
            tourName: "Tour Test",
            shortDescription: "Short",
            longDescription: "Long",
            seoTitle: null,
            seoDescription: null,
            status: TourStatus.Active,
            thumbnail: null,
            images: null,
            translations: "invalid{json");

        var badRequest = Assert.IsType<BadRequestObjectResult>(actionResult);
        var validation = Assert.IsType<ValidationProblemDetails>(badRequest.Value);
        Assert.Contains("translations", validation.Errors.Keys);
        Assert.Contains("invalid JSON format", validation.Errors["translations"][0]);
    }

    [Fact]
    public async Task Create_WhenAllJsonFieldsValid_ShouldCallCommandHandler()
    {
        var responseId = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<TourController, CreateTourCommand, Guid>(
                responseId, "/api/tour", StubFileService(), StubFileManager());

        var actionResult = await controller.Create(
            tourName: "Tour Test",
            shortDescription: "Short",
            longDescription: "Long",
            seoTitle: null,
            seoDescription: null,
            status: TourStatus.Active,
            thumbnail: null,
            images: null,
            translations: "{\"vi\":{\"tourName\":\"Tên Tour\",\"shortDescription\":\"Mô tả\",\"longDescription\":\"Chi tiết\"}}",
            classifications: "[]",
            accommodations: "[]",
            locations: "[]",
            transportations: "[]",
            services: "[]");

        Assert.IsNotType<BadRequestObjectResult>(actionResult);
        Assert.NotNull(probe.CapturedRequest);
    }

    #endregion

    #region UpdateStatus Tests

    [Fact]
    public async Task UpdateStatus_WhenTourExists_ShouldReturnOk()
    {
        var id = Guid.CreateVersion7();
        var dto = new UpdateTourStatusRequestDto(TourStatus.Active);
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<TourController, UpdateTourStatusCommand, Success>(
                Result.Success,
                $"/api/tour/{id}/status",
                StubFileService(), StubFileManager());

        var actionResult = await controller.UpdateStatus(id, dto);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: $"/api/tour/{id}/status",
            expectedData: Result.Success);
        Assert.Equal(new UpdateTourStatusCommand(id, TourStatus.Active), probe.CapturedRequest);
    }

    [Fact]
    public async Task UpdateStatus_WhenTourNotFound_ShouldReturn404()
    {
        var id = Guid.CreateVersion7();
        var dto = new UpdateTourStatusRequestDto(TourStatus.Inactive);
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<TourController, UpdateTourStatusCommand, Success>(
                Error.NotFound("Tour.NotFound", "Tour not found."),
                $"/api/tour/{id}/status",
                StubFileService(), StubFileManager());

        var actionResult = await controller.UpdateStatus(id, dto);

        ApiControllerTestHelper.AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "Tour.NotFound",
            expectedMessage: "Tour not found.",
            expectedInstance: $"/api/tour/{id}/status");
        Assert.Equal(new UpdateTourStatusCommand(id, TourStatus.Inactive), probe.CapturedRequest);
    }

    [Fact]
    public async Task UpdateStatus_WhenUnauthorized_ShouldReturn401()
    {
        var id = Guid.CreateVersion7();
        var dto = new UpdateTourStatusRequestDto(TourStatus.Rejected);
        var (controller, _) = ApiControllerTestHelper
            .BuildController<TourController, UpdateTourStatusCommand, Success>(
                Error.Unauthorized("Auth.Unauthorized", "Unauthorized"),
                $"/api/tour/{id}/status",
                StubFileService(), StubFileManager());

        var actionResult = await controller.UpdateStatus(id, dto);

        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status401Unauthorized, objectResult.StatusCode);
    }

    #endregion
}
