using System;
using Npgsql;
class Program {
    static void Main() {
        var connStr = "Host=34.143.220.132;Port=5432;Database=panthora;Username=postgres;Password=PanthoraDB_Pass_2026;Trust Server Certificate=true";
        using var conn = new NpgsqlConnection(connStr);
        conn.Open();
        var tables = new[] { "Tours", "TourDays", "TourPlanRoutes", "TourInstances", "Bookings", "BookingParticipants", "Reviews" };
        foreach(var table in tables) {
            try {
                using var cmd = new NpgsqlCommand($"SELECT COUNT(*) FROM \"{table}\"", conn);
                Console.WriteLine($"{table}: {cmd.ExecuteScalar()}");
            } catch (Exception ex) {
                Console.WriteLine($"{table}: ERROR - {ex.Message}");
            }
        }
    }
}
