namespace Contracts;

public record PaginatedList<T>(
    int Total,
    List<T> Items,
    int PageNumber,
    int PageSize,
    Dictionary<string, int>? RoleCounts = null)
{
    public int TotalPages => PageSize > 0
        ? (int)Math.Ceiling(Total / (double)PageSize)
        : 0;
}
