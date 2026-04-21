using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class FlattenTourItineraryFull : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TourInstancePlanRoutes");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ArrivalTime",
                table: "TourInstanceDayActivities",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BookingReference",
                table: "TourInstanceDayActivities",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "DepartureTime",
                table: "TourInstanceDayActivities",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DistanceKm",
                table: "TourInstanceDayActivities",
                type: "numeric(10,2)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DriverId",
                table: "TourInstanceDayActivities",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DropoffLocation",
                table: "TourInstanceDayActivities",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DurationMinutes",
                table: "TourInstanceDayActivities",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "FromLocationId",
                table: "TourInstanceDayActivities",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PickupLocation",
                table: "TourInstanceDayActivities",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Price",
                table: "TourInstanceDayActivities",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ToLocationId",
                table: "TourInstanceDayActivities",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TransportationName",
                table: "TourInstanceDayActivities",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TransportationType",
                table: "TourInstanceDayActivities",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "VehicleId",
                table: "TourInstanceDayActivities",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TourInstanceDayActivities_DriverId",
                table: "TourInstanceDayActivities",
                column: "DriverId");

            migrationBuilder.CreateIndex(
                name: "IX_TourInstanceDayActivities_FromLocationId",
                table: "TourInstanceDayActivities",
                column: "FromLocationId");

            migrationBuilder.CreateIndex(
                name: "IX_TourInstanceDayActivities_ToLocationId",
                table: "TourInstanceDayActivities",
                column: "ToLocationId");

            migrationBuilder.CreateIndex(
                name: "IX_TourInstanceDayActivities_VehicleId",
                table: "TourInstanceDayActivities",
                column: "VehicleId");

            migrationBuilder.AddForeignKey(
                name: "FK_TourInstanceDayActivities_Drivers_DriverId",
                table: "TourInstanceDayActivities",
                column: "DriverId",
                principalTable: "Drivers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_TourInstanceDayActivities_TourPlanLocations_FromLocationId",
                table: "TourInstanceDayActivities",
                column: "FromLocationId",
                principalTable: "TourPlanLocations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_TourInstanceDayActivities_TourPlanLocations_ToLocationId",
                table: "TourInstanceDayActivities",
                column: "ToLocationId",
                principalTable: "TourPlanLocations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_TourInstanceDayActivities_Vehicles_VehicleId",
                table: "TourInstanceDayActivities",
                column: "VehicleId",
                principalTable: "Vehicles",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TourInstanceDayActivities_Drivers_DriverId",
                table: "TourInstanceDayActivities");

            migrationBuilder.DropForeignKey(
                name: "FK_TourInstanceDayActivities_TourPlanLocations_FromLocationId",
                table: "TourInstanceDayActivities");

            migrationBuilder.DropForeignKey(
                name: "FK_TourInstanceDayActivities_TourPlanLocations_ToLocationId",
                table: "TourInstanceDayActivities");

            migrationBuilder.DropForeignKey(
                name: "FK_TourInstanceDayActivities_Vehicles_VehicleId",
                table: "TourInstanceDayActivities");

            migrationBuilder.DropIndex(
                name: "IX_TourInstanceDayActivities_DriverId",
                table: "TourInstanceDayActivities");

            migrationBuilder.DropIndex(
                name: "IX_TourInstanceDayActivities_FromLocationId",
                table: "TourInstanceDayActivities");

            migrationBuilder.DropIndex(
                name: "IX_TourInstanceDayActivities_ToLocationId",
                table: "TourInstanceDayActivities");

            migrationBuilder.DropIndex(
                name: "IX_TourInstanceDayActivities_VehicleId",
                table: "TourInstanceDayActivities");

            migrationBuilder.DropColumn(
                name: "ArrivalTime",
                table: "TourInstanceDayActivities");

            migrationBuilder.DropColumn(
                name: "BookingReference",
                table: "TourInstanceDayActivities");

            migrationBuilder.DropColumn(
                name: "DepartureTime",
                table: "TourInstanceDayActivities");

            migrationBuilder.DropColumn(
                name: "DistanceKm",
                table: "TourInstanceDayActivities");

            migrationBuilder.DropColumn(
                name: "DriverId",
                table: "TourInstanceDayActivities");

            migrationBuilder.DropColumn(
                name: "DropoffLocation",
                table: "TourInstanceDayActivities");

            migrationBuilder.DropColumn(
                name: "DurationMinutes",
                table: "TourInstanceDayActivities");

            migrationBuilder.DropColumn(
                name: "FromLocationId",
                table: "TourInstanceDayActivities");

            migrationBuilder.DropColumn(
                name: "PickupLocation",
                table: "TourInstanceDayActivities");

            migrationBuilder.DropColumn(
                name: "Price",
                table: "TourInstanceDayActivities");

            migrationBuilder.DropColumn(
                name: "ToLocationId",
                table: "TourInstanceDayActivities");

            migrationBuilder.DropColumn(
                name: "TransportationName",
                table: "TourInstanceDayActivities");

            migrationBuilder.DropColumn(
                name: "TransportationType",
                table: "TourInstanceDayActivities");

            migrationBuilder.DropColumn(
                name: "VehicleId",
                table: "TourInstanceDayActivities");

            migrationBuilder.CreateTable(
                name: "TourInstancePlanRoutes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DriverId = table.Column<Guid>(type: "uuid", nullable: true),
                    TourInstanceDayActivityId = table.Column<Guid>(type: "uuid", nullable: false),
                    VehicleId = table.Column<Guid>(type: "uuid", nullable: true),
                    ArrivalTime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    DepartureTime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DropoffLocation = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    PickupLocation = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourInstancePlanRoutes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourInstancePlanRoutes_Drivers_DriverId",
                        column: x => x.DriverId,
                        principalTable: "Drivers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_TourInstancePlanRoutes_TourInstanceDayActivities_TourInstan~",
                        column: x => x.TourInstanceDayActivityId,
                        principalTable: "TourInstanceDayActivities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TourInstancePlanRoutes_Vehicles_VehicleId",
                        column: x => x.VehicleId,
                        principalTable: "Vehicles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TourInstancePlanRoutes_DriverId",
                table: "TourInstancePlanRoutes",
                column: "DriverId");

            migrationBuilder.CreateIndex(
                name: "IX_TourInstancePlanRoutes_TourInstanceDayActivityId",
                table: "TourInstancePlanRoutes",
                column: "TourInstanceDayActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_TourInstancePlanRoutes_VehicleId",
                table: "TourInstancePlanRoutes",
                column: "VehicleId");
        }
    }
}
