using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations;

/// <inheritdoc />
public partial class AddTripAssignmentStatusFields : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "Status",
            table: "TourDayActivityRouteTransports",
            type: "integer",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "RejectionReason",
            table: "TourDayActivityRouteTransports",
            type: "character varying(1000)",
            maxLength: 1000,
            nullable: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "Status",
            table: "TourDayActivityRouteTransports");

        migrationBuilder.DropColumn(
            name: "RejectionReason",
            table: "TourDayActivityRouteTransports");
    }
}
