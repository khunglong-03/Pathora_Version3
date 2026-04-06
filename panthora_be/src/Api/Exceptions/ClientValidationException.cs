namespace Api.Exceptions;

public sealed class ClientValidationException : Exception
{
    public object? Details { get; }

    public ClientValidationException(string message) : base(message)
    {
    }
    public ClientValidationException(string message, object? details) : base(message)
    {
        Details = details;
    }
}
