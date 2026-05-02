using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTourItineraryFeedbackCompositeIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_TourItineraryFeedbacks_TourInstanceId_TourInstanceDayId",
                table: "TourItineraryFeedbacks",
                columns: new[] { "TourInstanceId", "TourInstanceDayId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TourItineraryFeedbacks_TourInstanceId_TourInstanceDayId",
                table: "TourItineraryFeedbacks");
        }
    }
}
