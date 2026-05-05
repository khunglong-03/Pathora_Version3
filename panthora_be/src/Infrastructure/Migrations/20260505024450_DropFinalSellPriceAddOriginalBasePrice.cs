using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class DropFinalSellPriceAddOriginalBasePrice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "OriginalBasePrice",
                table: "TourInstances",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            // Data migration: seed OriginalBasePrice from current BasePrice for existing rows
            migrationBuilder.Sql("""
                UPDATE "TourInstances" SET "OriginalBasePrice" = "BasePrice" WHERE "OriginalBasePrice" = 0;
                """);

            migrationBuilder.DropColumn(
                name: "FinalSellPrice",
                table: "TourInstances");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OriginalBasePrice",
                table: "TourInstances");

            migrationBuilder.AddColumn<decimal>(
                name: "FinalSellPrice",
                table: "TourInstances",
                type: "numeric(18,2)",
                nullable: true);
        }
    }
}
