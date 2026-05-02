using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTourInstanceBookingTicket : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TourInstanceBookingTickets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TourInstanceDayActivityId = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingId = table.Column<Guid>(type: "uuid", nullable: false),
                    FlightNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DepartureAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ArrivalAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    SeatNumbers = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ETicketNumbers = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    SeatClass = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourInstanceBookingTickets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourInstanceBookingTickets_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TourInstanceBookingTickets_TourInstanceDayActivities_TourIn~",
                        column: x => x.TourInstanceDayActivityId,
                        principalTable: "TourInstanceDayActivities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TourInstanceBookingTickets_BookingId",
                table: "TourInstanceBookingTickets",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_TourInstanceBookingTickets_TourInstanceDayActivityId",
                table: "TourInstanceBookingTickets",
                column: "TourInstanceDayActivityId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TourInstanceBookingTickets");
        }
    }
}
