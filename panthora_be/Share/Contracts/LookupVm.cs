namespace Contracts;

public sealed class LookupVm
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;

    public LookupVm()
    {
    }

    public LookupVm(string id, string name)
    {
        Id = id;
        Name = name;
    }
}
