using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTransportPlanToActivity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // NOTE: TransportApprovalNote and TransportApprovalStatus columns are intentionally
            // NOT dropped here. They remain in the TourInstances table for backward compat.
            // They will be dropped in a separate Release C migration after all readers are migrated.

            migrationBuilder.AddColumn<int>(
                name: "RequestedSeatCount",
                table: "TourInstanceDayActivities",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RequestedVehicleType",
                table: "TourInstanceDayActivities",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "TransportSupplierId",
                table: "TourInstanceDayActivities",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TourInstanceDayActivities_TransportSupplierId",
                table: "TourInstanceDayActivities",
                column: "TransportSupplierId");

            migrationBuilder.AddForeignKey(
                name: "FK_TourInstanceDayActivities_Suppliers_TransportSupplierId",
                table: "TourInstanceDayActivities",
                column: "TransportSupplierId",
                principalTable: "Suppliers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            // Data backfill: copy instance-level TransportProviderId to per-activity TransportSupplierId
            // for existing Transportation activities. Idempotent — only updates rows where TransportSupplierId IS NULL.
            migrationBuilder.Sql(@"
                UPDATE ""TourInstanceDayActivities"" a
                SET ""TransportSupplierId"" = ti.""TransportProviderId"",
                    ""RequestedSeatCount"" = ti.""MaxParticipation"",
                    ""RequestedVehicleType"" = 'Coach'
                FROM ""TourInstanceDays"" d
                INNER JOIN ""TourInstances"" ti ON d.""TourInstanceId"" = ti.""Id""
                WHERE a.""TourInstanceDayId"" = d.""Id""
                  AND a.""ActivityType"" = 'Transportation'
                  AND ti.""TransportProviderId"" IS NOT NULL
                  AND a.""TransportSupplierId"" IS NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TourInstanceDayActivities_Suppliers_TransportSupplierId",
                table: "TourInstanceDayActivities");

            migrationBuilder.DropIndex(
                name: "IX_TourInstanceDayActivities_TransportSupplierId",
                table: "TourInstanceDayActivities");

            migrationBuilder.DropColumn(
                name: "RequestedSeatCount",
                table: "TourInstanceDayActivities");

            migrationBuilder.DropColumn(
                name: "RequestedVehicleType",
                table: "TourInstanceDayActivities");

            migrationBuilder.DropColumn(
                name: "TransportSupplierId",
                table: "TourInstanceDayActivities");

            // NOTE: TransportApprovalNote and TransportApprovalStatus columns are NOT restored
            // here because Up() did not drop them. They are handled by Release C migration.
        }
    }
}
