using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveLegacyTransportProviderId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TourInstances_Suppliers_TransportProviderId",
                table: "TourInstances");

            migrationBuilder.DropIndex(
                name: "IX_TourInstances_TransportProviderId",
                table: "TourInstances");

            migrationBuilder.DropColumn(
                name: "TransportProviderId",
                table: "TourInstances");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "TransportProviderId",
                table: "TourInstances",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TourInstances_TransportProviderId",
                table: "TourInstances",
                column: "TransportProviderId");

            migrationBuilder.AddForeignKey(
                name: "FK_TourInstances_Suppliers_TransportProviderId",
                table: "TourInstances",
                column: "TransportProviderId",
                principalTable: "Suppliers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
