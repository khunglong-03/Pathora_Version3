namespace Domain.ValueObjects;

public class TourInstanceGuide
{
    public string Name { get; set; } = null!;
    public string? AvatarUrl { get; set; }
    public List<string> Languages { get; set; } = [];
    public string? Experience { get; set; }
}
