using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    public partial class RemoveDistanceAndBookingRefFromActivity : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DistanceKm",
                table: "TourInstanceDayActivities");

            migrationBuilder.DropColumn(
                name: "BookingReference",
                table: "TourInstanceDayActivities");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "DistanceKm",
                table: "TourInstanceDayActivities",
                type: "numeric(10,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BookingReference",
                table: "TourInstanceDayActivities",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);
        }
    }
}
