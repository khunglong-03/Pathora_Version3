using Application.Common.Interfaces;
using Application.Features.Withdrawal.Commands.RejectWithdrawal;
using Domain.Common.Repositories;
using Application.Common.Constant;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using NSubstitute;

namespace Domain.Specs.Application.Features.Withdrawal.Commands;

public sealed class RejectWithdrawalCommandTests
{
    private readonly ICurrentUser _currentUserMock = Substitute.For<ICurrentUser>();
    private readonly IWithdrawalRequestRepository _withdrawalRepoMock = Substitute.For<IWithdrawalRequestRepository>();
    private readonly IUserRepository _userRepoMock = Substitute.For<IUserRepository>();
    private readonly ITransactionHistoryRepository _transactionHistoryRepoMock = Substitute.For<ITransactionHistoryRepository>();
    private readonly IUnitOfWork _unitOfWorkMock = Substitute.For<IUnitOfWork>();
    private readonly RejectWithdrawalCommandHandler _handler;

    public RejectWithdrawalCommandTests()
    {
        _handler = new RejectWithdrawalCommandHandler(
            _currentUserMock,
            _withdrawalRepoMock,
            _userRepoMock,
            _transactionHistoryRepoMock,
            _unitOfWorkMock);
    }

    [Fact]
    public async Task Handle_Success_CreditsBalanceAndSetsRejected()
    {
        var adminId = Guid.NewGuid();
        _currentUserMock.Id.Returns(adminId);
        _currentUserMock.IsInRole(RoleConstants.Admin).Returns(true);

        var userId = Guid.NewGuid();
        var withdrawalId = Guid.NewGuid();
        var withdrawal = WithdrawalRequestEntity.Create(userId, Guid.NewGuid(), 100_000m, "123", "VTB", "111", "A", "B");
        _withdrawalRepoMock.GetByIdAsync(withdrawalId, default).Returns(withdrawal);

        var user = UserEntity.Create("user", "User", "user@a.com", "h", "sys");
        user.Balance = 10_000m;
        _userRepoMock.FindById(userId, default).Returns(user);

        var cmd = new RejectWithdrawalCommand(withdrawalId, "Invalid bank");

        var result = await _handler.Handle(cmd, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal(WithdrawalStatus.Rejected, withdrawal.Status);
        Assert.Equal(110_000m, user.Balance);
        await _transactionHistoryRepoMock.Received(1).AddAsync(Arg.Any<TransactionHistoryEntity>(), default);
        await _unitOfWorkMock.Received(1).SaveChangeAsync(default);
    }
}
