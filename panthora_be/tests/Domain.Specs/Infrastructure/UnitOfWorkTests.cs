using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Domain.Specs.Infrastructure;

/// <summary>
/// Regression tests for UnitOfWork behavior.
/// </summary>
public sealed class UnitOfWorkTests
{
    // Regression: ISSUE-001 — RollbackTransactionAsync should not throw when no transaction is active
    [Fact]
    public async Task RollbackTransactionAsync_WhenNoTransactionActive_ShouldNotThrow()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<global::Infrastructure.Data.AppDbContext>()
            .UseInMemoryDatabase($"rollback-test-{Guid.NewGuid():N}")
            .Options;

        await using var context = new AppDbContext(options);
        var unitOfWork = new global::Infrastructure.Repositories.Common.UnitOfWork(context);

        // Act — should NOT throw even though no transaction was started
        var exception = await Record.ExceptionAsync(() => unitOfWork.RollbackTransactionAsync());

        // Assert
        Assert.Null(exception);
    }
}
