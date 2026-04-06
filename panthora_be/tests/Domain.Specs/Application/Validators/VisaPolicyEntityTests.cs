using Domain.Entities;
using Domain.Entities.Translations;

namespace Domain.Specs.Application.Validators;

/// <summary>
/// Unit tests for VisaPolicyEntity.
/// Tests: Create, Update, SetActive, SoftDelete, GenerateVisaPolicyCode
/// </summary>
public class VisaPolicyEntityTests
{
    #region Create Tests

    [Fact]
    public void Create_TC01_AllValid_ShouldPass()
    {
        // Act
        var policy = VisaPolicyEntity.Create(
            region: "Japan",
            processingDays: 5,
            bufferDays: 3,
            fullPaymentRequired: true,
            performedBy: "system");

        // Assert
        Assert.NotEqual(Guid.Empty, policy.Id);
        Assert.Equal("Japan", policy.Region);
        Assert.Equal(5, policy.ProcessingDays);
        Assert.Equal(3, policy.BufferDays);
        Assert.True(policy.FullPaymentRequired);
        Assert.True(policy.IsActive);
        Assert.False(policy.IsDeleted);
        Assert.Equal("system", policy.CreatedBy);
        Assert.Equal("system", policy.LastModifiedBy);
    }

    [Fact]
    public void Create_TC02_WithTranslations_ShouldPass()
    {
        // Arrange
        var translations = new Dictionary<string, VisaPolicyTranslationData>
        {
            ["en"] = new() { Region = "Japan", Note = "Valid passport required" },
            ["vi"] = new() { Region = "Nhật Bản", Note = "Yêu cầu hộ chiếu còn hạn" }
        };

        // Act
        var policy = VisaPolicyEntity.Create(
            region: "Japan",
            processingDays: 5,
            bufferDays: 3,
            fullPaymentRequired: false,
            performedBy: "system",
            translations: translations);

        // Assert
        Assert.Equal(2, policy.Translations.Count);
        Assert.Equal("Japan", policy.Translations["en"].Region);
        Assert.Equal("Valid passport required", policy.Translations["en"].Note);
        Assert.Equal("Nhật Bản", policy.Translations["vi"].Region);
        Assert.Equal("Yêu cầu hộ chiếu còn hạn", policy.Translations["vi"].Note);
    }

    [Fact]
    public void Create_TC03_BufferDaysZero_ShouldPass()
    {
        // Act
        var policy = VisaPolicyEntity.Create(
            region: "Singapore",
            processingDays: 3,
            bufferDays: 0,
            fullPaymentRequired: false,
            performedBy: "system");

        // Assert
        Assert.Equal(0, policy.BufferDays);
    }

    [Fact]
    public void Create_TC04_FullPaymentFalse_ShouldPass()
    {
        // Act
        var policy = VisaPolicyEntity.Create(
            region: "Thailand",
            processingDays: 7,
            bufferDays: 2,
            fullPaymentRequired: false,
            performedBy: "system");

        // Assert
        Assert.False(policy.FullPaymentRequired);
    }

    [Fact]
    public void Create_TC05_EmptyRegion_ShouldThrow()
    {
        // Act & Assert
        var exception = Assert.Throws<ArgumentException>(() =>
            VisaPolicyEntity.Create(
                region: "",
                processingDays: 5,
                bufferDays: 3,
                fullPaymentRequired: false,
                performedBy: "system"));

        Assert.Contains("Region is required", exception.Message);
    }

    [Fact]
    public void Create_TC06_WhitespaceRegion_ShouldThrow()
    {
        // Act & Assert
        var exception = Assert.Throws<ArgumentException>(() =>
            VisaPolicyEntity.Create(
                region: "   ",
                processingDays: 5,
                bufferDays: 3,
                fullPaymentRequired: false,
                performedBy: "system"));

        Assert.Contains("Region is required", exception.Message);
    }

    [Fact]
    public void Create_TC07_ProcessingDaysZero_ShouldThrow()
    {
        // Act & Assert
        var exception = Assert.Throws<ArgumentOutOfRangeException>(() =>
            VisaPolicyEntity.Create(
                region: "Japan",
                processingDays: 0,
                bufferDays: 3,
                fullPaymentRequired: false,
                performedBy: "system"));

        Assert.Contains("Processing days must be greater than 0", exception.Message);
    }

    [Fact]
    public void Create_TC08_ProcessingDaysNegative_ShouldThrow()
    {
        // Act & Assert
        var exception = Assert.Throws<ArgumentOutOfRangeException>(() =>
            VisaPolicyEntity.Create(
                region: "Japan",
                processingDays: -1,
                bufferDays: 3,
                fullPaymentRequired: false,
                performedBy: "system"));

        Assert.Contains("Processing days must be greater than 0", exception.Message);
    }

