using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data.Seed;

public static class CustomerDepositContextSeed
{
    public static void SeedData(DbSet<CustomerDepositEntity> customerdepositCollection)
    {
        if (customerdepositCollection.Any())
        {
            return;
        }

        var items = SeedDataLoader.LoadData<CustomerDepositEntity>("customer-deposit.json");

        if (items is { Count: > 0 })
        {
            customerdepositCollection.AddRange(items);
        }
    }
}
