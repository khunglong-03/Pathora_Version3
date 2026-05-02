namespace Domain.Specs.Application.Features.Public.Commands;

using global::Application.Features.Public.Commands;
using global::Contracts.Interfaces;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using global::Domain.UnitOfWork;
using global::NSubstitute;
using global::Xunit;

public sealed class CreatePublicBookingCommandHandlerTests
{
    [Fact]
    public async Task PrivateDraft_AllowsBooking_WhenCapacityOk()
    {
        var tourInstanceId = Guid.NewGuid();
        var tourInstance = CreateTourInstance(tourInstanceId);
        tourInstance.InstanceType = TourType.Private;
        tourInstance.Status = TourInstanceStatus.Draft;

        _tourInstanceRepository.FindById(tourInstanceId).Returns(tourInstance);
        _taxConfigRepository.GetListAsync(Arg.Any<System.Linq.Expressions.Expression<Func<TaxConfigEntity, bool>>?>(), Arg.Any<System.Linq.Expressions.Expression<Func<TaxConfigEntity, object>>[]?>(), Arg.Any<CancellationToken>())
            .Returns(Array.Empty<TaxConfigEntity>());
        _pricingPolicyRepository.GetActivePolicyByTourType(Arg.Any<TourType>(), Arg.Any<CancellationToken>())
            .Returns((PricingPolicy?)null);
        _pricingPolicyRepository.GetDefaultPolicy(Arg.Any<CancellationToken>())
            .Returns((PricingPolicy?)null);
        _depositPolicyRepository.GetAllActiveAsync(Arg.Any<CancellationToken>())
            .Returns(Array.Empty<DepositPolicyEntity>());
        var tour = new TourEntity { Id = tourInstance.TourId, TourScope = TourScope.Domestic };
        _tourRepository.FindById(tourInstance.TourId, true, Arg.Any<CancellationToken>())
            .Returns(tour);
        _bookingRepository.AddAsync(Arg.Any<BookingEntity>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(1));

        _user.Id.Returns((string?)null);

        var handler = CreateHandler();
        var cmd = new CreatePublicBookingCommand(
            tourInstanceId,
            "Name",
            "+84 912345678",
            null,
            2,
            0,
            0,
            PaymentMethod.BankTransfer,
            true);

        var result = await handler.Handle(cmd, CancellationToken.None);

        Assert.False(result.IsError);
    }

    private readonly IUser _user = Substitute.For<IUser>();
    private readonly IBookingRepository _bookingRepository = Substitute.For<IBookingRepository>();
    private readonly ITourInstanceRepository _tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
    private readonly ITaxConfigRepository _taxConfigRepository = Substitute.For<ITaxConfigRepository>();
    private readonly IPricingPolicyRepository _pricingPolicyRepository = Substitute.For<IPricingPolicyRepository>();
    private readonly ITourRepository _tourRepository = Substitute.For<ITourRepository>();
    private readonly IDepositPolicyRepository _depositPolicyRepository = Substitute.For<IDepositPolicyRepository>();
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();

    private CreatePublicBookingCommandHandler CreateHandler() => new(
        _user,
        _bookingRepository,
        _tourInstanceRepository,
        _taxConfigRepository,
        _pricingPolicyRepository,
        _tourRepository,
        _depositPolicyRepository,
        _userRepository,
        _unitOfWork);

    private static TourInstanceEntity CreateTourInstance(Guid id)
    {
        var ti = TourInstanceEntity.Create(
            tourId: Guid.NewGuid(),
            classificationId: Guid.NewGuid(),
            title: "T",
            tourName: "Tour",
            tourCode: "TC",
            classificationName: "Std",
            instanceType: TourType.Public,
            startDate: DateTimeOffset.UtcNow,
            endDate: DateTimeOffset.UtcNow.AddDays(2),
            maxParticipation: 100,
            basePrice: 1000m,
            performedBy: "system");
        ti.Id = id;
        ti.Status = TourInstanceStatus.Available;
        ti.CurrentParticipation = 0;
        return ti;
    }

