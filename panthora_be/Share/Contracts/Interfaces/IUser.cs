namespace Contracts.Interfaces;

public interface IUser
{
    string? Id { get; }
    string? Username { get; }
    IEnumerable<string> Roles { get; }
}
