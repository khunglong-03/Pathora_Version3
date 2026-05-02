using System;
using System.Threading;
using System.Threading.Tasks;
using Domain.Entities;
using Domain.Enums;
using Domain.Common.Repositories;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Application.Services;

public class PostPaymentVisaGateService : IPostPaymentVisaGateService
{
    private readonly ITourInstanceRepository _tourInstanceRepository;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<PostPaymentVisaGateService> _logger;

    public PostPaymentVisaGateService(
        ITourInstanceRepository tourInstanceRepository,
        IServiceProvider serviceProvider,
        ILogger<PostPaymentVisaGateService> logger)
    {
        _tourInstanceRepository = tourInstanceRepository;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public Task<bool> HandlePostConfirmVisaOrAssignmentsAsync(TourInstanceEntity tourInstance, string transactionCode, CancellationToken cancellationToken = default)
    {
        var tour = tourInstance.Tour;

        // Idempotent: đã PendingVisa thì không làm gì thêm
        if (tourInstance.Status == TourInstanceStatus.PendingVisa)
        {
            _logger.LogInformation(
                "Visa gate already pending for instance {InstanceId} (transaction {TransactionCode}).",
                tourInstance.Id, transactionCode);
            return Task.FromResult(false);
        }

        // Check IsVisa qua navigation property nếu có, fallback không làm visa gate
        bool isVisa = tour?.IsVisa == true;

        if (isVisa && tourInstance.InstanceType == TourType.Private)
        {
            tourInstance.EnterVisaGate("SYSTEM");
            _logger.LogInformation(
                "Visa gate entered for private tour instance {InstanceId} (transaction {TransactionCode}).",
                tourInstance.Id, transactionCode);
            return Task.FromResult(false);
        }
        else
        {
            _logger.LogInformation(
                "Visa gate skipped: tour is not visa or is public for instance {InstanceId} (transaction {TransactionCode}). Returning true to trigger assignments later.",
                tourInstance.Id, transactionCode);
            return Task.FromResult(true);
        }
    }

    public async Task TryCompleteVisaGateAsync(Guid bookingId, CancellationToken cancellationToken = default)
    {
        using var scope = _serviceProvider.CreateScope();
        var bookingRepo = scope.ServiceProvider.GetRequiredService<IBookingRepository>();
        var visaAppRepo = scope.ServiceProvider.GetRequiredService<IVisaApplicationRepository>();
        var tourInstanceRepo = scope.ServiceProvider.GetRequiredService<ITourInstanceRepository>();
        var tourService = scope.ServiceProvider.GetRequiredService<Application.Services.ITourInstanceService>();
        var unitOfWork = scope.ServiceProvider.GetRequiredService<Domain.UnitOfWork.IUnitOfWork>();

        var booking = await bookingRepo.GetByIdWithDetailsAsync(bookingId, cancellationToken);
        if (booking == null) return;

        var tourInstance = await tourInstanceRepo.FindById(booking.TourInstanceId);
        if (tourInstance == null) return;

        if (tourInstance.Status != TourInstanceStatus.PendingVisa)
        {
            _logger.LogInformation("Instance {InstanceId} is not in PendingVisa (current: {Status}), skipping TryCompleteVisaGateAsync.", tourInstance.Id, tourInstance.Status);
            return; // Idempotent check
        }

        var participants = booking.BookingParticipants.ToList();
        var participantIds = participants.Select(p => p.Id).ToList();
        var allApps = await visaAppRepo.GetByBookingParticipantIdsAsync(participantIds, cancellationToken);
        var appsByParticipant = allApps.GroupBy(a => a.BookingParticipantId).ToDictionary(g => g.Key, g => g.ToList());

        bool allSatisfied = true;

        foreach (var participant in participants)
        {
            var apps = appsByParticipant.GetValueOrDefault(participant.Id) ?? new List<VisaApplicationEntity>();
            var latest = apps.OrderByDescending(v => v.CreatedOnUtc).FirstOrDefault();

            if (latest == null || latest.Status != VisaStatus.Approved)
            {
                allSatisfied = false;
                _logger.LogInformation("Participant {ParticipantId} missing approved visa (Latest status: {Status}).", participant.Id, latest?.Status);
                break;
            }

            if (latest.IsSystemAssisted && latest.ServiceFee.HasValue && !latest.ServiceFeePaidAt.HasValue)
            {
                allSatisfied = false;
                _logger.LogInformation("Participant {ParticipantId} has un-paid visa service fee.", participant.Id);
                break;
            }
        }

        if (allSatisfied)
        {
            _logger.LogInformation("All participants satisfied visa requirements. Completing visa gate for instance {InstanceId}.", tourInstance.Id);
            tourInstance.CompleteVisaGate("SYSTEM");
            await tourInstanceRepo.Update(tourInstance, cancellationToken);
            
            try
            {
                await unitOfWork.SaveChangeAsync(cancellationToken);
                
                _logger.LogInformation("Triggering provider assignments for instance {InstanceId} after visa gate completion.", tourInstance.Id);
                await tourService.TriggerProviderAssignmentsAsync(tourInstance.Id, cancellationToken);
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
            {
                _logger.LogWarning("Concurrency conflict while completing visa gate for instance {InstanceId}. Another thread might have completed it. Skipping provider assignments.", tourInstance.Id);
            }
        }
        else
        {
            _logger.LogInformation("Visa gate criteria not fully met yet for instance {InstanceId}.", tourInstance.Id);
        }
    }

    public async Task<bool> MarkVisaServiceFeePaidAsync(Guid transactionId, CancellationToken cancellationToken = default)
    {
        using var scope = _serviceProvider.CreateScope();
        var visaAppRepo = scope.ServiceProvider.GetRequiredService<IVisaApplicationRepository>();
        
        var visaApp = await visaAppRepo.GetByServiceFeeTransactionIdAsync(transactionId, cancellationToken);
            
        if (visaApp != null)
        {
            visaApp.MarkServiceFeePaid(transactionId, "SYSTEM");
            visaAppRepo.Update(visaApp);
            _logger.LogInformation("Visa service fee marked as paid for VisaApplication {AppId} via transaction {TransactionId}.", visaApp.Id, transactionId);
            return true;
        }
        
        _logger.LogWarning("No VisaApplication found with ServiceFeeTransactionId {TransactionId}.", transactionId);
        return false;
    }
}
