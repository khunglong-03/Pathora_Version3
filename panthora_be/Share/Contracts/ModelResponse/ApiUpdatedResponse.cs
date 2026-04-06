namespace Contracts.ModelResponse;

public sealed class ApiUpdatedResponse<T>
{
    public T Value { get; set; } = default!;
    public ApiUpdatedResponse() { }
    public ApiUpdatedResponse(T value)
    {
        Value = value;
    }
}
