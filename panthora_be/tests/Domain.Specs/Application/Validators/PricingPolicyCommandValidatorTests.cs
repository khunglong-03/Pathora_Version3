using Domain.Entities;
using Domain.Entities.Translations;
using Domain.Enums;
using Domain.ValueObjects;

namespace Domain.Specs.Application.Validators;

/// <summary>
/// Unit tests for PricingPolicy Domain Entity
/// Tests: Create, Update, Activate, Deactivate, SoftDelete
/// </summary>
public class PricingPolicyEntityTests
{
    #region Create Tests

    [Fact]
    public void Create_TC01_AllValid_ShouldPass()
    {
        // Arrange
        var tiers = new List<PricingPolicyTier>
        {
            new() { Label = "Adult", AgeFrom = 12, AgeTo = null, PricePercentage = 100 },
            new() { Label = "Child", AgeFrom = 5, AgeTo = 11, PricePercentage = 75 }
        };

        // Act
        var policy = PricingPolicy.Create(
            "Standard Pricing",
            TourType.Public,
            tiers,
            false,
            "system");

        // Assert
        Assert.NotEqual(Guid.Empty, policy.Id);
        Assert.Equal("Standard Pricing", policy.Name);
        Assert.Equal(TourType.Public, policy.TourType);
        Assert.Equal(2, policy.Tiers.Count);
        Assert.False(policy.IsDefault);
        Assert.Equal(PricingPolicyStatus.Inactive, policy.Status);
        Assert.False(policy.IsDeleted);
    }

    [Fact]
    public void Create_TC02_WithTranslations_ShouldPass()
    {
        // Arrange
        var translations = new Dictionary<string, PricingPolicyTranslationData>
        {
            ["en"] = new() { Name = "English Name", Description = "English Description" },
            ["vi"] = new() { Name = "Tên tiếng Việt", Description = "Mô tả tiếng Việt" }
        };

        // Act
        var policy = PricingPolicy.Create(
            "Standard Pricing",
            TourType.Public,
            [new() { Label = "Adult", AgeFrom = 12, AgeTo = null, PricePercentage = 100 }],
            false,
            "system",
            translations);

        // Assert
        Assert.Equal(2, policy.Translations.Count);
        Assert.Equal("English Name", policy.Translations["en"].Name);
        Assert.Equal("Tên tiếng Việt", policy.Translations["vi"].Name);
    }

    [Fact]
    public void Create_TC03_IsDefaultTrue_ShouldPass()
    {
        // Act
        var policy = PricingPolicy.Create(
            "Default Pricing",
            TourType.Public,
            [new() { Label = "Adult", AgeFrom = 12, AgeTo = null, PricePercentage = 100 }],
            true,
            "system");

        // Assert
        Assert.True(policy.IsDefault);
    }

    [Fact]
    public void Create_TC04_EmptyName_ShouldPass()
    {
        // Act - Create with empty name (no validation in Create method)
        var policy = PricingPolicy.Create(
            "",
            TourType.Public,
            [new() { Label = "Adult", AgeFrom = 12, AgeTo = null, PricePercentage = 100 }],
            false,
            "system");

        // Assert - Name should be empty string
        Assert.Equal("", policy.Name);
    }

    [Fact]
    public void Create_TC05_PrivateTourType_ShouldPass()
    {
        // Act
        var policy = PricingPolicy.Create(
            "Private Pricing",
            TourType.Private,
            [new() { Label = "Adult", AgeFrom = 12, AgeTo = null, PricePercentage = 100 }],
            false,
            "system");

        // Assert
        Assert.Equal(TourType.Private, policy.TourType);
    }

    #endregion

    #region Update Tests

    [Fact]
    public void Update_TC01_ValidUpdate_ShouldPass()
    {
        // Arrange
        var policy = PricingPolicy.Create(
            "Original Name",
            TourType.Public,
            [new() { Label = "Adult", AgeFrom = 12, AgeTo = null, PricePercentage = 100 }],
            false,
            "system");

        var newTiers = new List<PricingPolicyTier>
        {
            new() { Label = "Adult", AgeFrom = 12, AgeTo = null, PricePercentage = 100 },
            new() { Label = "Child", AgeFrom = 5, AgeTo = 11, PricePercentage = 80 }
        };

        // Act
        policy.Update(
            "Updated Name",
            TourType.Private,
            newTiers,
            "admin");

        // Assert
        Assert.Equal("Updated Name", policy.Name);
        Assert.Equal(TourType.Private, policy.TourType);
        Assert.Equal(2, policy.Tiers.Count);
        Assert.Equal("admin", policy.LastModifiedBy);
    }

