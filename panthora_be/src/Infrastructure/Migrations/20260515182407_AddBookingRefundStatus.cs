using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBookingRefundStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "RefundCompletedAt",
                table: "Bookings",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "RefundContactedAt",
                table: "Bookings",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "RefundOutstandingAmount",
                table: "Bookings",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RefundStatus",
                table: "Bookings",
                type: "integer",
                nullable: false,
                defaultValue: 4);

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_RefundStatus",
                table: "Bookings",
                column: "RefundStatus");

            // Backfill: existing Cancelled bookings → NotApplicable (already handled manually)
            migrationBuilder.Sql(
                @"UPDATE ""Bookings"" SET ""RefundStatus"" = 4 WHERE ""Status"" = 5;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Bookings_RefundStatus",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "RefundCompletedAt",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "RefundContactedAt",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "RefundOutstandingAmount",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "RefundStatus",
                table: "Bookings");
        }
    }
}
