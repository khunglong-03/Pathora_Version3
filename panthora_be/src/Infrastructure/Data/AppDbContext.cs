using Domain.Constant;
using Domain.Abstractions;
using Domain.Entities;
using Domain.Mails;
using Infrastructure.Data.Configurations;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public override int SaveChanges()
    {
        UpdateAuditableEntities();
        return base.SaveChanges();
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateAuditableEntities();
        return await base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateAuditableEntities()
    {
        foreach (var entry in ChangeTracker.Entries<IAuditable>())
        {
            if (entry.State == EntityState.Added)
            {
                if (entry.Entity.CreatedOnUtc == default)
                    entry.Entity.CreatedOnUtc = DateTimeOffset.UtcNow;

                if (entry.Entity.LastModifiedOnUtc is null)
                    entry.Entity.LastModifiedOnUtc = DateTimeOffset.UtcNow;
            }

            if (entry.State == EntityState.Modified)
            {
                entry.Entity.LastModifiedOnUtc = DateTimeOffset.UtcNow;
            }
        }
    }

    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<RoleEntity> Roles => Set<RoleEntity>();
    public DbSet<UserRoleEntity> UserRoles => Set<UserRoleEntity>();
    public DbSet<DepartmentEntity> Departments => Set<DepartmentEntity>();
    public DbSet<PositionEntity> Positions => Set<PositionEntity>();
    public DbSet<FileMetadataEntity> FileMetadatas => Set<FileMetadataEntity>();
    public DbSet<RefreshTokenEntity> RefreshTokens => Set<RefreshTokenEntity>();
    public DbSet<Domain.Constant.SystemKey> SystemKeys => Set<Domain.Constant.SystemKey>();
    public DbSet<TourEntity> Tours => Set<TourEntity>();
    public DbSet<TourClassificationEntity> TourClassifications => Set<TourClassificationEntity>();
    public DbSet<TourDayEntity> TourDays => Set<TourDayEntity>();
    public DbSet<TourDayActivityEntity> TourDayActivities => Set<TourDayActivityEntity>();
    public DbSet<TourDayActivityResourceLinkEntity> TourDayActivityResourceLinks => Set<TourDayActivityResourceLinkEntity>();
    public DbSet<TourInsuranceEntity> TourInsurances => Set<TourInsuranceEntity>();
    public DbSet<TourPlanAccommodationEntity> TourPlanAccommodations => Set<TourPlanAccommodationEntity>();
    public DbSet<TourPlanLocationEntity> TourPlanLocations => Set<TourPlanLocationEntity>();
    public DbSet<TourPlanRouteEntity> TourPlanRoutes => Set<TourPlanRouteEntity>();
    public DbSet<MailEntity> Mails => Set<MailEntity>();
    public DbSet<LogError> logErrors => Set<LogError>();
    public DbSet<RegisterEntity> Registers => Set<RegisterEntity>();
    public DbSet<ReviewEntity> Reviews => Set<ReviewEntity>();
    public DbSet<TourInstanceEntity> TourInstances => Set<TourInstanceEntity>();
    public DbSet<TourRequestEntity> TourRequests => Set<TourRequestEntity>();
    public DbSet<BookingEntity> Bookings => Set<BookingEntity>();
    public DbSet<BookingActivityReservationEntity> BookingActivityReservations => Set<BookingActivityReservationEntity>();
    public DbSet<BookingTransportDetailEntity> BookingTransportDetails => Set<BookingTransportDetailEntity>();
    public DbSet<BookingAccommodationDetailEntity> BookingAccommodationDetails => Set<BookingAccommodationDetailEntity>();
    public DbSet<BookingParticipantEntity> BookingParticipants => Set<BookingParticipantEntity>();
    public DbSet<PassportEntity> Passports => Set<PassportEntity>();
    public DbSet<VisaApplicationEntity> VisaApplications => Set<VisaApplicationEntity>();
    public DbSet<VisaEntity> Visas => Set<VisaEntity>();
    public DbSet<VisaPolicyEntity> VisaPolicies => Set<VisaPolicyEntity>();
    public DbSet<DepositPolicyEntity> DepositPolicies => Set<DepositPolicyEntity>();
    public DbSet<SupplierEntity> Suppliers => Set<SupplierEntity>();
    public DbSet<SupplierPayableEntity> SupplierPayables => Set<SupplierPayableEntity>();
    public DbSet<SupplierReceiptEntity> SupplierReceipts => Set<SupplierReceiptEntity>();
    public DbSet<BookingTourGuideEntity> BookingTourGuides => Set<BookingTourGuideEntity>();
    public DbSet<TourDayActivityStatusEntity> TourDayActivityStatuses => Set<TourDayActivityStatusEntity>();
    public DbSet<TourDayActivityGuideEntity> TourDayActivityGuides => Set<TourDayActivityGuideEntity>();
    public DbSet<CustomerPaymentEntity> CustomerPayments => Set<CustomerPaymentEntity>();
    public DbSet<CustomerDepositEntity> CustomerDeposits => Set<CustomerDepositEntity>();
    public DbSet<PaymentEntity> Payments => Set<PaymentEntity>();
    public DbSet<PaymentTransactionEntity> PaymentTransactions => Set<PaymentTransactionEntity>();
    public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();
    public DbSet<PasswordResetTokenEntity> PasswordResetTokens => Set<PasswordResetTokenEntity>();
    public DbSet<SiteContentEntity> SiteContents => Set<SiteContentEntity>();
    public DbSet<PricingPolicy> PricingPolicies => Set<PricingPolicy>();
    public DbSet<TaxConfigEntity> TaxConfigs => Set<TaxConfigEntity>();
    public DbSet<CancellationPolicyEntity> CancellationPolicies => Set<CancellationPolicyEntity>();
    public DbSet<TourResourceEntity> TourResources => Set<TourResourceEntity>();
    public DbSet<TourInstanceManagerEntity> TourInstanceManagers => Set<TourInstanceManagerEntity>();
    public DbSet<TourInstanceDayEntity> TourInstanceDays => Set<TourInstanceDayEntity>();
    public DbSet<UserSettingEntity> UserSettings => Set<UserSettingEntity>();
    public DbSet<TourManagerAssignmentEntity> TourManagerAssignments => Set<TourManagerAssignmentEntity>();
    public DbSet<VehicleEntity> Vehicles => Set<VehicleEntity>();
    public DbSet<DriverEntity> Drivers => Set<DriverEntity>();
    public DbSet<TourDayActivityRouteTransportEntity> TourDayActivityRouteTransports => Set<TourDayActivityRouteTransportEntity>();
    public DbSet<HotelRoomInventoryEntity> HotelRoomInventories => Set<HotelRoomInventoryEntity>();
    public DbSet<RoomBlockEntity> RoomBlocks => Set<RoomBlockEntity>();
    public DbSet<GuestArrivalEntity> GuestArrivals => Set<GuestArrivalEntity>();
    public DbSet<GuestArrivalParticipantEntity> GuestArrivalParticipants => Set<GuestArrivalParticipantEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
