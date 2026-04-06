namespace Contracts.ModelResponse;

public sealed class ApiGetResponse<T>
{
    public T Result { get; set; } = default!;
    public ApiGetResponse() { }
    public ApiGetResponse(T result)
    {
        Result = result;
    }
}
