namespace Domain.Specs.Application.Features.Public.Commands;

using global::Application.Features.Public.Commands;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using global::Domain.Mails;
using global::NSubstitute;
using global::Xunit;
using global::ErrorOr;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

public sealed class SubscribeNewsletterCommandHandlerTests
{
    private readonly ITourRepository _tourRepository = Substitute.For<ITourRepository>();
    private readonly IMailRepository _mailRepository = Substitute.For<IMailRepository>();
    private readonly Microsoft.Extensions.Configuration.IConfiguration _configuration = Substitute.For<Microsoft.Extensions.Configuration.IConfiguration>();

    public SubscribeNewsletterCommandHandlerTests()
    {
        _configuration["AppConfig:FrontendBaseUrl"].Returns("http://localhost:3003");
    }

    [Fact]
    public async Task Handle_ShouldQueueWelcomeEmail_WithFeaturedTours()
    {
        // Arrange
        var email = "test@gmail.com";
        var featuredTours = new List<TourEntity>
        {
            new() { Id = Guid.NewGuid(), TourName = "Featured Tour 1", ShortDescription = "Desc 1", LongDescription = "Desc 1", Status = TourStatus.Active, Classifications = [new() { Name = "Class 1", BasePrice = 1000 }] },
            new() { Id = Guid.NewGuid(), TourName = "Featured Tour 2", ShortDescription = "Desc 2", LongDescription = "Desc 2", Status = TourStatus.Active, Classifications = [new() { Name = "Class 2", BasePrice = 2000 }] },
            new() { Id = Guid.NewGuid(), TourName = "Featured Tour 3", ShortDescription = "Desc 3", LongDescription = "Desc 3", Status = TourStatus.Active, Classifications = [new() { Name = "Class 3", BasePrice = 3000 }] }
        };

        _tourRepository.FindFeaturedTours(3, Arg.Any<CancellationToken>()).Returns(featuredTours);
        _mailRepository.Add(Arg.Any<MailEntity>(), Arg.Any<CancellationToken>()).Returns(Result.Success);

        var handler = new SubscribeNewsletterCommandHandler(_tourRepository, _mailRepository, _configuration);

        // Act
        var result = await handler.Handle(new SubscribeNewsletterCommand(email), CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        await _mailRepository.Received(1).Add(Arg.Is<MailEntity>(m => 
            m.To == email && 
            m.Template == "newsletter-welcome" && 
            m.Body.Contains("Featured Tour 1") &&
            m.Body.Contains("Featured Tour 2") &&
            m.Body.Contains("Featured Tour 3")
        ), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ShouldFallbackToLatestTours_WhenFeaturedToursAreFewerThan3()
    {
        // Arrange
        var email = "fallback@gmail.com";
        var featuredTours = new List<TourEntity>
        {
            new() { Id = Guid.NewGuid(), TourName = "Featured Tour 1", ShortDescription = "Desc 1", LongDescription = "Desc 1", Status = TourStatus.Active, Classifications = [new() { Name = "Class 1", BasePrice = 1000 }] }
        };

        var latestTours = new List<TourEntity>
        {
            new() { Id = featuredTours[0].Id, TourName = "Featured Tour 1", ShortDescription = "Desc 1", LongDescription = "Desc 1", Status = TourStatus.Active, Classifications = [new() { Name = "Class 1", BasePrice = 1000 }] }, // Duplicate
            new() { Id = Guid.NewGuid(), TourName = "Latest Tour 2", ShortDescription = "Desc 2", LongDescription = "Desc 2", Status = TourStatus.Active, Classifications = [new() { Name = "Class 2", BasePrice = 2000 }] },
            new() { Id = Guid.NewGuid(), TourName = "Latest Tour 3", ShortDescription = "Desc 3", LongDescription = "Desc 3", Status = TourStatus.Active, Classifications = [new() { Name = "Class 3", BasePrice = 3000 }] }
        };

        _tourRepository.FindFeaturedTours(3, Arg.Any<CancellationToken>()).Returns(featuredTours);
        _tourRepository.FindLatestTours(10, Arg.Any<CancellationToken>()).Returns(latestTours);
        _mailRepository.Add(Arg.Any<MailEntity>(), Arg.Any<CancellationToken>()).Returns(Result.Success);

        var handler = new SubscribeNewsletterCommandHandler(_tourRepository, _mailRepository, _configuration);

        // Act
        var result = await handler.Handle(new SubscribeNewsletterCommand(email), CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        await _mailRepository.Received(1).Add(Arg.Is<MailEntity>(m => 
            m.To == email && 
            m.Template == "newsletter-welcome" && 
            m.Body.Contains("Featured Tour 1") &&
            m.Body.Contains("Latest Tour 2") &&
            m.Body.Contains("Latest Tour 3")
        ), Arg.Any<CancellationToken>());
    }
}
