using System;
using System.Collections.Generic;
using System.Linq;

namespace Contracts.ModelResponse;

public sealed class PaginatedList<T>
{
    public int TotalCount { get; init; }
    public IReadOnlyList<T> Items { get; init; } = Array.Empty<T>();
    public int Page { get; init; }
    public int Limit { get; init; }

    public PaginatedList(int totalCount, IEnumerable<T> items, int page, int limit)
    {
        TotalCount = totalCount;
        Items = items?.ToList().AsReadOnly() ?? Array.Empty<T>();
        Page = page;
        Limit = limit;
    }

    public override bool Equals(object? obj)
    {
        if (obj is not PaginatedList<T> other)
            return false;

        if (!Items.SequenceEqual(other.Items))
            return false;

        return TotalCount == other.TotalCount &&
               Page == other.Page &&
               Limit == other.Limit;
    }

    public override int GetHashCode()
    {
        var hash = new HashCode();
        hash.Add(TotalCount);
        hash.Add(Page);
        hash.Add(Limit);
        foreach (var item in Items)
        {
            hash.Add(item);
        }
        return hash.ToHashCode();
    }
}
