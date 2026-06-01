using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixOwnedImageSequences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TourGuideTasks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TourInstanceId = table.Column<Guid>(type: "uuid", nullable: false),
                    AssignedGuideId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Title = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsMandatory = table.Column<bool>(type: "boolean", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CompletedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    EvidenceImageUrls = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourGuideTasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourGuideTasks_TourInstances_TourInstanceId",
                        column: x => x.TourInstanceId,
                        principalTable: "TourInstances",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TourGuideTasks_AssignedGuideId",
                table: "TourGuideTasks",
                column: "AssignedGuideId");

            migrationBuilder.CreateIndex(
                name: "IX_TourGuideTasks_Status",
                table: "TourGuideTasks",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_TourGuideTasks_TourInstanceId",
                table: "TourGuideTasks",
                column: "TourInstanceId");

            // Fix owned image sequences (idempotent)
            migrationBuilder.Sql(@"
                SELECT setval(
                    pg_get_serial_sequence('""TourInstanceImages""', 'Id'),
                    GREATEST(
                        COALESCE((SELECT MAX(""Id"") FROM ""TourInstanceImages""), 1),
                        (SELECT last_value FROM pg_sequences WHERE sequencename = 'TourInstanceImages_Id_seq')
                    )
                );
                SELECT setval(
                    pg_get_serial_sequence('""TourImages""', 'Id'),
                    GREATEST(
                        COALESCE((SELECT MAX(""Id"") FROM ""TourImages""), 1),
                        (SELECT last_value FROM pg_sequences WHERE sequencename = 'TourImages_Id_seq')
                    )
                );
                SELECT setval(
                    pg_get_serial_sequence('""HotelRoomImages""', 'Id'),
                    GREATEST(
                        COALESCE((SELECT MAX(""Id"") FROM ""HotelRoomImages""), 1),
                        (SELECT last_value FROM pg_sequences WHERE sequencename = 'HotelRoomImages_Id_seq')
                    )
                );
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TourGuideTasks");

            // Down is no-op for sequence synchronization because setval is idempotent and does not change schema.
        }
    }
}
