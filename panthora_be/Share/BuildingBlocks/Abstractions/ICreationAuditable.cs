namespace Domain.Abstractions;

public interface ICreationAuditable
{
    DateTimeOffset CreatedOnUtc { get; set; }
    string? CreatedBy { get; set; }
}
