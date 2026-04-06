using Domain.Entities;
using ErrorOr;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Common.Repositories;

public interface IFileRepository
{
    Task<ErrorOr<Success>> AddRange(FileMetadataEntity[] fileMetadatas);
    Task<ErrorOr<List<FileMetadataEntity>>> FindByIds(IEnumerable<Guid> ids);
    Task<ErrorOr<List<FileMetadataEntity>>> FindByLinkedEntityIds(IEnumerable<string> ids);
    Task<ErrorOr<Success>> DeleteRange(List<Guid> ids);
    Task<ErrorOr<Success>> DeleteByLinkedEntityId(Guid id);
}
