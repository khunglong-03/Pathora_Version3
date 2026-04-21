using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveTourPlanRoutesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TourDayActivityRouteTransports_TourPlanRoutes_TourPlanRoute~",
                table: "TourDayActivityRouteTransports");

            migrationBuilder.DropTable(
                name: "TourPlanRoutes");

            migrationBuilder.RenameColumn(
                name: "TourPlanRouteId",
                table: "TourDayActivityRouteTransports",
                newName: "TourDayActivityId");

            migrationBuilder.RenameIndex(
                name: "IX_TourDayActivityRouteTransports_TourPlanRouteId",
                table: "TourDayActivityRouteTransports",
                newName: "IX_TourDayActivityRouteTransports_TourDayActivityId");

            migrationBuilder.AddColumn<string>(
                name: "BookingReference",
                table: "TourDayActivities",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DistanceKm",
                table: "TourDayActivities",
                type: "numeric(10,2)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DurationMinutes",
                table: "TourDayActivities",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "FromLocationId",
                table: "TourDayActivities",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Price",
                table: "TourDayActivities",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ToLocationId",
                table: "TourDayActivities",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TransportationName",
                table: "TourDayActivities",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TransportationType",
                table: "TourDayActivities",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TourDayActivities_FromLocationId",
                table: "TourDayActivities",
                column: "FromLocationId");

            migrationBuilder.CreateIndex(
                name: "IX_TourDayActivities_ToLocationId",
                table: "TourDayActivities",
                column: "ToLocationId");

            migrationBuilder.AddForeignKey(
                name: "FK_TourDayActivities_TourPlanLocations_FromLocationId",
                table: "TourDayActivities",
                column: "FromLocationId",
                principalTable: "TourPlanLocations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_TourDayActivities_TourPlanLocations_ToLocationId",
                table: "TourDayActivities",
                column: "ToLocationId",
                principalTable: "TourPlanLocations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_TourDayActivityRouteTransports_TourDayActivities_TourDayAct~",
                table: "TourDayActivityRouteTransports",
                column: "TourDayActivityId",
                principalTable: "TourDayActivities",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TourDayActivities_TourPlanLocations_FromLocationId",
                table: "TourDayActivities");

            migrationBuilder.DropForeignKey(
                name: "FK_TourDayActivities_TourPlanLocations_ToLocationId",
                table: "TourDayActivities");

            migrationBuilder.DropForeignKey(
                name: "FK_TourDayActivityRouteTransports_TourDayActivities_TourDayAct~",
                table: "TourDayActivityRouteTransports");

            migrationBuilder.DropIndex(
                name: "IX_TourDayActivities_FromLocationId",
                table: "TourDayActivities");

            migrationBuilder.DropIndex(
                name: "IX_TourDayActivities_ToLocationId",
                table: "TourDayActivities");

            migrationBuilder.DropColumn(
                name: "BookingReference",
                table: "TourDayActivities");

            migrationBuilder.DropColumn(
                name: "DistanceKm",
                table: "TourDayActivities");

            migrationBuilder.DropColumn(
                name: "DurationMinutes",
                table: "TourDayActivities");

            migrationBuilder.DropColumn(
                name: "FromLocationId",
                table: "TourDayActivities");

            migrationBuilder.DropColumn(
                name: "Price",
                table: "TourDayActivities");

            migrationBuilder.DropColumn(
                name: "ToLocationId",
                table: "TourDayActivities");

            migrationBuilder.DropColumn(
                name: "TransportationName",
                table: "TourDayActivities");

            migrationBuilder.DropColumn(
                name: "TransportationType",
                table: "TourDayActivities");

            migrationBuilder.RenameColumn(
                name: "TourDayActivityId",
                table: "TourDayActivityRouteTransports",
                newName: "TourPlanRouteId");

            migrationBuilder.RenameIndex(
                name: "IX_TourDayActivityRouteTransports_TourDayActivityId",
                table: "TourDayActivityRouteTransports",
                newName: "IX_TourDayActivityRouteTransports_TourPlanRouteId");

            migrationBuilder.CreateTable(
                name: "TourPlanRoutes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FromLocationId = table.Column<Guid>(type: "uuid", nullable: true),
                    ToLocationId = table.Column<Guid>(type: "uuid", nullable: true),
                    TourDayActivityId = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingReference = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    DeletedBy = table.Column<string>(type: "text", nullable: true),
                    DeletedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DistanceKm = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    DurationMinutes = table.Column<int>(type: "integer", nullable: true),
                    EstimatedArrivalTime = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    EstimatedDepartureTime = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    Price = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    TourDayActivityEntityId = table.Column<Guid>(type: "uuid", nullable: true),
                    Translations = table.Column<string>(type: "jsonb", nullable: false),
                    TransportationName = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    TransportationNote = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    TransportationType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourPlanRoutes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourPlanRoutes_TourDayActivities_TourDayActivityEntityId",
                        column: x => x.TourDayActivityEntityId,
                        principalTable: "TourDayActivities",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_TourPlanRoutes_TourDayActivities_TourDayActivityId",
                        column: x => x.TourDayActivityId,
                        principalTable: "TourDayActivities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TourPlanRoutes_TourPlanLocations_FromLocationId",
                        column: x => x.FromLocationId,
                        principalTable: "TourPlanLocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TourPlanRoutes_TourPlanLocations_ToLocationId",
                        column: x => x.ToLocationId,
                        principalTable: "TourPlanLocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TourPlanRoutes_FromLocationId",
                table: "TourPlanRoutes",
                column: "FromLocationId");

            migrationBuilder.CreateIndex(
                name: "IX_TourPlanRoutes_ToLocationId",
                table: "TourPlanRoutes",
                column: "ToLocationId");

            migrationBuilder.CreateIndex(
                name: "IX_TourPlanRoutes_TourDayActivityEntityId",
                table: "TourPlanRoutes",
                column: "TourDayActivityEntityId");

            migrationBuilder.CreateIndex(
                name: "IX_TourPlanRoutes_TourDayActivityId",
                table: "TourPlanRoutes",
                column: "TourDayActivityId");

            migrationBuilder.AddForeignKey(
                name: "FK_TourDayActivityRouteTransports_TourPlanRoutes_TourPlanRoute~",
                table: "TourDayActivityRouteTransports",
                column: "TourPlanRouteId",
                principalTable: "TourPlanRoutes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
