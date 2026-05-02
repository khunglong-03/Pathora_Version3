using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPrivateCustomTourSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "FinalSellPrice",
                table: "TourInstances",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TourItineraryFeedbacks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TourInstanceId = table.Column<Guid>(type: "uuid", nullable: false),
                    TourInstanceDayId = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingId = table.Column<Guid>(type: "uuid", nullable: true),
                    Content = table.Column<string>(type: "character varying(8000)", maxLength: 8000, nullable: false),
                    IsFromCustomer = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourItineraryFeedbacks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourItineraryFeedbacks_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_TourItineraryFeedbacks_TourInstanceDays_TourInstanceDayId",
                        column: x => x.TourInstanceDayId,
                        principalTable: "TourInstanceDays",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TourItineraryFeedbacks_TourInstances_TourInstanceId",
                        column: x => x.TourInstanceId,
                        principalTable: "TourInstances",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TransactionHistories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingId = table.Column<Guid>(type: "uuid", nullable: true),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TransactionHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TransactionHistories_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_TransactionHistories_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TourItineraryFeedbacks_BookingId",
                table: "TourItineraryFeedbacks",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_TourItineraryFeedbacks_TourInstanceDayId",
                table: "TourItineraryFeedbacks",
                column: "TourInstanceDayId");

            migrationBuilder.CreateIndex(
                name: "IX_TourItineraryFeedbacks_TourInstanceId",
                table: "TourItineraryFeedbacks",
                column: "TourInstanceId");

            migrationBuilder.CreateIndex(
                name: "IX_TransactionHistories_BookingId",
                table: "TransactionHistories",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_TransactionHistories_CreatedOnUtc",
                table: "TransactionHistories",
                column: "CreatedOnUtc");

            migrationBuilder.CreateIndex(
                name: "IX_TransactionHistories_UserId",
                table: "TransactionHistories",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TourItineraryFeedbacks");

            migrationBuilder.DropTable(
                name: "TransactionHistories");

            migrationBuilder.DropColumn(
                name: "FinalSellPrice",
                table: "TourInstances");
        }
    }
}
