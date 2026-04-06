using Application.Services;
using MediatR;

namespace Application.Contracts.Payment;

public sealed record ProcessPaymentCommand(SePayApiResponse? Response) : IRequest<Unit>;
