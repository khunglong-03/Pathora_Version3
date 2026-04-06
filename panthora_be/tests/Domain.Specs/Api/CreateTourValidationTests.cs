using Api.Controllers;
using Application.Common.Interfaces;
using Application.Contracts.File;
using Application.Features.Tour.Commands;
using Application.Services;
using Domain.Enums;
using ErrorOr;
using Microsoft.AspNetCore.Mvc;

namespace Domain.Specs.Api;

/// <summary>
/// API-level tests for CreateTour endpoint validation.
/// Covers all validation rules from CreateTourCommandValidator.
/// </summary>
public sealed class CreateTourValidationTests
{
    // ================================================================================
    // TOURNAME VALIDATION TESTS
    // ================================================================================

    [Fact]
    public async Task Create_WhenTourNameIsEmpty_ShouldReturnBadRequest()
    {
        // Arrange
        var (controller, _) = ApiControllerTestHelper.BuildController<TourController, CreateTourCommand, Guid>(
            Error.Validation("TourName.Required", "Tour name is required"),
            "/api/tour",
            new StubFileService(), new StubFileManager());

        // Act
        var actionResult = await controller.Create(
            tourName: "",
            shortDescription: "Valid short description",
            longDescription: "Valid long description",
            seoTitle: null,
            seoDescription: null,
            status: TourStatus.Active,
            thumbnail: null,
            images: null);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(400, objectResult.StatusCode);
    }

    [Fact]
    public async Task Create_WhenTourNameExceeds500Chars_ShouldReturnBadRequest()
    {
        // Arrange
        var invalidTourName = new string('A', 501);
        var (controller, _) = ApiControllerTestHelper.BuildController<TourController, CreateTourCommand, Guid>(
            Error.Validation("TourName.MaxLength", "Tour name must not exceed 500 characters"),
            "/api/tour",
            new StubFileService(), new StubFileManager());

        // Act
        var actionResult = await controller.Create(
            tourName: invalidTourName,
            shortDescription: "Valid short description",
            longDescription: "Valid long description",
            seoTitle: null,
            seoDescription: null,
            status: TourStatus.Active,
            thumbnail: null,
            images: null);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(400, objectResult.StatusCode);
    }

