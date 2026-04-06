namespace Application.Dtos;

public sealed record ImageDto(
    string? FileId,
    string? OriginalFileName,
    string? FileName,
    string? PublicURL
);