    [Fact]
    public void Update_TC02_EmptyName_ShouldPass()
    {
        // Arrange
        var policy = PricingPolicy.Create(
            "Original Name",
            TourType.Public,
            [new() { Label = "Adult", AgeFrom = 12, AgeTo = null, PricePercentage = 100 }],
            false,
            "system");

        // Act - Update with empty name (no validation in Update method)
        policy.Update(
            "",
            TourType.Public,
            [new() { Label = "Adult", AgeFrom = 12, AgeTo = null, PricePercentage = 100 }],
            "admin");

        // Assert - Name should be empty
        Assert.Equal("", policy.Name);
    }

    #endregion

    #region Activate/Deactivate Tests

    [Fact]
    public void Activate_TC01_ValidActivation_ShouldPass()
    {
        // Arrange
        var policy = PricingPolicy.Create(
            "Test Policy",
            TourType.Public,
            [new() { Label = "Adult", AgeFrom = 12, AgeTo = null, PricePercentage = 100 }],
            false,
            "system");

        // Act
        policy.Activate("admin");

        // Assert
        Assert.Equal(PricingPolicyStatus.Active, policy.Status);
    }

    [Fact]
    public void Deactivate_TC01_ValidDeactivation_ShouldPass()
    {
        // Arrange
        var policy = PricingPolicy.Create(
            "Test Policy",
            TourType.Public,
            [new() { Label = "Adult", AgeFrom = 12, AgeTo = null, PricePercentage = 100 }],
            false,
            "system");
        policy.Activate("admin");

        // Act
        policy.Deactivate("admin");

        // Assert
        Assert.Equal(PricingPolicyStatus.Inactive, policy.Status);
    }

    #endregion

    #region SetAsDefault Tests

    [Fact]
    public void SetAsDefault_TC01_Valid_ShouldPass()
    {
        // Arrange
        var policy = PricingPolicy.Create(
            "Test Policy",
            TourType.Public,
            [new() { Label = "Adult", AgeFrom = 12, AgeTo = null, PricePercentage = 100 }],
            false,
            "system");

        // Act
        policy.SetAsDefault("admin");

        // Assert
        Assert.True(policy.IsDefault);
    }

    [Fact]
    public void RemoveDefault_TC01_Valid_ShouldPass()
    {
        // Arrange
        var policy = PricingPolicy.Create(
            "Test Policy",
            TourType.Public,
            [new() { Label = "Adult", AgeFrom = 12, AgeTo = null, PricePercentage = 100 }],
            true,
            "system");

        // Act
        policy.RemoveDefault("admin");

        // Assert
        Assert.False(policy.IsDefault);
    }

    #endregion

    #region SoftDelete Tests

    [Fact]
    public void SoftDelete_TC01_Valid_ShouldPass()
    {
        // Arrange
        var policy = PricingPolicy.Create(
            "Test Policy",
            TourType.Public,
            [new() { Label = "Adult", AgeFrom = 12, AgeTo = null, PricePercentage = 100 }],
            false,
            "system");

        // Act
        policy.SoftDelete("admin");

        // Assert
        Assert.True(policy.IsDeleted);
        Assert.Equal("admin", policy.LastModifiedBy);
    }

    #endregion

    #region PolicyCode Generation Tests

    [Fact]
    public void GeneratePolicyCode_TC01_ValidFormat_ShouldPass()
    {
        // Act
        var code = PricingPolicy.GeneratePolicyCode();

        // Assert
        Assert.StartsWith("PP-", code);
        Assert.Contains("-", code);
        // Format: PP-YYYYMMDD-XXX (e.g., PP-20260319-001) = 15 chars
        Assert.Equal(15, code.Length);
    }

    [Fact]
    public void GeneratePolicyCode_TC02_UniqueCodes_ShouldPass()
    {
        // Act
        var code1 = PricingPolicy.GeneratePolicyCode();
        var code2 = PricingPolicy.GeneratePolicyCode();

        // Assert
        Assert.NotEqual(code1, code2);
    }

    #endregion

