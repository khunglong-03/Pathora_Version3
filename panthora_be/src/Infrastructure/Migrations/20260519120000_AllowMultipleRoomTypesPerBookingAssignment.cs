using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations;

/// <inheritdoc />
public partial class AllowMultipleRoomTypesPerBookingAssignment : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_TourInstanceBookingRoomAssignments_TourInstanceDayActivityI~",
            table: "TourInstanceBookingRoomAssignments");

        migrationBuilder.CreateIndex(
            name: "IX_TourInstanceBookingRoomAssignments_TourInstanceDayActivityId_BookingId_RoomType",
            table: "TourInstanceBookingRoomAssignments",
            columns: new[] { "TourInstanceDayActivityId", "BookingId", "RoomType" },
            unique: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_TourInstanceBookingRoomAssignments_TourInstanceDayActivityId_BookingId_RoomType",
            table: "TourInstanceBookingRoomAssignments");

        migrationBuilder.CreateIndex(
            name: "IX_TourInstanceBookingRoomAssignments_TourInstanceDayActivityI~",
            table: "TourInstanceBookingRoomAssignments",
            columns: new[] { "TourInstanceDayActivityId", "BookingId" },
            unique: true);
    }
}
