namespace Application.Tours.Commands;

public sealed record ReviewTourRequest(TourReviewAction Action, string? Reason = null);