namespace Domain.Specs.Application.Features.Admin.Commands;

using global::Application.Common.Constant;
using global::Application.Contracts.Admin;
using global::Application.Features.Admin.Commands.UpdateBankAccount;
using global::Application.Features.Admin.DTOs;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.UnitOfWork;
using global::ErrorOr;
using global::NSubstitute;
using global::Xunit;

public sealed class UpdateBankAccountCommandHandlerTests
{
    private readonly IManagerBankAccountRepository _bankAccountRepository = Substitute.For<IManagerBankAccountRepository>();
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();

    private global::Application.Features.Admin.Commands.UpdateBankAccount.UpdateBankAccountCommandHandler CreateHandler() =>
        new(_bankAccountRepository, _userRepository, _unitOfWork);

    #region Handle — valid request

    [Fact]
    public async Task Handle_ValidRequest_UpdatesSuccessfully()
    {
        // Arrange
        var managerId = Guid.NewGuid();
        var account = new ManagerBankAccountEntity
        {
            UserId = managerId,
            BankAccountNumber = "1234567890",
            BankCode = "MB",
            BankBin = "970422",
            BankAccountName = "Manager One"
        };
        var user = new UserEntity
        {
            Username = "manager1",
            Email = "manager@example.com",
            FullName = "Manager One",
            Password = "hash"
        };

        _bankAccountRepository.GetDefaultByUserIdAsync(managerId, Arg.Any<CancellationToken>())
            .Returns(account);
        _userRepository.FindById(managerId, Arg.Any<CancellationToken>())
            .Returns(user);

        var command = new UpdateBankAccountCommand(
            managerId,
            new UpdateBankAccountRequest("1234567890", "MB", "Manager One"));

        var handler = CreateHandler();

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        var dto = result.Value;
        Assert.Equal(managerId, dto.UserId);
        Assert.Equal("1234567890", dto.BankAccountNumber);
        Assert.Equal("MB", dto.BankCode);
        Assert.Equal("Manager One", dto.BankAccountName);
        await _unitOfWork.Received().SaveChangeAsync(Arg.Any<CancellationToken>());
    }

    #endregion

    #region Handle — no bank account found

    [Fact]
    public async Task Handle_NoBankAccount_ReturnsNotFound()
    {
        // Arrange
        var managerId = Guid.NewGuid();
        _bankAccountRepository.GetDefaultByUserIdAsync(managerId, Arg.Any<CancellationToken>())
            .Returns((ManagerBankAccountEntity?)null);
        _bankAccountRepository.GetByUserIdAsync(managerId, Arg.Any<CancellationToken>())
            .Returns(new List<ManagerBankAccountEntity>());

        var command = new UpdateBankAccountCommand(
            managerId,
            new UpdateBankAccountRequest("1234567890", "MB", "Manager One"));

        var handler = CreateHandler();

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsError);
        Assert.Contains(result.Errors, e => e.Code == ErrorConstants.Payment.NoBankAccountCode);
    }

    #endregion

    #region Handle — optional BankAccountName

    [Fact]
    public async Task Handle_EmptyBankAccountName_UpdatesSuccessfully()
    {
        // Arrange
        var managerId = Guid.NewGuid();
        var account = new ManagerBankAccountEntity
        {
            UserId = managerId,
            BankAccountNumber = "9876543210",
            BankCode = "TCB",
            BankBin = "970407"
        };
        var user = new UserEntity
        {
            Username = "manager2",
            Email = "manager2@example.com",
            FullName = "Manager Two",
            Password = "hash"
        };

        _bankAccountRepository.GetDefaultByUserIdAsync(managerId, Arg.Any<CancellationToken>())
            .Returns(account);
        _userRepository.FindById(managerId, Arg.Any<CancellationToken>())
            .Returns(user);

        var command = new UpdateBankAccountCommand(
            managerId,
            new UpdateBankAccountRequest("9876543210", "TCB", null));

        var handler = CreateHandler();

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal("9876543210", result.Value.BankAccountNumber);
        Assert.Null(result.Value.BankAccountName);
    }

    #endregion
}
