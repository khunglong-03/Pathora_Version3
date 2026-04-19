using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

public class Parent
{
    public Guid Id { get; set; }
    public List<Child> Children { get; set; } = new List<Child>();
}

public class Child
{
    public Guid Id { get; set; }
    public Guid ParentId { get; set; }
    public Parent Parent { get; set; }
}

public class TestDbContext : DbContext
{
    public DbSet<Parent> Parents { get; set; }
    public DbSet<Child> Children { get; set; }
    
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        => optionsBuilder.UseInMemoryDatabase("TestDb");
}

class Program
{
    static void Main()
    {
        using var ctx = new TestDbContext();
        var parent = new Parent { Id = Guid.NewGuid() };
        ctx.Parents.Add(parent);
        ctx.SaveChanges();
        
        // Simulating the scenario:
        var child = new Child { Id = Guid.NewGuid() }; // Non-empty GUID!
        parent.Children.Add(child);
        
        ctx.ChangeTracker.DetectChanges();
        
        Console.WriteLine($"State of Parent: {ctx.Entry(parent).State}");
        Console.WriteLine($"State of Child: {ctx.Entry(child).State}");
    }
}
