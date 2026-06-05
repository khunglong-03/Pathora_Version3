using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixAsiaMinibusSupplierId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                UPDATE ""Vehicles"" 
                SET ""SupplierId"" = '019def96-28f4-74d8-ad69-b4b1b13162ad' 
                WHERE ""Id"" = '019df000-0007-7000-0000-000000000001';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                UPDATE ""Vehicles"" 
                SET ""SupplierId"" = '019def96-284d-7fcc-861d-4708fb814c28' 
                WHERE ""Id"" = '019df000-0007-7000-0000-000000000001';
            ");
        }
    }
}
