using System;
using System.Collections.Generic;
using Application.Features.TourInstance.ItineraryFeedback;
using Domain.Entities;
using Xunit;

namespace Domain.Specs;

public class PrivateTourCoDesignAccessTests
{
    [Fact]
    public void EnsureInstanceManagerOnly_ShouldReturnTrue_WhenUserIsManager()
    {
        // Arrange
        var managerId = Guid.NewGuid();
        var instance = new TourInstanceEntity
        {
            Managers = new List<TourInstanceManagerEntity>
            {
                new TourInstanceManagerEntity { UserId = managerId }
            }
        };

        // Act
        var result = PrivateTourCoDesignAccess.EnsureInstanceManagerOnly(instance, managerId);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void EnsureInstanceManagerOnly_ShouldReturnFalse_WhenUserIsOperator()
    {
        // Arrange
        var operatorId = Guid.NewGuid();
        var instance = new TourInstanceEntity
        {
            Tour = new TourEntity { TourOperatorId = operatorId },
            Managers = new List<TourInstanceManagerEntity>()
        };

        // Act
        var result = PrivateTourCoDesignAccess.EnsureInstanceManagerOnly(instance, operatorId);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void EnsureInstanceManagerOnly_ShouldReturnFalse_WhenUserIsCustomer()
    {
        // Arrange
        var customerId = Guid.NewGuid();
        var instance = new TourInstanceEntity
        {
            Managers = new List<TourInstanceManagerEntity>()
        };

        // Act
        var result = PrivateTourCoDesignAccess.EnsureInstanceManagerOnly(instance, customerId);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void EnsureInstanceOperatorOnly_ShouldReturnTrue_WhenUserIsOperator()
    {
        // Arrange
        var operatorId = Guid.NewGuid();
        var instance = new TourInstanceEntity
        {
            Tour = new TourEntity { TourOperatorId = operatorId }
        };

        // Act
        var result = PrivateTourCoDesignAccess.EnsureInstanceOperatorOnly(instance, operatorId);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void EnsureInstanceOperatorOnly_ShouldReturnFalse_WhenUserIsManager()
    {
        // Arrange
        var managerId = Guid.NewGuid();
        var instance = new TourInstanceEntity
        {
            Tour = new TourEntity { TourOperatorId = Guid.NewGuid() },
            Managers = new List<TourInstanceManagerEntity>
            {
                new TourInstanceManagerEntity { UserId = managerId }
            }
        };

        // Act
        var result = PrivateTourCoDesignAccess.EnsureInstanceOperatorOnly(instance, managerId);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void EnsureInstanceOperatorOnly_ShouldReturnFalse_WhenUserIsCustomer()
    {
        // Arrange
        var customerId = Guid.NewGuid();
        var instance = new TourInstanceEntity
        {
            Tour = new TourEntity { TourOperatorId = Guid.NewGuid() }
        };

        // Act
        var result = PrivateTourCoDesignAccess.EnsureInstanceOperatorOnly(instance, customerId);

        // Assert
        Assert.False(result);
    }
}
