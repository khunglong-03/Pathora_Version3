using System;
using System.IO;
using Npgsql;

var connString = "Host=localhost;Database=panthora;Username=postgres;Password=postgres";
using var conn = new NpgsqlConnection(connString);
conn.Open();

using var cmd = new NpgsqlCommand("SELECT \"Id\", \"To\", \"Subject\", \"Status\", \"ErrorMessage\", \"CreatedAt\" FROM \"Mails\" ORDER BY \"CreatedAt\" DESC LIMIT 5", conn);
using var reader = cmd.ExecuteReader();
while (reader.Read())
{
    Console.WriteLine($"{reader["Id"]} | {reader["To"]} | {reader["Subject"]} | Status: {reader["Status"]} | Err: {reader["ErrorMessage"]}");
}
