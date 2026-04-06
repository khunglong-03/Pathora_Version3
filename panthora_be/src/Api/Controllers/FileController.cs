using Api.Endpoint;
using Application.Common.Constant;
using Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Authorize(Roles = RoleConstants.Admin)]
[Route(FileEndpoint.Base)]
public class FileController : BaseApiController
{
    private readonly IFileService _fileService;

    public FileController(IFileService fileService)
    {
        _fileService = fileService;
    }

    [HttpPost(FileEndpoint.Upload)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file.Length == 0)
            return BadRequest("File is empty");

        await using var stream = file.OpenReadStream();
        var result = await _fileService.UploadFileAsync(
            new Application.Contracts.File.UploadFileRequest(stream, file.FileName, file.ContentType ?? "application/octet-stream", file.Length));
        return Ok(result);
    }

    [HttpPost(FileEndpoint.UploadMultiple)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadMultiple([FromForm] Guid entityId, [FromForm] List<IFormFile> files)
    {
        if (files.Count == 0)
            return BadRequest("No files provided");

        var fileDataList = files.Select(f =>
            new Application.Contracts.File.FileData(f.OpenReadStream(), f.FileName, f.ContentType, f.Length)).ToList();

        var result = await _fileService.UploadMultipleFilesAsync(
            new Application.Contracts.File.UploadMultipleFilesRequest(entityId, fileDataList));

        return Ok(result);
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromBody] Application.Contracts.File.DeleteMultipleFilesRequest request)
    {
        await _fileService.DeleteMultipleFilesAsync(request);
        return Ok();
    }
}
