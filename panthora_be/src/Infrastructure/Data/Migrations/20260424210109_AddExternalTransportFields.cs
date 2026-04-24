using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddExternalTransportFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ExternalTransportConfirmed",
                table: "TourInstanceDayActivities",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ExternalTransportConfirmedAt",
                table: "TourInstanceDayActivities",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExternalTransportConfirmedBy",
                table: "TourInstanceDayActivities",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExternalTransportConfirmed",
                table: "TourInstanceDayActivities");

            migrationBuilder.DropColumn(
                name: "ExternalTransportConfirmedAt",
                table: "TourInstanceDayActivities");

            migrationBuilder.DropColumn(
                name: "ExternalTransportConfirmedBy",
                table: "TourInstanceDayActivities");
        }
    }
}
