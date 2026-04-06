using System.Collections.Concurrent;

namespace Application.Common.Behaviors;

public sealed class CacheKeyTracker
{
    private readonly ConcurrentDictionary<string, ConcurrentDictionary<string, byte>> _tagToKeys = new();

    public void Track(string tag, string cacheKey)
    {
        var keys = _tagToKeys.GetOrAdd(tag, _ => new ConcurrentDictionary<string, byte>());
        keys.TryAdd(cacheKey, 0);
    }

    public IReadOnlyList<string> GetKeys(string tag)
    {
        return _tagToKeys.TryGetValue(tag, out var keys)
            ? [.. keys.Keys]
            : [];
    }

    public void RemoveKeys(string tag)
    {
        if (_tagToKeys.TryRemove(tag, out _)) { }
    }
}
