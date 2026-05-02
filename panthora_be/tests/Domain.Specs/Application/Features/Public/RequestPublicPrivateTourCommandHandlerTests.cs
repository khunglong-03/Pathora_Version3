using System.Linq.Expressions;
using global::Application.Features.Public.Commands;
using global::Application.Features.TourInstance.Commands;
using global::Application.Services;
using global::Contracts.Interfaces;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using global::Domain.UnitOfWork;
using global::NSubstitute;
using global::Xunit;

namespace Domain.Specs.Application.Features.Public.Commands;

public sealed class RequestPublicPrivateTourCommandHandlerTests
{
    private readonly ITourInstanceService _tourInstanceService = Substitute.For<ITourInstanceService>();
    private readonly IUser _user = Substitute.For<IUser>();
    private readonly IBookingRepository _bookingRepository = Substitute.For<IBookingRepository>();
    private readonly ITourInstanceRepository _tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
    private readonly ITourRepository _tourRepository = Substitute.For<ITourRepository>();
    private readonly ITaxConfigRepository _taxConfigRepository = Substitute.For<ITaxConfigRepository>();
    private readonly IPricingPolicyRepository _pricingPolicyRepository = Substitute.For<IPricingPolicyRepository>();
    private readonly IDepositPolicyRepository _depositPolicyRepository = Substitute.For<IDepositPolicyRepository>();
    private readonly IUserRepository _userRepository = Substitute.For<IUserRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly ITourInstanceNotificationBroadcaster _notificationBroadcaster = Substitute.For<ITourInstanceNotificationBroadcaster>();

    private RequestPublicPrivateTourCommandHandler CreateHandler() => new(
        _tourInstanceService,
        _user,
        _bookingRepository,
        _tourInstanceRepository,
        _tourRepository,
        _taxConfigRepository,
        _pricingPolicyRepository,
        _depositPolicyRepository,
        _userRepository,
        _unitOfWork,
        _notificationBroadcaster);

    [Fact]
    public async Task HappyPath_CreatesPrivateDraftAndSetsBookingType()
    {
        var tourId = Guid.NewGuid();
        var classificationId = Guid.NewGuid();
        var operatorId = Guid.NewGuid();
        var instanceId = Guid.NewGuid();

        var tour = new TourEntity
        {
            Id = tourId,
            TourName = "Ha Long",
            TourCode = "HL",
            Status = TourStatus.Active,
            TourScope = TourScope.Domestic,
            TourOperatorId = operatorId,
            Thumbnail = new ImageEntity { FileId = "f", FileName = "n", PublicURL = "https://cdn/x.jpg" },
            Classifications =
            [
                new TourClassificationEntity
                {
                    Id = classificationId,
                    TourId = tourId,
                    BasePrice = 1_000_000m,
                    Name = "Standard",
                    Description = "d",
                    NumberOfDay = 3,
                    NumberOfNight = 2,
                }
            ]
        };

        _tourRepository.FindById(tourId, true, Arg.Any<CancellationToken>())
            .Returns(tour);

        _tourInstanceService.CreatePublicPrivateDraftAsync(Arg.Any<CreateTourInstanceCommand>())
            .Returns(instanceId);

        var instance = TourInstanceEntity.Create(
            tourId,
            classificationId,
            "Private — Ha Long",
            tour.TourName,
            tour.TourCode,
            "Standard",
            TourType.Private,
            DateTimeOffset.UtcNow.AddDays(7),
            DateTimeOffset.UtcNow.AddDays(10),
            8,
            tour.Classifications[0].BasePrice,
            operatorId.ToString(),
            thumbnail: new ImageEntity { FileId = "f", FileName = "n", PublicURL = "u" });

        instance.Id = instanceId;

        _tourInstanceRepository.FindById(instanceId).Returns(instance);

        _taxConfigRepository.GetListAsync(Arg.Any<System.Linq.Expressions.Expression<Func<TaxConfigEntity, bool>>?>(), Arg.Any<System.Linq.Expressions.Expression<Func<TaxConfigEntity, object>>[]?>(), Arg.Any<CancellationToken>())
            .Returns([]);
        _pricingPolicyRepository.GetActivePolicyByTourType(Arg.Any<TourType>(), Arg.Any<CancellationToken>())
            .Returns((PricingPolicy?)null);
        _pricingPolicyRepository.GetDefaultPolicy(Arg.Any<CancellationToken>())
            .Returns((PricingPolicy?)null);
        _depositPolicyRepository.GetAllActiveAsync(Arg.Any<CancellationToken>())
            .Returns([]);

        _user.Id.Returns((string?)null);

        BookingEntity? captured = null;
        await _bookingRepository.AddAsync(
            Arg.Do<BookingEntity>(b => captured = b),
            Arg.Any<CancellationToken>());
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(1));

        var cmd = new RequestPublicPrivateTourCommand(
            tourId,
            classificationId,
            instance.StartDate,
            instance.EndDate,
            8,
            "Nguyen A",
            "+84 912345678",
            null,
            2,
            0,
            0,
            PaymentMethod.BankTransfer,
            true,
            true,
            null);

        var result = await CreateHandler().Handle(cmd, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.NotNull(captured);
        Assert.Equal(BookingType.PrivateCustomTourRequest, captured!.BookingType);
        Assert.Equal(instanceId, captured.TourInstanceId);
        Assert.Equal(100m, result.Value.DepositPercentage);
        Assert.Equal(result.Value.TotalPrice, result.Value.DepositAmount);

        await _tourInstanceService.Received(1).CreatePublicPrivateDraftAsync(
            Arg.Is<CreateTourInstanceCommand>(c =>
                c.TourId == tourId
                && c.ClassificationId == classificationId
                && c.InstanceType == TourType.Private
                && c.Title == "Private — Ha Long"
                && c.MaxParticipation == 8));
    }
}
