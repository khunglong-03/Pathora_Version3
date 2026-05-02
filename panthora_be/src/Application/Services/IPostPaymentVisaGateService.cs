using System;
using System.Threading;
using System.Threading.Tasks;
using Domain.Entities;

namespace Application.Services;

public interface IPostPaymentVisaGateService
{
    /// <summary>Returns true if provider assignments should be triggered.</summary>
    Task<bool> HandlePostConfirmVisaOrAssignmentsAsync(TourInstanceEntity tourInstance, string transactionCode, CancellationToken cancellationToken = default);

    Task TryCompleteVisaGateAsync(Guid bookingId, CancellationToken cancellationToken = default);

    Task<bool> MarkVisaServiceFeePaidAsync(Guid transactionId, CancellationToken cancellationToken = default);
}
