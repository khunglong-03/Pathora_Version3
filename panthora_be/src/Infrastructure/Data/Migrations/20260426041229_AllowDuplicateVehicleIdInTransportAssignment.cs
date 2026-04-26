using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AllowDuplicateVehicleIdInTransportAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TourInstanceTransportAssignments_TourInstanceDayActivityId_~",
                table: "TourInstanceTransportAssignments");

            migrationBuilder.CreateIndex(
                name: "IX_TourInstanceTransportAssignments_TourInstanceDayActivityId_~",
                table: "TourInstanceTransportAssignments",
                columns: new[] { "TourInstanceDayActivityId", "VehicleId", "DriverId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TourInstanceTransportAssignments_TourInstanceDayActivityId_~",
                table: "TourInstanceTransportAssignments");

            migrationBuilder.CreateIndex(
                name: "IX_TourInstanceTransportAssignments_TourInstanceDayActivityId_~",
                table: "TourInstanceTransportAssignments",
                columns: new[] { "TourInstanceDayActivityId", "VehicleId" },
                unique: true);
        }
    }
}
