using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <summary>
    /// ER-2 + ER-5 migration. Adds:
    ///   • TourInstances.RowVersion bytea — optimistic concurrency for status transitions.
    ///   • Vehicles.SupplierId (uuid NULL + FK + index) — supplier ownership for transport.
    ///   • Drivers.SupplierId  (uuid NULL + FK + index) — supplier ownership for drivers.
    ///
    /// Idempotency: all columns are nullable with no backfill. Rollback drops them cleanly.
    /// The Application layer's transport approve path prefers <c>SupplierId</c> equality
    /// with the activity's <c>TransportSupplierId</c>, and only falls back to owner/user
    /// matching when <c>SupplierId</c> is still NULL — so this migration is non-breaking.
    /// </summary>
    public partial class AddSupplierOwnershipAndRowVersion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ER-2: optimistic concurrency token on TourInstances.
            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "TourInstances",
                type: "bytea",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);

            // ER-5: supplier ownership on Vehicles.
            migrationBuilder.AddColumn<Guid>(
                name: "SupplierId",
                table: "Vehicles",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_SupplierId",
                table: "Vehicles",
                column: "SupplierId");

            migrationBuilder.AddForeignKey(
                name: "FK_Vehicles_Suppliers_SupplierId",
                table: "Vehicles",
                column: "SupplierId",
                principalTable: "Suppliers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            // ER-5: supplier ownership on Drivers.
            migrationBuilder.AddColumn<Guid>(
                name: "SupplierId",
                table: "Drivers",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Drivers_SupplierId",
                table: "Drivers",
                column: "SupplierId");

            migrationBuilder.AddForeignKey(
                name: "FK_Drivers_Suppliers_SupplierId",
                table: "Drivers",
                column: "SupplierId",
                principalTable: "Suppliers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Drivers_Suppliers_SupplierId",
                table: "Drivers");

            migrationBuilder.DropIndex(
                name: "IX_Drivers_SupplierId",
                table: "Drivers");

            migrationBuilder.DropColumn(
                name: "SupplierId",
                table: "Drivers");

            migrationBuilder.DropForeignKey(
                name: "FK_Vehicles_Suppliers_SupplierId",
                table: "Vehicles");

            migrationBuilder.DropIndex(
                name: "IX_Vehicles_SupplierId",
                table: "Vehicles");

            migrationBuilder.DropColumn(
                name: "SupplierId",
                table: "Vehicles");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "TourInstances");
        }
    }
}
