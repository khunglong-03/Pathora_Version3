using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPostPaymentVisaFlow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_VisaApplications_BookingParticipantId",
                table: "VisaApplications");

            migrationBuilder.DropIndex(
                name: "IX_VisaApplications_Status",
                table: "VisaApplications");

            migrationBuilder.AddColumn<bool>(
                name: "IsSystemAssisted",
                table: "VisaApplications",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "ServiceFee",
                table: "VisaApplications",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ServiceFeePaidAt",
                table: "VisaApplications",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ServiceFeeQuotedAt",
                table: "VisaApplications",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ServiceFeeTransactionId",
                table: "VisaApplications",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "VisaServiceFeeTotal",
                table: "Bookings",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateIndex(
                name: "IX_VisaApplications_BookingParticipantId",
                table: "VisaApplications",
                column: "BookingParticipantId",
                unique: true,
                filter: "\"Status\" IN ('Pending', 'Processing', 'Approved')");

            migrationBuilder.CreateIndex(
                name: "IX_VisaApplications_BookingParticipantId_Status",
                table: "VisaApplications",
                columns: new[] { "BookingParticipantId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_VisaApplications_ServiceFeeTransactionId",
                table: "VisaApplications",
                column: "ServiceFeeTransactionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_VisaApplications_BookingParticipantId",
                table: "VisaApplications");

            migrationBuilder.DropIndex(
                name: "IX_VisaApplications_BookingParticipantId_Status",
                table: "VisaApplications");

            migrationBuilder.DropIndex(
                name: "IX_VisaApplications_ServiceFeeTransactionId",
                table: "VisaApplications");

            migrationBuilder.DropColumn(
                name: "IsSystemAssisted",
                table: "VisaApplications");

            migrationBuilder.DropColumn(
                name: "ServiceFee",
                table: "VisaApplications");

            migrationBuilder.DropColumn(
                name: "ServiceFeePaidAt",
                table: "VisaApplications");

            migrationBuilder.DropColumn(
                name: "ServiceFeeQuotedAt",
                table: "VisaApplications");

            migrationBuilder.DropColumn(
                name: "ServiceFeeTransactionId",
                table: "VisaApplications");

            migrationBuilder.DropColumn(
                name: "VisaServiceFeeTotal",
                table: "Bookings");

            migrationBuilder.CreateIndex(
                name: "IX_VisaApplications_BookingParticipantId",
                table: "VisaApplications",
                column: "BookingParticipantId");

            migrationBuilder.CreateIndex(
                name: "IX_VisaApplications_Status",
                table: "VisaApplications",
                column: "Status");
        }
    }
}
