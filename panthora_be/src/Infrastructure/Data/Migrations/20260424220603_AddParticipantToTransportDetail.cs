using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddParticipantToTransportDetail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "BookingParticipantId",
                table: "BookingTransportDetails",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PassengerName",
                table: "BookingTransportDetails",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_BookingTransportDetails_BookingParticipantId",
                table: "BookingTransportDetails",
                column: "BookingParticipantId");

            migrationBuilder.AddForeignKey(
                name: "FK_BookingTransportDetails_BookingParticipants_BookingParticip~",
                table: "BookingTransportDetails",
                column: "BookingParticipantId",
                principalTable: "BookingParticipants",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BookingTransportDetails_BookingParticipants_BookingParticip~",
                table: "BookingTransportDetails");

            migrationBuilder.DropIndex(
                name: "IX_BookingTransportDetails_BookingParticipantId",
                table: "BookingTransportDetails");

            migrationBuilder.DropColumn(
                name: "BookingParticipantId",
                table: "BookingTransportDetails");

            migrationBuilder.DropColumn(
                name: "PassengerName",
                table: "BookingTransportDetails");
        }
    }
}
