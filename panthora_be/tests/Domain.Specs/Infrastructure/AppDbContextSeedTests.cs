using System.Reflection;
using System.Text.Json;
using global::Domain.Entities;
using global::Domain.Enums;
using FluentAssertions;
using global::Infrastructure.Data;
using global::Infrastructure.Data.Seed;
using Microsoft.EntityFrameworkCore;

namespace Domain.Specs.Infrastructure;

public sealed class AppDbContextSeedTests
{
    [Fact]
    public void SeedAppendTable_WhenSeedContainsExistingPrimaryKeys_ShouldSkipDuplicates()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);
        var existingSupplierId = Guid.Parse("019527d1-0000-7000-8000-000000000001");
        var newSupplierId = Guid.Parse("019527d1-0000-7000-8000-000000000002");
        var timestamp = DateTimeOffset.Parse("2026-04-05T00:00:00Z");

        context.Suppliers.Add(new SupplierEntity
        {
            Id = existingSupplierId,
            SupplierCode = "SUP-HTL-001",
            SupplierType = SupplierType.Accommodation,
            Name = "Lan Rung Hotel",
            Phone = "0903001001",
            Email = "booking@lanrunghotel.vn",
            Address = "78 Hung Vuong, Da Nang",
            Note = "Existing supplier",
            IsActive = true,
            IsDeleted = false,
            CreatedBy = "system",
            CreatedOnUtc = timestamp,
            LastModifiedBy = "system",
            LastModifiedOnUtc = timestamp
        });
        context.SaveChanges();

        var fileName = $"supplier-append-test-{Guid.NewGuid():N}.json";
        var seedDirectory = Path.Combine(AppContext.BaseDirectory, "Data", "Seed", "Seeddata");
        Directory.CreateDirectory(seedDirectory);
        var seedFilePath = Path.Combine(seedDirectory, fileName);

        File.WriteAllText(
            seedFilePath,
            JsonSerializer.Serialize(new object[]
            {
                new
                {
                    Id = existingSupplierId,
                    SupplierCode = "SUP-HTL-001",
                    SupplierType = SupplierType.Accommodation,
                    Name = "Lan Rung Hotel",
                    TaxCode = "1122334455",
                    Phone = "0903001001",
                    Email = "booking@lanrunghotel.vn",
                    Address = "78 Hung Vuong, Da Nang",
                    Note = "Existing supplier",
                    IsActive = true,
                    IsDeleted = false,
                    CreatedBy = "system",
                    CreatedOnUtc = timestamp,
                    LastModifiedBy = "system",
                    LastModifiedOnUtc = timestamp
                },
                new
                {
                    Id = newSupplierId,
                    SupplierCode = "SUP-HTL-002",
                    SupplierType = SupplierType.Accommodation,
                    Name = "Mai Garden Resort",
                    TaxCode = "5544332211",
                    Phone = "0903002002",
                    Email = "reservation@maigardenresort.vn",
                    Address = "12 Duong Bien, Nha Trang",
                    Note = "New supplier",
                    IsActive = true,
                    IsDeleted = false,
                    CreatedBy = "system",
                    CreatedOnUtc = timestamp,
                    LastModifiedBy = "system",
                    LastModifiedOnUtc = timestamp
                }
            }));

        try
        {
            var seedMethod = typeof(AppDbContextSeed)
                .GetMethod("SeedAppendTable", BindingFlags.NonPublic | BindingFlags.Static);

            seedMethod.Should().NotBeNull();

            var seedAppendTable = seedMethod!.MakeGenericMethod(typeof(SupplierEntity));

            var firstSeedResult = (bool)seedAppendTable.Invoke(null, [context, fileName, context.Suppliers])!;
            var suppliersAfterFirstSeed = context.Suppliers
                .AsNoTracking()
                .OrderBy(supplier => supplier.SupplierCode)
                .ToList();

            firstSeedResult.Should().BeTrue();
            suppliersAfterFirstSeed.Should().HaveCount(2);
            suppliersAfterFirstSeed.Count(supplier => supplier.Id == existingSupplierId).Should().Be(1);
            suppliersAfterFirstSeed.Should().ContainSingle(supplier => supplier.Id == newSupplierId);

            var secondSeedResult = (bool)seedAppendTable.Invoke(null, [context, fileName, context.Suppliers])!;
            var suppliersAfterSecondSeed = context.Suppliers
                .AsNoTracking()
                .ToList();

            secondSeedResult.Should().BeFalse();
            suppliersAfterSecondSeed.Should().HaveCount(2);
        }
        finally
        {
            if (File.Exists(seedFilePath))
            {
                File.Delete(seedFilePath);
            }
        }
    }
}
