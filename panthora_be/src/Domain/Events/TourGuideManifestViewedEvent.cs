namespace Domain.Events;

using System;
using System.Collections.Generic;
using Domain.Abstractions;

public sealed record TourGuideManifestViewedEvent(
    Guid GuideUserId,
    Guid TourInstanceId,
    DateTimeOffset ViewedAt,
    IReadOnlyList<Guid> BookingIds
) : IDomainEvent;
