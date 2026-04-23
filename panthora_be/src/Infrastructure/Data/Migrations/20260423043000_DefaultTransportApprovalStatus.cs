using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <summary>
    /// Unblocks <c>INSERT</c> on <c>TourInstances</c> while the deprecated
    /// <c>TransportApprovalStatus</c> / <c>TransportApprovalNote</c> columns still exist.
    /// The EF model no longer maps these columns (approval is per-activity on
    /// <c>TourInstanceDayActivities</c>), so EF omits them from the INSERT and the
    /// NOT NULL constraint fails. Giving them server-side defaults keeps writes safe
    /// until the Release C migration finally drops the columns.
    /// </summary>
    public partial class DefaultTransportApprovalStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Guarded with IF EXISTS so the migration is safe even after the
            // Release C drop has already run on an environment.
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'TourInstances'
                          AND column_name = 'TransportApprovalStatus'
                    ) THEN
                        EXECUTE 'ALTER TABLE ""TourInstances"" ALTER COLUMN ""TransportApprovalStatus"" SET DEFAULT 0';
                        EXECUTE 'UPDATE ""TourInstances"" SET ""TransportApprovalStatus"" = 0 WHERE ""TransportApprovalStatus"" IS NULL';
                    END IF;

                    IF EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'TourInstances'
                          AND column_name = 'TransportApprovalNote'
                    ) THEN
                        EXECUTE 'ALTER TABLE ""TourInstances"" ALTER COLUMN ""TransportApprovalNote"" DROP NOT NULL';
                    END IF;
                END $$;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'TourInstances'
                          AND column_name = 'TransportApprovalStatus'
                    ) THEN
                        EXECUTE 'ALTER TABLE ""TourInstances"" ALTER COLUMN ""TransportApprovalStatus"" DROP DEFAULT';
                    END IF;
                END $$;
            ");
        }
    }
}
