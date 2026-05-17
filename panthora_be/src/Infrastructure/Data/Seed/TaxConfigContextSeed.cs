using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data.Seed;

/// <summary>
/// Seed TaxConfig mặc định nếu chưa có row nào IsActive.
/// Đảm bảo môi trường mới luôn có tax config để tính thuế.
/// </summary>
public static class TaxConfigContextSeed
{
    public static async Task SeedAsync(AppDbContext db, CancellationToken cancellationToken = default)
    {
        if (await db.TaxConfigs.AnyAsync(t => t.IsActive, cancellationToken))
        {
            return;
        }

        db.TaxConfigs.Add(TaxConfigEntity.Create(
            taxName: "Default VAT",
            taxRate: 8m,
            description: "Default VAT 8%",
            effectiveDate: DateTimeOffset.UtcNow,
            performedBy: "system"));

        await db.SaveChangesAsync(cancellationToken);
    }
}
