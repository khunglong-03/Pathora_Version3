using Application.Common.Interfaces;
using Application.Features.Withdrawal.Commands.CreateWithdrawalRequest;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.UnitOfWork;
using ErrorOr;
using NSubstitute;

namespace Domain.Specs.Application.Features.Withdrawal.Commands;

public sealed class CreateWithdrawalRequestCommandTests
{
    private readonly ICurrentUser _currentUserMock = Substitute.For<ICurrentUser>();
    private readonly IManagerBankAccountRepository _bankAccountRepoMock = Substitute.For<IManagerBankAccountRepository>();
    private readonly IUserRepository _userRepoMock = Substitute.For<IUserRepository>();
    private readonly IWithdrawalRequestRepository _withdrawalRepoMock = Substitute.For<IWithdrawalRequestRepository>();
    private readonly ITransactionHistoryRepository _transactionHistoryRepoMock = Substitute.For<ITransactionHistoryRepository>();
    private readonly IUnitOfWork _unitOfWorkMock = Substitute.For<IUnitOfWork>();
    private readonly CreateWithdrawalRequestCommandHandler _handler;

    public CreateWithdrawalRequestCommandTests()
    {
        _handler = new CreateWithdrawalRequestCommandHandler(
            _currentUserMock,
            _bankAccountRepoMock,
            _userRepoMock,
            _withdrawalRepoMock,
            _transactionHistoryRepoMock,
            _unitOfWorkMock);
    }

    [Fact]
    public async Task Handle_Success_DebitsBalanceAndAddsRequest()
    {
        var userId = Guid.NewGuid();
        var bankId = Guid.NewGuid();
        _currentUserMock.Id.Returns(userId);
        
        var bankAccount = new ManagerBankAccountEntity { Id = bankId, UserId = userId, BankAccountNumber = "123", BankCode = "VTB", BankBin = "111" };
        _bankAccountRepoMock.GetByIdAndUserIdAsync(bankId, userId, default).Returns(bankAccount);

        var user = UserEntity.Create("test", "Test", "test@test.com", "hash", "sys");
        user.Balance = 500_000m;
        _userRepoMock.FindById(userId, default).Returns(user);

        var cmd = new CreateWithdrawalRequestCommand(bankId, 100_000m);

        var result = await _handler.Handle(cmd, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal(400_000m, user.Balance);
        await _withdrawalRepoMock.Received(1).AddAsync(Arg.Any<WithdrawalRequestEntity>(), default);
        await _transactionHistoryRepoMock.Received(1).AddAsync(Arg.Any<TransactionHistoryEntity>(), default);
        await _unitOfWorkMock.Received(1).SaveChangeAsync(default);
    }

    [Fact]
    public async Task Handle_InsufficientBalance_ReturnsValidationError()
    {
        var userId = Guid.NewGuid();
        var bankId = Guid.NewGuid();
        _currentUserMock.Id.Returns(userId);
        
        var bankAccount = new ManagerBankAccountEntity { Id = bankId, UserId = userId, BankAccountNumber = "123", BankCode = "VTB", BankBin = "111" };
        _bankAccountRepoMock.GetByIdAndUserIdAsync(bankId, userId, default).Returns(bankAccount);

        var user = UserEntity.Create("test", "Test", "test@test.com", "hash", "sys");
        user.Balance = 50_000m;
        _userRepoMock.FindById(userId, default).Returns(user);

        var cmd = new CreateWithdrawalRequestCommand(bankId, 100_000m);

        var result = await _handler.Handle(cmd, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal(ErrorType.Validation, result.FirstError.Type);
    }
}
