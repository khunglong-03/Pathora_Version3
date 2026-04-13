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
    private readonly IManagerBankAccountRepository _bankAccountRepository = Substitute.For<IManagerBankAccountRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly ICurrentUser _currentUser = Substitute.For<ICurrentUser>();

    private global::Application.Features.Admin.Commands.VerifyBankAccount.VerifyBankAccountCommandHandler CreateHandler() =>
        new(_bankAccountRepository, _unitOfWork, _currentUser);

    #region Handle — valid verification

    [Fact]
    public async Task Handle_ValidRequest_SetsVerifiedFlag()
    {
        // Arrange
        var managerId = Guid.NewGuid();
        var adminId = Guid.NewGuid();
        var account = new ManagerBankAccountEntity
        {
            UserId = managerId,
            BankAccountNumber = "1234567890",
            BankCode = "MB",
            BankBin = "970422",
            IsVerified = false
        };

        _bankAccountRepository.GetDefaultByUserIdAsync(managerId, Arg.Any<CancellationToken>())
            .Returns(account);
        _currentUser.Id.Returns(adminId);

        var command = new VerifyBankAccountCommand(managerId);
        var handler = CreateHandler();

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.True(account.IsVerified);
        Assert.NotNull(account.VerifiedAt);
        Assert.Equal(adminId, account.VerifiedBy);
        await _unitOfWork.Received().SaveChangeAsync(Arg.Any<CancellationToken>());
    }

    #endregion

    #region Handle — manager has no bank account

    [Fact]
    public async Task Handle_NoBankAccount_ReturnsNotFound()
    {
        // Arrange
        var managerId = Guid.NewGuid();
        _bankAccountRepository.GetDefaultByUserIdAsync(managerId, Arg.Any<CancellationToken>())
            .Returns((ManagerBankAccountEntity?)null);
        _bankAccountRepository.GetByUserIdAsync(managerId, Arg.Any<CancellationToken>())
            .Returns(new List<ManagerBankAccountEntity>());

        var command = new VerifyBankAccountCommand(managerId);
        var handler = CreateHandler();

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsError);
        Assert.Contains(result.Errors, e => e.Code == ErrorConstants.Payment.NoBankAccountCode);
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

        var account = new ManagerBankAccountEntity
        {
            UserId = managerId,
            BankAccountNumber = "1234567890",
            BankCode = "MB",
            BankBin = "970422",
            IsVerified = true,
            VerifiedAt = originalTime,
            VerifiedBy = originalAdminId
        };

        _bankAccountRepository.GetDefaultByUserIdAsync(managerId, Arg.Any<CancellationToken>())
            .Returns(account);
        _currentUser.Id.Returns(newAdminId);

        var command = new VerifyBankAccountCommand(managerId);
        var handler = CreateHandler();

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.True(account.IsVerified);
        Assert.True(account.VerifiedAt > originalTime);
        Assert.Equal(newAdminId, account.VerifiedBy);
    }

    #endregion
}
