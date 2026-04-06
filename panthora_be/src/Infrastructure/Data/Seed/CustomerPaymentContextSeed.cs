using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data.Seed;

public static class CustomerPaymentContextSeed
{
    public static void SeedData(DbSet<CustomerPaymentEntity> customerpaymentCollection)
    {
        if (customerpaymentCollection.Any())
        {
            return;
        }

        var items = SeedDataLoader.LoadData<CustomerPaymentEntity>("customer-payment.json");

        if (items is { Count: > 0 })
        {
            customerpaymentCollection.AddRange(items);
        }
    }
}
