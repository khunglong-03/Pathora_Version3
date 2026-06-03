using System.Collections.Generic;

namespace Domain.Mails;

[Mail("[Pathora] Đăng ký bản tin thành công - Khám phá các tour du lịch hot nhất", "newsletter-welcome")]
public record NewsletterWelcomeMail(
    string Email,
    List<NewsletterTourDto> FeaturedTours,
    string ViewMoreLink);

public record NewsletterTourDto(
    string Title,
    string Description,
    string PriceText,
    string ImageUrl,
    string DeepLink);
