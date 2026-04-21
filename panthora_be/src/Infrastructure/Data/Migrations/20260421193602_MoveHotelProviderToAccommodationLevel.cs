using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class MoveHotelProviderToAccommodationLevel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Phase 1: Add new columns to TourInstancePlanAccommodations
            migrationBuilder.AddColumn<string>(
                name: "SupplierApprovalNote",
                table: "TourInstancePlanAccommodations",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SupplierApprovalStatus",
                table: "TourInstancePlanAccommodations",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "NotAssigned");

            migrationBuilder.AddColumn<Guid>(
                name: "SupplierId",
                table: "TourInstancePlanAccommodations",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TourInstancePlanAccommodations_SupplierId",
                table: "TourInstancePlanAccommodations",
                column: "SupplierId");

            migrationBuilder.AddForeignKey(
                name: "FK_TourInstancePlanAccommodations_Suppliers_SupplierId",
                table: "TourInstancePlanAccommodations",
                column: "SupplierId",
                principalTable: "Suppliers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            // Phase 2: Backfill — copy existing TourInstances.HotelProviderId into each
            // accommodation activity's SupplierId, and mirror the approval status.
            migrationBuilder.Sql("""
                UPDATE "TourInstancePlanAccommodations" AS accom
                SET
                    "SupplierId" = ti."HotelProviderId",
                    "SupplierApprovalStatus" = CASE ti."HotelApprovalStatus"
                        WHEN 1 THEN 'Pending'
                        WHEN 2 THEN 'Approved'
                        WHEN 3 THEN 'Rejected'
                        ELSE 'NotAssigned'
                    END,
                    "SupplierApprovalNote" = ti."HotelApprovalNote"
                FROM "TourInstanceDayActivities" AS act
                INNER JOIN "TourInstanceDays" AS d ON d."Id" = act."TourInstanceDayId"
                INNER JOIN "TourInstances" AS ti ON ti."Id" = d."TourInstanceId"
                WHERE accom."TourInstanceDayActivityId" = act."Id"
                  AND ti."HotelProviderId" IS NOT NULL;
                """);

            // Phase 3: Drop old columns from TourInstances
            migrationBuilder.DropForeignKey(
                name: "FK_TourInstances_Suppliers_HotelProviderId",
                table: "TourInstances");

            migrationBuilder.DropIndex(
                name: "IX_TourInstances_HotelProviderId",
                table: "TourInstances");

            migrationBuilder.DropColumn(
                name: "HotelApprovalNote",
                table: "TourInstances");

            migrationBuilder.DropColumn(
                name: "HotelApprovalStatus",
                table: "TourInstances");

            migrationBuilder.DropColumn(
                name: "HotelProviderId",
                table: "TourInstances");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TourInstancePlanAccommodations_Suppliers_SupplierId",
                table: "TourInstancePlanAccommodations");

            migrationBuilder.DropIndex(
                name: "IX_TourInstancePlanAccommodations_SupplierId",
                table: "TourInstancePlanAccommodations");

            migrationBuilder.DropColumn(
                name: "SupplierApprovalNote",
                table: "TourInstancePlanAccommodations");

            migrationBuilder.DropColumn(
                name: "SupplierApprovalStatus",
                table: "TourInstancePlanAccommodations");

            migrationBuilder.DropColumn(
                name: "SupplierId",
                table: "TourInstancePlanAccommodations");

            migrationBuilder.AddColumn<string>(
                name: "HotelApprovalNote",
                table: "TourInstances",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "HotelApprovalStatus",
                table: "TourInstances",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "HotelProviderId",
                table: "TourInstances",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TourInstances_HotelProviderId",
                table: "TourInstances",
                column: "HotelProviderId");

            migrationBuilder.AddForeignKey(
                name: "FK_TourInstances_Suppliers_HotelProviderId",
                table: "TourInstances",
                column: "HotelProviderId",
                principalTable: "Suppliers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
