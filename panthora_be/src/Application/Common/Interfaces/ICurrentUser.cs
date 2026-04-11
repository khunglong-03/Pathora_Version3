using System;

namespace Application.Common.Interfaces;

public interface ICurrentUser
{
    Guid? Id { get; }
}
