using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTicketImageEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TicketImages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TourInstanceDayActivityId = table.Column<Guid>(type: "uuid", nullable: false),
                    Image_FileId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Image_OriginalFileName = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    Image_FileName = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    Image_PublicURL = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    UploadedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    UploadedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    BookingId = table.Column<Guid>(type: "uuid", nullable: true),
                    BookingReference = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TicketImages_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_TicketImages_TourInstanceDayActivities_TourInstanceDayActiv~",
                        column: x => x.TourInstanceDayActivityId,
                        principalTable: "TourInstanceDayActivities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TicketImages_BookingId",
                table: "TicketImages",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketImages_TourInstanceDayActivityId",
                table: "TicketImages",
                column: "TourInstanceDayActivityId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TicketImages");
        }
    }
}
