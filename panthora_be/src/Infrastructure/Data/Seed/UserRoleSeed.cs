using Microsoft.EntityFrameworkCore;
using Domain.Entities;
using Infrastructure.Data;

namespace Infrastructure.Data.Seed;

public static class UserRoleSeed
{
    public static bool SeedData(AppDbContext context)
    {
        var hasChanges = false;
        hasChanges |= SeedRoles(context);
        hasChanges |= SeedUsers(context);
        hasChanges |= SeedUserRoles(context);
        return hasChanges;
    }

    private static bool SeedRoles(AppDbContext context)
    {
        if (context.Roles.Any()) return false;

        var data = SeedDataLoader.LoadData<RoleEntity>("role.json");
        if (data is { Count: > 0 })
        {
            context.Roles.AddRange(data);
            context.SaveChanges();
            return true;
        }

        return false;
    }

    private static bool SeedUsers(AppDbContext context)
    {
        if (context.Users.Any()) return false;

        var data = SeedDataLoader.LoadData<UserEntity>("user.json");
        if (data is { Count: > 0 })
        {
            context.Users.AddRange(data);
            context.SaveChanges();
            return true;
        }

        return false;
    }

    private static bool SeedUserRoles(AppDbContext context)
    {
        if (context.UserRoles.Any()) return false;

        var data = SeedDataLoader.LoadData<UserRoleEntity>("user-role.json");
        if (data is { Count: > 0 })
        {
            context.UserRoles.AddRange(data);
            context.SaveChanges();
            return true;
        }

        return false;
    }
}
