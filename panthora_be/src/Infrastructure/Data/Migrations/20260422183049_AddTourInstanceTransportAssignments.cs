using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTourInstanceTransportAssignments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TourInstanceTransportAssignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TourInstanceDayActivityId = table.Column<Guid>(type: "uuid", nullable: false),
                    VehicleId = table.Column<Guid>(type: "uuid", nullable: false),
                    DriverId = table.Column<Guid>(type: "uuid", nullable: true),
                    SeatCountSnapshot = table.Column<int>(type: "integer", nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourInstanceTransportAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourInstanceTransportAssignments_Drivers_DriverId",
                        column: x => x.DriverId,
                        principalTable: "Drivers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TourInstanceTransportAssignments_TourInstanceDayActivities_~",
                        column: x => x.TourInstanceDayActivityId,
                        principalTable: "TourInstanceDayActivities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TourInstanceTransportAssignments_Vehicles_VehicleId",
                        column: x => x.VehicleId,
                        principalTable: "Vehicles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TourInstanceTransportAssignments_DriverId",
                table: "TourInstanceTransportAssignments",
                column: "DriverId");

            migrationBuilder.CreateIndex(
                name: "IX_TourInstanceTransportAssignments_TourInstanceDayActivityId",
                table: "TourInstanceTransportAssignments",
                column: "TourInstanceDayActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_TourInstanceTransportAssignments_TourInstanceDayActivityId_~",
                table: "TourInstanceTransportAssignments",
                columns: new[] { "TourInstanceDayActivityId", "VehicleId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TourInstanceTransportAssignments_VehicleId",
                table: "TourInstanceTransportAssignments",
                column: "VehicleId");

            // Backfill: one assignment per Transportation activity that already had a legacy VehicleId.
            // SeatCountSnapshot comes from Vehicles.SeatCapacity when join succeeds; otherwise null (SQL-only migrate).
            migrationBuilder.Sql(@"
                INSERT INTO ""TourInstanceTransportAssignments"" (
                    ""Id"", ""TourInstanceDayActivityId"", ""VehicleId"", ""DriverId"", ""SeatCountSnapshot"",
                    ""CreatedOnUtc"", ""CreatedBy"", ""LastModifiedOnUtc"", ""LastModifiedBy"")
                SELECT gen_random_uuid(), a.""Id"", a.""VehicleId"", a.""DriverId"", v.""SeatCapacity"",
                    NOW() AT TIME ZONE 'utc', 'backfill:AddTourInstanceTransportAssignments',
                    NOW() AT TIME ZONE 'utc', 'backfill:AddTourInstanceTransportAssignments'
                FROM ""TourInstanceDayActivities"" a
                LEFT JOIN ""Vehicles"" v ON v.""Id"" = a.""VehicleId""
                WHERE a.""ActivityType"" = 'Transportation'
                  AND a.""VehicleId"" IS NOT NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TourInstanceTransportAssignments");
        }
    }
}