    private void ArrangeHappyPath(Guid tourInstanceId)
    {
        var tourInstance = CreateTourInstance(tourInstanceId);
        _tourInstanceRepository.FindById(tourInstanceId).Returns(tourInstance);
        _taxConfigRepository.GetListAsync(Arg.Any<System.Linq.Expressions.Expression<Func<TaxConfigEntity, bool>>?>(), Arg.Any<System.Linq.Expressions.Expression<Func<TaxConfigEntity, object>>[]?>(), Arg.Any<CancellationToken>())
            .Returns(Array.Empty<TaxConfigEntity>());
        _pricingPolicyRepository.GetActivePolicyByTourType(Arg.Any<TourType>(), Arg.Any<CancellationToken>())
            .Returns((PricingPolicy?)null);
        _pricingPolicyRepository.GetDefaultPolicy(Arg.Any<CancellationToken>())
            .Returns((PricingPolicy?)null);
        _depositPolicyRepository.GetAllActiveAsync(Arg.Any<CancellationToken>())
            .Returns(Array.Empty<DepositPolicyEntity>());
        var tour = new TourEntity { Id = tourInstance.TourId, TourScope = TourScope.Domestic };
        _tourRepository.FindById(tourInstance.TourId, true, Arg.Any<CancellationToken>())
            .Returns(tour);
        _bookingRepository.AddAsync(Arg.Any<BookingEntity>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(1));
    }

    [Fact]
    public async Task Guest_WithEmailMatchingActiveUser_SetsBookingUserId()
    {
        var tourInstanceId = Guid.NewGuid();
        ArrangeHappyPath(tourInstanceId);
        var matchedUserId = Guid.NewGuid();
        var matched = new UserEntity
        {
            Id = matchedUserId,
            Email = "guest@example.com",
            Username = "guest",
            Status = UserStatus.Active,
            IsDeleted = false,
        };

        _user.Id.Returns((string?)null);
        _userRepository.GetByEmailAsync("guest@example.com", Arg.Any<CancellationToken>())
            .Returns(matched);

        BookingEntity? captured = null;
        await _bookingRepository.AddAsync(
            Arg.Do<BookingEntity>(b => captured = b),
            Arg.Any<CancellationToken>());

        var handler = CreateHandler();
        var cmd = new CreatePublicBookingCommand(
            tourInstanceId,
            "Name",
            "+84 912345678",
            "guest@example.com",
            2,
            0,
            0,
            PaymentMethod.BankTransfer,
            false);

        var result = await handler.Handle(cmd, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.NotNull(captured);
        Assert.Equal(matchedUserId, captured.UserId);
        await _userRepository.Received(1).GetByEmailAsync("guest@example.com", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Guest_WithNoEmailMatch_UserIdStaysNull()
    {
        var tourInstanceId = Guid.NewGuid();
        ArrangeHappyPath(tourInstanceId);
        _user.Id.Returns((string?)null);
        _userRepository.GetByEmailAsync("nobody@example.com", Arg.Any<CancellationToken>())
            .Returns((UserEntity?)null);

        BookingEntity? captured = null;
        await _bookingRepository.AddAsync(
            Arg.Do<BookingEntity>(b => captured = b),
            Arg.Any<CancellationToken>());

        var handler = CreateHandler();
        var cmd = new CreatePublicBookingCommand(
            tourInstanceId,
            "Name",
            "+84 912345678",
            "nobody@example.com",
            2,
            0,
            0,
            PaymentMethod.BankTransfer,
            false);

        var result = await handler.Handle(cmd, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.NotNull(captured);
        Assert.Null(captured.UserId);
    }

    [Fact]
    public async Task Authenticated_JwtUserWins_IgnoresEmailLookup()
    {
        var tourInstanceId = Guid.NewGuid();
        ArrangeHappyPath(tourInstanceId);
        var jwtUserId = Guid.NewGuid();
        _user.Id.Returns(jwtUserId.ToString());

        BookingEntity? captured = null;
        await _bookingRepository.AddAsync(
            Arg.Do<BookingEntity>(b => captured = b),
            Arg.Any<CancellationToken>());

        var handler = CreateHandler();
        var cmd = new CreatePublicBookingCommand(
            tourInstanceId,
            "Name",
            "+84 912345678",
            "other@example.com",
            2,
            0,
            0,
            PaymentMethod.BankTransfer,
            false);

        var result = await handler.Handle(cmd, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.NotNull(captured);
        Assert.Equal(jwtUserId, captured.UserId);
        await _userRepository.DidNotReceive().GetByEmailAsync(Arg.Any<string>(), Arg.Any<CancellationToken>());
    }
}
