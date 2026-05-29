namespace Domain.Events;

using Domain.Abstractions;
using System;
using System.Collections.Generic;

public sealed record RejectedActivityInfo(
    Guid ActivityId,
    int DayNumber,
    string Title
);

public sealed record ProviderRejectedTourInstanceEvent(
    Guid TourInstanceId,
    Guid SupplierId,
    string SupplierName,
    string ProviderType, // "Hotel" | "Transport"
    string? Note,
    IReadOnlyList<RejectedActivityInfo> Activities
) : IDomainEvent;
