using System;
using Domain.Entities;
using Domain.Enums;
using Xunit;

namespace Domain.Specs.Entities;

public sealed class TourInstancePlanAccommodationEntityTests
{
    [Fact]
    public void ApproveBySupplier_ValidSupplier_UpdatesStatusAndNote()
    {
        // Arrange
        var entity = TourInstancePlanAccommodationEntity.Create(Guid.NewGuid(), supplierId: Guid.NewGuid());
        var note = "All good";

        // Act
        entity.ApproveBySupplier(true, note);

        // Assert
        Assert.Equal(ProviderApprovalStatus.Approved, entity.SupplierApprovalStatus);
        Assert.Equal(note, entity.SupplierApprovalNote);
    }

    [Fact]
    public void ApproveBySupplier_Reject_UpdatesStatusAndNote()
    {
        // Arrange
        var entity = TourInstancePlanAccommodationEntity.Create(Guid.NewGuid(), supplierId: Guid.NewGuid());
        var note = "No rooms available";

        // Act
        entity.ApproveBySupplier(false, note);

        // Assert
        Assert.Equal(ProviderApprovalStatus.Rejected, entity.SupplierApprovalStatus);
        Assert.Equal(note, entity.SupplierApprovalNote);
    }

    [Fact]
    public void ApproveBySupplier_NoSupplier_ThrowsInvalidOperationException()
    {
        // Arrange
        var entity = TourInstancePlanAccommodationEntity.Create(Guid.NewGuid());

        // Act & Assert
        var ex = Assert.Throws<InvalidOperationException>(() => entity.ApproveBySupplier(true, "Test"));
        Assert.Equal("Không thể duyệt khi chưa gán nhà cung cấp.", ex.Message);
    }

    [Fact]
    public void AssignSupplier_UpdatesSupplierAndResetsApproval()
    {
        // Arrange
        var entity = TourInstancePlanAccommodationEntity.Create(Guid.NewGuid());
        var newSupplierId = Guid.NewGuid();

        // Act
        entity.AssignSupplier(newSupplierId);

        // Assert
        Assert.Equal(newSupplierId, entity.SupplierId);
        Assert.Equal(ProviderApprovalStatus.Pending, entity.SupplierApprovalStatus);
        Assert.Null(entity.SupplierApprovalNote);
    }

    [Fact]
    public void Update_SupplierChanged_ResetsApproval()
    {
        // Arrange
        var entity = TourInstancePlanAccommodationEntity.Create(Guid.NewGuid(), supplierId: Guid.NewGuid());
        entity.ApproveBySupplier(true, "Approved");
        
        var newSupplierId = Guid.NewGuid();

        // Act
        entity.Update(RoomType.Standard, 2, supplierId: newSupplierId);

        // Assert
        Assert.Equal(newSupplierId, entity.SupplierId);
        Assert.Equal(ProviderApprovalStatus.Pending, entity.SupplierApprovalStatus);
        Assert.Null(entity.SupplierApprovalNote);
    }
}
