using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTourInstancePerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Enable pg_trgm for GIN trigram index support
            migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS pg_trgm;", suppressTransaction: true);

            // 2. Drop old redundant indexes (replaced by covering index below)
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_TourInstances_Status_InstanceType\";", suppressTransaction: true);
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_TourInstances_StartDate\";", suppressTransaction: true);

            // 3. Partial composite covering index for the main public-available query
            //    Covers: WHERE IsDeleted=false AND InstanceType='Public' AND Status='Available' ORDER BY StartDate
            migrationBuilder.Sql(
                """
                CREATE INDEX CONCURRENTLY "IX_TourInstances_covering"
                ON "TourInstances" ("IsDeleted", "InstanceType", "Status", "StartDate")
                WHERE "IsDeleted" = false;
                """,
                suppressTransaction: true);

            // 4. B-tree index on BasePrice for price-low / price-high sort modes
            migrationBuilder.Sql(
                """
                CREATE INDEX CONCURRENTLY "IX_TourInstances_BasePrice"
                ON "TourInstances" ("BasePrice");
                """,
                suppressTransaction: true);

            // 5. GIN trigram partial index on Location for case-insensitive substring search
            //    The query uses LOWER(Location).Contains(), so the trigram index must match LOWER(Location).
            //    Note: raw "Location" gin_trgm_ops would NOT be used by the query planner.
            migrationBuilder.Sql(
                """
                CREATE INDEX CONCURRENTLY "IX_TourInstances_Location_Trgm"
                ON "TourInstances" USING gin (LOWER("Location") gin_trgm_ops)
                WHERE "IsDeleted" = false;
                """,
                suppressTransaction: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_TourInstances_covering\";", suppressTransaction: true);
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_TourInstances_BasePrice\";", suppressTransaction: true);
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_TourInstances_Location_Trgm\";", suppressTransaction: true);
            // Re-create dropped indexes so Down() is a clean rollback
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_TourInstances_Status_InstanceType\";", suppressTransaction: true);
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_TourInstances_StartDate\";", suppressTransaction: true);
            migrationBuilder.CreateIndex(
                name: "IX_TourInstances_Status_InstanceType",
                table: "TourInstances",
                columns: new[] { "Status", "InstanceType" });
            migrationBuilder.CreateIndex(
                name: "IX_TourInstances_StartDate",
                table: "TourInstances",
                column: "StartDate");
        }
    }
}
