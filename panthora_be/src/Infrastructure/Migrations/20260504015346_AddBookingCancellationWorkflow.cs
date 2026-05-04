using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBookingCancellationWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BookingCancellationRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequestedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    CancellationPolicyId = table.Column<Guid>(type: "uuid", nullable: true),
                    TourScopeSnapshot = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DaysBeforeDeparture = table.Column<int>(type: "integer", nullable: false),
                    FeePercent = table.Column<int>(type: "integer", nullable: false),
                    PaidAmountSnapshot = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    RefundAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CustomerReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    PreviousBookingStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ReviewedByManagerId = table.Column<Guid>(type: "uuid", nullable: true),
                    ManagerNote = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ReviewedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    RefundConfirmedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    RefundConfirmedByManagerId = table.Column<Guid>(type: "uuid", nullable: true),
                    RefundProofNote = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookingCancellationRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BookingCancellationRequests_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CancellationPolicies_TourScope",
                table: "CancellationPolicies",
                column: "TourScope",
                unique: true,
                filter: "\"Status\" = 'Active' AND \"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_BookingCancellationRequests_BookingId",
                table: "BookingCancellationRequests",
                column: "BookingId",
                unique: true,
                filter: "\"Status\" = 'PendingManagerReview'");

            migrationBuilder.CreateIndex(
                name: "IX_BookingCancellationRequests_CreatedAt",
                table: "BookingCancellationRequests",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_BookingCancellationRequests_RequestedByUserId",
                table: "BookingCancellationRequests",
                column: "RequestedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_BookingCancellationRequests_Status",
                table: "BookingCancellationRequests",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BookingCancellationRequests");

            migrationBuilder.DropIndex(
                name: "IX_CancellationPolicies_TourScope",
                table: "CancellationPolicies");
        }
    }
}
