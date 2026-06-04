using Application.Common.Constant;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Mails;
using ErrorOr;
using FluentValidation;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Public.Commands;

public sealed record SubscribeNewsletterCommand(
    [property: JsonPropertyName("email")] string Email) : ICommand<ErrorOr<Success>>;

public sealed class SubscribeNewsletterCommandValidator : AbstractValidator<SubscribeNewsletterCommand>
{
    public SubscribeNewsletterCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống.")
            .EmailAddress().WithMessage("Địa chỉ email không đúng định dạng.");
    }
}

public sealed class SubscribeNewsletterCommandHandler(
    ITourRepository tourRepository,
    IMailRepository mailRepository,
    IConfiguration configuration)
    : ICommandHandler<SubscribeNewsletterCommand, ErrorOr<Success>>
{
    private readonly ITourRepository _tourRepository = tourRepository;
    private readonly IMailRepository _mailRepository = mailRepository;
    private readonly IConfiguration _configuration = configuration;

    public async Task<ErrorOr<Success>> Handle(
        SubscribeNewsletterCommand request,
        CancellationToken cancellationToken)
    {
        var frontendBaseUrl = (_configuration["AppConfig:FrontendBaseUrl"] ?? "http://localhost:3003").TrimEnd('/');

        // 1. Fetch featured tours (limit 3)
        var tours = await _tourRepository.FindFeaturedTours(3, cancellationToken) ?? [];

        // 2. Fallback to latest tours if we have fewer than 3 featured tours
        if (tours.Count < 3)
        {
            var missingCount = 3 - tours.Count;
            var latestTours = await _tourRepository.FindLatestTours(10, cancellationToken) ?? [];

            foreach (var latestTour in latestTours)
            {
                if (tours.Count >= 3)
                {
                    break;
                }

                if (tours.All(t => t.Id != latestTour.Id))
                {
                    tours.Add(latestTour);
                }
            }
        }

        // 3. Map tours to DTOs
        var tourDtos = tours.Select(t =>
        {
            var classification = t.Classifications?
                .Where(c => !c.IsDeleted)
                .OrderBy(c => c.BasePrice)
                .FirstOrDefault();

            var priceText = classification != null
                ? $"{classification.BasePrice:N0} VND"
                : "Liên hệ";

            var deepLink = $"{frontendBaseUrl}/tours/{t.Id}";
            var imageUrl = t.Thumbnail?.PublicURL ?? "";

            // Limit description to prevent overflow in email layout
            var description = t.ShortDescription ?? "";
            if (description.Length > 150)
            {
                description = description[..147] + "...";
            }

            return new NewsletterTourDto(
                t.TourName,
                description,
                priceText,
                imageUrl,
                deepLink);
        }).ToList();

        // 4. Create Mail Model and MailEntity
        var welcomeMail = new NewsletterWelcomeMail(
            request.Email,
            tourDtos,
            $"{frontendBaseUrl}/tours");

        var mailEntity = welcomeMail.ToMail(request.Email);

        // 5. Add to queue (saved to DbContext immediately by repository.Add)
        var result = await _mailRepository.Add(mailEntity, cancellationToken);
        if (result.IsError)
        {
            return result.Errors;
        }

        return Result.Success;
    }
}

