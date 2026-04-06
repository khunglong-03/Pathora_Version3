namespace Application.Contracts.File;

public sealed record DeleteMultipleFilesRequest(List<Guid> FileIds);
