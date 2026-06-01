using System;
using System.IO;
using System.Threading.Tasks;
using global::Infrastructure.Data;
using global::Infrastructure.Data.HealthChecks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Infrastructure;

public sealed class SequenceHealthCheckTests
{
    private readonly string _postgresConnectionString;

    public SequenceHealthCheckTests()
    {
        var solutionRoot = FindSolutionRoot();
        var config = new ConfigurationBuilder()
            .SetBasePath(Path.Combine(solutionRoot, "src", "Api"))
            .AddJsonFile(Path.Combine(solutionRoot, "src", "Api", "appsettings.json"), optional: false)
            .Build();

        _postgresConnectionString = config.GetConnectionString("Default")
            ?? throw new InvalidOperationException("ConnectionStrings:Default is not configured.");
    }

    [Fact]
    public async Task SyncOwnedImageSequencesAsync_ShouldRunSuccessfullyAndBeIdempotent()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgresConnectionString)
            .Options;

        await using var db = new AppDbContext(options);
        var logger = Substitute.For<ILogger>();

        // Act & Assert
        // First run (should sync if any drift exists, or do nothing if already healthy)
        await SequenceHealthCheck.SyncOwnedImageSequencesAsync(db, logger);

        // Second run (should be completely healthy, calling no setval)
        await SequenceHealthCheck.SyncOwnedImageSequencesAsync(db, logger);
    }

    [Fact]
    public async Task SyncOwnedImageSequencesAsync_WithForcedDrift_ShouldHealAndLogWarning()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgresConnectionString)
            .Options;

        await using var db = new AppDbContext(options);
        var logger = Substitute.For<ILogger>();

        var connection = db.Database.GetDbConnection();
        if (connection.State != System.Data.ConnectionState.Open)
        {
            await connection.OpenAsync();
        }

        // 1. Get current sequence value so we can restore it after the test
        long originalSeqVal = 0;
        using (var cmd = connection.CreateCommand())
        {
            cmd.CommandText = "SELECT last_value FROM \"TourInstanceImages_Id_seq\";";
            var res = await cmd.ExecuteScalarAsync();
            originalSeqVal = res == DBNull.Value || res == null ? 1 : Convert.ToInt64(res);
        }

        try
        {
            // 2. Force drift: set sequence to 1
            using (var cmd = connection.CreateCommand())
            {
                cmd.CommandText = "SELECT setval('\"TourInstanceImages_Id_seq\"', 1, false);";
                await cmd.ExecuteNonQueryAsync();
            }

            // 3. Act: Sync
            await SequenceHealthCheck.SyncOwnedImageSequencesAsync(db, logger);

            // 4. Assert: Logger received a Warning log
            logger.Received().Log(
                LogLevel.Warning,
                Arg.Any<EventId>(),
                Arg.Any<object>(),
                Arg.Any<Exception>(),
                Arg.Any<Func<object, Exception?, string>>());

            // 5. Assert: Sequence value is healed (should be greater than or equal to MAX(Id))
            long maxId = 0;
            using (var cmd = connection.CreateCommand())
            {
                cmd.CommandText = "SELECT MAX(\"Id\") FROM \"TourInstanceImages\";";
                var res = await cmd.ExecuteScalarAsync();
                maxId = res == DBNull.Value || res == null ? 0 : Convert.ToInt64(res);
            }

            long newSeqVal = 0;
            using (var cmd = connection.CreateCommand())
            {
                cmd.CommandText = "SELECT last_value FROM \"TourInstanceImages_Id_seq\";";
                var res = await cmd.ExecuteScalarAsync();
                newSeqVal = res == DBNull.Value || res == null ? 1 : Convert.ToInt64(res);
            }

            Assert.Equal(maxId == 0 ? 1 : maxId, newSeqVal);
        }
        finally
        {
            // 6. Restore original sequence value
            using (var cmd = connection.CreateCommand())
            {
                cmd.CommandText = $"SELECT setval('\"TourInstanceImages_Id_seq\"', {originalSeqVal}, true);";
                await cmd.ExecuteNonQueryAsync();
            }
        }
    }

    [Fact]
    public async Task DumpVehiclesAndSuppliers()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgresConnectionString)
            .Options;

        await using var db = new AppDbContext(options);
        var vehicles = await db.Vehicles.ToListAsync();
        var suppliers = await db.Suppliers.ToListAsync();
        
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("DUMP START:");
        var transportSuppliers = suppliers.Where(s => s.SupplierType == global::Domain.Enums.SupplierType.Transport).ToList();
        foreach (var s in transportSuppliers)
        {
            sb.AppendLine($"TRANSPORT SUPPLIER: Id={s.Id}, Name={s.Name}, Owner={s.OwnerUserId}, IsActive={s.IsActive}, IsDeleted={s.IsDeleted}");
            var supplierVehicles = vehicles.Where(v => v.SupplierId == s.Id || (v.SupplierId == null && s.OwnerUserId.HasValue && v.OwnerId == s.OwnerUserId.Value)).ToList();
            foreach (var v in supplierVehicles)
            {
                sb.AppendLine($"  VEHICLE: Id={v.Id}, Type={v.VehicleType}, Qty={v.Quantity}, IsActive={v.IsActive}, IsDeleted={v.IsDeleted}, SupplierId={v.SupplierId}, OwnerId={v.OwnerId}");
            }
        }
        
        throw new Exception(sb.ToString());
    }

    private static string FindSolutionRoot()
    {
        var current = new DirectoryInfo(AppContext.BaseDirectory);
        while (current is not null)
        {
            if (File.Exists(Path.Combine(current.FullName, "LocalService.slnx")))
                return current.FullName;
            current = current.Parent;
        }
        throw new InvalidOperationException("Could not locate LocalService.slnx.");
    }
}