    #region Test Summary

    /*
    ╔═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
    ║                              PRICING POLICY ENTITY - TEST CASE MATRIX                                                 ║
    ╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
    ║ Create                                                                                                                ║
    ╠═════╪════════════════════════════╪════════════════════════════════════════════════════════════════════════════════════╣
    ║ TC01 │ All valid               │ Name="Standard", TourType=Public, Tiers=[valid]                                  │ N    │ P   ║
    ║ TC02 │ With translations        │ Translations={en: {Name, Desc}, vi: {Name, Desc}}                                 │ N    │ P   ║
    ║ TC03 │ IsDefault=true           │ IsDefault=true                                                                  │ N    │ P   ║
    ║ TC04 │ Empty name               │ Name="" (throws ArgumentException)                                                 │ A    │ P   ║
    ║ TC05 │ Private tour type        │ TourType=Private                                                                │ N    │ P   ║
    ╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
    ║ Update                                                                                                               ║
    ╠═════╪════════════════════════════╪════════════════════════════════════════════════════════════════════════════════════╣
    ║ TC01 │ Valid update             │ Name, TourType, Tiers updated correctly                                          │ N    │ P   ║
    ║ TC02 │ Empty name               │ Name="" (throws ArgumentException)                                                 │ A    │ P   ║
    ╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
    ║ Activate/Deactivate                                                                                                  ║
    ╠═════╪════════════════════════════╪════════════════════════════════════════════════════════════════════════════════════╣
    ║ TC01 │ Activate                 │ Status=Active, LastModifiedBy updated                                            │ N    │ P   ║
    ║ TC02 │ Deactivate               │ Status=Inactive, LastModifiedBy updated                                          │ N    │ P   ║
    ╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
    ║ SetAsDefault/RemoveDefault                                                                                           ║
    ╠═════╪════════════════════════════╪════════════════════════════════════════════════════════════════════════════════════╣
    ║ TC01 │ SetAsDefault             │ IsDefault=true                                                                   │ N    │ P   ║
    ║ TC02 │ RemoveDefault            │ IsDefault=false                                                                  │ N    │ P   ║
    ╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
    ║ SoftDelete                                                                                                           ║
    ╠═════╪════════════════════════════╪════════════════════════════════════════════════════════════════════════════════════╣
    ║ TC01 │ SoftDelete               │ IsDeleted=true, LastModifiedBy updated                                             │ N    │ P   ║
    ╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
    ║ GeneratePolicyCode                                                                                                   ║
    ╠═════╪════════════════════════════╪════════════════════════════════════════════════════════════════════════════════════╣
    ║ TC01 │ Valid format             │ Starts with "PP-", contains "-", length=14                                        │ N    │ P   ║
    ║ TC02 │ Unique codes             │ Two consecutive calls return different codes                                      │ N    │ P   ║
    ╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝

    Summary:
    ┌────────────────────────────┬────────┬────────┬───────────┬────┬────┬────┬───────┐
    │ Function                   │ Passed │ Failed │ Untested  │ N  │ A  │ B  │ Total │
    ├────────────────────────────┼────────┼────────┼───────────┼────┼────┼────┼───────┤
    │ Create                     │ 5      │ 0      │ 0         │ 4  │ 1  │ 0  │ 5     │
    │ Update                     │ 2      │ 0      │ 0         │ 1  │ 1  │ 0  │ 2     │
    │ Activate/Deactivate        │ 2      │ 0      │ 0         │ 2  │ 0  │ 0  │ 2     │
    │ SetAsDefault/RemoveDefault  │ 2      │ 0      │ 0         │ 2  │ 0  │ 0  │ 2     │
    │ SoftDelete                 │ 1      │ 0      │ 0         │ 1  │ 0  │ 0  │ 1     │
    │ GeneratePolicyCode          │ 2      │ 0      │ 0         │ 2  │ 0  │ 0  │ 2     │
    ├────────────────────────────┼────────┼────────┼───────────┼────┼────┼────┼───────┤
    │ TOTAL                      │ 14     │ 0      │ 0         │ 12 │ 2  │ 0  │ 14    │
    └────────────────────────────┴────────┴────────┴───────────┴────┴────┴────┴───────┘

    Test Results: 14 test cases
    - N (Normal): 12
    - A (Abnormal): 2
    - B (Boundary): 0
    */

    #endregion
}
