#:package Npgsql@8.0.4

using Npgsql;
using System;

var conn = new NpgsqlConnection("Host=34.142.139.106;Port=5432;Database=PPPPathora;Username=postgres;Password=123abc@A;SSL Mode=Disable");
await conn.OpenAsync();

var sql = "SELECT \"Id\", \"UserId\", \"Status\", \"TourInstanceId\" FROM \"Bookings\" WHERE \"Id\" = '019de57c-243c-7458-8eb0-bd98e0c88634'";
using var cmd = new NpgsqlCommand(sql, conn);
using var reader = await cmd.ExecuteReaderAsync();

if (await reader.ReadAsync())
{
    Console.WriteLine($"Found Booking! ID: {reader["Id"]}, UserId: {reader["UserId"]}, Status: {reader["Status"]}");
}
else
{
    Console.WriteLine("Booking NOT FOUND in Database!");
}
