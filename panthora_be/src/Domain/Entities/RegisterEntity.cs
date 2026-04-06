namespace Domain.Entities;

public class RegisterEntity : Aggregate<Guid>
{
    public string Username { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public bool IsDeleted { get; set; }
}
