using System.Security.Claims;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Identity.Authorization;

public class ManageTourRequirementHandler(AppDbContext context) : AuthorizationHandler<ManageTourRequirement, TourEntity>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext contextAuth, ManageTourRequirement requirement, TourEntity resource)
    {
        // 1. Admin implicitly has access to all tours
        if (contextAuth.User.IsInRole("Admin"))
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

            // 3. For Managers: check if the TourDesigner who created this tour is managed by this Manager
            if (contextAuth.User.IsInRole("Manager") && resource.TourDesignerId.HasValue)
            {
                var targetDesignerId = resource.TourDesignerId.Value;

                var isManaged = await context.TourManagerAssignments
                    .AnyAsync(a => a.TourManagerId == userId
                                   && a.AssignedEntityType == AssignedEntityType.TourDesigner
                                   && a.AssignedUserId == targetDesignerId);

                if (isManaged)
                {
                    contextAuth.Succeed(requirement);
                    return;
                }
            }
        }

        // If none of the conditions match, the authorization fails implicitly
        // by returning without calling Succeed.
    }
}
