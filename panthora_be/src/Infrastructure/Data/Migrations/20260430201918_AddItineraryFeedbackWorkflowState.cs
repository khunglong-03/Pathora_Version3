using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddItineraryFeedbackWorkflowState : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ApprovedAt",
                table: "TourItineraryFeedbacks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ApprovedByManagerId",
                table: "TourItineraryFeedbacks",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ForwardedAt",
                table: "TourItineraryFeedbacks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ForwardedByManagerId",
                table: "TourItineraryFeedbacks",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "TourItineraryFeedbacks",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "RespondedAt",
                table: "TourItineraryFeedbacks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "RespondedByOperatorId",
                table: "TourItineraryFeedbacks",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "TourItineraryFeedbacks",
                type: "bytea",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "TourItineraryFeedbacks",
                type: "integer",
                nullable: false,
                defaultValue: 3);

            migrationBuilder.CreateIndex(
                name: "IX_TourItineraryFeedbacks_Status",
                table: "TourItineraryFeedbacks",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TourItineraryFeedbacks_Status",
                table: "TourItineraryFeedbacks");

            migrationBuilder.DropColumn(
                name: "ApprovedAt",
                table: "TourItineraryFeedbacks");

            migrationBuilder.DropColumn(
                name: "ApprovedByManagerId",
                table: "TourItineraryFeedbacks");

            migrationBuilder.DropColumn(
                name: "ForwardedAt",
                table: "TourItineraryFeedbacks");

            migrationBuilder.DropColumn(
                name: "ForwardedByManagerId",
                table: "TourItineraryFeedbacks");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "TourItineraryFeedbacks");

            migrationBuilder.DropColumn(
                name: "RespondedAt",
                table: "TourItineraryFeedbacks");

            migrationBuilder.DropColumn(
                name: "RespondedByOperatorId",
                table: "TourItineraryFeedbacks");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "TourItineraryFeedbacks");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "TourItineraryFeedbacks");
        }
    }
}
