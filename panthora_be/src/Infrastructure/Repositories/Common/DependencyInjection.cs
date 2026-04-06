
using Application.Common.Interfaces;
using Application.Features.Tour.Commands.PurgeTour;
using Infrastructure.Repositories.Tour;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.UnitOfWork;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Repositories.Common;

internal static class DependencyInjection
{
    internal static IServiceCollection AddRepositories(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IOtpRepository, OtpRepository>();
        services.AddScoped<IPasswordResetTokenRepository, PasswordResetTokenRepository>();

        services.AddScoped<IRoleRepository, RoleRepository>();
        services.AddScoped<IDepartmentRepository, DepartmentRepository>();
        services.AddScoped<IPositionRepository, PositionRepository>();

        services.AddScoped<IFileRepository, FileRepository>();
        services.AddScoped<IMailRepository, MailRepository>();

        services.AddKeyedScoped<ISystemKeyRepository, SystemKeyRepository>("original");
        services.AddScoped<ISystemKeyRepository, SystemKeyRepository>();

        services.AddScoped<ITourRepository, TourRepository>();
        services.AddScoped<ITourInstanceRepository, TourInstanceRepository>();
        services.AddScoped<IPricingPolicyRepository, PricingPolicyRepository>();
        services.AddScoped<ICancellationPolicyRepository, CancellationPolicyRepository>();

        services.AddScoped<IReviewRepository, ReviewRepository>();

        services.AddScoped<ITourRequestRepository, TourRequestRepository>();
        services.AddScoped<IBookingRepository, BookingRepository>();
        services.AddScoped<IBookingActivityReservationRepository, BookingActivityReservationRepository>();
        services.AddScoped<IBookingTransportDetailRepository, BookingTransportDetailRepository>();
        services.AddScoped<IBookingAccommodationDetailRepository, BookingAccommodationDetailRepository>();
        services.AddScoped<IBookingParticipantRepository, BookingParticipantRepository>();
        services.AddScoped<IPassportRepository, PassportRepository>();
        services.AddScoped<IVisaApplicationRepository, VisaApplicationRepository>();
        services.AddScoped<IVisaRepository, VisaRepository>();
        services.AddScoped<IVisaPolicyRepository, VisaPolicyRepository>();
        services.AddScoped<IDepositPolicyRepository, DepositPolicyRepository>();
        services.AddScoped<ITaxConfigRepository, TaxConfigRepository>();
        services.AddScoped<ISupplierRepository, SupplierRepository>();
        services.AddScoped<ISupplierPayableRepository, SupplierPayableRepository>();
        services.AddScoped<ISupplierReceiptRepository, SupplierReceiptRepository>();
        services.AddScoped<IBookingTourGuideRepository, BookingTourGuideRepository>();
        services.AddScoped<ITourDayActivityStatusRepository, TourDayActivityStatusRepository>();
        services.AddScoped<ITourDayActivityGuideRepository, TourDayActivityGuideRepository>();
        services.AddScoped<IAdminOverviewRepository, AdminOverviewRepository>();
        services.AddScoped<IAdminDashboardRepository, AdminDashboardRepository>();
        services.AddScoped<ITourManagerAssignmentRepository, TourManagerAssignmentRepository>();

        services.AddScoped<ICustomerPaymentRepository, CustomerPaymentRepository>();
        services.AddScoped<ICustomerDepositRepository, CustomerDepositRepository>();
        services.AddScoped<IPaymentTransactionRepository, PaymentTransactionRepository>();
        services.AddScoped<IOutboxRepository, OutboxRepository>();

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IRegisterRepository, RegisterRepository>();

        services.AddScoped<ISiteContentRepository, SiteContentRepository>();

        services.AddScoped<ITourPurgeExecutor, TourPurgeExecutor>();

        return services;
    }
}

