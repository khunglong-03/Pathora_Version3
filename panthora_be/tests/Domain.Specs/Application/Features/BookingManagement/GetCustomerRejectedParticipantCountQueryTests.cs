using Application.Features.BookingManagement.Queries;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using FluentAssertions;
using NSubstitute;
using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace Domain.Specs.Application.Features.BookingManagement;

public class GetCustomerRejectedParticipantCountQueryTests
{
    private readonly IBookingParticipantRepository _participantRepoMock = Substitute.For<IBookingParticipantRepository>();
    private readonly IUser _currentUserMock = Substitute.For<IUser>();
    private readonly Guid _userId = Guid.NewGuid();

    public GetCustomerRejectedParticipantCountQueryTests()
    {
        _currentUserMock.Id.Returns(_userId.ToString());
    }

    [Fact]
    public async Task Handle_Unauthorized_ReturnsError()
    {
        // Arrange
        _currentUserMock.Id.Returns((string?)null);
        var handler = new GetCustomerRejectedParticipantCountQueryHandler(_currentUserMock, _participantRepoMock);
        var query = new GetCustomerRejectedParticipantCountQuery();

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Unauthorized);
    }

    [Fact]
    public async Task Handle_HappyPath_ReturnsCount()
    {
        // Arrange
        var mockParticipants = new List<BookingParticipantEntity>
        {
            new BookingParticipantEntity { Id = Guid.NewGuid(), InfoReviewStatus = ParticipantInfoReviewStatus.Rejected },
            new BookingParticipantEntity { Id = Guid.NewGuid(), InfoReviewStatus = ParticipantInfoReviewStatus.Rejected }
        };

        _participantRepoMock.GetListAsync(
            Arg.Any<Expression<Func<BookingParticipantEntity, bool>>>(),
            Arg.Any<Expression<Func<BookingParticipantEntity, object>>[]>(),
            Arg.Any<CancellationToken>()
        ).Returns(mockParticipants);

        var handler = new GetCustomerRejectedParticipantCountQueryHandler(_currentUserMock, _participantRepoMock);
        var query = new GetCustomerRejectedParticipantCountQuery();

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsError.Should().BeFalse();
        result.Value.Should().Be(2);
    }
}
