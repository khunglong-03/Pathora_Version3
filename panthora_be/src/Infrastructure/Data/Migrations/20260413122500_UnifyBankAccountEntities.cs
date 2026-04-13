using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class UnifyBankAccountEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Step 1: Copy existing bank account data from Users → ManagerBankAccounts
            // Only for users that have bank data and don't already have a record
            migrationBuilder.Sql("""
                INSERT INTO "ManagerBankAccounts" (
                    "Id", "UserId", "BankAccountNumber", "BankCode", "BankBin",
                    "BankShortName", "BankAccountName", "IsDefault", "IsVerified",
                    "VerifiedAt", "VerifiedBy", "CreatedOnUtc", "LastModifiedOnUtc"
                )
                SELECT
                    gen_random_uuid(),
                    u."Id",
                    u."BankAccountNumber",
                    u."BankCode",
                    COALESCE(u."BankCode", '000000'),
                    NULL,
                    u."BankAccountName",
                    true,
                    u."BankAccountVerified",
                    u."BankAccountVerifiedAt",
                    u."BankAccountVerifiedBy",
                    NOW(),
                    NOW()
                FROM "Users" u
                WHERE u."BankAccountNumber" IS NOT NULL
                  AND u."BankCode" IS NOT NULL
                  AND NOT EXISTS (
                      SELECT 1 FROM "ManagerBankAccounts" mba
                      WHERE mba."UserId" = u."Id"
                  );
                """);

            // Step 2: Drop the columns from Users table
            migrationBuilder.DropColumn(
                name: "BankAccountName",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "BankAccountNumber",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "BankAccountVerified",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "BankAccountVerifiedAt",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "BankAccountVerifiedBy",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "BankCode",
                table: "Users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BankAccountName",
                table: "Users",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankAccountNumber",
                table: "Users",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "BankAccountVerified",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "BankAccountVerifiedAt",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "BankAccountVerifiedBy",
                table: "Users",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankCode",
                table: "Users",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);
        }
    }
}
