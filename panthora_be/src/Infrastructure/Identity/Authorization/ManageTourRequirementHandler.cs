using System.Security.Claims;
using Domain.Entities;
using Microsoft.AspNetCore.Authorization;

namespace Infrastructure.Identity.Authorization;

public class ManageTourRequirementHandler : AuthorizationHandler<ManageTourRequirement, TourEntity>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext contextAuth, ManageTourRequirement requirement, TourEntity resource)
    {
        try
        {
            // 1. Admin and Manager implicitly have access to all tours
            if (contextAuth.User.IsInRole("Admin") || contextAuth.User.IsInRole("Manager"))
            {
                contextAuth.Succeed(requirement);
                return Task.CompletedTask;
            }

            var userIdString = contextAuth.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(userIdString, out var userId))
            {
                // 2. If the user is the creator of the tour itself, allow them.
                if (resource.TourDesignerId == userId)
                {
                    contextAuth.Succeed(requirement);
                }
            }

            return Task.CompletedTask;
        }
        catch (Exception exception)
        {
            return Task.FromException(exception);
        }
    }
}
