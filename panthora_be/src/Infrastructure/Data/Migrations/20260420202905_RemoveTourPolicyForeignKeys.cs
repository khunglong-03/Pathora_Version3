using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveTourPolicyForeignKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tours_CancellationPolicies_CancellationPolicyId",
                table: "Tours");

            migrationBuilder.DropForeignKey(
                name: "FK_Tours_DepositPolicies_DepositPolicyId",
                table: "Tours");

            migrationBuilder.DropForeignKey(
                name: "FK_Tours_PricingPolicies_PricingPolicyId",
                table: "Tours");

            migrationBuilder.DropForeignKey(
                name: "FK_Tours_VisaPolicies_VisaPolicyId",
                table: "Tours");

            migrationBuilder.DropTable(
                name: "VisaPolicies");

            migrationBuilder.DropIndex(
                name: "IX_Tours_CancellationPolicyId",
                table: "Tours");

            migrationBuilder.DropIndex(
                name: "IX_Tours_DepositPolicyId",
                table: "Tours");

            migrationBuilder.DropIndex(
                name: "IX_Tours_PricingPolicyId",
                table: "Tours");

            migrationBuilder.DropIndex(
                name: "IX_Tours_VisaPolicyId",
                table: "Tours");

            migrationBuilder.DropColumn(
                name: "CancellationPolicyId",
                table: "Tours");

            migrationBuilder.DropColumn(
                name: "DepositPolicyId",
                table: "Tours");

            migrationBuilder.DropColumn(
                name: "PricingPolicyId",
                table: "Tours");

            migrationBuilder.DropColumn(
                name: "VisaPolicyId",
                table: "Tours");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CancellationPolicyId",
                table: "Tours",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DepositPolicyId",
                table: "Tours",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PricingPolicyId",
                table: "Tours",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "VisaPolicyId",
                table: "Tours",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "VisaPolicies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BufferDays = table.Column<int>(type: "integer", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    FullPaymentRequired = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ProcessingDays = table.Column<int>(type: "integer", nullable: false),
                    Region = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Translations = table.Column<string>(type: "jsonb", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VisaPolicies", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Tours_CancellationPolicyId",
                table: "Tours",
                column: "CancellationPolicyId");

            migrationBuilder.CreateIndex(
                name: "IX_Tours_DepositPolicyId",
                table: "Tours",
                column: "DepositPolicyId");

            migrationBuilder.CreateIndex(
                name: "IX_Tours_PricingPolicyId",
                table: "Tours",
                column: "PricingPolicyId");

            migrationBuilder.CreateIndex(
                name: "IX_Tours_VisaPolicyId",
                table: "Tours",
                column: "VisaPolicyId");

            migrationBuilder.CreateIndex(
                name: "IX_VisaPolicies_IsActive",
                table: "VisaPolicies",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_VisaPolicies_IsDeleted",
                table: "VisaPolicies",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_VisaPolicies_Region",
                table: "VisaPolicies",
                column: "Region");

            migrationBuilder.AddForeignKey(
                name: "FK_Tours_CancellationPolicies_CancellationPolicyId",
                table: "Tours",
                column: "CancellationPolicyId",
                principalTable: "CancellationPolicies",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Tours_DepositPolicies_DepositPolicyId",
                table: "Tours",
                column: "DepositPolicyId",
                principalTable: "DepositPolicies",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Tours_PricingPolicies_PricingPolicyId",
                table: "Tours",
                column: "PricingPolicyId",
                principalTable: "PricingPolicies",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Tours_VisaPolicies_VisaPolicyId",
                table: "Tours",
                column: "VisaPolicyId",
                principalTable: "VisaPolicies",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
