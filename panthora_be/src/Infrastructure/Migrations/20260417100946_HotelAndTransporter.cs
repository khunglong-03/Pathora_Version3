using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class HotelAndTransporter : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "TourInstanceDayActivityEntityId",
                table: "RoomBlocks",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "TourInstanceDayActivityId",
                table: "RoomBlocks",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_RoomBlocks_TourInstanceDayActivityEntityId",
                table: "RoomBlocks",
                column: "TourInstanceDayActivityEntityId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomBlocks_TourInstanceDayActivityId",
                table: "RoomBlocks",
                column: "TourInstanceDayActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomBlocks_TourInstanceDayActivityId_RoomType",
                table: "RoomBlocks",
                columns: new[] { "TourInstanceDayActivityId", "RoomType" },
                unique: true,
                filter: "\"TourInstanceDayActivityId\" IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_RoomBlocks_TourInstanceDayActivities_TourInstanceDayActivit~",
                table: "RoomBlocks",
                column: "TourInstanceDayActivityEntityId",
                principalTable: "TourInstanceDayActivities",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_RoomBlocks_TourInstanceDayActivities_TourInstanceDayActivi~1",
                table: "RoomBlocks",
                column: "TourInstanceDayActivityId",
                principalTable: "TourInstanceDayActivities",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RoomBlocks_TourInstanceDayActivities_TourInstanceDayActivit~",
                table: "RoomBlocks");

            migrationBuilder.DropForeignKey(
                name: "FK_RoomBlocks_TourInstanceDayActivities_TourInstanceDayActivi~1",
                table: "RoomBlocks");

            migrationBuilder.DropIndex(
                name: "IX_RoomBlocks_TourInstanceDayActivityEntityId",
                table: "RoomBlocks");

            migrationBuilder.DropIndex(
                name: "IX_RoomBlocks_TourInstanceDayActivityId",
                table: "RoomBlocks");

            migrationBuilder.DropIndex(
                name: "IX_RoomBlocks_TourInstanceDayActivityId_RoomType",
                table: "RoomBlocks");

            migrationBuilder.DropColumn(
                name: "TourInstanceDayActivityEntityId",
                table: "RoomBlocks");

            migrationBuilder.DropColumn(
                name: "TourInstanceDayActivityId",
                table: "RoomBlocks");
        }
    }
}
