using Application.Features.User.Commands;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Features.User.Commands;

public sealed class UpdateUserStatusCommandHandlerTests
{
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<UpdateUserStatusCommandHandler> _logger;
    private readonly UpdateUserStatusCommandHandler _handler;

    public UpdateUserStatusCommandHandlerTests()
    {
        _userRepository = Substitute.For<IUserRepository>();
        _unitOfWork = Substitute.For<IUnitOfWork>();
        _logger = Substitute.For<ILogger<UpdateUserStatusCommandHandler>>();

        _handler = new UpdateUserStatusCommandHandler(
            _userRepository,
            _unitOfWork,
            _logger);
    }

    [Fact]
    public async Task Handle_UserNotFound_ReturnsNotFound()
    {
        // Arrange
        var request = new UpdateUserStatusCommand(Guid.NewGuid(), UserStatus.Inactive);
        _userRepository.FindById(request.UserId, Arg.Any<CancellationToken>())
            .Returns((UserEntity?)null);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        Assert.True(result.IsError);
        Assert.Equal(ErrorType.NotFound, result.FirstError.Type);
        Assert.Equal("User.NotFound", result.FirstError.Code);
    }

    [Fact]
    public async Task Handle_UserFound_UpdatesStatusAndReturnsSuccess()
    {
        // Arrange
        var userId = Guid.Parse("019d9f1f-12e1-7a2d-a798-d2059f6c8df9");
        var request = new UpdateUserStatusCommand(userId, UserStatus.Inactive);
        
        var user = new UserEntity
        {
            Id = userId,
            Status = UserStatus.Active
        };

        _userRepository.FindById(userId, Arg.Any<CancellationToken>())
            .Returns(user);

        // Act
        var result = await _handler.Handle(request, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(UserStatus.Inactive, user.Status);
        Assert.Equal("admin", user.LastModifiedBy);

        _userRepository.Received(1).Update(user);
        await _unitOfWork.Received(1).SaveChangeAsync(Arg.Any<CancellationToken>());
    }
}
