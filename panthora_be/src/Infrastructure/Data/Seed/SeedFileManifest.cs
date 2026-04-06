namespace Infrastructure.Data.Seed;

internal static class SeedFileManifest
{
    public static IReadOnlyList<SeedFileDefinition> Definitions { get; } =
    [
        new("RoleContextSeed", "role.json", ["Id", "Name", "Type", "Status"], "Id", null),
        new("UserContextSeed", "user.json", ["Id", "Username", "Email", "Status", "VerifyStatus"], "Id", null),
        new("UserRoleContextSeed", "user-role.json", ["UserId", "RoleId"], null, ["UserId", "RoleId"]),
    ];
}

internal sealed record SeedFileDefinition(
    string ContextSeedClass,
    string FileName,
    IReadOnlyList<string> RequiredFields,
    string? IdField = null,
    IReadOnlyList<string>? ReferenceFields = null);