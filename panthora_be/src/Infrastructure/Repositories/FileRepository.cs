using Domain.Common.Repositories;
using Domain.Entities;
using ErrorOr;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class FileRepository(AppDbContext context) : IFileRepository
{
    private readonly AppDbContext _context = context;

    public async Task<ErrorOr<Success>> AddRange(FileMetadataEntity[] fileMetadatas)
    {
        await _context.FileMetadatas.AddRangeAsync(fileMetadatas);
        await _context.SaveChangesAsync();
        return Result.Success;
    }

    public async Task<ErrorOr<List<FileMetadataEntity>>> FindByIds(IEnumerable<Guid> ids)
    {
        var idList = ids.ToList();
        return await _context.FileMetadatas
            .AsNoTracking()
            .Where(f => idList.Contains(f.Id) && !f.IsDeleted)
            .ToListAsync();
    }

    public async Task<ErrorOr<List<FileMetadataEntity>>> FindByLinkedEntityIds(IEnumerable<string> ids)
    {
        var guidIds = ids.Where(id => Guid.TryParse(id, out _)).Select(Guid.Parse).ToList();
        return await _context.FileMetadatas
            .AsNoTracking()
            .Where(f => guidIds.Contains(f.LinkedEntityId) && !f.IsDeleted)
            .ToListAsync();
    }

    public async Task<ErrorOr<Success>> DeleteRange(List<Guid> ids)
    {
        var files = await _context.FileMetadatas.Where(f => ids.Contains(f.Id)).ToListAsync();
        foreach (var file in files)
            file.IsDeleted = true;
        await _context.SaveChangesAsync();
        return Result.Success;
    }

    public async Task<ErrorOr<Success>> DeleteByLinkedEntityId(Guid id)
    {
        var files = await _context.FileMetadatas.Where(f => f.LinkedEntityId == id).ToListAsync();
        foreach (var file in files)
            file.IsDeleted = true;
        await _context.SaveChangesAsync();
        return Result.Success;
    }
}
