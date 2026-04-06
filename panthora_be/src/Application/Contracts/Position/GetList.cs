namespace Application.Contracts.Position;

public sealed record GetAllPositionRequest(int PageNumber = 1, int PageSize = 10, string? SearchText = null);

public sealed record PositionVm(
    Guid Id,
    string Name,
    int Level,
    string? Note,
    int? Type
);
