using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTourInstanceDayActivities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "TourInstanceDays",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "TourInstanceDayActivities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TourInstanceDayId = table.Column<Guid>(type: "uuid", nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    ActivityType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsOptional = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    StartTime = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    EndTime = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourInstanceDayActivities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourInstanceDayActivities_TourInstanceDays_TourInstanceDayId",
                        column: x => x.TourInstanceDayId,
                        principalTable: "TourInstanceDays",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TourInstancePlanAccommodations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TourInstanceDayActivityId = table.Column<Guid>(type: "uuid", nullable: false),
                    RoomType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Quantity = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    CheckInTime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CheckOutTime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourInstancePlanAccommodations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourInstancePlanAccommodations_TourInstanceDayActivities_To~",
                        column: x => x.TourInstanceDayActivityId,
                        principalTable: "TourInstanceDayActivities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TourInstancePlanRoutes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TourInstanceDayActivityId = table.Column<Guid>(type: "uuid", nullable: false),
                    VehicleId = table.Column<Guid>(type: "uuid", nullable: true),
                    PickupLocation = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DropoffLocation = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DepartureTime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ArrivalTime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourInstancePlanRoutes", x => x.Id);
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
                name: "IX_TourInstanceDayActivities_TourInstanceDayId",
                table: "TourInstanceDayActivities",
                column: "TourInstanceDayId");

            migrationBuilder.CreateIndex(
                name: "IX_TourInstancePlanAccommodations_TourInstanceDayActivityId",
                table: "TourInstancePlanAccommodations",
                column: "TourInstanceDayActivityId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TourInstancePlanRoutes_TourInstanceDayActivityId",
                table: "TourInstancePlanRoutes",
                column: "TourInstanceDayActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_TourInstancePlanRoutes_VehicleId",
                table: "TourInstancePlanRoutes",
                column: "VehicleId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TourInstancePlanAccommodations");

            migrationBuilder.DropTable(
                name: "TourInstancePlanRoutes");

            migrationBuilder.DropTable(
                name: "TourInstanceDayActivities");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "TourInstanceDays");
        }
    }
}
