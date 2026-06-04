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

        var rolesResult = await _roleRepository.FindByUserId(currentUserId.ToString(), cancellationToken);
        if (rolesResult.IsError)
        {
            return false;
        }

        return rolesResult.Value.Any(role =>
            string.Equals(role.Name, "Admin", StringComparison.OrdinalIgnoreCase));
    }

    public async Task<bool> CanAccessAsync(Guid resourceOwnerId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_user.Id) || !Guid.TryParse(_user.Id, out var currentUserId))
        {
            return false;
        }

        // Staff and service provider roles can access (authorized via controller policies)
        var rolesResult = await _roleRepository.FindByUserId(currentUserId.ToString(), cancellationToken);
        if (!rolesResult.IsError)
        {
            var hasAccessRole = rolesResult.Value.Any(role =>
                string.Equals(role.Name, "Admin", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(role.Name, "Manager", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(role.Name, "TourOperator", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(role.Name, "TourGuide", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(role.Name, "TransportProvider", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(role.Name, "HotelServiceProvider", StringComparison.OrdinalIgnoreCase));

            if (hasAccessRole)
            {
                return true;
            }
        }

        // Owner (Customer) can access their own resources
        return resourceOwnerId == currentUserId;
    }
}
