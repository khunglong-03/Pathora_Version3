using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Common.Models;
using Infrastructure.Exceptions;
using Infrastructure.Files;
using Infrastructure.Options;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Infrastructure;

public sealed class CloudinaryCloudServiceTests
{
    private static CloudinaryCloudService CreateService(ICloudinaryClient? client = null, string defaultFolder = "test-folder")
    {
        client ??= Substitute.For<ICloudinaryClient>();
        var storageOptions = Microsoft.Extensions.Options.Options.Create(new StorageOptions { DefaultFolder = defaultFolder });
        var logger = Substitute.For<ILogger<CloudinaryCloudService>>();
        return new CloudinaryCloudService(client, storageOptions, logger);
    }

    [Fact]
    public async Task UploadFilesAsync_WhenSingleFile_ReturnsPublicUrl()
    {
        // Arrange
        var client = Substitute.For<ICloudinaryClient>();
        var service = CreateService(client);

        var mockResult = new ImageUploadResult
        {
            SecureUrl = new Uri("https://res.cloudinary.com/test-cloud/image/upload/v123456/test.jpg")
        };
        client.UploadAsync(Arg.Any<ImageUploadParams>(), Arg.Any<CancellationToken>())
            .Returns(mockResult);

        var files = new List<UploadFileBytes>
        {
            new()
            {
                FileName = "test.jpg",
                ContentType = "image/jpeg",
                Bytes = [0xFF, 0xD8, 0xFF, 0xE0]
            }
        };

        // Act
        var results = await service.UploadFilesAsync(files, "panthora");

        // Assert
        Assert.Single(results);
        Assert.Equal("test.jpg", results[0].OriginalFileName);
        Assert.Equal("image/jpeg", results[0].ContentType);
        Assert.Equal(4, results[0].FileSize);
        Assert.Equal("https://res.cloudinary.com/test-cloud/image/upload/v123456/test.jpg", results[0].PublicUrl);
        Assert.Equal("panthora", results[0].FolderName);

        // Verify upload was called
        await client.Received(1).UploadAsync(Arg.Any<ImageUploadParams>(), Arg.Any<CancellationToken>());
        var uploadParams = client.ReceivedCalls().First().GetArguments()[0] as ImageUploadParams;
        Assert.NotNull(uploadParams);
        Assert.Equal("panthora", uploadParams.Folder);
        Assert.EndsWith(".jpg", uploadParams.PublicId);
    }