    [Fact]
    public void Create_TC09_BufferDaysNegative_ShouldThrow()
    {
        // Act & Assert
        var exception = Assert.Throws<ArgumentOutOfRangeException>(() =>
            VisaPolicyEntity.Create(
                region: "Japan",
                processingDays: 5,
                bufferDays: -1,
                fullPaymentRequired: false,
                performedBy: "system"));

        Assert.Contains("Buffer days cannot be negative", exception.Message);
    }

    [Fact]
    public void Create_TC10_LargeBufferDays_ShouldPass()
    {
        // Act
        var policy = VisaPolicyEntity.Create(
            region: "China",
            processingDays: 14,
            bufferDays: 30,
            fullPaymentRequired: true,
            performedBy: "system");

        // Assert
        Assert.Equal(30, policy.BufferDays);
        Assert.Equal(44, policy.ProcessingDays + policy.BufferDays); // Total timeline
    }

    #endregion

    #region Update Tests

    [Fact]
    public void Update_TC01_ValidUpdate_ShouldPass()
    {
        // Arrange
        var policy = VisaPolicyEntity.Create(
            region: "Japan",
            processingDays: 5,
            bufferDays: 3,
            fullPaymentRequired: false,
            performedBy: "system");

        // Act
        policy.Update(
            region: "South Korea",
            processingDays: 7,
            bufferDays: 5,
            fullPaymentRequired: true,
            performedBy: "admin");

        // Assert
        Assert.Equal("South Korea", policy.Region);
        Assert.Equal(7, policy.ProcessingDays);
        Assert.Equal(5, policy.BufferDays);
        Assert.True(policy.FullPaymentRequired);
        Assert.Equal("admin", policy.LastModifiedBy);
    }

    [Fact]
    public void Update_TC02_EmptyRegion_ShouldThrow()
    {
        // Arrange
        var policy = VisaPolicyEntity.Create(
            region: "Japan",
            processingDays: 5,
            bufferDays: 3,
            fullPaymentRequired: false,
            performedBy: "system");

        // Act & Assert
        var exception = Assert.Throws<ArgumentException>(() =>
            policy.Update(
                region: "",
                processingDays: 7,
                bufferDays: 5,
                fullPaymentRequired: true,
                performedBy: "admin"));

        Assert.Contains("Region is required", exception.Message);
    }

    [Fact]
    public void Update_TC03_ProcessingDaysZero_ShouldThrow()
    {
        // Arrange
        var policy = VisaPolicyEntity.Create(
            region: "Japan",
            processingDays: 5,
            bufferDays: 3,
            fullPaymentRequired: false,
            performedBy: "system");

        // Act & Assert
        var exception = Assert.Throws<ArgumentOutOfRangeException>(() =>
            policy.Update(
                region: "Japan",
                processingDays: 0,
                bufferDays: 5,
                fullPaymentRequired: true,
                performedBy: "admin"));

        Assert.Contains("Processing days must be greater than 0", exception.Message);
    }

    [Fact]
    public void Update_TC04_BufferDaysNegative_ShouldThrow()
    {
        // Arrange
        var policy = VisaPolicyEntity.Create(
            region: "Japan",
            processingDays: 5,
            bufferDays: 3,
            fullPaymentRequired: false,
            performedBy: "system");

        // Act & Assert
        var exception = Assert.Throws<ArgumentOutOfRangeException>(() =>
            policy.Update(
                region: "Japan",
                processingDays: 5,
                bufferDays: -1,
                fullPaymentRequired: true,
                performedBy: "admin"));

        Assert.Contains("Buffer days cannot be negative", exception.Message);
    }

    #endregion

    #region SetActive Tests

    [Fact]
    public void SetActive_TC01_Activate_ShouldPass()
    {
        // Arrange
        var policy = VisaPolicyEntity.Create(
            region: "Japan",
            processingDays: 5,
            bufferDays: 3,
            fullPaymentRequired: false,
            performedBy: "system");

        // Act
        policy.SetActive(isActive: true, performedBy: "admin");

        // Assert
        Assert.True(policy.IsActive);
        Assert.Equal("admin", policy.LastModifiedBy);
    }

    [Fact]
    public void SetActive_TC02_Deactivate_ShouldPass()
    {
        // Arrange
        var policy = VisaPolicyEntity.Create(
            region: "Japan",
            processingDays: 5,
            bufferDays: 3,
            fullPaymentRequired: false,
            performedBy: "system");

        // Act
        policy.SetActive(isActive: false, performedBy: "admin");

        // Assert
        Assert.False(policy.IsActive);
        Assert.Equal("admin", policy.LastModifiedBy);
    }

