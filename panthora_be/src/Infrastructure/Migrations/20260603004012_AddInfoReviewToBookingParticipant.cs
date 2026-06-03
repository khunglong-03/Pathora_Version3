using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInfoReviewToBookingParticipant : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "InfoRejectionReason",
                table: "BookingParticipants",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InfoReviewStatus",
                table: "BookingParticipants",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "NotReviewed");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "InfoReviewedAt",
                table: "BookingParticipants",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "InfoReviewedBy",
                table: "BookingParticipants",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_BookingParticipants_InfoReviewStatus",
                table: "BookingParticipants",
                column: "InfoReviewStatus");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_BookingParticipants_InfoReviewStatus",
                table: "BookingParticipants");

            migrationBuilder.DropColumn(
                name: "InfoRejectionReason",
                table: "BookingParticipants");

            migrationBuilder.DropColumn(
                name: "InfoReviewStatus",
                table: "BookingParticipants");

            migrationBuilder.DropColumn(
                name: "InfoReviewedAt",
                table: "BookingParticipants");

            migrationBuilder.DropColumn(
                name: "InfoReviewedBy",
                table: "BookingParticipants");
        }
    }
}
