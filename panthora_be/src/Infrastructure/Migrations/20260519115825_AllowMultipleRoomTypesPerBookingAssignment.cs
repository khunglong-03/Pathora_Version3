using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AllowMultipleRoomTypesPerBookingAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Unique per (activity, booking, room type) — allows multiple room types per booking.
            migrationBuilder.Sql(
                """
                DROP INDEX IF EXISTS "IX_TourInstanceBookingRoomAssignments_TourInstanceDayActivityI~";
                DROP INDEX IF EXISTS "IX_TourInstanceBookingRoomAssignments_TourInstanceDayActivityId";
                CREATE UNIQUE INDEX IF NOT EXISTS "IX_TourInstanceBookingRoomAssignments_TourInstanceDayActivityId_BookingId_RoomType"
                ON "TourInstanceBookingRoomAssignments" ("TourInstanceDayActivityId", "BookingId", "RoomType");
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DROP INDEX IF EXISTS "IX_TourInstanceBookingRoomAssignments_TourInstanceDayActivityId_BookingId_RoomType";
                CREATE UNIQUE INDEX IF NOT EXISTS "IX_TourInstanceBookingRoomAssignments_TourInstanceDayActivityI~"
                ON "TourInstanceBookingRoomAssignments" ("TourInstanceDayActivityId", "BookingId");
                """);
        }
    }
}
