namespace Contracts.ModelResponse;

public sealed class ApiPerformedResponse<T>
{
    public T Result { get; set; } = default!;
    public ApiPerformedResponse() { }
    public ApiPerformedResponse(T result)
    {
        Result = result;
    }
}
