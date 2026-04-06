namespace Contracts.ModelResponse;

public class ErrorResult
{
    public string? ErrorMessage { get; set; }
    public object? Details { get; set; }
    public ErrorResult(string errorMessage, object? details)
    {
        ErrorMessage = errorMessage;
        Details = details;
    }
}
