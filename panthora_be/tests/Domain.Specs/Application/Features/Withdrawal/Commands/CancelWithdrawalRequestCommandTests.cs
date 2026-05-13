using Application.Common.Interfaces;
using Application.Features.Withdrawal.Commands.CancelWithdrawalRequest;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using NSubstitute;

namespace Domain.Specs.Application.Features.Withdrawal.Commands;

public sealed class CancelWithdrawalRequestCommandTests
{
    private readonly ICurrentUser _currentUserMock = Substitute.For<ICurrentUser>();
    private readonly IWithdrawalRequestRepository _withdrawalRepoMock = Substitute.For<IWithdrawalRequestRepository>();
    private readonly IUserRepository _userRepoMock = Substitute.For<IUserRepository>();
    private readonly ITransactionHistoryRepository _transactionHistoryRepoMock = Substitute.For<ITransactionHistoryRepository>();
    private readonly IUnitOfWork _unitOfWorkMock = Substitute.For<IUnitOfWork>();
    private readonly CancelWithdrawalRequestCommandHandler _handler;

    public CancelWithdrawalRequestCommandTests()
    {
        _handler = new CancelWithdrawalRequestCommandHandler(
            _currentUserMock,
            _withdrawalRepoMock,
            _userRepoMock,
            _transactionHistoryRepoMock,
            _unitOfWorkMock);
    }

    [Fact]
    public async Task Handle_Success_CreditsBalanceAndSetsCancelled()
    {
        var userId = Guid.NewGuid();
        _currentUserMock.Id.Returns(userId);

        var withdrawalId = Guid.NewGuid();
        var withdrawal = WithdrawalRequestEntity.Create(userId, Guid.NewGuid(), 100_000m, "123", "VTB", "111", "A", "B");
        _withdrawalRepoMock.GetByIdAsync(withdrawalId, default).Returns(withdrawal);

        var user = UserEntity.Create("user", "User", "user@a.com", "h", "sys");
        user.Balance = 10_000m;
        _userRepoMock.FindById(userId, default).Returns(user);

        var cmd = new CancelWithdrawalRequestCommand(withdrawalId);

        var result = await _handler.Handle(cmd, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal(WithdrawalStatus.Cancelled, withdrawal.Status);
        Assert.Equal(110_000m, user.Balance);
        await _transactionHistoryRepoMock.Received(1).AddAsync(Arg.Any<TransactionHistoryEntity>(), default);
        await _unitOfWorkMock.Received(1).SaveChangeAsync(default);
    }
}
