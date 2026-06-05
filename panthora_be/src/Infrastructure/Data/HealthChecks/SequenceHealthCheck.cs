using System;
using System.Data;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Data.HealthChecks;

public static class SequenceHealthCheck
{
    public static async Task SyncOwnedImageSequencesAsync(
        AppDbContext db,
        ILogger logger,
        CancellationToken ct = default)
    {
        var tables = new[]
        {
            (Table: "TourInstanceImages", Sequence: "TourInstanceImages_Id_seq"),
            (Table: "TourImages", Sequence: "TourImages_Id_seq"),
            (Table: "HotelRoomImages", Sequence: "HotelRoomImages_Id_seq")
        };

        var connection = db.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync(ct);
        }

        foreach (var item in tables)
        {
            try
            {
                // Retrieve max ID
                long maxId = 0;
                using (var cmd = connection.CreateCommand())
                {
                    cmd.CommandText = $"SELECT MAX(\"Id\") FROM \"{item.Table}\";";
                    var resultObj = await cmd.ExecuteScalarAsync(ct);
                    maxId = resultObj == DBNull.Value || resultObj == null ? 0 : Convert.ToInt64(resultObj);
                }

                // Retrieve last_value from sequence
                long lastValue = 0;
                using (var cmd = connection.CreateCommand())
                {
                    cmd.CommandText = $"SELECT last_value FROM \"{item.Sequence}\";";
                    var resultObj = await cmd.ExecuteScalarAsync(ct);
                    lastValue = resultObj == DBNull.Value || resultObj == null ? 0 : Convert.ToInt64(resultObj);
                }

                // If sequence has drifted (last_value <= maxId)
                if (lastValue <= maxId)
                {
                    logger.LogWarning("Sequence drift detected for table {Table}. Sequence {Sequence} last_value is {LastValue}, while MAX(Id) is {MaxId}. Bumping sequence.",
                        item.Table, item.Sequence, lastValue, maxId);

                    using (var cmd = connection.CreateCommand())
                    {
                        cmd.CommandText = $@"
                             SELECT setval(
                                 '""{item.Sequence}""',
                                 GREATEST(
                                     COALESCE((SELECT MAX(""Id"") FROM ""{item.Table}""), 1),
                                     (SELECT last_value FROM pg_sequences WHERE sequencename = '{item.Sequence}')
                                 )
                             );";
                        await cmd.ExecuteScalarAsync(ct);
                    }

                    // Query the new sequence value to log it
                    long newLastValue = 0;
                    using (var cmd = connection.CreateCommand())
                    {
                        cmd.CommandText = $"SELECT last_value FROM \"{item.Sequence}\";";
                        var resultObj = await cmd.ExecuteScalarAsync(ct);
                        newLastValue = resultObj == DBNull.Value || resultObj == null ? 0 : Convert.ToInt64(resultObj);
                    }

                    logger.LogInformation("Sequence {Sequence} successfully bumped from {OldValue} to {NewValue}.",
                        item.Sequence, lastValue, newLastValue);
                }
                else
                {
                    logger.LogDebug("Sequence {Sequence} is healthy. last_value={LastValue}, MAX(Id)={MaxId}.",
                        item.Sequence, lastValue, maxId);
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error checking/syncing sequence for table {Table}", item.Table);
                throw;
            }
        }
    }
}
