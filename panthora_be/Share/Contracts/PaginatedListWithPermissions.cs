namespace Contracts;

public record PaginatedListWithPermissions<T>(
    int Total,
    List<T> Data,
    Dictionary<string, bool> ButtonShow);
