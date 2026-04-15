using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDriverToTourInstancePlanRoute : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "DriverId",
                table: "TourInstancePlanRoutes",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TourInstancePlanRoutes_DriverId",
                table: "TourInstancePlanRoutes",
                column: "DriverId");

            migrationBuilder.AddForeignKey(
                name: "FK_TourInstancePlanRoutes_Drivers_DriverId",
                table: "TourInstancePlanRoutes",
                column: "DriverId",
                principalTable: "Drivers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TourInstancePlanRoutes_Drivers_DriverId",
                table: "TourInstancePlanRoutes");

            migrationBuilder.DropIndex(
                name: "IX_TourInstancePlanRoutes_DriverId",
                table: "TourInstancePlanRoutes");

            migrationBuilder.DropColumn(
                name: "DriverId",
                table: "TourInstancePlanRoutes");
        }
    }
}