    [Fact]
    public async Task Create_WhenTourNameExactly500Chars_ShouldReturnOk()
    {
        // Arrange
        var validTourName = new string('A', 500);
        var expectedId = Guid.CreateVersion7();
        var (controller, probe) = ApiControllerTestHelper.BuildController<TourController, CreateTourCommand, Guid>(
            expectedId,
            "/api/tour",
            new StubFileService(), new StubFileManager());

        // Act
        var actionResult = await controller.Create(
            tourName: validTourName,
            shortDescription: "Valid short description",
            longDescription: "Valid long description",
            seoTitle: null,
            seoDescription: null,
            status: TourStatus.Active,
            thumbnail: null,
            images: null);

        // Assert
        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: 200,
            expectedInstance: "/api/tour",
            expectedData: expectedId);
        Assert.NotNull(probe.CapturedRequest);
        Assert.Equal(validTourName, probe.CapturedRequest.TourName);
    }

    // ================================================================================
    // SHORT DESCRIPTION VALIDATION TESTS
    // ================================================================================

    [Fact]
    public async Task Create_WhenShortDescriptionIsEmpty_ShouldReturnBadRequest()
    {
        // Arrange
        var (controller, _) = ApiControllerTestHelper.BuildController<TourController, CreateTourCommand, Guid>(
            Error.Validation("ShortDescription.Required", "Short description is required"),
            "/api/tour",
            new StubFileService(), new StubFileManager());

        // Act
        var actionResult = await controller.Create(
            tourName: "Valid Tour Name",
            shortDescription: "",
            longDescription: "Valid long description",
            seoTitle: null,
            seoDescription: null,
            status: TourStatus.Active,
            thumbnail: null,
            images: null);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(400, objectResult.StatusCode);
    }

    [Fact]
    public async Task Create_WhenShortDescriptionExceeds250Chars_ShouldReturnBadRequest()
    {
        // Arrange
        var invalidShortDesc = new string('A', 251);
        var (controller, _) = ApiControllerTestHelper.BuildController<TourController, CreateTourCommand, Guid>(
            Error.Validation("ShortDescription.MaxLength", "Short description must not exceed 250 characters"),
            "/api/tour",
            new StubFileService(), new StubFileManager());

        // Act
        var actionResult = await controller.Create(
            tourName: "Valid Tour Name",
            shortDescription: invalidShortDesc,
            longDescription: "Valid long description",
            seoTitle: null,
            seoDescription: null,
            status: TourStatus.Active,
            thumbnail: null,
            images: null);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(400, objectResult.StatusCode);
    }

    // ================================================================================
    // LONG DESCRIPTION VALIDATION TESTS
    // ================================================================================

    [Fact]
    public async Task Create_WhenLongDescriptionIsEmpty_ShouldReturnBadRequest()
    {
        // Arrange
        var (controller, _) = ApiControllerTestHelper.BuildController<TourController, CreateTourCommand, Guid>(
            Error.Validation("LongDescription.Required", "Long description is required"),
            "/api/tour",
            new StubFileService(), new StubFileManager());

        // Act
        var actionResult = await controller.Create(
            tourName: "Valid Tour Name",
            shortDescription: "Valid short description",
            longDescription: "",
            seoTitle: null,
            seoDescription: null,
            status: TourStatus.Active,
            thumbnail: null,
            images: null);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(400, objectResult.StatusCode);
    }

    [Fact]
    public async Task Create_WhenLongDescriptionExceeds5000Chars_ShouldReturnBadRequest()
    {
        // Arrange
        var invalidLongDesc = new string('A', 5001);
        var (controller, _) = ApiControllerTestHelper.BuildController<TourController, CreateTourCommand, Guid>(
            Error.Validation("LongDescription.MaxLength", "Long description must not exceed 5000 characters"),
            "/api/tour",
            new StubFileService(), new StubFileManager());

        // Act
        var actionResult = await controller.Create(
            tourName: "Valid Tour Name",
            shortDescription: "Valid short description",
            longDescription: invalidLongDesc,
            seoTitle: null,
            seoDescription: null,
            status: TourStatus.Active,
            thumbnail: null,
            images: null);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(400, objectResult.StatusCode);
    }

    // ================================================================================
    // SEO VALIDATION TESTS
    // ================================================================================

    [Fact]
    public async Task Create_WhenSEOTitleExceeds70Chars_ShouldReturnBadRequest()
    {
        // Arrange
        var invalidSEOTitle = new string('A', 71);
        var (controller, _) = ApiControllerTestHelper.BuildController<TourController, CreateTourCommand, Guid>(
            Error.Validation("SEOTitle.MaxLength", "SEO title must not exceed 70 characters"),
            "/api/tour",
            new StubFileService(), new StubFileManager());

        // Act
        var actionResult = await controller.Create(
            tourName: "Valid Tour Name",
            shortDescription: "Valid short description",
            longDescription: "Valid long description",
            seoTitle: invalidSEOTitle,
            seoDescription: null,
            status: TourStatus.Active,
            thumbnail: null,
            images: null);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(400, objectResult.StatusCode);
    }

    [Fact]
    public async Task Create_WhenSEODescriptionExceeds320Chars_ShouldReturnBadRequest()
    {
        // Arrange
        var invalidSEODesc = new string('A', 321);
        var (controller, _) = ApiControllerTestHelper.BuildController<TourController, CreateTourCommand, Guid>(
            Error.Validation("SEODescription.MaxLength", "SEO description must not exceed 320 characters"),
            "/api/tour",
            new StubFileService(), new StubFileManager());

        // Act
        var actionResult = await controller.Create(
            tourName: "Valid Tour Name",
            shortDescription: "Valid short description",
            longDescription: "Valid long description",
            seoTitle: null,
            seoDescription: invalidSEODesc,
            status: TourStatus.Active,
            thumbnail: null,
            images: null);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(400, objectResult.StatusCode);
    }

    // ================================================================================
    // STUB FILE SERVICE
    // ================================================================================

    private sealed class StubFileService : IFileService
    {
        public Task<FileMetadataVm> UploadFileAsync(UploadFileRequest request)
            => Task.FromResult(new FileMetadataVm(
                Guid.CreateVersion7(), "http://cdn/test.jpg", request.FileName, "image/jpeg", request.Length));

        public Task<IEnumerable<FileMetadataVm>> UploadMultipleFilesAsync(UploadMultipleFilesRequest request)
            => Task.FromResult<IEnumerable<FileMetadataVm>>([]);

        public Task DeleteMultipleFilesAsync(DeleteMultipleFilesRequest request)
            => Task.CompletedTask;

        public Task DeleteUploadedFilesAsync(List<string> objectNames)
            => Task.CompletedTask;
    }

    private sealed class StubFileManager : IFileManager
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
}