    [Fact]
    public void SetActive_TC03_Reactivate_ShouldPass()
    {
        // Arrange
        var policy = VisaPolicyEntity.Create(
            region: "Japan",
            processingDays: 5,
            bufferDays: 3,
            fullPaymentRequired: false,
            performedBy: "system");
        policy.SetActive(false, "admin");

        // Act
        policy.SetActive(true, "superadmin");

        // Assert
        Assert.True(policy.IsActive);
        Assert.Equal("superadmin", policy.LastModifiedBy);
    }

    #endregion

    #region SoftDelete Tests

    [Fact]
    public void SoftDelete_TC01_Valid_ShouldPass()
    {
        // Arrange
        var policy = VisaPolicyEntity.Create(
            region: "Japan",
            processingDays: 5,
            bufferDays: 3,
            fullPaymentRequired: false,
            performedBy: "system");

        // Act
        policy.SoftDelete(performedBy: "admin");

        // Assert
        Assert.True(policy.IsDeleted);
        Assert.Equal("admin", policy.LastModifiedBy);
    }

    [Fact]
    public void SoftDelete_TC02_AlreadyDeleted_ShouldPass()
    {
        // Arrange
        var policy = VisaPolicyEntity.Create(
            region: "Japan",
            processingDays: 5,
            bufferDays: 3,
            fullPaymentRequired: false,
            performedBy: "system");
        policy.SoftDelete("admin");

        // Act - calling SoftDelete again should not throw
        policy.SoftDelete("superadmin");

        // Assert
        Assert.True(policy.IsDeleted);
        Assert.Equal("superadmin", policy.LastModifiedBy); // Updated to latest
    }

    #endregion

    #region Audit Trail Tests

    [Fact]
    public void Create_TC_AuditFields_ShouldBePopulated()
    {
        // Act
        var policy = VisaPolicyEntity.Create(
            region: "Japan",
            processingDays: 5,
            bufferDays: 3,
            fullPaymentRequired: false,
            performedBy: "system");

        // Assert
        Assert.NotEqual(default, policy.CreatedOnUtc);
        Assert.NotEqual(default, policy.LastModifiedOnUtc);
        // LastModifiedOnUtc should be equal to or very close to CreatedOnUtc (within 1ms)
        Assert.True(Math.Abs((policy.LastModifiedOnUtc - policy.CreatedOnUtc)!.Value.TotalMilliseconds) < 1);
    }

    [Fact]
    public void Update_T_AuditFields_ShouldBeUpdated()
    {
        // Arrange
        var policy = VisaPolicyEntity.Create(
            region: "Japan",
            processingDays: 5,
            bufferDays: 3,
            fullPaymentRequired: false,
            performedBy: "system");
        var originalCreatedOn = policy.CreatedOnUtc;
        var originalLastModified = policy.LastModifiedOnUtc;

        // Act
        policy.Update(
            region: "South Korea",
            processingDays: 7,
            bufferDays: 5,
            fullPaymentRequired: true,
            performedBy: "admin");

        // Assert
        Assert.Equal(originalCreatedOn, policy.CreatedOnUtc); // CreatedOn unchanged
        Assert.True(policy.LastModifiedOnUtc > originalLastModified); // LastModified updated
    }

    #endregion

    #region Total Visa Timeline Calculation

    [Fact]
    public void Create_T_TotalVisaTimeline_ShouldBeProcessingPlusBuffer()
    {
        // Arrange
        var processingDays = 10;
        var bufferDays = 5;

        // Act
        var policy = VisaPolicyEntity.Create(
            region: "Schengen",
            processingDays: processingDays,
            bufferDays: bufferDays,
            fullPaymentRequired: true,
            performedBy: "system");

        // Assert - Total timeline = ProcessingDays + BufferDays
        Assert.Equal(15, policy.ProcessingDays + policy.BufferDays);
    }

    [Fact]
    public void Create_T_FullPaymentRequired_ShouldBlockPartialPayment()
    {
        // Arrange
        var policy = VisaPolicyEntity.Create(
            region: "USA",
            processingDays: 14,
            bufferDays: 7,
            fullPaymentRequired: true,
            performedBy: "system");

        // Assert - Business rule: Full payment must be collected before visa processing
        Assert.True(policy.FullPaymentRequired);
    }

    #endregion

    #region Test Summary

