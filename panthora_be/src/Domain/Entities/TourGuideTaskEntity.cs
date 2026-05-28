using Domain.Enums;
using System.Collections.Generic;

namespace Domain.Entities;

public class TourGuideTaskEntity : Aggregate<Guid>
{
    public Guid TourInstanceId { get; set; }
    public virtual TourInstanceEntity TourInstance { get; set; } = null!;

    public string? AssignedGuideId { get; set; }

    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsMandatory { get; set; }
    public TourGuideTaskStatus Status { get; set; } = TourGuideTaskStatus.Pending;
    
    public DateTimeOffset? CompletedAt { get; set; }
    public string? CompletedBy { get; set; }

    public string? Notes { get; set; }
    public List<string> EvidenceImageUrls { get; set; } = [];

    public static TourGuideTaskEntity Create(
        Guid tourInstanceId,
        string title,
        string? description,
        bool isMandatory,
        string? assignedGuideId,
        string performedBy)
    {
        return new TourGuideTaskEntity
        {
            Id = Guid.CreateVersion7(),
            TourInstanceId = tourInstanceId,
            Title = title,
            Description = description,
            IsMandatory = isMandatory,
            AssignedGuideId = assignedGuideId,
            Status = TourGuideTaskStatus.Pending,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }
}
