using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBookingApprovalDeadlineColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ApprovalAutoCancelledAt",
                table: "Bookings",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ApprovalWarningSentAt",
                table: "Bookings",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.Sql(@"
                CREATE INDEX IF NOT EXISTS ""IX_Bookings_ApprovalSweep""
                ON ""Bookings""(""Status"", ""ApprovalAutoCancelledAt"")
                WHERE ""Status"" IN ('Pending', 'Confirmed', 'Deposited', 'Paid', 'PendingCancellation', 'PendingAdjustment');
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""IX_Bookings_ApprovalSweep"";");

            migrationBuilder.DropColumn(
                name: "ApprovalAutoCancelledAt",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "ApprovalWarningSentAt",
                table: "Bookings");
        }
    }
}
