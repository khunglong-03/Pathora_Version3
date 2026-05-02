namespace Domain.Specs.Api;

/// <summary>
/// OpenSpec <c>private-custom-tour</c> — DB.1: schema delta must be captured in a named EF migration
/// (new table <c>TourItineraryFeedbacks</c>, <c>FinalSellPrice</c> on <c>TourInstances</c>, <c>TransactionHistories</c>).
/// </summary>
public sealed class PrivateCustomTourSchemaMigrationTests
{
    public const string MigrationClassSubstring = "AddPrivateCustomTourSchema";

    [Fact]
    public void AddPrivateCustomTourSchema_MigrationFile_ShouldExist()
    {
        var migrationRoot = GetMigrationRoot();
        var files = Directory.GetFiles(migrationRoot, $"*{MigrationClassSubstring}*.cs", SearchOption.TopDirectoryOnly)
            .Where(f => !f.EndsWith(".Designer.cs", StringComparison.Ordinal))
            .ToList();

        Assert.True(files.Count > 0,
            $"Expected a migration whose name contains '{MigrationClassSubstring}' under {migrationRoot}.");
    }

    [Fact]
    public void AddPrivateCustomTourSchema_Migration_ShouldCreateTourItineraryFeedbacks_AndTransactionHistories_AndFinalSellPrice()
    {
        var migrationRoot = GetMigrationRoot();
        var migrationFile = Directory.GetFiles(migrationRoot, $"*{MigrationClassSubstring}*.cs", SearchOption.TopDirectoryOnly)
            .FirstOrDefault(f => !f.EndsWith(".Designer.cs", StringComparison.Ordinal));

        Assert.True(migrationFile is not null && File.Exists(migrationFile),
            $"Migration *{MigrationClassSubstring}*.cs not found.");

        var source = File.ReadAllText(migrationFile!);
        Assert.Contains("TourItineraryFeedbacks", source, StringComparison.Ordinal);
        Assert.Contains("TransactionHistories", source, StringComparison.Ordinal);
        Assert.Contains("FinalSellPrice", source, StringComparison.Ordinal);
    }

    [Fact]
    public void AppDbContextModelSnapshot_ShouldIncludePrivateCustomTourArtifacts()
    {
        var migrationRoot = GetMigrationRoot();
        var snapshotFile = Path.Combine(migrationRoot, "AppDbContextModelSnapshot.cs");
        Assert.True(File.Exists(snapshotFile));

        var content = File.ReadAllText(snapshotFile);
        Assert.Contains("TourItineraryFeedback", content, StringComparison.Ordinal);
        Assert.Contains("FinalSellPrice", content, StringComparison.Ordinal);
        Assert.Contains("TransactionHistory", content, StringComparison.Ordinal);
    }

    private static string GetMigrationRoot()
    {
        var current = new DirectoryInfo(AppContext.BaseDirectory);
        while (current is not null)
        {
            var p2 = Path.Combine(current.FullName, "src", "Infrastructure", "Migrations");
            if (Directory.Exists(p2))
                return p2;

            var p1 = Path.Combine(current.FullName, "Infrastructure", "Migrations");
            if (Directory.Exists(p1))
                return p1;

            current = current.Parent;
        }

        throw new InvalidOperationException(
            $"Could not locate Infrastructure/Migrations. AppContext.BaseDirectory = {AppContext.BaseDirectory}");
    }
}
