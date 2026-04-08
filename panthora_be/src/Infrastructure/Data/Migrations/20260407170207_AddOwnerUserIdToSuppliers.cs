using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddOwnerUserIdToSuppliers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CountryCode",
                table: "Vehicles");

            migrationBuilder.AddColumn<string>(
                name: "OperatingCountries",
                table: "Vehicles",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "OwnerUserId",
                table: "Suppliers",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "HotelRoomInventory",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImageUrls",
                table: "HotelRoomInventory",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LocationArea",
                table: "HotelRoomInventory",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "HotelRoomInventory",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "HotelRoomInventory",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OperatingCountries",
                table: "HotelRoomInventory",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_OperatingCountries",
                table: "Vehicles",
                column: "OperatingCountries");

            migrationBuilder.CreateIndex(
                name: "IX_Suppliers_OwnerUserId",
                table: "Suppliers",
                column: "OwnerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_HotelRoomInventory_LocationArea",
                table: "HotelRoomInventory",
                column: "LocationArea");

            migrationBuilder.CreateIndex(
                name: "IX_HotelRoomInventory_OperatingCountries",
                table: "HotelRoomInventory",
                column: "OperatingCountries");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Vehicles_OperatingCountries",
                table: "Vehicles");

            migrationBuilder.DropIndex(
                name: "IX_Suppliers_OwnerUserId",
                table: "Suppliers");

            migrationBuilder.DropIndex(
                name: "IX_HotelRoomInventory_LocationArea",
                table: "HotelRoomInventory");

            migrationBuilder.DropIndex(
                name: "IX_HotelRoomInventory_OperatingCountries",
                table: "HotelRoomInventory");

            migrationBuilder.DropColumn(
                name: "OperatingCountries",
                table: "Vehicles");

            migrationBuilder.DropColumn(
                name: "OwnerUserId",
                table: "Suppliers");

            migrationBuilder.DropColumn(
                name: "Address",
                table: "HotelRoomInventory");

            migrationBuilder.DropColumn(
                name: "ImageUrls",
                table: "HotelRoomInventory");

            migrationBuilder.DropColumn(
                name: "LocationArea",
                table: "HotelRoomInventory");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "HotelRoomInventory");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "HotelRoomInventory");

            migrationBuilder.DropColumn(
                name: "OperatingCountries",
                table: "HotelRoomInventory");

            migrationBuilder.AddColumn<string>(
                name: "CountryCode",
                table: "Vehicles",
                type: "character varying(2)",
                maxLength: 2,
                nullable: true);
        }
    }
}
