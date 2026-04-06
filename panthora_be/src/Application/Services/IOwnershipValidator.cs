namespace Application.Services;

public interface IOwnershipValidator
{
    Task<bool> IsOwnerAsync(Guid resourceOwnerId, CancellationToken cancellationToken = default);
    Task<bool> IsAdminAsync(CancellationToken cancellationToken = default);
    Task<bool> CanAccessAsync(Guid resourceOwnerId, CancellationToken cancellationToken = default);
    string? GetCurrentUserId();
}
