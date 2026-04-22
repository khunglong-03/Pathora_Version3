using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class TourRequestProviderHardening : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ReviewerRole",
                table: "TourRequests",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TransportationApprovalNote",
                table: "TourInstanceDayActivities",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TransportationApprovalStatus",
                table: "TourInstanceDayActivities",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ExpiresAt",
                table: "RoomBlocks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "HoldStatus",
                table: "RoomBlocks",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "VehicleBlocks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VehicleId = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingActivityReservationId = table.Column<Guid>(type: "uuid", nullable: true),
                    TourInstanceDayActivityId = table.Column<Guid>(type: "uuid", nullable: true),
                    BlockedDate = table.Column<DateOnly>(type: "date", nullable: false),
                    HoldStatus = table.Column<int>(type: "integer", nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VehicleBlocks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VehicleBlocks_BookingActivityReservations_BookingActivityRe~",
                        column: x => x.BookingActivityReservationId,
                        principalTable: "BookingActivityReservations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_VehicleBlocks_TourInstanceDayActivities_TourInstanceDayActi~",
                        column: x => x.TourInstanceDayActivityId,
                        principalTable: "TourInstanceDayActivities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_VehicleBlocks_Vehicles_VehicleId",
                        column: x => x.VehicleId,
                        principalTable: "Vehicles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RoomBlocks_ExpiresAt",
                table: "RoomBlocks",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_RoomBlocks_HoldStatus",
                table: "RoomBlocks",
                column: "HoldStatus");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleBlocks_BlockedDate",
                table: "VehicleBlocks",
                column: "BlockedDate");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleBlocks_BookingActivityReservationId",
                table: "VehicleBlocks",
                column: "BookingActivityReservationId");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleBlocks_ExpiresAt",
                table: "VehicleBlocks",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleBlocks_TourInstanceDayActivityId",
                table: "VehicleBlocks",
                column: "TourInstanceDayActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleBlocks_VehicleId",
                table: "VehicleBlocks",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleBlocks_VehicleId_BlockedDate_HoldStatus",
                table: "VehicleBlocks",
                columns: new[] { "VehicleId", "BlockedDate", "HoldStatus" },
                unique: true,
                filter: "\"HoldStatus\" = 1");

            migrationBuilder.AddForeignKey(
                name: "FK_Suppliers_Users_OwnerUserId",
                table: "Suppliers",
                column: "OwnerUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.Sql(@"
                UPDATE ""TourInstanceDayActivities"" AS A
                SET ""TransportationApprovalStatus"" = TI.""TransportApprovalStatus"",
                    ""TransportationApprovalNote"" = TI.""TransportApprovalNote""
                FROM ""TourInstances"" AS TI
                INNER JOIN ""TourInstanceDays"" AS TID ON TI.""Id"" = TID.""TourInstanceId""
                WHERE A.""TourInstanceDayId"" = TID.""Id""
                  AND A.""ActivityType"" = 'Transportation'
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Suppliers_Users_OwnerUserId",
                table: "Suppliers");

            migrationBuilder.DropTable(
                name: "VehicleBlocks");

            migrationBuilder.DropIndex(
                name: "IX_RoomBlocks_ExpiresAt",
                table: "RoomBlocks");

            migrationBuilder.DropIndex(
                name: "IX_RoomBlocks_HoldStatus",
                table: "RoomBlocks");

            migrationBuilder.DropColumn(
                name: "ReviewerRole",
                table: "TourRequests");

            migrationBuilder.DropColumn(
                name: "TransportationApprovalNote",
                table: "TourInstanceDayActivities");

            migrationBuilder.DropColumn(
                name: "TransportationApprovalStatus",
                table: "TourInstanceDayActivities");

            migrationBuilder.DropColumn(
                name: "ExpiresAt",
                table: "RoomBlocks");

            migrationBuilder.DropColumn(
                name: "HoldStatus",
                table: "RoomBlocks");
        }
    }
}
