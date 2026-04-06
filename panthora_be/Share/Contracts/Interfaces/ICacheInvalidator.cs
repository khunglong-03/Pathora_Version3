namespace Contracts.Interfaces;

public interface ICacheInvalidator
{
    IReadOnlyList<string> CacheKeysToInvalidate { get; }
}
