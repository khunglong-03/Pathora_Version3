using Api.Controllers;
using Application.Contracts.File;
using Application.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Domain.Specs.Api;

public sealed class FileControllerTests
{
    [Fact]
    public async Task Upload_WhenFileIsEmpty_ShouldReturnBadRequest()
    {
        var fileService = new CaptureFileService();
        var controller = new FileController(fileService);
        var emptyFile = new FormFile(Stream.Null, 0, 0, "file", "empty.txt");

        var actionResult = await controller.Upload(emptyFile);

        var badRequest = Assert.IsType<BadRequestObjectResult>(actionResult);
        Assert.Equal("File is empty", badRequest.Value);
        Assert.False(fileService.UploadCalled);
    }

    [Fact]
    public async Task Upload_WhenFileIsValid_ShouldReturnUrl()
    {
        var expectedVm = new FileMetadataVm(Guid.CreateVersion7(), "https://cdn.example.com/file.png", "avatar.png", "image/png", 4);
        var fileService = new CaptureFileService { UploadResult = expectedVm };
        var controller = new FileController(fileService);
        await using var stream = new MemoryStream([1, 2, 3, 4]);
        var file = new FormFile(stream, 0, stream.Length, "file", "avatar.png")
        {
            Headers = new HeaderDictionary(),
            ContentType = "image/png"
        };

        var actionResult = await controller.Upload(file);

        var ok = Assert.IsType<OkObjectResult>(actionResult);
        var vm = Assert.IsType<FileMetadataVm>(ok.Value);
        Assert.Equal("https://cdn.example.com/file.png", vm.Url);
        Assert.True(fileService.UploadCalled);
        Assert.Equal("avatar.png", fileService.CapturedUploadRequest?.FileName);
    }

    [Fact]
    public async Task UploadMultiple_WhenNoFilesProvided_ShouldReturnBadRequest()
    {
        var fileService = new CaptureFileService();
        var controller = new FileController(fileService);
        var entityId = Guid.CreateVersion7();

        var actionResult = await controller.UploadMultiple(entityId, []);

        var badRequest = Assert.IsType<BadRequestObjectResult>(actionResult);
        Assert.Equal("No files provided", badRequest.Value);
        Assert.False(fileService.UploadMultipleCalled);
    }

    [Fact]
    public async Task UploadMultiple_WhenFilesProvided_ShouldReturnMetadata()
    {
        var fileService = new CaptureFileService
        {
            UploadMultipleResult =
            [
                new FileMetadataVm(Guid.CreateVersion7(), "https://cdn.example.com/a.png", "a.png", "image/png", 123)
            ]
        };
        var controller = new FileController(fileService);
        var entityId = Guid.CreateVersion7();
        await using var stream = new MemoryStream([1, 2, 3]);
        var files = new List<IFormFile>
        {
            new FormFile(stream, 0, stream.Length, "files", "a.png")
            {
                Headers = new HeaderDictionary(),
                ContentType = "image/png"
            }
        };

        var actionResult = await controller.UploadMultiple(entityId, files);

        var ok = Assert.IsType<OkObjectResult>(actionResult);
        var payload = Assert.IsAssignableFrom<IEnumerable<FileMetadataVm>>(ok.Value);
        var item = Assert.Single(payload);
        Assert.Equal("a.png", item.Name);
        Assert.True(fileService.UploadMultipleCalled);
        Assert.Equal(entityId, fileService.CapturedUploadMultipleRequest?.EntityId);
    }

    [Fact]
    public async Task Delete_WhenRequestIsValid_ShouldReturnOk()
    {
        var fileService = new CaptureFileService();
        var controller = new FileController(fileService);
        var request = new DeleteMultipleFilesRequest([Guid.CreateVersion7(), Guid.CreateVersion7()]);

        var actionResult = await controller.Delete(request);

        Assert.IsType<OkResult>(actionResult);
        Assert.True(fileService.DeleteCalled);
        Assert.Equal(request, fileService.CapturedDeleteRequest);
    }

    private sealed class CaptureFileService : IFileService
    {
        public bool UploadCalled { get; private set; }
        public bool UploadMultipleCalled { get; private set; }
        public bool DeleteCalled { get; private set; }
        public FileMetadataVm UploadResult { get; set; } = new(Guid.Empty, "https://cdn.example.com/default.png", "default.png", "image/png", 0);
        public IEnumerable<FileMetadataVm> UploadMultipleResult { get; set; } = [];
        public UploadFileRequest? CapturedUploadRequest { get; private set; }
        public UploadMultipleFilesRequest? CapturedUploadMultipleRequest { get; private set; }
        public DeleteMultipleFilesRequest? CapturedDeleteRequest { get; private set; }

        public Task<FileMetadataVm> UploadFileAsync(UploadFileRequest request)
        {
            UploadCalled = true;
            CapturedUploadRequest = request;
            return Task.FromResult(UploadResult);
        }

        public Task<IEnumerable<FileMetadataVm>> UploadMultipleFilesAsync(UploadMultipleFilesRequest request)
        {
            UploadMultipleCalled = true;
            CapturedUploadMultipleRequest = request;
            return Task.FromResult(UploadMultipleResult);
        }

        public Task DeleteMultipleFilesAsync(DeleteMultipleFilesRequest request)
        {
            DeleteCalled = true;
            CapturedDeleteRequest = request;
            return Task.CompletedTask;
        }

        public Task DeleteUploadedFilesAsync(List<string> objectNames)
            => Task.CompletedTask;
    }
}
