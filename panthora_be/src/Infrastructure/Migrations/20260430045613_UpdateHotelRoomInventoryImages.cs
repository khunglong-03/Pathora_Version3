using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateHotelRoomInventoryImages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrls",
                table: "HotelRoomInventory");

            migrationBuilder.AddColumn<string>(
                name: "Thumbnail_FileId",
                table: "HotelRoomInventory",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Thumbnail_FileName",
                table: "HotelRoomInventory",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Thumbnail_OriginalFileName",
                table: "HotelRoomInventory",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Thumbnail_PublicURL",
                table: "HotelRoomInventory",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "HotelRoomImages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    FileId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    OriginalFileName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FileName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PublicURL = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    HotelRoomInventoryId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HotelRoomImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HotelRoomImages_HotelRoomInventory_HotelRoomInventoryId",
                        column: x => x.HotelRoomInventoryId,
                        principalTable: "HotelRoomInventory",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_HotelRoomImages_HotelRoomInventoryId",
                table: "HotelRoomImages",
                column: "HotelRoomInventoryId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HotelRoomImages");

            migrationBuilder.DropColumn(
                name: "Thumbnail_FileId",
                table: "HotelRoomInventory");

            migrationBuilder.DropColumn(
                name: "Thumbnail_FileName",
                table: "HotelRoomInventory");

            migrationBuilder.DropColumn(
                name: "Thumbnail_OriginalFileName",
                table: "HotelRoomInventory");

            migrationBuilder.DropColumn(
                name: "Thumbnail_PublicURL",
                table: "HotelRoomInventory");

            migrationBuilder.AddColumn<string>(
                name: "ImageUrls",
                table: "HotelRoomInventory",
                type: "jsonb",
                nullable: true);
        }
    }
}
