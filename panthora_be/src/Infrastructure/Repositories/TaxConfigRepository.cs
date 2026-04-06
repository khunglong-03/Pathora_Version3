using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;

namespace Infrastructure.Repositories;

public class TaxConfigRepository(AppDbContext context) : Repository<TaxConfigEntity>(context), ITaxConfigRepository
{
}
