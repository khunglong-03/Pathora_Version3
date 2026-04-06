#! "nuget:Npgsql,8.0.0"

var connectionString = "Host=34.143.220.132;Port=5432;Database=PPPathora;Username=postgres;Password=123abc@A;SSL Mode=Disable";

var dataSource = NpgsqlDataSource.Create(connectionString);
var cmd = dataSource.CreateCommand("ALTER TABLE \"Tours\" ADD COLUMN IF NOT EXISTS \"Continent\" varchar(50) NULL");
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
finally
{
    await dataSource.DisposeAsync();
}
