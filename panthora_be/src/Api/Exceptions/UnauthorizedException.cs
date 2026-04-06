namespace Api.Exceptions;

public sealed class UnauthorizedException : Exception
{
    public object? Details { get; }

    public UnauthorizedException(string message) : base(message)
    {
    }
    public UnauthorizedException(string message, object? details) : base(message)
    {
        Details = details;
    }

}
