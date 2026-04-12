namespace Domain.Specs.Application.Features.Admin.Commands;

using global::Application.Common.Constant;
using global::Application.Common.Interfaces;
using global::Application.Features.Admin.Commands.VerifyBankAccount;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.UnitOfWork;
using global::ErrorOr;
using global::NSubstitute;
using global::Xunit;

public sealed class VerifyBankAccountCommandHandlerTests
{
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly ICurrentUser _currentUser = Substitute.For<ICurrentUser>();

    private global::Application.Features.Admin.Commands.VerifyBankAccount.VerifyBankAccountCommandHandler CreateHandler() =>
        new(_userRepository, _unitOfWork, _currentUser);

    #region Handle — valid verification

    [Fact]
    public async Task Handle_ValidRequest_SetsVerifiedFlag()
    {
        // Arrange
        var managerId = Guid.NewGuid();
        var adminId = Guid.NewGuid();
        var manager = new UserEntity
        {
            Username = "manager1",
            Email = "manager@example.com",
            FullName = "Manager One",
            Password = "hash",
            BankAccountNumber = "1234567890",
            BankCode = "MB",
            BankAccountVerified = false
        };

        _userRepository.FindById(managerId, Arg.Any<CancellationToken>())
            .Returns(manager);
        _currentUser.Id.Returns(adminId);

        var command = new VerifyBankAccountCommand(managerId);
        var handler = CreateHandler();

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.True(manager.BankAccountVerified);
        Assert.NotNull(manager.BankAccountVerifiedAt);
        Assert.Equal(adminId, manager.BankAccountVerifiedBy);
        _userRepository.Received().Update(manager);
        await _unitOfWork.Received().SaveChangeAsync(Arg.Any<CancellationToken>());
    }

    #endregion

    #region Handle — manager not found

    [Fact]
    public async Task Handle_ManagerNotFound_ReturnsNotFound()
    {
        // Arrange
        var managerId = Guid.NewGuid();
        _userRepository.FindById(managerId, Arg.Any<CancellationToken>())
            .Returns((UserEntity?)null);

        var command = new VerifyBankAccountCommand(managerId);
        var handler = CreateHandler();

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsError);
        Assert.Contains(result.Errors, e => e.Code == ErrorConstants.User.NotFoundCode);
    }

    #endregion

    #region Handle — re-verification updates timestamp

    [Fact]
    public async Task Handle_AlreadyVerified_UpdatesTimestamp()
    {
        // Arrange
        var managerId = Guid.NewGuid();
        var originalAdminId = Guid.NewGuid();
        var newAdminId = Guid.NewGuid();
        var originalTime = DateTimeOffset.UtcNow.AddDays(-1);

        var manager = new UserEntity
        {
            Username = "manager1",
            Email = "manager@example.com",
            FullName = "Manager One",
            Password = "hash",
            BankAccountNumber = "1234567890",
            BankCode = "MB",
            BankAccountVerified = true,
            BankAccountVerifiedAt = originalTime,
            BankAccountVerifiedBy = originalAdminId
        };

        _userRepository.FindById(managerId, Arg.Any<CancellationToken>())
            .Returns(manager);
        _currentUser.Id.Returns(newAdminId);

        var command = new VerifyBankAccountCommand(managerId);
        var handler = CreateHandler();

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.True(manager.BankAccountVerified);
        Assert.True(manager.BankAccountVerifiedAt > originalTime);
        Assert.Equal(newAdminId, manager.BankAccountVerifiedBy);
    }

    #endregion
}
