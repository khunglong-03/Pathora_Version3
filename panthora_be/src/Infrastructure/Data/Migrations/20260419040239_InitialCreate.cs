using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CancellationPolicies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PolicyCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TourScope = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Active"),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    Translations = table.Column<string>(type: "jsonb", nullable: false),
                    Tiers = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CancellationPolicies", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Departments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParentId = table.Column<Guid>(type: "uuid", nullable: true),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Level = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Departments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Departments_Departments_ParentId",
                        column: x => x.ParentId,
                        principalTable: "Departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DepositPolicies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TourScope = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DepositType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DepositValue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    MinDaysBeforeDeparture = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    Translations = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DepositPolicies", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FileMetadatas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LinkedEntityId = table.Column<Guid>(type: "uuid", nullable: false),
                    OriginalFileName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    StoredFileName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    MimeType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Url = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FileMetadatas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LogErrors",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Content = table.Column<string>(type: "text", nullable: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LogErrors", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Mails",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    To = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Subject = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Body = table.Column<string>(type: "text", nullable: false),
                    Template = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Pending"),
                    SentAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Mails", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Otps",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    ExpiryDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    FailedAttemptsCount = table.Column<int>(type: "integer", nullable: false),
                    LockoutExpiration = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Otps", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OutboxMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Payload = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    RetryCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    NextRetryAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ProcessedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ErrorMessage = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OutboxMessages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PasswordResetTokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    TokenHash = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UsedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PasswordResetTokens", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Positions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Level = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    Type = table.Column<int>(type: "integer", nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Positions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PricingPolicies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PolicyCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    TourType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    Tiers = table.Column<string>(type: "jsonb", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    Translations = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PricingPolicies", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Registers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Username = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Password = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    FullName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Registers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "site_contents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PageKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ContentKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ContentValue = table.Column<string>(type: "text", nullable: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_site_contents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Suppliers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SupplierCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    SupplierType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    OwnerUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    Continent = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Suppliers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SystemKeys",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ParentId = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    CodeKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CodeValue = table.Column<int>(type: "integer", nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemKeys", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TaxConfigs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TaxName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    TaxRate = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    EffectiveDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaxConfigs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Username = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FullName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    PhoneNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    AvatarUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    VerifyStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Password = table.Column<string>(type: "text", nullable: true),
                    GoogleId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Balance = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false, defaultValue: 0m),
                    ForcePasswordChange = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "VisaPolicies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Region = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ProcessingDays = table.Column<int>(type: "integer", nullable: false),
                    BufferDays = table.Column<int>(type: "integer", nullable: false),
                    FullPaymentRequired = table.Column<bool>(type: "boolean", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Translations = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VisaPolicies", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "HotelRoomInventory",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SupplierId = table.Column<Guid>(type: "uuid", nullable: false),
                    RoomType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TotalRooms = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    LocationArea = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    OperatingCountries = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ImageUrls = table.Column<string>(type: "jsonb", nullable: true),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HotelRoomInventory", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HotelRoomInventory_Suppliers_SupplierId",
                        column: x => x.SupplierId,
                        principalTable: "Suppliers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Drivers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    FullName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LicenseNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    LicenseType = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    PhoneNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    AvatarUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Drivers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Drivers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ManagerBankAccounts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    BankAccountNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    BankCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    BankBin = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    BankShortName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    BankAccountName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    IsVerified = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    VerifiedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    VerifiedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ManagerBankAccounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ManagerBankAccounts_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RefreshTokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Token = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ExpiresOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefreshTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RefreshTokens_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserRoles",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    RoleId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_UserRoles_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserRoles_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    PreferredLanguage = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "vi"),
                    NotificationEmail = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    NotificationSms = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    NotificationPush = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    Theme = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "light"),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserSettings_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Vehicles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VehiclePlate = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    VehicleType = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Brand = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Model = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    SeatCapacity = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    LocationArea = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    OperatingCountries = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    VehicleImageUrls = table.Column<string>(type: "jsonb", nullable: true),
                    OwnerId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vehicles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Vehicles_Users_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Tours",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TourCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TourName = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    ShortDescription = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    LongDescription = table.Column<string>(type: "text", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    SEOTitle = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    SEODescription = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    RejectionReason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    TourScope = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Continent = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CustomerSegment = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Thumbnail_FileId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Thumbnail_OriginalFileName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Thumbnail_FileName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Thumbnail_PublicURL = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Translations = table.Column<string>(type: "jsonb", nullable: false),
                    VisaPolicyId = table.Column<Guid>(type: "uuid", nullable: true),
                    DepositPolicyId = table.Column<Guid>(type: "uuid", nullable: true),
                    PricingPolicyId = table.Column<Guid>(type: "uuid", nullable: true),
                    CancellationPolicyId = table.Column<Guid>(type: "uuid", nullable: true),
                    TourDesignerId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tours", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tours_CancellationPolicies_CancellationPolicyId",
                        column: x => x.CancellationPolicyId,
                        principalTable: "CancellationPolicies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Tours_DepositPolicies_DepositPolicyId",
                        column: x => x.DepositPolicyId,
                        principalTable: "DepositPolicies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Tours_PricingPolicies_PricingPolicyId",
                        column: x => x.PricingPolicyId,
                        principalTable: "PricingPolicies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Tours_Users_TourDesignerId",
                        column: x => x.TourDesignerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Tours_VisaPolicies_VisaPolicyId",
                        column: x => x.VisaPolicyId,
                        principalTable: "VisaPolicies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Reviews",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TourId = table.Column<Guid>(type: "uuid", nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: false),
                    Comment = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsApproved = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reviews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reviews_Tours_TourId",
                        column: x => x.TourId,
                        principalTable: "Tours",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Reviews_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TourClassifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TourId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    BasePrice = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    NumberOfDay = table.Column<int>(type: "integer", nullable: false),
                    NumberOfNight = table.Column<int>(type: "integer", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true),
                    Translations = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourClassifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourClassifications_Tours_TourId",
                        column: x => x.TourId,
                        principalTable: "Tours",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TourImages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    FileId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    OriginalFileName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FileName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PublicURL = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    TourId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourImages_Tours_TourId",
                        column: x => x.TourId,
                        principalTable: "Tours",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TourDays",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassificationId = table.Column<Guid>(type: "uuid", nullable: true),
                    DayNumber = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true),
                    Translations = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourDays", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourDays_TourClassifications_ClassificationId",
                        column: x => x.ClassificationId,
                        principalTable: "TourClassifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TourInstances",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TourId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassificationId = table.Column<Guid>(type: "uuid", nullable: false),
                    HotelProviderId = table.Column<Guid>(type: "uuid", nullable: true),
                    HotelApprovalStatus = table.Column<int>(type: "integer", nullable: false),
                    HotelApprovalNote = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    TransportProviderId = table.Column<Guid>(type: "uuid", nullable: true),
                    TransportApprovalStatus = table.Column<int>(type: "integer", nullable: false),
                    TransportApprovalNote = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    TourInstanceCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    TourName = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    TourCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ClassificationName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    InstanceType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CancellationReason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    StartDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    DurationDays = table.Column<int>(type: "integer", nullable: false),
                    ConfirmationDeadline = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    MaxParticipation = table.Column<int>(type: "integer", nullable: false),
                    CurrentParticipation = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    BasePrice = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Location = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Thumbnail_FileId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Thumbnail_OriginalFileName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Thumbnail_FileName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Thumbnail_PublicURL = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IncludedServices = table.Column<string>(type: "jsonb", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    Translations = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourInstances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourInstances_Suppliers_HotelProviderId",
                        column: x => x.HotelProviderId,
                        principalTable: "Suppliers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TourInstances_Suppliers_TransportProviderId",
                        column: x => x.TransportProviderId,
                        principalTable: "Suppliers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TourInstances_TourClassifications_ClassificationId",
                        column: x => x.ClassificationId,
                        principalTable: "TourClassifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TourInstances_Tours_TourId",
                        column: x => x.TourId,
                        principalTable: "Tours",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TourInsurances",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    InsuranceName = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    InsuranceType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    InsuranceProvider = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    CoverageDescription = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    CoverageAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CoverageFee = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    IsOptional = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    DeletedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true),
                    Translations = table.Column<string>(type: "jsonb", nullable: false),
                    TourClassificationId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourInsurances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourInsurances_TourClassifications_TourClassificationId",
                        column: x => x.TourClassificationId,
                        principalTable: "TourClassifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TourDayActivities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TourDayId = table.Column<Guid>(type: "uuid", nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    ActivityType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    EstimatedCost = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    IsOptional = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true),
                    Translations = table.Column<string>(type: "jsonb", nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    EndTime = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourDayActivities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourDayActivities_TourDays_TourDayId",
                        column: x => x.TourDayId,
                        principalTable: "TourDays",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "tour_manager_assignment",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TourManagerId = table.Column<Guid>(type: "uuid", nullable: false),
                    AssignedEntityType = table.Column<string>(type: "text", nullable: false),
                    AssignedUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    AssignedTourId = table.Column<Guid>(type: "uuid", nullable: true),
                    AssignedRoleInTeam = table.Column<string>(type: "text", nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tour_manager_assignment", x => x.Id);
                    table.ForeignKey(
                        name: "FK_tour_manager_assignment_TourInstances_AssignedTourId",
                        column: x => x.AssignedTourId,
                        principalTable: "TourInstances",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_tour_manager_assignment_Users_AssignedUserId",
                        column: x => x.AssignedUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_tour_manager_assignment_Users_TourManagerId",
                        column: x => x.TourManagerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TourInstanceDays",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TourInstanceId = table.Column<Guid>(type: "uuid", nullable: false),
                    TourDayId = table.Column<Guid>(type: "uuid", nullable: false),
                    InstanceDayNumber = table.Column<int>(type: "integer", nullable: false),
                    ActualDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    StartTime = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    EndTime = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    Translations = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourInstanceDays", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourInstanceDays_TourDays_TourDayId",
                        column: x => x.TourDayId,
                        principalTable: "TourDays",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TourInstanceDays_TourInstances_TourInstanceId",
                        column: x => x.TourInstanceId,
                        principalTable: "TourInstances",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TourInstanceImages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    FileId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    OriginalFileName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FileName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PublicURL = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    TourInstanceId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourInstanceImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourInstanceImages_TourInstances_TourInstanceId",
                        column: x => x.TourInstanceId,
                        principalTable: "TourInstances",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TourInstanceManagers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TourInstanceId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourInstanceManagers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourInstanceManagers_TourInstances_TourInstanceId",
                        column: x => x.TourInstanceId,
                        principalTable: "TourInstances",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TourInstanceManagers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TourRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    CustomerName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CustomerPhone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CustomerEmail = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Destination = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    DepartureDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ReturnDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    NumberAdult = table.Column<int>(type: "integer", nullable: false),
                    NumberChild = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    NumberInfant = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    Budget = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    TravelInterests = table.Column<string>(type: "jsonb", nullable: false),
                    PreferredAccommodation = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    TransportationPreference = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    SpecialRequirements = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Note = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AdminNote = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ReviewedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    ReviewedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    TourInstanceId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourRequests_TourInstances_TourInstanceId",
                        column: x => x.TourInstanceId,
                        principalTable: "TourInstances",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TourRequests_Users_ReviewedBy",
                        column: x => x.ReviewedBy,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TourRequests_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TourDayActivityResourceLinks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TourDayActivityId = table.Column<Guid>(type: "uuid", nullable: false),
                    Url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourDayActivityResourceLinks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourDayActivityResourceLinks_TourDayActivities_TourDayActiv~",
                        column: x => x.TourDayActivityId,
                        principalTable: "TourDayActivities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TourPlanAccommodations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AccommodationName = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    CheckInTime = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    CheckOutTime = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    RoomType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    RoomCapacity = table.Column<int>(type: "integer", nullable: false),
                    RoomPrice = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    NumberOfRooms = table.Column<int>(type: "integer", nullable: true),
                    NumberOfNights = table.Column<int>(type: "integer", nullable: true),
                    TotalPrice = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    MealsIncluded = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    SpecialRequest = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    City = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ContactPhone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Website = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ImageUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Latitude = table.Column<decimal>(type: "numeric(10,7)", nullable: true),
                    Longitude = table.Column<decimal>(type: "numeric(10,7)", nullable: true),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true),
                    Translations = table.Column<string>(type: "jsonb", nullable: false),
                    TourDayActivityId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourPlanAccommodations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourPlanAccommodations_TourDayActivities_TourDayActivityId",
                        column: x => x.TourDayActivityId,
                        principalTable: "TourDayActivities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TourPlanLocations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LocationName = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    LocationDescription = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    LocationType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    City = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Country = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Latitude = table.Column<decimal>(type: "numeric(10,7)", nullable: true),
                    Longitude = table.Column<decimal>(type: "numeric(10,7)", nullable: true),
                    EntranceFee = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    OpeningHours = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    ClosingHours = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    EstimatedDurationMinutes = table.Column<int>(type: "integer", nullable: true),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true),
                    Translations = table.Column<string>(type: "jsonb", nullable: false),
                    TourDayActivityId = table.Column<Guid>(type: "uuid", nullable: true),
                    TourId = table.Column<Guid>(type: "uuid", nullable: false),
                    TourEntityId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourPlanLocations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourPlanLocations_TourDayActivities_TourDayActivityId",
                        column: x => x.TourDayActivityId,
                        principalTable: "TourDayActivities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_TourPlanLocations_Tours_TourEntityId",
                        column: x => x.TourEntityId,
                        principalTable: "Tours",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_TourPlanLocations_Tours_TourId",
                        column: x => x.TourId,
                        principalTable: "Tours",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TourInstanceDayActivities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TourInstanceDayId = table.Column<Guid>(type: "uuid", nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    ActivityType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsOptional = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    StartTime = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    EndTime = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourInstanceDayActivities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourInstanceDayActivities_TourInstanceDays_TourInstanceDayId",
                        column: x => x.TourInstanceDayId,
                        principalTable: "TourInstanceDays",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Bookings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TourInstanceId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    TourRequestId = table.Column<Guid>(type: "uuid", nullable: true),
                    CustomerName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CustomerPhone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CustomerEmail = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    NumberAdult = table.Column<int>(type: "integer", nullable: false),
                    NumberChild = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    NumberInfant = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    TotalPrice = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    PaymentMethod = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IsFullPay = table.Column<bool>(type: "boolean", nullable: false),
                    BookingType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    BookingDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CancelledAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CancelReason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bookings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Bookings_TourInstances_TourInstanceId",
                        column: x => x.TourInstanceId,
                        principalTable: "TourInstances",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Bookings_TourRequests_TourRequestId",
                        column: x => x.TourRequestId,
                        principalTable: "TourRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Bookings_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TourPlanRoutes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    TransportationType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TransportationName = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    TransportationNote = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    FromLocationId = table.Column<Guid>(type: "uuid", nullable: true),
                    ToLocationId = table.Column<Guid>(type: "uuid", nullable: true),
                    EstimatedDepartureTime = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    EstimatedArrivalTime = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    DurationMinutes = table.Column<int>(type: "integer", nullable: true),
                    DistanceKm = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    Price = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    BookingReference = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true),
                    Translations = table.Column<string>(type: "jsonb", nullable: false),
                    TourDayActivityId = table.Column<Guid>(type: "uuid", nullable: false),
                    TourDayActivityEntityId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourPlanRoutes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourPlanRoutes_TourDayActivities_TourDayActivityEntityId",
                        column: x => x.TourDayActivityEntityId,
                        principalTable: "TourDayActivities",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_TourPlanRoutes_TourDayActivities_TourDayActivityId",
                        column: x => x.TourDayActivityId,
                        principalTable: "TourDayActivities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TourPlanRoutes_TourPlanLocations_FromLocationId",
                        column: x => x.FromLocationId,
                        principalTable: "TourPlanLocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TourPlanRoutes_TourPlanLocations_ToLocationId",
                        column: x => x.ToLocationId,
                        principalTable: "TourPlanLocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TourResources",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TourId = table.Column<Guid>(type: "uuid", nullable: false),
                    FromLocationId = table.Column<Guid>(type: "uuid", nullable: true),
                    ToLocationId = table.Column<Guid>(type: "uuid", nullable: true),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    City = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Country = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ContactPhone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ContactEmail = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    EntranceFee = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    Price = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    PricingType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    TransportationType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    TransportationName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DurationMinutes = table.Column<int>(type: "integer", nullable: true),
                    RequiresIndividualTicket = table.Column<bool>(type: "boolean", nullable: false),
                    TicketInfo = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CheckInTime = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CheckOutTime = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true),
                    Translations = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourResources", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourResources_TourPlanLocations_FromLocationId",
                        column: x => x.FromLocationId,
                        principalTable: "TourPlanLocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TourResources_TourPlanLocations_ToLocationId",
                        column: x => x.ToLocationId,
                        principalTable: "TourPlanLocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TourResources_Tours_TourId",
                        column: x => x.TourId,
                        principalTable: "Tours",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TourInstancePlanAccommodations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TourInstanceDayActivityId = table.Column<Guid>(type: "uuid", nullable: false),
                    RoomType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Quantity = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    CheckInTime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CheckOutTime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourInstancePlanAccommodations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourInstancePlanAccommodations_TourInstanceDayActivities_To~",
                        column: x => x.TourInstanceDayActivityId,
                        principalTable: "TourInstanceDayActivities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TourInstancePlanRoutes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TourInstanceDayActivityId = table.Column<Guid>(type: "uuid", nullable: false),
                    VehicleId = table.Column<Guid>(type: "uuid", nullable: true),
                    DriverId = table.Column<Guid>(type: "uuid", nullable: true),
                    PickupLocation = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DropoffLocation = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DepartureTime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ArrivalTime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourInstancePlanRoutes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourInstancePlanRoutes_Drivers_DriverId",
                        column: x => x.DriverId,
                        principalTable: "Drivers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_TourInstancePlanRoutes_TourInstanceDayActivities_TourInstan~",
                        column: x => x.TourInstanceDayActivityId,
                        principalTable: "TourInstanceDayActivities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TourInstancePlanRoutes_Vehicles_VehicleId",
                        column: x => x.VehicleId,
                        principalTable: "Vehicles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "BookingActivityReservations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingId = table.Column<Guid>(type: "uuid", nullable: false),
                    SupplierId = table.Column<Guid>(type: "uuid", nullable: true),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    ActivityType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    StartTime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    EndTime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    TotalServicePrice = table.Column<decimal>(type: "numeric(18,2)", nullable: false, defaultValue: 0m),
                    TotalServicePriceAfterTax = table.Column<decimal>(type: "numeric(18,2)", nullable: false, defaultValue: 0m),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookingActivityReservations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BookingActivityReservations_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BookingActivityReservations_Suppliers_SupplierId",
                        column: x => x.SupplierId,
                        principalTable: "Suppliers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "BookingParticipants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParticipantType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    FullName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DateOfBirth = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Gender = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Nationality = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookingParticipants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BookingParticipants_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BookingTourGuides",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    AssignedRole = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IsLead = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    AssignedDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    AssignedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookingTourGuides", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BookingTourGuides_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BookingTourGuides_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CustomerDeposits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingId = table.Column<Guid>(type: "uuid", nullable: false),
                    DepositOrder = table.Column<int>(type: "integer", nullable: false),
                    ExpectedAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    DueAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PaidAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomerDeposits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CustomerDeposits_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Payments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PaidUser = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingId = table.Column<Guid>(type: "uuid", nullable: true),
                    TransactionId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Currency = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    PaymentDescription = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    TransactionTimestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SenderName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    SenderAccountNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ReceiverName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ReceiverAccountNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    BeneficiaryBank = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    TaxCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    BillingAddress = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    TaxAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    TaxRate = table.Column<double>(type: "double precision", nullable: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Payments_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Payments_Users_PaidUser",
                        column: x => x.PaidUser,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PaymentTransactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingId = table.Column<Guid>(type: "uuid", nullable: false),
                    TransactionCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ExternalTransactionId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    PayOSOrderCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    PaidAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    RemainingAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    PaymentMethod = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ExpiredAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    PaidAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CheckoutUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PaymentNote = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ReferenceCode = table.Column<string>(type: "character varying(12)", maxLength: 12, nullable: true),
                    SenderName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    SenderAccountNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    BeneficiaryBank = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    ManagerAccountNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ManagerBankCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    ManagerAccountName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ErrorCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ErrorMessage = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    RetryCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    LastProcessingError = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    LastProcessedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PaymentTransactions_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SupplierPayables",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingId = table.Column<Guid>(type: "uuid", nullable: false),
                    SupplierId = table.Column<Guid>(type: "uuid", nullable: false),
                    ExpectedAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    PaidAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false, defaultValue: 0m),
                    DueAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupplierPayables", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SupplierPayables_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SupplierPayables_Suppliers_SupplierId",
                        column: x => x.SupplierId,
                        principalTable: "Suppliers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TourDayActivityStatuses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingId = table.Column<Guid>(type: "uuid", nullable: false),
                    TourDayId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActivityStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ActualStartTime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ActualEndTime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CompletedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    CancellationReason = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CancelledAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CancelledBy = table.Column<Guid>(type: "uuid", nullable: true),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourDayActivityStatuses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourDayActivityStatuses_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TourDayActivityStatuses_TourDays_TourDayId",
                        column: x => x.TourDayId,
                        principalTable: "TourDays",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "BookingAccommodationDetails",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingActivityReservationId = table.Column<Guid>(type: "uuid", nullable: false),
                    SupplierId = table.Column<Guid>(type: "uuid", nullable: true),
                    AccommodationName = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    RoomType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    RoomCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    BedType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ContactPhone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CheckInAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CheckOutAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    BuyPrice = table.Column<decimal>(type: "numeric(18,2)", nullable: false, defaultValue: 0m),
                    TaxRate = table.Column<decimal>(type: "numeric(5,2)", nullable: false, defaultValue: 0m),
                    TotalBuyPrice = table.Column<decimal>(type: "numeric(18,2)", nullable: false, defaultValue: 0m),
                    IsTaxable = table.Column<bool>(type: "boolean", nullable: false),
                    ConfirmationCode = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    FileUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    SpecialRequest = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookingAccommodationDetails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BookingAccommodationDetails_BookingActivityReservations_Boo~",
                        column: x => x.BookingActivityReservationId,
                        principalTable: "BookingActivityReservations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BookingAccommodationDetails_Suppliers_SupplierId",
                        column: x => x.SupplierId,
                        principalTable: "Suppliers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "BookingTransportDetails",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingActivityReservationId = table.Column<Guid>(type: "uuid", nullable: false),
                    SupplierId = table.Column<Guid>(type: "uuid", nullable: true),
                    TransportType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DepartureAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ArrivalAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    TicketNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ETicketNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    SeatNumber = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    SeatCapacity = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    SeatClass = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    VehicleNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    BuyPrice = table.Column<decimal>(type: "numeric(18,2)", nullable: false, defaultValue: 0m),
                    TaxRate = table.Column<decimal>(type: "numeric(5,2)", nullable: false, defaultValue: 0m),
                    TotalBuyPrice = table.Column<decimal>(type: "numeric(18,2)", nullable: false, defaultValue: 0m),
                    IsTaxable = table.Column<bool>(type: "boolean", nullable: false),
                    FileUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    SpecialRequest = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookingTransportDetails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BookingTransportDetails_BookingActivityReservations_Booking~",
                        column: x => x.BookingActivityReservationId,
                        principalTable: "BookingActivityReservations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BookingTransportDetails_Suppliers_SupplierId",
                        column: x => x.SupplierId,
                        principalTable: "Suppliers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "TourDayActivityRouteTransports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingActivityReservationId = table.Column<Guid>(type: "uuid", nullable: false),
                    TourPlanRouteId = table.Column<Guid>(type: "uuid", nullable: false),
                    DriverId = table.Column<Guid>(type: "uuid", nullable: true),
                    VehicleId = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: true),
                    RejectionReason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourDayActivityRouteTransports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourDayActivityRouteTransports_BookingActivityReservations_~",
                        column: x => x.BookingActivityReservationId,
                        principalTable: "BookingActivityReservations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TourDayActivityRouteTransports_Drivers_DriverId",
                        column: x => x.DriverId,
                        principalTable: "Drivers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_TourDayActivityRouteTransports_TourPlanRoutes_TourPlanRoute~",
                        column: x => x.TourPlanRouteId,
                        principalTable: "TourPlanRoutes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TourDayActivityRouteTransports_Vehicles_VehicleId",
                        column: x => x.VehicleId,
                        principalTable: "Vehicles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Passports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingParticipantId = table.Column<Guid>(type: "uuid", nullable: false),
                    PassportNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Nationality = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    IssuedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    FileUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Passports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Passports_BookingParticipants_BookingParticipantId",
                        column: x => x.BookingParticipantId,
                        principalTable: "BookingParticipants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CustomerPayments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingId = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerDepositId = table.Column<Guid>(type: "uuid", nullable: true),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    PaymentMethod = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TransactionRef = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    PaidAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomerPayments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CustomerPayments_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CustomerPayments_CustomerDeposits_CustomerDepositId",
                        column: x => x.CustomerDepositId,
                        principalTable: "CustomerDeposits",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SupplierReceipts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SupplierPayableId = table.Column<Guid>(type: "uuid", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    PaidAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    PaymentMethod = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TransactionRef = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupplierReceipts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SupplierReceipts_SupplierPayables_SupplierPayableId",
                        column: x => x.SupplierPayableId,
                        principalTable: "SupplierPayables",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TourDayActivityGuides",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TourDayActivityStatusId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CheckInTime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CheckOutTime = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourDayActivityGuides", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourDayActivityGuides_TourDayActivityStatuses_TourDayActivi~",
                        column: x => x.TourDayActivityStatusId,
                        principalTable: "TourDayActivityStatuses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TourDayActivityGuides_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "GuestArrivals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingAccommodationDetailId = table.Column<Guid>(type: "uuid", nullable: false),
                    SubmittedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    SubmittedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    SubmissionStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CheckedInByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ActualCheckInAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CheckedOutByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ActualCheckOutAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GuestArrivals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GuestArrivals_BookingAccommodationDetails_BookingAccommodat~",
                        column: x => x.BookingAccommodationDetailId,
                        principalTable: "BookingAccommodationDetails",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RoomBlocks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SupplierId = table.Column<Guid>(type: "uuid", nullable: false),
                    RoomType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    BookingAccommodationDetailId = table.Column<Guid>(type: "uuid", nullable: true),
                    BookingId = table.Column<Guid>(type: "uuid", nullable: true),
                    TourInstanceDayActivityId = table.Column<Guid>(type: "uuid", nullable: true),
                    BlockedDate = table.Column<DateOnly>(type: "date", nullable: false),
                    RoomCountBlocked = table.Column<int>(type: "integer", nullable: false),
                    TourInstanceDayActivityEntityId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoomBlocks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RoomBlocks_BookingAccommodationDetails_BookingAccommodation~",
                        column: x => x.BookingAccommodationDetailId,
                        principalTable: "BookingAccommodationDetails",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_RoomBlocks_Suppliers_SupplierId",
                        column: x => x.SupplierId,
                        principalTable: "Suppliers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RoomBlocks_TourInstanceDayActivities_TourInstanceDayActivit~",
                        column: x => x.TourInstanceDayActivityEntityId,
                        principalTable: "TourInstanceDayActivities",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_RoomBlocks_TourInstanceDayActivities_TourInstanceDayActivi~1",
                        column: x => x.TourInstanceDayActivityId,
                        principalTable: "TourInstanceDayActivities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "VisaApplications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingParticipantId = table.Column<Guid>(type: "uuid", nullable: false),
                    PassportId = table.Column<Guid>(type: "uuid", nullable: false),
                    DestinationCountry = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    MinReturnDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    RefusalReason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    VisaFileUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VisaApplications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VisaApplications_BookingParticipants_BookingParticipantId",
                        column: x => x.BookingParticipantId,
                        principalTable: "BookingParticipants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VisaApplications_Passports_PassportId",
                        column: x => x.PassportId,
                        principalTable: "Passports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "GuestArrivalParticipants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GuestArrivalId = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingParticipantId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GuestArrivalParticipants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GuestArrivalParticipants_BookingParticipants_BookingPartici~",
                        column: x => x.BookingParticipantId,
                        principalTable: "BookingParticipants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GuestArrivalParticipants_GuestArrivals_GuestArrivalId",
                        column: x => x.GuestArrivalId,
                        principalTable: "GuestArrivals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Visas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VisaApplicationId = table.Column<Guid>(type: "uuid", nullable: false),
                    VisaNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Country = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    EntryType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    IssuedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    FileUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModifiedOnUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Visas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Visas_VisaApplications_VisaApplicationId",
                        column: x => x.VisaApplicationId,
                        principalTable: "VisaApplications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BookingAccommodationDetails_BookingActivityReservationId",
                table: "BookingAccommodationDetails",
                column: "BookingActivityReservationId");

            migrationBuilder.CreateIndex(
                name: "IX_BookingAccommodationDetails_Status",
                table: "BookingAccommodationDetails",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_BookingAccommodationDetails_SupplierId",
                table: "BookingAccommodationDetails",
                column: "SupplierId");

            migrationBuilder.CreateIndex(
                name: "IX_BookingActivityReservations_BookingId",
                table: "BookingActivityReservations",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_BookingActivityReservations_BookingId_Order",
                table: "BookingActivityReservations",
                columns: new[] { "BookingId", "Order" });

            migrationBuilder.CreateIndex(
                name: "IX_BookingActivityReservations_Status",
                table: "BookingActivityReservations",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_BookingActivityReservations_SupplierId",
                table: "BookingActivityReservations",
                column: "SupplierId");

            migrationBuilder.CreateIndex(
                name: "IX_BookingParticipants_BookingId",
                table: "BookingParticipants",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_BookingParticipants_ParticipantType",
                table: "BookingParticipants",
                column: "ParticipantType");

            migrationBuilder.CreateIndex(
                name: "IX_BookingParticipants_Status",
                table: "BookingParticipants",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_BookingDate",
                table: "Bookings",
                column: "BookingDate");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_Status",
                table: "Bookings",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_Status_TourInstanceId",
                table: "Bookings",
                columns: new[] { "Status", "TourInstanceId" });

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_Status_UserId",
                table: "Bookings",
                columns: new[] { "Status", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_TourInstanceId",
                table: "Bookings",
                column: "TourInstanceId");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_TourRequestId",
                table: "Bookings",
                column: "TourRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_UserId",
                table: "Bookings",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_UserId_TourInstanceId",
                table: "Bookings",
                columns: new[] { "UserId", "TourInstanceId" });

            migrationBuilder.CreateIndex(
                name: "IX_BookingTourGuides_BookingId",
                table: "BookingTourGuides",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_BookingTourGuides_BookingId_AssignedRole",
                table: "BookingTourGuides",
                columns: new[] { "BookingId", "AssignedRole" });

            migrationBuilder.CreateIndex(
                name: "IX_BookingTourGuides_UserId",
                table: "BookingTourGuides",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_BookingTransportDetails_BookingActivityReservationId",
                table: "BookingTransportDetails",
                column: "BookingActivityReservationId");

            migrationBuilder.CreateIndex(
                name: "IX_BookingTransportDetails_Status",
                table: "BookingTransportDetails",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_BookingTransportDetails_SupplierId",
                table: "BookingTransportDetails",
                column: "SupplierId");

            migrationBuilder.CreateIndex(
                name: "IX_CancellationPolicies_CreatedOnUtc",
                table: "CancellationPolicies",
                column: "CreatedOnUtc");

            migrationBuilder.CreateIndex(
                name: "IX_CancellationPolicies_PolicyCode",
                table: "CancellationPolicies",
                column: "PolicyCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CancellationPolicies_Status_IsDeleted",
                table: "CancellationPolicies",
                columns: new[] { "Status", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_CancellationPolicies_TourScope_Status_IsDeleted",
                table: "CancellationPolicies",
                columns: new[] { "TourScope", "Status", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_CustomerDeposits_BookingId",
                table: "CustomerDeposits",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerDeposits_BookingId_DepositOrder",
                table: "CustomerDeposits",
                columns: new[] { "BookingId", "DepositOrder" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CustomerDeposits_DueAt",
                table: "CustomerDeposits",
                column: "DueAt");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerDeposits_Status",
                table: "CustomerDeposits",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerPayments_BookingId",
                table: "CustomerPayments",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerPayments_CustomerDepositId",
                table: "CustomerPayments",
                column: "CustomerDepositId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerPayments_PaidAt",
                table: "CustomerPayments",
                column: "PaidAt");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerPayments_TransactionRef",
                table: "CustomerPayments",
                column: "TransactionRef");

            migrationBuilder.CreateIndex(
                name: "IX_Departments_IsDeleted",
                table: "Departments",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_Departments_ParentId",
                table: "Departments",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_DepositPolicies_IsActive",
                table: "DepositPolicies",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_DepositPolicies_IsDeleted",
                table: "DepositPolicies",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_DepositPolicies_TourScope",
                table: "DepositPolicies",
                column: "TourScope");

            migrationBuilder.CreateIndex(
                name: "IX_Drivers_IsActive",
                table: "Drivers",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Drivers_LicenseNumber",
                table: "Drivers",
                column: "LicenseNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Drivers_UserId",
                table: "Drivers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_FileMetadatas_IsDeleted",
                table: "FileMetadatas",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_FileMetadatas_LinkedEntityId",
                table: "FileMetadatas",
                column: "LinkedEntityId");

            migrationBuilder.CreateIndex(
                name: "IX_GuestArrivalParticipants_BookingParticipantId",
                table: "GuestArrivalParticipants",
                column: "BookingParticipantId");

            migrationBuilder.CreateIndex(
                name: "IX_GuestArrivalParticipants_GuestArrivalId_BookingParticipantId",
                table: "GuestArrivalParticipants",
                columns: new[] { "GuestArrivalId", "BookingParticipantId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GuestArrivals_BookingAccommodationDetailId",
                table: "GuestArrivals",
                column: "BookingAccommodationDetailId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_HotelRoomInventory_LocationArea",
                table: "HotelRoomInventory",
                column: "LocationArea");

            migrationBuilder.CreateIndex(
                name: "IX_HotelRoomInventory_OperatingCountries",
                table: "HotelRoomInventory",
                column: "OperatingCountries");

            migrationBuilder.CreateIndex(
                name: "IX_HotelRoomInventory_SupplierId",
                table: "HotelRoomInventory",
                column: "SupplierId");

            migrationBuilder.CreateIndex(
                name: "IX_HotelRoomInventory_SupplierId_RoomType",
                table: "HotelRoomInventory",
                columns: new[] { "SupplierId", "RoomType" });

            migrationBuilder.CreateIndex(
                name: "IX_LogErrors_CreatedOnUtc",
                table: "LogErrors",
                column: "CreatedOnUtc");

            migrationBuilder.CreateIndex(
                name: "IX_Mails_CreatedAt",
                table: "Mails",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Mails_Status",
                table: "Mails",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_ManagerBankAccounts_UserId",
                table: "ManagerBankAccounts",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ManagerBankAccounts_UserId_IsDefault",
                table: "ManagerBankAccounts",
                columns: new[] { "UserId", "IsDefault" },
                unique: true,
                filter: "\"IsDefault\" = true");

            migrationBuilder.CreateIndex(
                name: "IX_Otps_Email",
                table: "Otps",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Otps_ExpiryDate",
                table: "Otps",
                column: "ExpiryDate");

            migrationBuilder.CreateIndex(
                name: "IX_OutboxMessages_CreatedAt",
                table: "OutboxMessages",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_OutboxMessages_NextRetryAt",
                table: "OutboxMessages",
                column: "NextRetryAt");

            migrationBuilder.CreateIndex(
                name: "IX_OutboxMessages_Status",
                table: "OutboxMessages",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Passports_BookingParticipantId",
                table: "Passports",
                column: "BookingParticipantId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Passports_PassportNumber",
                table: "Passports",
                column: "PassportNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResetTokens_ExpiresAt",
                table: "PasswordResetTokens",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResetTokens_TokenHash",
                table: "PasswordResetTokens",
                column: "TokenHash");

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResetTokens_UserId",
                table: "PasswordResetTokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_BookingId",
                table: "Payments",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_PaidUser",
                table: "Payments",
                column: "PaidUser");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_TransactionId",
                table: "Payments",
                column: "TransactionId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_TransactionTimestamp",
                table: "Payments",
                column: "TransactionTimestamp");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransactions_BookingId",
                table: "PaymentTransactions",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransactions_ExternalTransactionId",
                table: "PaymentTransactions",
                column: "ExternalTransactionId",
                unique: true,
                filter: "\"ExternalTransactionId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransactions_PaidAt",
                table: "PaymentTransactions",
                column: "PaidAt");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransactions_PayOSOrderCode",
                table: "PaymentTransactions",
                column: "PayOSOrderCode");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransactions_ReferenceCode",
                table: "PaymentTransactions",
                column: "ReferenceCode",
                unique: true,
                filter: "\"ReferenceCode\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransactions_Status",
                table: "PaymentTransactions",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransactions_Status_PaidAt",
                table: "PaymentTransactions",
                columns: new[] { "Status", "PaidAt" });

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransactions_TransactionCode",
                table: "PaymentTransactions",
                column: "TransactionCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Positions_IsDeleted",
                table: "Positions",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_PricingPolicies_CreatedOnUtc",
                table: "PricingPolicies",
                column: "CreatedOnUtc");

            migrationBuilder.CreateIndex(
                name: "IX_PricingPolicies_IsDefault",
                table: "PricingPolicies",
                column: "IsDefault");

            migrationBuilder.CreateIndex(
                name: "IX_PricingPolicies_PolicyCode",
                table: "PricingPolicies",
                column: "PolicyCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PricingPolicies_Status_IsDeleted",
                table: "PricingPolicies",
                columns: new[] { "Status", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_ExpiresOnUtc",
                table: "RefreshTokens",
                column: "ExpiresOnUtc");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_Token",
                table: "RefreshTokens",
                column: "Token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_UserId",
                table: "RefreshTokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Registers_Email",
                table: "Registers",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Registers_Username",
                table: "Registers",
                column: "Username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_IsApproved_Rating",
                table: "Reviews",
                columns: new[] { "IsApproved", "Rating" });

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_TourId",
                table: "Reviews",
                column: "TourId");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_UserId_TourId",
                table: "Reviews",
                columns: new[] { "UserId", "TourId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Roles_Name",
                table: "Roles",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Roles_Status_IsDeleted",
                table: "Roles",
                columns: new[] { "Status", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_RoomBlocks_BookingAccommodationDetailId",
                table: "RoomBlocks",
                column: "BookingAccommodationDetailId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomBlocks_SupplierId_RoomType_BlockedDate",
                table: "RoomBlocks",
                columns: new[] { "SupplierId", "RoomType", "BlockedDate" });

            migrationBuilder.CreateIndex(
                name: "IX_RoomBlocks_TourInstanceDayActivityEntityId",
                table: "RoomBlocks",
                column: "TourInstanceDayActivityEntityId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomBlocks_TourInstanceDayActivityId",
                table: "RoomBlocks",
                column: "TourInstanceDayActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_RoomBlocks_TourInstanceDayActivityId_RoomType",
                table: "RoomBlocks",
                columns: new[] { "TourInstanceDayActivityId", "RoomType" },
                unique: true,
                filter: "\"TourInstanceDayActivityId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_site_contents_PageKey_ContentKey",
                table: "site_contents",
                columns: new[] { "PageKey", "ContentKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SupplierPayables_BookingId",
                table: "SupplierPayables",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_SupplierPayables_DueAt",
                table: "SupplierPayables",
                column: "DueAt");

            migrationBuilder.CreateIndex(
                name: "IX_SupplierPayables_Status",
                table: "SupplierPayables",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_SupplierPayables_SupplierId",
                table: "SupplierPayables",
                column: "SupplierId");

            migrationBuilder.CreateIndex(
                name: "IX_SupplierReceipts_PaidAt",
                table: "SupplierReceipts",
                column: "PaidAt");

            migrationBuilder.CreateIndex(
                name: "IX_SupplierReceipts_SupplierPayableId",
                table: "SupplierReceipts",
                column: "SupplierPayableId");

            migrationBuilder.CreateIndex(
                name: "IX_Suppliers_IsActive",
                table: "Suppliers",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Suppliers_IsDeleted",
                table: "Suppliers",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_Suppliers_OwnerUserId",
                table: "Suppliers",
                column: "OwnerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Suppliers_SupplierCode",
                table: "Suppliers",
                column: "SupplierCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Suppliers_SupplierType",
                table: "Suppliers",
                column: "SupplierType");

            migrationBuilder.CreateIndex(
                name: "IX_SystemKeys_CodeKey",
                table: "SystemKeys",
                column: "CodeKey");

            migrationBuilder.CreateIndex(
                name: "IX_SystemKeys_ParentId_IsDeleted",
                table: "SystemKeys",
                columns: new[] { "ParentId", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_TaxConfigs_EffectiveDate",
                table: "TaxConfigs",
                column: "EffectiveDate");

            migrationBuilder.CreateIndex(
                name: "IX_TaxConfigs_IsActive",
                table: "TaxConfigs",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_tour_manager_assignment_AssignedEntityType",
                table: "tour_manager_assignment",
                column: "AssignedEntityType");

            migrationBuilder.CreateIndex(
                name: "IX_tour_manager_assignment_AssignedTourId",
                table: "tour_manager_assignment",
                column: "AssignedTourId");

            migrationBuilder.CreateIndex(
                name: "IX_tour_manager_assignment_AssignedUserId",
                table: "tour_manager_assignment",
                column: "AssignedUserId");

            migrationBuilder.CreateIndex(
                name: "IX_tour_manager_assignment_TourManagerId",
                table: "tour_manager_assignment",
                column: "TourManagerId");

            migrationBuilder.CreateIndex(
                name: "IX_TourClassifications_TourId",
                table: "TourClassifications",
                column: "TourId");

            migrationBuilder.CreateIndex(
                name: "IX_TourDayActivities_TourDayId",
                table: "TourDayActivities",
                column: "TourDayId");

            migrationBuilder.CreateIndex(
                name: "IX_TourDayActivityGuides_TourDayActivityStatusId",
                table: "TourDayActivityGuides",
                column: "TourDayActivityStatusId");

            migrationBuilder.CreateIndex(
                name: "IX_TourDayActivityGuides_UserId",
                table: "TourDayActivityGuides",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_TourDayActivityResourceLinks_TourDayActivityId",
                table: "TourDayActivityResourceLinks",
                column: "TourDayActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_TourDayActivityRouteTransports_BookingActivityReservationId~",
                table: "TourDayActivityRouteTransports",
                columns: new[] { "BookingActivityReservationId", "TourPlanRouteId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TourDayActivityRouteTransports_DriverId",
                table: "TourDayActivityRouteTransports",
                column: "DriverId");

            migrationBuilder.CreateIndex(
                name: "IX_TourDayActivityRouteTransports_Status",
                table: "TourDayActivityRouteTransports",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_TourDayActivityRouteTransports_TourPlanRouteId",
                table: "TourDayActivityRouteTransports",
                column: "TourPlanRouteId");

            migrationBuilder.CreateIndex(
                name: "IX_TourDayActivityRouteTransports_VehicleId",
                table: "TourDayActivityRouteTransports",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_TourDayActivityStatuses_BookingId",
                table: "TourDayActivityStatuses",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_TourDayActivityStatuses_BookingId_TourDayId",
                table: "TourDayActivityStatuses",
                columns: new[] { "BookingId", "TourDayId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TourDayActivityStatuses_TourDayId",
                table: "TourDayActivityStatuses",
                column: "TourDayId");

            migrationBuilder.CreateIndex(
                name: "IX_TourDays_ClassificationId",
                table: "TourDays",
                column: "ClassificationId");

            migrationBuilder.CreateIndex(
                name: "IX_TourImages_TourId",
                table: "TourImages",
                column: "TourId");

            migrationBuilder.CreateIndex(
                name: "IX_TourInstanceDayActivities_TourInstanceDayId",
                table: "TourInstanceDayActivities",
                column: "TourInstanceDayId");

            migrationBuilder.CreateIndex(
                name: "IX_TourInstanceDays_TourDayId",
                table: "TourInstanceDays",
                column: "TourDayId");

            migrationBuilder.CreateIndex(
                name: "IX_TourInstanceDays_TourInstanceId",
                table: "TourInstanceDays",
                column: "TourInstanceId");

            migrationBuilder.CreateIndex(
                name: "IX_TourInstanceDays_TourInstanceId_InstanceDayNumber",
                table: "TourInstanceDays",
                columns: new[] { "TourInstanceId", "InstanceDayNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TourInstanceImages_TourInstanceId",
                table: "TourInstanceImages",
                column: "TourInstanceId");

            migrationBuilder.CreateIndex(
                name: "IX_TourInstanceManagers_TourInstanceId",
                table: "TourInstanceManagers",
                column: "TourInstanceId");

            migrationBuilder.CreateIndex(
                name: "IX_TourInstanceManagers_TourInstanceId_UserId_Role",
                table: "TourInstanceManagers",
                columns: new[] { "TourInstanceId", "UserId", "Role" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TourInstanceManagers_UserId",
                table: "TourInstanceManagers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_TourInstancePlanAccommodations_TourInstanceDayActivityId",
                table: "TourInstancePlanAccommodations",
                column: "TourInstanceDayActivityId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TourInstancePlanRoutes_DriverId",
                table: "TourInstancePlanRoutes",
                column: "DriverId");

            migrationBuilder.CreateIndex(
                name: "IX_TourInstancePlanRoutes_TourInstanceDayActivityId",
                table: "TourInstancePlanRoutes",
                column: "TourInstanceDayActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_TourInstancePlanRoutes_VehicleId",
                table: "TourInstancePlanRoutes",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_TourInstances_BasePrice",
                table: "TourInstances",
                column: "BasePrice");

            migrationBuilder.CreateIndex(
                name: "IX_TourInstances_ClassificationId",
                table: "TourInstances",
                column: "ClassificationId");

            migrationBuilder.CreateIndex(
                name: "IX_TourInstances_HotelProviderId",
                table: "TourInstances",
                column: "HotelProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_TourInstances_IsDeleted",
                table: "TourInstances",
                column: "IsDeleted",
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_TourInstances_IsDeleted_InstanceType_Status_StartDate",
                table: "TourInstances",
                columns: new[] { "IsDeleted", "InstanceType", "Status", "StartDate" },
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_TourInstances_TourId",
                table: "TourInstances",
                column: "TourId");

            migrationBuilder.CreateIndex(
                name: "IX_TourInstances_TourInstanceCode",
                table: "TourInstances",
                column: "TourInstanceCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TourInstances_TransportProviderId",
                table: "TourInstances",
                column: "TransportProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_TourInsurances_TourClassificationId",
                table: "TourInsurances",
                column: "TourClassificationId");

            migrationBuilder.CreateIndex(
                name: "IX_TourPlanAccommodations_TourDayActivityId",
                table: "TourPlanAccommodations",
                column: "TourDayActivityId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TourPlanLocations_City_Country",
                table: "TourPlanLocations",
                columns: new[] { "City", "Country" });

            migrationBuilder.CreateIndex(
                name: "IX_TourPlanLocations_LocationType",
                table: "TourPlanLocations",
                column: "LocationType");

            migrationBuilder.CreateIndex(
                name: "IX_TourPlanLocations_TourDayActivityId",
                table: "TourPlanLocations",
                column: "TourDayActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_TourPlanLocations_TourEntityId",
                table: "TourPlanLocations",
                column: "TourEntityId");

            migrationBuilder.CreateIndex(
                name: "IX_TourPlanLocations_TourId",
                table: "TourPlanLocations",
                column: "TourId");

            migrationBuilder.CreateIndex(
                name: "IX_TourPlanRoutes_FromLocationId",
                table: "TourPlanRoutes",
                column: "FromLocationId");

            migrationBuilder.CreateIndex(
                name: "IX_TourPlanRoutes_ToLocationId",
                table: "TourPlanRoutes",
                column: "ToLocationId");

            migrationBuilder.CreateIndex(
                name: "IX_TourPlanRoutes_TourDayActivityEntityId",
                table: "TourPlanRoutes",
                column: "TourDayActivityEntityId");

            migrationBuilder.CreateIndex(
                name: "IX_TourPlanRoutes_TourDayActivityId",
                table: "TourPlanRoutes",
                column: "TourDayActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_TourRequests_DepartureDate",
                table: "TourRequests",
                column: "DepartureDate");

            migrationBuilder.CreateIndex(
                name: "IX_TourRequests_ReviewedBy",
                table: "TourRequests",
                column: "ReviewedBy");

            migrationBuilder.CreateIndex(
                name: "IX_TourRequests_Status",
                table: "TourRequests",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_TourRequests_Status_DepartureDate",
                table: "TourRequests",
                columns: new[] { "Status", "DepartureDate" });

            migrationBuilder.CreateIndex(
                name: "IX_TourRequests_TourInstanceId",
                table: "TourRequests",
                column: "TourInstanceId");

            migrationBuilder.CreateIndex(
                name: "IX_TourRequests_UserId",
                table: "TourRequests",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_TourResources_FromLocationId",
                table: "TourResources",
                column: "FromLocationId");

            migrationBuilder.CreateIndex(
                name: "IX_TourResources_ToLocationId",
                table: "TourResources",
                column: "ToLocationId");

            migrationBuilder.CreateIndex(
                name: "IX_TourResources_TourId",
                table: "TourResources",
                column: "TourId");

            migrationBuilder.CreateIndex(
                name: "IX_TourResources_Type",
                table: "TourResources",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_Tours_CancellationPolicyId",
                table: "Tours",
                column: "CancellationPolicyId");

            migrationBuilder.CreateIndex(
                name: "IX_Tours_CreatedOnUtc",
                table: "Tours",
                column: "CreatedOnUtc");

            migrationBuilder.CreateIndex(
                name: "IX_Tours_DepositPolicyId",
                table: "Tours",
                column: "DepositPolicyId");

            migrationBuilder.CreateIndex(
                name: "IX_Tours_IsDeleted",
                table: "Tours",
                column: "IsDeleted",
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_Tours_PricingPolicyId",
                table: "Tours",
                column: "PricingPolicyId");

            migrationBuilder.CreateIndex(
                name: "IX_Tours_Status_IsDeleted",
                table: "Tours",
                columns: new[] { "Status", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_Tours_TourCode",
                table: "Tours",
                column: "TourCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tours_TourDesignerId",
                table: "Tours",
                column: "TourDesignerId");

            migrationBuilder.CreateIndex(
                name: "IX_Tours_VisaPolicyId",
                table: "Tours",
                column: "VisaPolicyId");

            migrationBuilder.CreateIndex(
                name: "IX_UserRoles_RoleId",
                table: "UserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_CreatedOnUtc",
                table: "Users",
                column: "CreatedOnUtc");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_GoogleId",
                table: "Users",
                column: "GoogleId",
                unique: true,
                filter: "\"GoogleId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Users_IsDeleted",
                table: "Users",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Username",
                table: "Users",
                column: "Username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserSettings_UserId",
                table: "UserSettings",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_IsDeleted",
                table: "Vehicles",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_LocationArea",
                table: "Vehicles",
                column: "LocationArea");

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_OperatingCountries",
                table: "Vehicles",
                column: "OperatingCountries");

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_OwnerId",
                table: "Vehicles",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_VehiclePlate",
                table: "Vehicles",
                column: "VehiclePlate",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VisaApplications_BookingParticipantId",
                table: "VisaApplications",
                column: "BookingParticipantId");

            migrationBuilder.CreateIndex(
                name: "IX_VisaApplications_PassportId",
                table: "VisaApplications",
                column: "PassportId");

            migrationBuilder.CreateIndex(
                name: "IX_VisaApplications_Status",
                table: "VisaApplications",
                column: "Status");

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

            migrationBuilder.CreateIndex(
                name: "IX_Visas_Status",
                table: "Visas",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Visas_VisaApplicationId",
                table: "Visas",
                column: "VisaApplicationId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BookingTourGuides");

            migrationBuilder.DropTable(
                name: "BookingTransportDetails");

            migrationBuilder.DropTable(
                name: "CustomerPayments");

            migrationBuilder.DropTable(
                name: "Departments");

            migrationBuilder.DropTable(
                name: "FileMetadatas");

            migrationBuilder.DropTable(
                name: "GuestArrivalParticipants");

            migrationBuilder.DropTable(
                name: "HotelRoomInventory");

            migrationBuilder.DropTable(
                name: "LogErrors");

            migrationBuilder.DropTable(
                name: "Mails");

            migrationBuilder.DropTable(
                name: "ManagerBankAccounts");

            migrationBuilder.DropTable(
                name: "Otps");

            migrationBuilder.DropTable(
                name: "OutboxMessages");

            migrationBuilder.DropTable(
                name: "PasswordResetTokens");

            migrationBuilder.DropTable(
                name: "Payments");

            migrationBuilder.DropTable(
                name: "PaymentTransactions");

            migrationBuilder.DropTable(
                name: "Positions");

            migrationBuilder.DropTable(
                name: "RefreshTokens");

            migrationBuilder.DropTable(
                name: "Registers");

            migrationBuilder.DropTable(
                name: "Reviews");

            migrationBuilder.DropTable(
                name: "RoomBlocks");

            migrationBuilder.DropTable(
                name: "site_contents");

            migrationBuilder.DropTable(
                name: "SupplierReceipts");

            migrationBuilder.DropTable(
                name: "SystemKeys");

            migrationBuilder.DropTable(
                name: "TaxConfigs");

            migrationBuilder.DropTable(
                name: "tour_manager_assignment");

            migrationBuilder.DropTable(
                name: "TourDayActivityGuides");

            migrationBuilder.DropTable(
                name: "TourDayActivityResourceLinks");

            migrationBuilder.DropTable(
                name: "TourDayActivityRouteTransports");

            migrationBuilder.DropTable(
                name: "TourImages");

            migrationBuilder.DropTable(
                name: "TourInstanceImages");

            migrationBuilder.DropTable(
                name: "TourInstanceManagers");

            migrationBuilder.DropTable(
                name: "TourInstancePlanAccommodations");

            migrationBuilder.DropTable(
                name: "TourInstancePlanRoutes");

            migrationBuilder.DropTable(
                name: "TourInsurances");

            migrationBuilder.DropTable(
                name: "TourPlanAccommodations");

            migrationBuilder.DropTable(
                name: "TourResources");

            migrationBuilder.DropTable(
                name: "UserRoles");

            migrationBuilder.DropTable(
                name: "UserSettings");

            migrationBuilder.DropTable(
                name: "Visas");

            migrationBuilder.DropTable(
                name: "CustomerDeposits");

            migrationBuilder.DropTable(
                name: "GuestArrivals");

            migrationBuilder.DropTable(
                name: "SupplierPayables");

            migrationBuilder.DropTable(
                name: "TourDayActivityStatuses");

            migrationBuilder.DropTable(
                name: "TourPlanRoutes");

            migrationBuilder.DropTable(
                name: "Drivers");

            migrationBuilder.DropTable(
                name: "TourInstanceDayActivities");

            migrationBuilder.DropTable(
                name: "Vehicles");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropTable(
                name: "VisaApplications");

            migrationBuilder.DropTable(
                name: "BookingAccommodationDetails");

            migrationBuilder.DropTable(
                name: "TourPlanLocations");

            migrationBuilder.DropTable(
                name: "TourInstanceDays");

            migrationBuilder.DropTable(
                name: "Passports");

            migrationBuilder.DropTable(
                name: "BookingActivityReservations");

            migrationBuilder.DropTable(
                name: "TourDayActivities");

            migrationBuilder.DropTable(
                name: "BookingParticipants");

            migrationBuilder.DropTable(
                name: "TourDays");

            migrationBuilder.DropTable(
                name: "Bookings");

            migrationBuilder.DropTable(
                name: "TourRequests");

            migrationBuilder.DropTable(
                name: "TourInstances");

            migrationBuilder.DropTable(
                name: "Suppliers");

            migrationBuilder.DropTable(
                name: "TourClassifications");

            migrationBuilder.DropTable(
                name: "Tours");

            migrationBuilder.DropTable(
                name: "CancellationPolicies");

            migrationBuilder.DropTable(
                name: "DepositPolicies");

            migrationBuilder.DropTable(
                name: "PricingPolicies");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "VisaPolicies");
        }
    }
}
