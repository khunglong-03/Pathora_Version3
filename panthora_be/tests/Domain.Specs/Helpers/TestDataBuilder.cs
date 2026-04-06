using System.Collections.Generic;
using Domain.Entities;
using Domain.Enums;
using Domain.ValueObjects;

namespace Domain.Specs.Helpers;

/// <summary>
/// Builder for creating test entities with sensible defaults
/// </summary>
public class TestDataBuilder
{
    public static DepositPolicyEntity CreateDepositPolicy(
        TourScope tourScope = TourScope.Domestic,
        DepositType depositType = DepositType.Percentage,
        decimal depositValue = 10,
        int minDays = 7)
    {
        if (depositValue <= 0)
            throw new ArgumentOutOfRangeException(nameof(depositValue));
        if (depositType == DepositType.Percentage && depositValue > 100)
            throw new ArgumentOutOfRangeException(nameof(depositValue));
        if (minDays < 0)
            throw new ArgumentOutOfRangeException(nameof(minDays));

        return DepositPolicyEntity.Create(
            tourScope: tourScope,
            depositType: depositType,
            depositValue: depositValue,
            minDaysBeforeDeparture: minDays,
            performedBy: "test"
        );
    }

    public static TaxConfigEntity CreateTaxConfig(
        string taxName = "VAT",
        decimal taxRate = 10)
    {
        return TaxConfigEntity.Create(
            taxName: taxName,
            taxRate: taxRate,
            description: "Test tax",
            effectiveDate: DateTimeOffset.UtcNow.AddDays(30),
            performedBy: "test"
        );
    }

    public static VisaPolicyEntity CreateVisaPolicy(
        string region = "Southeast Asia",
        int processingDays = 30,
        int bufferDays = 7)
    {
        return VisaPolicyEntity.Create(
            region: region,
            processingDays: processingDays,
            bufferDays: bufferDays,
            fullPaymentRequired: false,
            performedBy: "test"
        );
    }

    public static CancellationPolicyEntity CreateCancellationPolicy(
        TourScope tourScope = TourScope.Domestic,
        int minDays = 0,
        int maxDays = 7,
        decimal penaltyPercentage = 10)
    {
        var tier = new CancellationPolicyTier(minDays, maxDays, penaltyPercentage);
        return CancellationPolicyEntity.Create(
            tourScope,
            new List<CancellationPolicyTier> { tier },
            "test"
        );
    }
}
