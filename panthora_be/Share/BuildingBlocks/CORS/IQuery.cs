using MediatR;

namespace BuildingBlocks.CORS;

public interface IQuery<out TResponse> : IRequest<TResponse>
{
}