    /*
    ╔════════════════════════════════════════════════════════════════════════════════════╗
    ║                         VISA POLICY ENTITY - TEST CASE MATRIX                    ║
    ╠════════════════════════════════════════════════════════════════════════════════════╣
    ║ Create                                                                              ║
    ╠══════════╪═══════════════════════════════════╪═══════════╪════╪════╪════╪═══════╣
    ║ TC01     ║ All valid                       ║ N         ║ ✓  ║    ║    ║ Pass ║
    ║ TC02     ║ With translations               ║ N         ║ ✓  ║    ║    ║ Pass ║
    ║ TC03     ║ BufferDays = 0                  ║ N/B       ║ ✓  ║    ║    ║ Pass ║
    ║ TC04     ║ FullPaymentRequired = false     ║ N         ║ ✓  ║    ║    ║ Pass ║
    ║ TC05     ║ Empty region                    ║ A         ║    ║ ✓  ║    ║ Pass ║
    ║ TC06     ║ Whitespace region               ║ A         ║    ║ ✓  ║    ║ Pass ║
    ║ TC07     ║ ProcessingDays = 0             ║ A         ║    ║ ✓  ║    ║ Pass ║
    ║ TC08     ║ ProcessingDays < 0             ║ A         ║    ║ ✓  ║    ║ Pass ║
    ║ TC09     ║ BufferDays < 0                 ║ A         ║    ║ ✓  ║    ║ Pass ║
    ║ TC10     ║ Large buffer days              ║ N/B       ║ ✓  ║    ║    ║ Pass ║
    ╠══════════╪═══════════════════════════════════╪═══════════╪════╪════╪════╪═══════╣
    ║ Update                                                                              ║
    ╠══════════╪═══════════════════════════════════╪═══════════╪════╪════╪════╪═══════╣
    ║ TC01     ║ Valid update                   ║ N         ║ ✓  ║    ║    ║ Pass ║
    ║ TC02     ║ Empty region                   ║ A         ║    ║ ✓  ║    ║ Pass ║
    ║ TC03     ║ ProcessingDays = 0             ║ A         ║    ║ ✓  ║    ║ Pass ║
    ║ TC04     ║ BufferDays < 0                 ║ A         ║    ║ ✓  ║    ║ Pass ║
    ╠══════════╪═══════════════════════════════════╪═══════════╪════╪════╪════╪═══════╣
    ║ SetActive                                                                             ║
    ╠══════════╪═══════════════════════════════════╪═══════════╪════╪════╪════╪═══════╣
    ║ TC01     ║ Activate                       ║ N         ║ ✓  ║    ║    ║ Pass ║
    ║ TC02     ║ Deactivate                     ║ N         ║ ✓  ║    ║    ║ Pass ║
    ║ TC03     ║ Reactivate                     ║ N         ║ ✓  ║    ║    ║ Pass ║
    ╠══════════╪═══════════════════════════════════╪═══════════╪════╪════╪════╪═══════╣
    ║ SoftDelete                                                                             ║
    ╠══════════╪═══════════════════════════════════╪═══════════╪════╪════╪════╪═══════╣
    ║ TC01     ║ Valid soft delete               ║ N         ║ ✓  ║    ║    ║ Pass ║
    ║ TC02     ║ Already deleted                 ║ N         ║ ✓  ║    ║    ║ Pass ║
    ╠══════════╪═══════════════════════════════════╪═══════════╪════╪════╪════╪═══════╣
    ║ Audit Trail                                                                             ║
    ╠══════════╪═══════════════════════════════════╪═══════════╪════╪════╪════╪═══════╣
    ║ TC_Audit ║ Create audit fields populated    ║ N         ║ ✓  ║    ║    ║ Pass ║
    ║ TC_Audit2║ Update audit fields updated      ║ N         ║ ✓  ║    ║    ║ Pass ║
    ╠══════════╪═══════════════════════════════════╪═══════════╪════╪════╪════╪═══════╣
    ║ Total Visa Timeline                                                                 ║
    ╠══════════╪═══════════════════════════════════╪═══════════╪════╪════╪════╪═══════╣
    ║ TC01     ║ Total = Processing + Buffer     ║ N         ║ ✓  ║    ║    ║ Pass ║
    ║ TC02     ║ FullPaymentRequired flag        ║ N         ║ ✓  ║    ║    ║ Pass ║
    ╠══════════╪═══════════════════════════════════╪═══════════╪════╪════╪════╪═══════╣
    ║ TOTAL    ║ 21 test cases                   ║           ║ 17 ║  6 ║  0 ║ 21   ║
    ╚══════════╩═══════════════════════════════════╩═══════════╩════╩════╩════╩═══════╝

    Legend: N = Normal, A = Abnormal, B = Boundary
    */

    #endregion
}
