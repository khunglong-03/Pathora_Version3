using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVisaEntityFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Category",
                table: "Visas",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DestinationCountry",
                table: "Visas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Format",
                table: "Visas",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IssuingAuthority",
                table: "Visas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxStayDays",
                table: "Visas",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Category",
                table: "Visas");

            migrationBuilder.DropColumn(
                name: "DestinationCountry",
                table: "Visas");

            migrationBuilder.DropColumn(
                name: "Format",
                table: "Visas");

            migrationBuilder.DropColumn(
                name: "IssuingAuthority",
                table: "Visas");

            migrationBuilder.DropColumn(
                name: "MaxStayDays",
                table: "Visas");
        }
    }
}
