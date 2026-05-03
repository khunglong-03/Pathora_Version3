using System;
using System.IO;
using Npgsql;

var connString = "Host=34.142.139.106;Port=5432;Database=PPPPathora;Username=postgres;Password=123abc@A;SSL Mode=Disable;";
using var conn = new NpgsqlConnection(connString);
conn.Open();

using var cmd = new NpgsqlCommand("SELECT \"Id\", \"TourName\", \"Status\", \"IsDeleted\" FROM \"Tours\" LIMIT 10", conn);
using var reader = cmd.ExecuteReader();
while (reader.Read())
{
    Console.WriteLine($"{reader["Id"]} | {reader["TourName"]} | {reader["Status"]} | Del: {reader["IsDeleted"]}");
}
