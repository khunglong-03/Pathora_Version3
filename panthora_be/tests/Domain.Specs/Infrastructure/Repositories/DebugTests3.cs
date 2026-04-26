using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Xunit;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Repositories;
using System.Collections.Generic;
using System;
using System.Threading.Tasks;
using System.Linq;

namespace Domain.Specs.Infrastructure.Repositories;
public class DebugTests3 {
    [Fact]
    public async Task Debug() {
        var options = new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase("debug3").Options;
        var context = new AppDbContext(options);
        var ownerUserId = Guid.NewGuid();
        var supplierId = Guid.NewGuid();
        
        var v1 = VehicleEntity.Create(VehicleType.Car, 4, ownerUserId, "test", quantity: 3);
        v1.SupplierId = supplierId; // Set SupplierId
        context.Vehicles.Add(v1);
        await context.SaveChangesAsync();

        var query = context.Vehicles.Where(v => v.IsActive && !v.IsDeleted);
        var res1 = query.ToList();
        throw new Exception($"res1 count: {res1.Count}, total count: {context.Vehicles.Count()}");
        
        // var ownedSupplierIds = new List<Guid> { supplierId };
        // var query2 = query.Where(v => (v.SupplierId != null && ownedSupplierIds.Any(id => id == v.SupplierId.Value))
        //      || (v.SupplierId == null && v.OwnerId == ownerUserId));
             
        // var res2 = query2.ToList();
        // Assert.Single(res2);
    }
}
