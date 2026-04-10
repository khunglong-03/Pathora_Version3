using Contracts.Interfaces;
using Domain.Common.Repositories;

namespace Application.Services;

public sealed class OwnershipValidator(
    IUser user,
    IRoleRepository roleRepository) : IOwnershipValidator
{
    private readonly IUser _user = user;
    private readonly IRoleRepository _roleRepository = roleRepository;

    public string? GetCurrentUserId() => _user.Id;

    public Task<bool> IsOwnerAsync(Guid resourceOwnerId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_user.Id) || !Guid.TryParse(_user.Id, out var currentUserId))
        {
            return Task.FromResult(false);
        }

        return Task.FromResult(resourceOwnerId == currentUserId);
    }

    public async Task<bool> IsAdminAsync(CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_user.Id) || !Guid.TryParse(_user.Id, out var currentUserId))
        {
            return false;
        }

        var rolesResult = await _roleRepository.FindByUserId(currentUserId.ToString());
        if (rolesResult.IsError)
        {
            return false;
        }

        return rolesResult.Value.Any(role =>
            string.Equals(role.Name, "Admin", StringComparison.OrdinalIgnoreCase));
    }

    public async Task<bool> CanAccessAsync(Guid resourceOwnerId, CancellationToken cancellationToken = default)
    {
        // Admin can access everything
        if (await IsAdminAsync(cancellationToken))
        {
            return true;
        }

        // Owner can access their own resources
        return await IsOwnerAsync(resourceOwnerId, cancellationToken);
    }
}