    [Fact]
    public async Task UploadFilesAsync_WhenMultipleFiles_ReturnsAllResults()
    {
        // Arrange
        var client = Substitute.For<ICloudinaryClient>();
        var service = CreateService(client);

        var results = new[]
        {
            new ImageUploadResult { SecureUrl = new Uri("https://res.cloudinary.com/test/v1/a.jpg") },
            new ImageUploadResult { SecureUrl = new Uri("https://res.cloudinary.com/test/v1/b.png") }
        };
        client.UploadAsync(Arg.Any<ImageUploadParams>(), Arg.Any<CancellationToken>())
            .Returns(results[0], results[1]);

        var files = new List<UploadFileBytes>
        {
            new() { FileName = "a.jpg", ContentType = "image/jpeg", Bytes = [0x01] },
            new() { FileName = "b.png", ContentType = "image/png", Bytes = [0x02] }
        };

        // Act
        var uploadResults = await service.UploadFilesAsync(files, "panthora");

        // Assert
        Assert.Equal(2, uploadResults.Count);
        Assert.Equal("a.jpg", uploadResults[0].OriginalFileName);
        Assert.Equal("b.png", uploadResults[1].OriginalFileName);
        await client.Received(2).UploadAsync(Arg.Any<ImageUploadParams>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UploadFilesAsync_WhenEmptyList_ReturnsEmptyResults()
    {
        // Arrange
        var client = Substitute.For<ICloudinaryClient>();
        var service = CreateService(client);

        // Act
        var results = await service.UploadFilesAsync([], "panthora");

        // Assert
        Assert.Empty(results);
        await client.Received(0).UploadAsync(Arg.Any<ImageUploadParams>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UploadFilesAsync_WhenDefaultFolderUsed_UsesConfigurationDefault()
    {
        // Arrange
        var client = Substitute.For<ICloudinaryClient>();
        var service = CreateService(client, "my-default-folder");

        var mockResult = new ImageUploadResult
        {
            SecureUrl = new Uri("https://res.cloudinary.com/test-cloud/image/upload/v123/test.jpg")
        };
        client.UploadAsync(Arg.Any<ImageUploadParams>(), Arg.Any<CancellationToken>())
            .Returns(mockResult);

        var files = new List<UploadFileBytes>
        {
            new() { FileName = "test.jpg", ContentType = "image/jpeg", Bytes = [0xFF] }
        };

        // Act — pass empty string to trigger default folder
        var results = await service.UploadFilesAsync(files, string.Empty);

        // Assert
        Assert.Single(results);
        Assert.Equal("my-default-folder", results[0].FolderName);

        var uploadParams = client.ReceivedCalls().First().GetArguments()[0] as ImageUploadParams;
        Assert.NotNull(uploadParams);
        Assert.Equal("my-default-folder", uploadParams.Folder);
    }

    [Fact]
    public async Task DeleteFilesAsync_WhenSinglePublicId_CallsCloudinaryDelete()
    {
        // Arrange
        var client = Substitute.For<ICloudinaryClient>();
        var service = CreateService(client);

        client.DeleteResourcesAsync(Arg.Any<string[]>())
            .Returns(new DelResResult { Deleted = new Dictionary<string, string> { ["abc123.jpg"] = "deleted" } });

        // Act
        await service.DeleteFilesAsync(["abc123.jpg"], CancellationToken.None);

        // Assert
        await client.Received(1).DeleteResourcesAsync(Arg.Is<string[]>(p => p.Length == 1 && p[0] == "abc123.jpg"));
    }

    [Fact]
    public async Task DeleteFilesAsync_WhenMultiplePublicIds_JoinsWithComma()
    {
        // Arrange
        var client = Substitute.For<ICloudinaryClient>();
        var service = CreateService(client);

        client.DeleteResourcesAsync(Arg.Any<string[]>())
            .Returns(new DelResResult());

        // Act
        await service.DeleteFilesAsync(["abc.jpg", "def.png", "ghi.webp"], CancellationToken.None);

        // Assert
        await client.Received(1).DeleteResourcesAsync(Arg.Is<string[]>(p => p.Length == 3 && p[0] == "abc.jpg" && p[1] == "def.png" && p[2] == "ghi.webp"));
    }

    [Fact]
    public async Task DeleteFilesAsync_WhenEmptyList_DoesNotCallCloudinary()
    {
        // Arrange
        var client = Substitute.For<ICloudinaryClient>();
        var service = CreateService(client);

        // Act
        await service.DeleteFilesAsync([], CancellationToken.None);

        // Assert
        await client.Received(0).DeleteResourcesAsync(Arg.Any<string[]>());
    }

    [Fact]
    public async Task UploadFilesAsync_WhenCloudinaryThrows_ThrowsInfrastructureException()
    {
        // Arrange
        var client = Substitute.For<ICloudinaryClient>();
        var service = CreateService(client);

        client.UploadAsync(Arg.Any<ImageUploadParams>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromException<ImageUploadResult>(new Exception("Network error")));

        var files = new List<UploadFileBytes>
        {
            new() { FileName = "test.jpg", ContentType = "image/jpeg", Bytes = [0xFF] }
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InfrastructureException>(
            () => service.UploadFilesAsync(files, "panthora"));
        Assert.Contains("test.jpg", ex.Message);
        Assert.Contains("Network error", ex.Message);
    }
}
