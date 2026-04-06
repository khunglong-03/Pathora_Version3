namespace Application.Dtos;

public sealed record ImageInputDto(
    string FileId,
    string OriginalFileName,
    string FileName,
    string PublicURL
);
