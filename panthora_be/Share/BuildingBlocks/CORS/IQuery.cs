using MediatR;

namespace BuildingBlocks.CORS;

public interface IQuery<TResponse> : IRequest<TResponse>
{
}
