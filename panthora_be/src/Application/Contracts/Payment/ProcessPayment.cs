using Application.Services;
using MediatR;
using System.Text.Json.Serialization;

namespace Application.Contracts.Payment;

public sealed record ProcessPaymentCommand(
    [property: JsonPropertyName("response")] SePayApiResponse? Response) : IRequest<Unit>;
