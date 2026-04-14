using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProviderApproval : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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

            migrationBuilder.AddColumn<string>(
                name: "TransportApprovalNote",
                table: "TourInstances",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TransportApprovalStatus",
                table: "TourInstances",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "TransportProviderId",
                table: "TourInstances",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Continent",
                table: "Suppliers",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TourInstances_HotelProviderId",
                table: "TourInstances",
                column: "HotelProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_TourInstances_TransportProviderId",
                table: "TourInstances",
                column: "TransportProviderId");

            migrationBuilder.AddForeignKey(
                name: "FK_TourInstances_Suppliers_HotelProviderId",
                table: "TourInstances",
                column: "HotelProviderId",
                principalTable: "Suppliers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_TourInstances_Suppliers_TransportProviderId",
                table: "TourInstances",
                column: "TransportProviderId",
                principalTable: "Suppliers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TourInstances_Suppliers_HotelProviderId",
                table: "TourInstances");

            migrationBuilder.DropForeignKey(
                name: "FK_TourInstances_Suppliers_TransportProviderId",
                table: "TourInstances");

            migrationBuilder.DropIndex(
                name: "IX_TourInstances_HotelProviderId",
                table: "TourInstances");

            migrationBuilder.DropIndex(
                name: "IX_TourInstances_TransportProviderId",
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

            migrationBuilder.DropColumn(
                name: "TransportApprovalNote",
                table: "TourInstances");

            migrationBuilder.DropColumn(
                name: "TransportApprovalStatus",
                table: "TourInstances");

            migrationBuilder.DropColumn(
                name: "TransportProviderId",
                table: "TourInstances");

            migrationBuilder.DropColumn(
                name: "Continent",
                table: "Suppliers");
        }
    }
}
