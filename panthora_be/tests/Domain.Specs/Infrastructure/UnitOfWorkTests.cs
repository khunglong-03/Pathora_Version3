using global::Infrastructure.Data;
using global::Infrastructure.Repositories.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Moq;

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
        var mediatorMock = new Mock<IMediator>();
        mediatorMock.Setup(m => m.Publish(It.IsAny<INotification>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        var unitOfWork = new UnitOfWork(context, mediatorMock.Object);

        // Act — should NOT throw even though no transaction was started
        var exception = await Record.ExceptionAsync(() => unitOfWork.RollbackTransactionAsync());

        // Assert
        Assert.Null(exception);
    }
}
