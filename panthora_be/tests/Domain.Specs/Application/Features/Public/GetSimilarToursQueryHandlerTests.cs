namespace Domain.Specs.Application.Features.Public.Queries;

using global::Application.Contracts.Public;
using global::Application.Features.Public.Queries;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using global::NSubstitute;
using global::Xunit;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

public sealed class GetSimilarToursQueryHandlerTests
{
    private readonly ITourRepository _tourRepository = Substitute.For<ITourRepository>();

    [Fact]
    public async Task Handle_ShouldReturnSimilarTours_SortedByScoreDescending()
    {
        // Arrange
        var currentTourId = Guid.NewGuid();
        var currentTour = new TourEntity
        {
            Id = currentTourId,
            TourCode = "TOUR-CUR",
            TourName = "Current Tour",
            ShortDescription = "Desc",
            Status = TourStatus.Active,
            TourScope = TourScope.Domestic,
            IsVisa = false,
            IsDeleted = false,
            PlanLocations = new List<TourPlanLocationEntity>
            {
                new TourPlanLocationEntity { LocationName = "Ha Noi" }
            },
            Classifications = new List<TourClassificationEntity>
            {
                new TourClassificationEntity { Name = "Luxury", BasePrice = 1000 }
            }
        };

        var tourA = new TourEntity
        {
            Id = Guid.NewGuid(),
            TourCode = "TOUR-A",
            TourName = "Tour A (Same Location, Same Classification)",
            ShortDescription = "Desc",
            Status = TourStatus.Active,
            TourScope = TourScope.Domestic,
            IsVisa = false,
            IsDeleted = false,
            PlanLocations = new List<TourPlanLocationEntity>
            {
                new TourPlanLocationEntity { LocationName = "Ha Noi" }
            },
            Classifications = new List<TourClassificationEntity>
            {
                new TourClassificationEntity { Name = "Luxury", BasePrice = 2000 }
            }
        };

        var tourB = new TourEntity
        {
            Id = Guid.NewGuid(),
            TourCode = "TOUR-B",
            TourName = "Tour B (Same Location, Different Classification)",
            ShortDescription = "Desc",
            Status = TourStatus.Active,
            TourScope = TourScope.Domestic,
            IsVisa = false,
            IsDeleted = false,
            PlanLocations = new List<TourPlanLocationEntity>
            {
                new TourPlanLocationEntity { LocationName = "Ha Noi" }
            },
            Classifications = new List<TourClassificationEntity>
            {
                new TourClassificationEntity { Name = "Standard", BasePrice = 1500 }
            }
        };

        var tourC = new TourEntity
        {
            Id = Guid.NewGuid(),
            TourCode = "TOUR-C",
            TourName = "Tour C (Different Location, Same Classification)",
            ShortDescription = "Desc",
            Status = TourStatus.Active,
            TourScope = TourScope.Domestic,
            IsVisa = false,
            IsDeleted = false,
            PlanLocations = new List<TourPlanLocationEntity>
            {
                new TourPlanLocationEntity { LocationName = "Saigon" }
            },
            Classifications = new List<TourClassificationEntity>
            {
                new TourClassificationEntity { Name = "Luxury", BasePrice = 1800 }
            }
        };

        var allToursList = new List<TourEntity> { currentTour, tourA, tourB, tourC };

        _tourRepository.FindById(currentTourId, true, Arg.Any<CancellationToken>()).Returns(currentTour);
        _tourRepository.FindAll(
            Arg.Any<string>(),
            Arg.Any<int>(),
            Arg.Any<int>(),
            principalId: null,
            status: TourStatus.Active,
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(allToursList);

        var handler = new GetSimilarToursQueryHandler(_tourRepository);

        // Act
        var result = await handler.Handle(new GetSimilarToursQuery(currentTourId, "vi"), CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        var similarTours = result.Value;
        Assert.Equal(3, similarTours.Count);

        // Tour A: location (+3) + class (+2) + scope (+1) + visa (+1) = 7
        // Tour B: location (+3) + class (0) + scope (+1) + visa (+1) = 5
        // Tour C: location (0) + class (+2) + scope (+1) + visa (+1) = 4
        Assert.Equal(tourA.Id, similarTours[0].Id);
        Assert.Equal(tourB.Id, similarTours[1].Id);
        Assert.Equal(tourC.Id, similarTours[2].Id);
    }

    [Fact]
    public async Task Handle_ShouldExcludeCurrentTour()
    {
        // Arrange
        var currentTourId = Guid.NewGuid();
        var currentTour = new TourEntity
        {
            Id = currentTourId,
            TourCode = "TOUR-CUR",
            TourName = "Current Tour",
            ShortDescription = "Desc",
            Status = TourStatus.Active,
            IsDeleted = false,
            PlanLocations = new List<TourPlanLocationEntity> { new TourPlanLocationEntity { LocationName = "Ha Noi" } },
            Classifications = new List<TourClassificationEntity> { new TourClassificationEntity { Name = "Luxury" } }
        };

        var allToursList = new List<TourEntity> { currentTour };

        _tourRepository.FindById(currentTourId, true, Arg.Any<CancellationToken>()).Returns(currentTour);
        _tourRepository.FindAll(
            null, 1, 100,
            status: TourStatus.Active,
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(allToursList);

        var handler = new GetSimilarToursQueryHandler(_tourRepository);

        // Act
        var result = await handler.Handle(new GetSimilarToursQuery(currentTourId, "vi"), CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Empty(result.Value);
    }
}
