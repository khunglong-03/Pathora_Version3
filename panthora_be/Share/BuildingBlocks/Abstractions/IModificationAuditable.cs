namespace Domain.Abstractions;

public interface IModificationAuditable
{
    DateTimeOffset? LastModifiedOnUtc { get; set; }
    string? LastModifiedBy { get; set; }

}
