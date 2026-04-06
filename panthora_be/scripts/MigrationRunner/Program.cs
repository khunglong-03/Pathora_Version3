using Npgsql;

var connectionString = "Host=34.143.220.132;Port=5432;Database=PPPathora;Username=postgres;Password=123abc@A;SSL Mode=Disable";

await using var conn = new NpgsqlConnection(connectionString);
await conn.OpenAsync();

var cmd = conn.CreateCommand();
cmd.CommandText = "ALTER TABLE \"Tours\" ADD COLUMN IF NOT EXISTS \"Continent\" varchar(50) NULL";
try
{
    await cmd.ExecuteNonQueryAsync();
    Console.WriteLine("SUCCESS: Column Continent added to Tours table");
}
catch (Exception ex)
{
    Console.WriteLine($"ERROR: {ex.Message}");
    throw;
}
