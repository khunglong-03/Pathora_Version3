namespace Domain.Constant;

public class SystemKey : Entity<int>
{
    public int ParentId { get; set; }
    public string CodeKey { get; set; } = null!;
    public int CodeValue { get; set; }
    public string Description { get; set; } = null!;
    public int SortOrder { get; set; }
    public bool IsDeleted { get; set; }
}
