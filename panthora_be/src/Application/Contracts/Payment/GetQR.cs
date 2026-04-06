using Application.Common.Constant;
using Application.Services;
using BuildingBlocks.CORS;
using ErrorOr;
using FluentValidation;
using MediatR;

namespace Application.Contracts.Payment
{
    public sealed record GetQRCommand(string note, long amount) : IRequest<ErrorOr<string>>;
    public class GetQRCommandValidator : AbstractValidator<GetQRCommand>
    {
        public GetQRCommandValidator()
        {
            RuleFor(x => x.note)
                .NotEmpty().WithMessage(ValidationMessages.GetQRContentRequired);

            RuleFor(x => x.amount)
                .GreaterThan(0).WithMessage(ValidationMessages.GetQRAmountGreaterThanZero);
        }
    }
    public sealed class GetQRCommandHandler(IPaymentService paymentService)
        : IRequestHandler<GetQRCommand, ErrorOr<string>>
    {
        public async Task<ErrorOr<string>> Handle(GetQRCommand request, CancellationToken cancellationToken)
        {
            return await paymentService.GetQR(request.note, request.amount);
        }
    }
}