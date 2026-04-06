namespace Application.Contracts.Position;

public sealed record UpdatePositionRequest(
    Guid Id,
    string Name,
    int Level,
    string? Note,
    int? Type
);

