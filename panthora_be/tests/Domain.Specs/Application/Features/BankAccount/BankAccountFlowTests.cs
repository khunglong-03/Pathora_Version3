namespace Domain.Specs.Application.Features.BankAccount;

using global::Application.Common.Constant;
using global::Application.Common.Interfaces;
using global::Application.Contracts.Manager;
using global::Application.Features.Admin.Commands.VerifyBankAccount;
using global::Application.Features.Manager.Commands.UpdateMyBankAccount;
using global::Application.Features.Manager.Queries.GetMyBankAccount;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.UnitOfWork;
using global::NSubstitute;
using global::Xunit;

/// <summary>
/// Integration-style tests verifying the full bank account lifecycle:
/// 1. Manager creates/updates bank account
/// 2. Manager retrieves bank account
/// 3. Admin verifies bank account
/// </summary>
public sealed class BankAccountFlowTests
{
    private readonly IManagerBankAccountRepository _bankAccountRepo = Substitute.For<IManagerBankAccountRepository>();
    private readonly IUserRepository _userRepo = Substitute.For<IUserRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly ICurrentUser _currentUser = Substitute.For<ICurrentUser>();

    #region Manager creates bank account then retrieves it

    [Fact]
    public async Task ManagerFlow_CreateAndRetrieve_ReturnsCreatedAccount()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _currentUser.Id.Returns(userId);

        ManagerBankAccountEntity? capturedAccount = null;
        _bankAccountRepo.GetDefaultByUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns(ci => capturedAccount);
        _bankAccountRepo.GetByUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns(ci => capturedAccount is null
                ? new List<ManagerBankAccountEntity>()
                : new List<ManagerBankAccountEntity> { capturedAccount });
        _bankAccountRepo.AddAsync(Arg.Any<ManagerBankAccountEntity>(), Arg.Any<CancellationToken>())
            .Returns(ci =>
            {
                capturedAccount = ci.Arg<ManagerBankAccountEntity>();
                return Task.CompletedTask;
            });

        // Step 1: Manager creates bank account
        var updateHandler = new UpdateMyBankAccountCommandHandler(_bankAccountRepo, _unitOfWork, _currentUser);
        var updateCmd = new UpdateMyBankAccountCommand(new UpdateMyBankAccountRequest("1234567890", "VCB", "Nguyen Van A"));
        var updateResult = await updateHandler.Handle(updateCmd, CancellationToken.None);

        Assert.False(updateResult.IsError);
        Assert.Equal("1234567890", updateResult.Value.BankAccountNumber);
        Assert.Equal("VCB", updateResult.Value.BankCode);
        Assert.False(updateResult.Value.BankAccountVerified);

        // Step 2: Update mock to return the created account for retrieval
        _bankAccountRepo.GetDefaultByUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns(capturedAccount);

        // Step 3: Manager retrieves bank account
        var getHandler = new GetMyBankAccountQueryHandler(_bankAccountRepo, _currentUser);
        var getResult = await getHandler.Handle(new GetMyBankAccountQuery(), CancellationToken.None);

        Assert.False(getResult.IsError);
        Assert.Equal("1234567890", getResult.Value.BankAccountNumber);
        Assert.Equal("VCB", getResult.Value.BankCode);
        Assert.Equal("Nguyen Van A", getResult.Value.BankAccountName);
    }

    #endregion

    #region Manager creates, admin verifies, then retrieves verified account

    [Fact]
    public async Task FullFlow_CreateVerifyRetrieve_AccountIsVerified()
    {
        // Arrange
        var managerId = Guid.NewGuid();
        var adminId = Guid.NewGuid();

        var account = new ManagerBankAccountEntity
        {
            UserId = managerId,
            BankAccountNumber = "9876543210",
            BankCode = "TCB",
            BankBin = "970407",
            BankAccountName = "Tran Thi B",
            IsDefault = true,
            IsVerified = false
        };

        _bankAccountRepo.GetDefaultByUserIdAsync(managerId, Arg.Any<CancellationToken>())
            .Returns(account);
        _currentUser.Id.Returns(adminId);

        // Step 1: Admin verifies the bank account
        var verifyHandler = new VerifyBankAccountCommandHandler(_bankAccountRepo, _unitOfWork, _currentUser);
        var verifyResult = await verifyHandler.Handle(
            new VerifyBankAccountCommand(managerId), CancellationToken.None);

        Assert.False(verifyResult.IsError);
        Assert.True(account.IsVerified);
        Assert.NotNull(account.VerifiedAt);
        Assert.Equal(adminId, account.VerifiedBy);

        // Step 2: Manager retrieves and sees verified status
        _currentUser.Id.Returns(managerId);
        var getHandler = new GetMyBankAccountQueryHandler(_bankAccountRepo, _currentUser);
        var getResult = await getHandler.Handle(new GetMyBankAccountQuery(), CancellationToken.None);

        Assert.False(getResult.IsError);
        Assert.True(getResult.Value.BankAccountVerified);
        Assert.NotNull(getResult.Value.BankAccountVerifiedAt);
    }

    #endregion

    #region No bank account returns empty DTO

    [Fact]
    public async Task GetMyBankAccount_NoAccount_ReturnsEmptyDto()
    {
        var userId = Guid.NewGuid();
        _currentUser.Id.Returns(userId);
        _bankAccountRepo.GetDefaultByUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns((ManagerBankAccountEntity?)null);
        _bankAccountRepo.GetByUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns(new List<ManagerBankAccountEntity>());

        var handler = new GetMyBankAccountQueryHandler(_bankAccountRepo, _currentUser);
        var result = await handler.Handle(new GetMyBankAccountQuery(), CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Null(result.Value.BankAccountNumber);
        Assert.Null(result.Value.BankCode);
        Assert.False(result.Value.BankAccountVerified);
    }

    #endregion

    #region Update existing account preserves identity

    [Fact]
    public async Task UpdateMyBankAccount_ExistingAccount_UpdatesInPlace()
    {
        var userId = Guid.NewGuid();
        _currentUser.Id.Returns(userId);

        var existing = new ManagerBankAccountEntity
        {
            UserId = userId,
            BankAccountNumber = "1111111111",
            BankCode = "MB",
            BankBin = "970422",
            BankAccountName = "Old Name",
            IsDefault = true,
            IsVerified = true,
            VerifiedAt = DateTimeOffset.UtcNow.AddDays(-1)
        };

        _bankAccountRepo.GetDefaultByUserIdAsync(userId, Arg.Any<CancellationToken>())
            .Returns(existing);

        var handler = new UpdateMyBankAccountCommandHandler(_bankAccountRepo, _unitOfWork, _currentUser);
        var result = await handler.Handle(
            new UpdateMyBankAccountCommand(new UpdateMyBankAccountRequest("2222222222", "ACB", "New Name")),
            CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal("2222222222", result.Value.BankAccountNumber);
        Assert.Equal("ACB", result.Value.BankCode);
        Assert.Equal("New Name", result.Value.BankAccountName);
        // Verified status preserved
        Assert.True(result.Value.BankAccountVerified);
        // No new AddAsync call — existing entity was updated in-place
        await _bankAccountRepo.DidNotReceive().AddAsync(Arg.Any<ManagerBankAccountEntity>(), Arg.Any<CancellationToken>());
    }

    #endregion
}
