using System.Security.Claims;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Identity.Authorization;

public class ManageTourRequirementHandler : AuthorizationHandler<ManageTourRequirement, TourEntity>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext contextAuth, ManageTourRequirement requirement, TourEntity resource)
    {
        // 1. Admin and Manager implicitly have access to all tours
        if (contextAuth.User.IsInRole("Admin") || contextAuth.User.IsInRole("Manager"))
        {
            contextAuth.Succeed(requirement);
            return;
        }

        var userIdString = contextAuth.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (Guid.TryParse(userIdString, out var userId))
        {
            // 2. If the user is the creator of the tour itself, allow them.
            if (resource.TourDesignerId == userId)
            {
                contextAuth.Succeed(requirement);
                return;
            }
        }

        // If none of the conditions match, the authorization fails implicitly
        // by returning without calling Succeed.
    }
}
