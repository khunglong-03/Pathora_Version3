using ErrorOr;
using MediatR;

namespace Application.Features.Withdrawal.Queries.GetWithdrawalQR;

public sealed record GetWithdrawalQRQuery(Guid Id) : IRequest<ErrorOr<string>>;
