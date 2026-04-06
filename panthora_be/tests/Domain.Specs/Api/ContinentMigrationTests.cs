namespace Domain.Specs.Api;

/// <summary>
/// Verifies that the Continent migration (adding Continent column to Tours table)
/// is properly registered and ready to be applied to __EFMigrationsHistory.
///
/// These tests verify migration artifacts at the file level, which is the most reliable
/// approach in an xUnit test environment. Full __EFMigrationsHistory verification
/// requires a live database and is done via MigrationRunner or `dotnet ef database update`.
/// </summary>
public sealed class ContinentMigrationTests
{
    private const string ExpectedMigrationName = "20260404142420_AddContinentToTour";

    [Fact]
    public void AddContinentToTour_MigrationFile_ShouldExist()
    {
        var migrationRoot = GetMigrationRoot();
        var migrationFile = Path.Combine(migrationRoot, $"{ExpectedMigrationName}.cs");

        Assert.True(File.Exists(migrationFile),
            $"Migration file should exist at: {migrationRoot}\\{ExpectedMigrationName}.cs");
    }

    [Fact]
    public void AddContinentToTour_DesignerFile_ShouldExist()
    {
        // The .Designer.cs file is required by EF Core to record the migration in __EFMigrationsHistory
        var migrationRoot = GetMigrationRoot();
        var designerFile = Path.Combine(migrationRoot, $"{ExpectedMigrationName}.Designer.cs");

        Assert.True(File.Exists(designerFile),
            $"Designer file should exist: {designerFile}");
    }

    [Fact]
    public void AddContinentToTour_MigrationFile_ShouldAddContinentColumnToTours()
    {
        // Verify the migration source file contains the expected SQL operations
        var migrationRoot = GetMigrationRoot();
        var migrationFile = Path.Combine(migrationRoot, $"{ExpectedMigrationName}.cs");
        var source = File.ReadAllText(migrationFile);

        // Up: add Continent column to Tours table
        Assert.Contains("Continent", source);
        Assert.Contains("Tours", source);
        Assert.Contains("AddColumn", source, StringComparison.Ordinal);
    }

    [Fact]
    public void AddContinentToTour_MigrationFile_ShouldHaveRollbackInDown()
    {
        var migrationRoot = GetMigrationRoot();
        var migrationFile = Path.Combine(migrationRoot, $"{ExpectedMigrationName}.cs");
        var source = File.ReadAllText(migrationFile);

        // Down: remove Continent column
        Assert.Contains("DropColumn", source, StringComparison.Ordinal);
    }

    [Fact]
    public void Continent_Enum_ShouldHaveSixValues()
    {
        var values = Enum.GetValues<Domain.Enums.Continent>();
        Assert.Equal(6, values.Length);
        Assert.Contains(Domain.Enums.Continent.Asia, values);
        Assert.Contains(Domain.Enums.Continent.Europe, values);
        Assert.Contains(Domain.Enums.Continent.Africa, values);
        Assert.Contains(Domain.Enums.Continent.Americas, values);
        Assert.Contains(Domain.Enums.Continent.Oceania, values);
        Assert.Contains(Domain.Enums.Continent.Antarctica, values);
    }

    [Fact]
    public void Continent_Enum_Values_ShouldHaveCorrectIntegerValues()
    {
        Assert.Equal(1, (int)Domain.Enums.Continent.Asia);
        Assert.Equal(2, (int)Domain.Enums.Continent.Europe);
        Assert.Equal(3, (int)Domain.Enums.Continent.Africa);
        Assert.Equal(4, (int)Domain.Enums.Continent.Americas);
        Assert.Equal(5, (int)Domain.Enums.Continent.Oceania);
        Assert.Equal(6, (int)Domain.Enums.Continent.Antarctica);
    }

    [Fact]
    public void EFModelSnapshot_ShouldIncludeContinentProperty()
    {
        var migrationRoot = GetMigrationRoot();
        var snapshotFile = Path.Combine(migrationRoot, "AppDbContextModelSnapshot.cs");

        Assert.True(File.Exists(snapshotFile));
        var content = File.ReadAllText(snapshotFile);
        Assert.Contains("Continent", content);
        Assert.Contains("Tours", content);
    }

    [Fact]
    public void AllMigrations_ShouldIncludeAddContinentToTour()
    {
        var migrationRoot = GetMigrationRoot();
        var migrationFiles = Directory.GetFiles(migrationRoot, "*.cs")
            .Where(f => !f.EndsWith("AppDbContextModelSnapshot.cs")
                     && !Path.GetFileName(f).StartsWith("<"))
            .Select(f => Path.GetFileNameWithoutExtension(f))
            .Where(n => n.StartsWith("20") && n.Contains("_"))
            .OrderBy(n => n)
            .ToList();

        Assert.True(migrationFiles.Count >= 10,
            $"Expected at least 10 migration files, found {migrationFiles.Count}");

        Assert.True(migrationFiles.Contains(ExpectedMigrationName),
            $"'{ExpectedMigrationName}' should be in the migration history. " +
            $"Found: {string.Join(", ", migrationFiles)}");
    }

    private static string GetMigrationRoot()
    {
        // Walk up from test bin directory to find Infrastructure/Migrations source folder.
        var current = new DirectoryInfo(AppContext.BaseDirectory);
        while (current is not null)
        {
            var p1 = Path.Combine(current.FullName, "Infrastructure", "Migrations");
            if (Directory.Exists(p1))
                return p1;

            var p2 = Path.Combine(current.FullName, "src", "Infrastructure", "Migrations");
            if (Directory.Exists(p2))
                return p2;

            current = current.Parent;
        }

        throw new InvalidOperationException(
            $"Could not locate Infrastructure/Migrations directory. " +
            $"AppContext.BaseDirectory = {AppContext.BaseDirectory}");
    }
}
