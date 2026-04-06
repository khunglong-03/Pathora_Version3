namespace Api.Exceptions;

public sealed class NotFoundException : Exception
{
    public object? Details { get; }
    public NotFoundException(string message) : base(message)
    {
    }
    public NotFoundException(string message, object? details) : base(message)
    {
        Details = details;
    }

}
