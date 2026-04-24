using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;

namespace Contracts.ModelResponse;

public sealed class PaginatedList<T>
{
    [JsonPropertyName("totalCount")]
    public int TotalCount { get; init; }

    [JsonPropertyName("items")]
    public IReadOnlyList<T> Items { get; init; } = Array.Empty<T>();

    [JsonPropertyName("page")]
    public int Page { get; init; }

    [JsonPropertyName("limit")]
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
