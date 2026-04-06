namespace Contracts.ModelResponse;

public sealed class ApiDeletedResponse<T>
{
    public T Value { get; set; } = default!;
    public ApiDeletedResponse() { }
    public ApiDeletedResponse(T value)
    {
        Value = value;
    }
}
