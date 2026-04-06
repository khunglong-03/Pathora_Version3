using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;

namespace Infrastructure.Repositories;

internal class RegisterRepository(AppDbContext context) : Repository<RegisterEntity>(context), IRegisterRepository
{
}
