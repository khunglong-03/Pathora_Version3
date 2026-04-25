using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class ResetAllPasswords : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // BCrypt hash for 'thehieu03'
            var hashedPassword = "$2b$11$/slKlo0xxvuOJA1mBLCDXu83GKz.ZOgkv8eoHwdnBSYXrdK/ttmFi";
            migrationBuilder.Sql($"UPDATE \"Users\" SET \"Password\" = '{hashedPassword}', \"ForcePasswordChange\" = false WHERE \"IsDeleted\" = false;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
