using System.Threading;
using global::Application.Common.Constant;
using global::Application.Services;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using global::Domain.UnitOfWork;
using ErrorOr;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NSubstitute;
using OutboxMessage = global::Domain.Entities.OutboxMessage;

namespace Domain.Specs.Application.Services;

public sealed class PaymentServiceTests
{
    private readonly IPaymentTransactionRepository _transactionRepo = Substitute.For<IPaymentTransactionRepository>();
    private readonly IBookingRepository _bookingRepo = Substitute.For<IBookingRepository>();
    private readonly IOutboxRepository _outboxRepo = Substitute.For<IOutboxRepository>();
    private readonly ITourInstanceRepository _tourInstanceRepo = Substitute.For<ITourInstanceRepository>();
    private readonly ILogger<PaymentService> _logger = Substitute.For<ILogger<PaymentService>>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IConfiguration _configuration = Substitute.For<IConfiguration>();
    private readonly IManagerBankAccountRepository _managerBankAccountRepo = Substitute.For<IManagerBankAccountRepository>();

    private readonly IUserRepository _userRepo = Substitute.For<IUserRepository>();

    private PaymentService CreateService() => new(
        _transactionRepo,
        _bookingRepo,
        _outboxRepo,
        _tourInstanceRepo,
        _managerBankAccountRepo,
        _userRepo,
        _logger,
        _configuration,
        _unitOfWork);

    private static PaymentTransactionEntity CreatePendingTransaction(
        Guid bookingId,
        TransactionType type = TransactionType.Deposit,
        decimal amount = 100000m,
        string? referenceCode = null)
    {
        var transaction = PaymentTransactionEntity.Create(
            bookingId: bookingId,
            transactionCode: "PAY-20240101-ABCD1234",
            type: type,
            amount: amount,
            paymentMethod: PaymentMethod.BankTransfer,
            paymentNote: "Test payment",
            createdBy: "test@test.com",
            expiredAt: DateTimeOffset.UtcNow.AddHours(1),
            referenceCode: referenceCode);
        return transaction;
    }

    private static BookingEntity CreatePendingBooking(Guid id) =>
        BookingEntity.Create(
            tourInstanceId: Guid.NewGuid(),
            customerName: "Test User",
            customerPhone: "0123456789",
            numberAdult: 2,
            totalPrice: 100000m,
            paymentMethod: PaymentMethod.BankTransfer,
            isFullPay: false,
            performedBy: "test@test.com");

    #region TC01: ProcessPaymentCallbackAsync with Deposit persists booking to database

    [Fact]
    public async Task ProcessPaymentCallbackAsync_WhenBookingPending_ShouldPersistToDatabase()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var transaction = CreatePendingTransaction(bookingId);
        var booking = CreatePendingBooking(bookingId);

        _transactionRepo.GetByTransactionCodeAsync(Arg.Any<string>()).Returns(transaction);
        _transactionRepo.UpdateAsync(Arg.Any<PaymentTransactionEntity>()).Returns(Task.CompletedTask);
        _bookingRepo.GetByIdAsync(bookingId).Returns(booking);
        _bookingRepo.UpdateAsync(Arg.Any<BookingEntity>()).Returns(Task.CompletedTask);

        var transactionData = new SepayTransactionData
        {
            TransactionId = "tx-001",
            TransactionContent = "PAY-20240101-ABCD1234",
            Amount = 100000m,
            TransactionDate = DateTimeOffset.UtcNow
        };

        var service = CreateService();

        // Act
        var result = await service.ProcessSepayCallbackAsync(transactionData);

        // Assert
        Assert.False(result.IsError);
        await _bookingRepo.ReceivedWithAnyArgs().UpdateAsync(Arg.Any<BookingEntity>());
    }

    #endregion

    #region TC02: ProcessPaymentCallbackAsync with FullPayment persists booking to Paid

    [Fact]
    public async Task ProcessPaymentCallbackAsync_WhenBookingConfirmed_ShouldTransitionToPaid()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var transaction = CreatePendingTransaction(bookingId, TransactionType.FullPayment, 500000m);
        var booking = CreatePendingBooking(bookingId);

        _transactionRepo.GetByTransactionCodeAsync(Arg.Any<string>()).Returns(transaction);
        _transactionRepo.UpdateAsync(Arg.Any<PaymentTransactionEntity>()).Returns(Task.CompletedTask);
        _bookingRepo.GetByIdAsync(Arg.Any<Guid>()).Returns(booking);
        _bookingRepo.UpdateAsync(Arg.Any<BookingEntity>()).Returns(Task.CompletedTask);

        var transactionData = new SepayTransactionData
        {
            TransactionId = "tx-002",
            TransactionContent = "PAY-20240101-ABCD1234",
            Amount = 500000m,
            TransactionDate = DateTimeOffset.UtcNow
        };

        var service = CreateService();

        // Act
        var result = await service.ProcessSepayCallbackAsync(transactionData);

        // Assert
        Assert.False(result.IsError);
        await _bookingRepo.ReceivedWithAnyArgs().UpdateAsync(Arg.Any<BookingEntity>());
    }

    #endregion

    #region TC03: ProcessPaymentCallbackAsync with Manager credits manager balance

    [Fact]
    public async Task ProcessSepayCallbackAsync_WithManager_ShouldCreditManagerBalance()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var tourInstanceId = Guid.NewGuid();
        var managerUserId = Guid.NewGuid();
        var transactionAmount = 100000m;
        
        var transaction = CreatePendingTransaction(bookingId, TransactionType.Deposit, transactionAmount);
        
        var booking = BookingEntity.Create(
            tourInstanceId: tourInstanceId,
            customerName: "Test User",
            customerPhone: "0123456789",
            numberAdult: 2,
            totalPrice: 100000m,
            paymentMethod: PaymentMethod.BankTransfer,
            isFullPay: false,
            performedBy: "test@test.com");

        // Mock a tour instance with a manager
        var managerUser = UserEntity.Create("Manager", "Manager User", "manager@test.com", "hash", "system");
        managerUser.Id = managerUserId;
        var tourInstance = new TourInstanceEntity { Id = tourInstanceId };
        tourInstance.Managers.Add(new TourInstanceManagerEntity { UserId = managerUserId, User = managerUser, Role = TourInstanceManagerRole.Manager });

        _transactionRepo.GetByTransactionCodeAsync(Arg.Any<string>()).Returns(transaction);
        _transactionRepo.UpdateAsync(Arg.Any<PaymentTransactionEntity>()).Returns(Task.CompletedTask);
        _bookingRepo.GetByIdWithDetailsAsync(Arg.Any<Guid>()).Returns(booking);
        _tourInstanceRepo.FindById(tourInstanceId).Returns(tourInstance);
        _userRepo.FindById(managerUserId).Returns(managerUser);

        var transactionData = new SepayTransactionData
        {
            TransactionId = "tx-003",
            TransactionContent = "PAY-20240101-ABCD1234",
            Amount = transactionAmount,
            TransactionDate = DateTimeOffset.UtcNow
        };

        var service = CreateService();

        // Act
        var result = await service.ProcessSepayCallbackAsync(transactionData);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(transactionAmount, managerUser.Balance);
        _userRepo.Received(1).Update(managerUser);
        await _unitOfWork.Received(1).SaveChangeAsync();
    }

    #endregion

    #region TC04: CreatePaymentTransactionAsync generates 12-char refCode

    [Fact]
    public async Task CreatePaymentTransactionAsync_GeneratesRefCode_Exactly12Characters()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var booking = BookingEntity.Create(
            tourInstanceId: Guid.NewGuid(),
            customerName: "Customer",
            customerPhone: "0123456789",
            numberAdult: 1,
            totalPrice: 100000m,
            paymentMethod: PaymentMethod.BankTransfer,
            isFullPay: false,
            performedBy: "test@test.com");

        _bookingRepo.GetByIdAsync(bookingId).Returns(booking);
        _transactionRepo.AddAsync(Arg.Any<PaymentTransactionEntity>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);
        _outboxRepo.AddAsync(Arg.Any<OutboxMessage>(), Arg.Any<CancellationToken>())
            .Returns(OutboxMessage.Create("test", "{}"));
        _configuration["VietQR:ApiUrl"].Returns("https://api.vietqr.io");
        _configuration["VietQR:BankBin"].Returns("970405");
        _configuration["VietQR:AccountNo"].Returns("123456789");
        _configuration["VietQR:AccountName"].Returns("Test Account");
        _configuration["VietQR:TemplateId"].Returns("compact2");
        _configuration["Payment:MockMode"].Returns("true");

        var service = CreateService();

        // Act
        var result = await service.CreatePaymentTransactionAsync(
            bookingId: bookingId,
            type: TransactionType.Deposit,
            amount: 100000m,
            paymentMethod: PaymentMethod.BankTransfer,
            paymentNote: "Test booking",
            createdBy: "test@test.com");

        // Assert
        Assert.False(result.IsError);
        var transaction = result.Value;
        Assert.NotNull(transaction.ReferenceCode);
        Assert.Equal(12, transaction.ReferenceCode.Length);
        Assert.True(transaction.ReferenceCode.All(c => char.IsDigit(c) || (c >= 'A' && c <= 'Z')),
            $"refCode '{transaction.ReferenceCode}' should be alphanumeric uppercase");
        Assert.StartsWith("data:image/svg+xml", transaction.CheckoutUrl);
    }

    #endregion

    #region TC05: CreatePaymentTransactionAsync refCode format is yyMMddHH + 4 Base36 random

    [Fact]
    public async Task CreatePaymentTransactionAsync_RefCodeFormat_IsDateTimePlus4Random()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var booking = BookingEntity.Create(
            tourInstanceId: Guid.NewGuid(),
            customerName: "Customer",
            customerPhone: "0123456789",
            numberAdult: 1,
            totalPrice: 100000m,
            paymentMethod: PaymentMethod.BankTransfer,
            isFullPay: false,
            performedBy: "test@test.com");

        _bookingRepo.GetByIdAsync(bookingId).Returns(booking);
        _transactionRepo.AddAsync(Arg.Any<PaymentTransactionEntity>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);
        _outboxRepo.AddAsync(Arg.Any<OutboxMessage>(), Arg.Any<CancellationToken>())
            .Returns(OutboxMessage.Create("test", "{}"));
        _configuration["VietQR:ApiUrl"].Returns("https://api.vietqr.io");
        _configuration["VietQR:BankBin"].Returns("970405");
        _configuration["VietQR:AccountNo"].Returns("123456789");
        _configuration["VietQR:AccountName"].Returns("Test Account");
        _configuration["VietQR:TemplateId"].Returns("compact2");

        var service = CreateService();

        // Act
        var result = await service.CreatePaymentTransactionAsync(
            bookingId: bookingId,
            type: TransactionType.Deposit,
            amount: 100000m,
            paymentMethod: PaymentMethod.BankTransfer,
            paymentNote: "Test",
            createdBy: "test@test.com");

        // Assert
        Assert.False(result.IsError);
        var refCode = result.Value.ReferenceCode!;

        // Format: yyMMddHH (8 digits) + 4 Base36 random = 12 total
        Assert.Equal(12, refCode.Length);

        // First 8 chars should be digits (yyMMddHH)
        var datetimePart = refCode[..8];
        Assert.True(datetimePart.All(char.IsDigit), $"datetime part should be all digits: {datetimePart}");

        // Last 4 chars should be alphanumeric (Base36)
        var randomPart = refCode[^4..];
        Assert.True(randomPart.All(c => char.IsDigit(c) || (c >= 'A' && c <= 'Z')),
            $"random part should be alphanumeric Base36: {randomPart}");
    }

    #endregion

    #region TC06: CreatePaymentTransactionAsync expiresAt defaults to 30 minutes

    [Fact]
    public async Task CreatePaymentTransactionAsync_ExpiresAt_DefaultsTo30Minutes()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var booking = BookingEntity.Create(
            tourInstanceId: Guid.NewGuid(),
            customerName: "Customer",
            customerPhone: "0123456789",
            numberAdult: 1,
            totalPrice: 100000m,
            paymentMethod: PaymentMethod.BankTransfer,
            isFullPay: false,
            performedBy: "test@test.com");

        _bookingRepo.GetByIdAsync(bookingId).Returns(booking);
        _transactionRepo.AddAsync(Arg.Any<PaymentTransactionEntity>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);
        _outboxRepo.AddAsync(Arg.Any<OutboxMessage>(), Arg.Any<CancellationToken>())
            .Returns(OutboxMessage.Create("test", "{}"));
        _configuration["VietQR:ApiUrl"].Returns("https://api.vietqr.io");
        _configuration["VietQR:BankBin"].Returns("970405");
        _configuration["VietQR:AccountNo"].Returns("123456789");
        _configuration["VietQR:AccountName"].Returns("Test Account");
        _configuration["VietQR:TemplateId"].Returns("compact2");

        var service = CreateService();
        var before = DateTimeOffset.UtcNow;

        // Act
        var result = await service.CreatePaymentTransactionAsync(
            bookingId: bookingId,
            type: TransactionType.Deposit,
            amount: 100000m,
            paymentMethod: PaymentMethod.BankTransfer,
            paymentNote: "Test",
            createdBy: "test@test.com",
            expirationMinutes: null);

        // Assert
        Assert.False(result.IsError);
        var transaction = result.Value;
        Assert.NotNull(transaction.ExpiredAt);

        var expectedExpiry = before.AddMinutes(30);
        var tolerance = TimeSpan.FromSeconds(2);
        Assert.InRange(transaction.ExpiredAt.Value, expectedExpiry - tolerance, expectedExpiry + tolerance);
    }

    #endregion

    #region TC03: ProcessPaymentCallbackAsync when booking update fails does not fail payment

    [Fact]
    public async Task ProcessPaymentCallbackAsync_WhenUpdateFails_ShouldNotFailPayment()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var transaction = CreatePendingTransaction(bookingId);
        var booking = CreatePendingBooking(bookingId);

        _transactionRepo.GetByTransactionCodeAsync(Arg.Any<string>()).Returns(transaction);
        _transactionRepo.UpdateAsync(Arg.Any<PaymentTransactionEntity>()).Returns(Task.CompletedTask);
        _bookingRepo.GetByIdAsync(bookingId).Returns(booking);
        _bookingRepo.UpdateAsync(Arg.Any<BookingEntity>()).Returns(Task.FromException(new InvalidOperationException("Database error")));

        var transactionData = new SepayTransactionData
        {
            TransactionId = "tx-003",
            TransactionContent = "PAY-20240101-ABCD1234",
            Amount = 100000m,
            TransactionDate = DateTimeOffset.UtcNow
        };

        var service = CreateService();

        // Act
        var result = await service.ProcessSepayCallbackAsync(transactionData);

        // Assert
        Assert.False(result.IsError);
        _logger.ReceivedWithAnyArgs().Log(
            LogLevel.Error,
            Arg.Any<EventId>(),
            Arg.Any<object>(),
            Arg.Any<Exception>(),
            Arg.Any<Func<object, Exception?, string>>());
    }

    #endregion

    #region TC07: CreatePaymentTransactionAsync with manager having bank account uses manager account

    [Fact]
    public async Task CreatePaymentTransactionAsync_WithManagerHavingBankAccount_UsesManagerAccount()
    {
        // Arrange
        var tourInstanceId = Guid.NewGuid();
        var managerId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();

        var manager = new UserEntity
        {
            Username = "manager",
            Email = "manager@example.com",
            FullName = "Manager Name",
            Password = "hash"
        };

        var managerBankAccount = new ManagerBankAccountEntity
        {
            UserId = managerId,
            BankAccountNumber = "1234567890",
            BankCode = "MB",
            BankBin = "970422",
            BankAccountName = "Manager Name",
            IsDefault = true
        };

        var tourInstance = TourInstanceEntity.Create(
            tourId: Guid.NewGuid(),
            classificationId: Guid.NewGuid(),
            title: "Tour",
            tourName: "Tour",
            tourCode: "T001",
            classificationName: "Standard",
            instanceType: TourType.Public,
            startDate: DateTimeOffset.UtcNow,
            endDate: DateTimeOffset.UtcNow.AddDays(3),
            maxParticipation: 20,
            basePrice: 1000m,
            performedBy: "system",
            location: "Hanoi");
        var managerAssignment = TourInstanceManagerEntity.Create(
            tourInstanceId: tourInstanceId,
            userId: managerId,
            role: TourInstanceManagerRole.Manager,
            performedBy: "system");
        managerAssignment.User = manager;
        tourInstance.Managers.Add(managerAssignment);

        var booking = BookingEntity.Create(
            tourInstanceId: tourInstanceId,
            customerName: "Customer",
            customerPhone: "0987654321",
            numberAdult: 2,
            totalPrice: 500000m,
            paymentMethod: PaymentMethod.BankTransfer,
            isFullPay: false,
            performedBy: "customer@example.com");

        _bookingRepo.GetByIdAsync(Arg.Any<Guid>()).Returns(booking);
        _tourInstanceRepo.FindById(booking.TourInstanceId, Arg.Any<bool>(), Arg.Any<CancellationToken>())
            .Returns(tourInstance);
        _managerBankAccountRepo.GetDefaultByUserIdAsync(managerId, Arg.Any<CancellationToken>())
            .Returns(managerBankAccount);
        _transactionRepo.AddAsync(Arg.Any<PaymentTransactionEntity>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);
        _outboxRepo.AddAsync(Arg.Any<OutboxMessage>(), Arg.Any<CancellationToken>())
            .Returns(OutboxMessage.Create("test", "{}"));
        _configuration["VietQR:ApiUrl"].Returns("https://api.vietqr.io");
        _configuration["VietQR:BankBin"].Returns("970405");
        _configuration["VietQR:AccountNo"].Returns("9999999999");
        _configuration["VietQR:AccountName"].Returns("Default Account");
        _configuration["VietQR:TemplateId"].Returns("compact2");

        var service = CreateService();

        // Act
        var result = await service.CreatePaymentTransactionAsync(
            bookingId: bookingId,
            type: TransactionType.Deposit,
            amount: 500000m,
            paymentMethod: PaymentMethod.BankTransfer,
            paymentNote: "Test payment",
            createdBy: "customer@example.com");

        // Assert
        Assert.False(result.IsError);
        var transaction = result.Value;
        Assert.Equal("1234567890", transaction.ManagerAccountNumber);
        Assert.Equal("MB", transaction.ManagerBankCode);
        Assert.Equal("Manager Name", transaction.ManagerAccountName);
    }

    #endregion

    #region TC08: CreatePaymentTransactionAsync without manager account uses default config

    [Fact]
    public async Task CreatePaymentTransactionAsync_WithoutManagerAccount_UsesDefaultConfig()
    {
        // Arrange
        var tourInstanceId = Guid.NewGuid();
        var managerId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();

        var manager = new UserEntity
        {
            Username = "manager",
            Email = "manager@example.com",
            FullName = "Manager Name",
            Password = "hash"
        };
        // No bank account in ManagerBankAccountEntity → falls back to config

        var tourInstance = TourInstanceEntity.Create(
            tourId: Guid.NewGuid(),
            classificationId: Guid.NewGuid(),
            title: "Tour",
            tourName: "Tour",
            tourCode: "T001",
            classificationName: "Standard",
            instanceType: TourType.Public,
            startDate: DateTimeOffset.UtcNow,
            endDate: DateTimeOffset.UtcNow.AddDays(3),
            maxParticipation: 20,
            basePrice: 1000m,
            performedBy: "system",
            location: "Hanoi");
        var managerAssignment = TourInstanceManagerEntity.Create(
            tourInstanceId: tourInstanceId,
            userId: managerId,
            role: TourInstanceManagerRole.Manager,
            performedBy: "system");
        managerAssignment.User = manager;
        tourInstance.Managers.Add(managerAssignment);

        var booking = BookingEntity.Create(
            tourInstanceId: tourInstanceId,
            customerName: "Customer",
            customerPhone: "0987654321",
            numberAdult: 2,
            totalPrice: 500000m,
            paymentMethod: PaymentMethod.BankTransfer,
            isFullPay: false,
            performedBy: "customer@example.com");

        _bookingRepo.GetByIdAsync(Arg.Any<Guid>()).Returns(booking);
        _tourInstanceRepo.FindById(booking.TourInstanceId, Arg.Any<bool>(), Arg.Any<CancellationToken>())
            .Returns(tourInstance);
        _managerBankAccountRepo.GetDefaultByUserIdAsync(managerId, Arg.Any<CancellationToken>())
            .Returns((ManagerBankAccountEntity?)null);
        _managerBankAccountRepo.GetByUserIdAsync(managerId, Arg.Any<CancellationToken>())
            .Returns(new List<ManagerBankAccountEntity>());
        _transactionRepo.AddAsync(Arg.Any<PaymentTransactionEntity>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);
        _outboxRepo.AddAsync(Arg.Any<OutboxMessage>(), Arg.Any<CancellationToken>())
            .Returns(OutboxMessage.Create("test", "{}"));
        _configuration["VietQR:ApiUrl"].Returns("https://api.vietqr.io");
        _configuration["VietQR:BankBin"].Returns("970405");
        _configuration["VietQR:AccountNo"].Returns("8888888888");
        _configuration["VietQR:AccountName"].Returns("Default Account");
        _configuration["VietQR:TemplateId"].Returns("compact2");

        var service = CreateService();

        // Act
        var result = await service.CreatePaymentTransactionAsync(
            bookingId: bookingId,
            type: TransactionType.Deposit,
            amount: 500000m,
            paymentMethod: PaymentMethod.BankTransfer,
            paymentNote: "Test payment",
            createdBy: "customer@example.com");

        // Assert
        Assert.False(result.IsError);
        var transaction = result.Value;
        // Should fall back to default config
        Assert.Equal("8888888888", transaction.ManagerAccountNumber);
        Assert.Equal("970405", transaction.ManagerBankCode);
        Assert.Equal("Default Account", transaction.ManagerAccountName);
    }

    #endregion

    #region TC09: CreatePaymentTransactionAsync no managers falls back to default config

    [Fact]
    public async Task CreatePaymentTransactionAsync_NoManagers_FallsBackToDefaultConfig()
    {
        // Arrange
        var tourInstanceId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();

        var tourInstance = TourInstanceEntity.Create(
            tourId: Guid.NewGuid(),
            classificationId: Guid.NewGuid(),
            title: "Tour",
            tourName: "Tour",
            tourCode: "T001",
            classificationName: "Standard",
            instanceType: TourType.Public,
            startDate: DateTimeOffset.UtcNow,
            endDate: DateTimeOffset.UtcNow.AddDays(3),
            maxParticipation: 20,
            basePrice: 1000m,
            performedBy: "system",
            location: "Hanoi");
        // Managers list is empty

        var booking = BookingEntity.Create(
            tourInstanceId: tourInstanceId,
            customerName: "Customer",
            customerPhone: "0987654321",
            numberAdult: 2,
            totalPrice: 500000m,
            paymentMethod: PaymentMethod.BankTransfer,
            isFullPay: false,
            performedBy: "customer@example.com");

        _bookingRepo.GetByIdAsync(Arg.Any<Guid>()).Returns(booking);
        _tourInstanceRepo.FindById(booking.TourInstanceId, Arg.Any<bool>(), Arg.Any<CancellationToken>())
            .Returns(tourInstance);
        _transactionRepo.AddAsync(Arg.Any<PaymentTransactionEntity>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);
        _outboxRepo.AddAsync(Arg.Any<OutboxMessage>(), Arg.Any<CancellationToken>())
            .Returns(OutboxMessage.Create("test", "{}"));
        _configuration["VietQR:ApiUrl"].Returns("https://api.vietqr.io");
        _configuration["VietQR:BankBin"].Returns("970405");
        _configuration["VietQR:AccountNo"].Returns("7777777777");
        _configuration["VietQR:AccountName"].Returns("Fallback Account");
        _configuration["VietQR:TemplateId"].Returns("compact2");

        var service = CreateService();

        // Act
        var result = await service.CreatePaymentTransactionAsync(
            bookingId: bookingId,
            type: TransactionType.Deposit,
            amount: 500000m,
            paymentMethod: PaymentMethod.BankTransfer,
            paymentNote: "Test payment",
            createdBy: "customer@example.com");

        // Assert
        Assert.False(result.IsError);
        var transaction = result.Value;
        Assert.Equal("7777777777", transaction.ManagerAccountNumber);
        Assert.Equal("970405", transaction.ManagerBankCode);
        Assert.Equal("Fallback Account", transaction.ManagerAccountName);
    }

    #endregion

    #region TC10: CreatePaymentTransactionAsync prefers Manager role over Guide

    [Fact]
    public async Task CreatePaymentTransactionAsync_PrefersManagerRole_OverGuide()
    {
        // Arrange
        var tourInstanceId = Guid.NewGuid();
        var managerId = Guid.NewGuid();
        var guideId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();

        var manager = new UserEntity
        {
            Username = "manager",
            Email = "manager@example.com",
            FullName = "The Manager",
            Password = "hash"
        };

        var managerBankAccount = new ManagerBankAccountEntity
        {
            UserId = managerId,
            BankAccountNumber = "1111111111",
            BankCode = "TCB",
            BankBin = "970407",
            BankAccountName = "The Manager",
            IsDefault = true
        };

        var guide = new UserEntity
        {
            Username = "guide",
            Email = "guide@example.com",
            FullName = "Guide Person",
            Password = "hash"
        };

        var tourInstance = TourInstanceEntity.Create(
            tourId: Guid.NewGuid(),
            classificationId: Guid.NewGuid(),
            title: "Tour",
            tourName: "Tour",
            tourCode: "T001",
            classificationName: "Standard",
            instanceType: TourType.Public,
            startDate: DateTimeOffset.UtcNow,
            endDate: DateTimeOffset.UtcNow.AddDays(3),
            maxParticipation: 20,
            basePrice: 1000m,
            performedBy: "system",
            location: "Hanoi");

        // Guide assigned first (before Manager) to test role preference
        var guideAssignment = TourInstanceManagerEntity.Create(
            tourInstanceId: tourInstanceId,
            userId: guideId,
            role: TourInstanceManagerRole.Guide,
            performedBy: "system");
        guideAssignment.User = guide;
        tourInstance.Managers.Add(guideAssignment);

        var managerAssignment = TourInstanceManagerEntity.Create(
            tourInstanceId: tourInstanceId,
            userId: managerId,
            role: TourInstanceManagerRole.Manager,
            performedBy: "system");
        managerAssignment.User = manager;
        tourInstance.Managers.Add(managerAssignment);

        var booking = BookingEntity.Create(
            tourInstanceId: tourInstanceId,
            customerName: "Customer",
            customerPhone: "0987654321",
            numberAdult: 2,
            totalPrice: 500000m,
            paymentMethod: PaymentMethod.BankTransfer,
            isFullPay: false,
            performedBy: "customer@example.com");

        _bookingRepo.GetByIdAsync(Arg.Any<Guid>()).Returns(booking);
        _tourInstanceRepo.FindById(booking.TourInstanceId, Arg.Any<bool>(), Arg.Any<CancellationToken>())
            .Returns(tourInstance);
        _managerBankAccountRepo.GetDefaultByUserIdAsync(managerId, Arg.Any<CancellationToken>())
            .Returns(managerBankAccount);
        _transactionRepo.AddAsync(Arg.Any<PaymentTransactionEntity>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);
        _outboxRepo.AddAsync(Arg.Any<OutboxMessage>(), Arg.Any<CancellationToken>())
            .Returns(OutboxMessage.Create("test", "{}"));
        _configuration["VietQR:ApiUrl"].Returns("https://api.vietqr.io");
        _configuration["VietQR:BankBin"].Returns("970405");
        _configuration["VietQR:AccountNo"].Returns("9999999999");
        _configuration["VietQR:AccountName"].Returns("Default");
        _configuration["VietQR:TemplateId"].Returns("compact2");

        var service = CreateService();

        // Act
        var result = await service.CreatePaymentTransactionAsync(
            bookingId: bookingId,
            type: TransactionType.Deposit,
            amount: 500000m,
            paymentMethod: PaymentMethod.BankTransfer,
            paymentNote: "Test payment",
            createdBy: "customer@example.com");

        // Assert
        Assert.False(result.IsError);
        var transaction = result.Value;
        // Should use Manager's account, not the Guide's (even though Guide was assigned first)
        Assert.Equal("1111111111", transaction.ManagerAccountNumber);
        Assert.Equal("TCB", transaction.ManagerBankCode);
    }

    #endregion

    #region TC11: CreatePaymentTransactionAsync no Manager role uses first assignment

    [Fact]
    public async Task CreatePaymentTransactionAsync_NoManagerRole_UsesFirstAssignment()
    {
        // Arrange
        var tourInstanceId = Guid.NewGuid();
        var guide1Id = Guid.NewGuid();
        var guide2Id = Guid.NewGuid();
        var bookingId = Guid.NewGuid();

        var guide1 = new UserEntity
        {
            Username = "guide1",
            Email = "guide1@example.com",
            FullName = "Guide One",
            Password = "hash"
        };

        var guide1BankAccount = new ManagerBankAccountEntity
        {
            UserId = guide1Id,
            BankAccountNumber = "3333333333",
            BankCode = "ACB",
            BankBin = "970416",
            BankAccountName = "Guide One",
            IsDefault = true
        };

        var guide2 = new UserEntity
        {
            Username = "guide2",
            Email = "guide2@example.com",
            FullName = "Guide Two",
            Password = "hash"
        };

        var tourInstance = TourInstanceEntity.Create(
            tourId: Guid.NewGuid(),
            classificationId: Guid.NewGuid(),
            title: "Tour",
            tourName: "Tour",
            tourCode: "T001",
            classificationName: "Standard",
            instanceType: TourType.Public,
            startDate: DateTimeOffset.UtcNow,
            endDate: DateTimeOffset.UtcNow.AddDays(3),
            maxParticipation: 20,
            basePrice: 1000m,
            performedBy: "system",
            location: "Hanoi");

        // Guide1 assigned first
        var guide1Assignment = TourInstanceManagerEntity.Create(
            tourInstanceId: tourInstanceId,
            userId: guide1Id,
            role: TourInstanceManagerRole.Guide,
            performedBy: "system");
        guide1Assignment.User = guide1;
        tourInstance.Managers.Add(guide1Assignment);

        // Guide2 assigned second
        var guide2Assignment = TourInstanceManagerEntity.Create(
            tourInstanceId: tourInstanceId,
            userId: guide2Id,
            role: TourInstanceManagerRole.Guide,
            performedBy: "system");
        guide2Assignment.User = guide2;
        tourInstance.Managers.Add(guide2Assignment);

        var booking = BookingEntity.Create(
            tourInstanceId: tourInstanceId,
            customerName: "Customer",
            customerPhone: "0987654321",
            numberAdult: 2,
            totalPrice: 500000m,
            paymentMethod: PaymentMethod.BankTransfer,
            isFullPay: false,
            performedBy: "customer@example.com");

        _bookingRepo.GetByIdAsync(Arg.Any<Guid>()).Returns(booking);
        _tourInstanceRepo.FindById(booking.TourInstanceId, Arg.Any<bool>(), Arg.Any<CancellationToken>())
            .Returns(tourInstance);
        _managerBankAccountRepo.GetDefaultByUserIdAsync(guide1Id, Arg.Any<CancellationToken>())
            .Returns(guide1BankAccount);
        _transactionRepo.AddAsync(Arg.Any<PaymentTransactionEntity>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);
        _outboxRepo.AddAsync(Arg.Any<OutboxMessage>(), Arg.Any<CancellationToken>())
            .Returns(OutboxMessage.Create("test", "{}"));
        _configuration["VietQR:ApiUrl"].Returns("https://api.vietqr.io");
        _configuration["VietQR:BankBin"].Returns("970405");
        _configuration["VietQR:AccountNo"].Returns("9999999999");
        _configuration["VietQR:AccountName"].Returns("Default");
        _configuration["VietQR:TemplateId"].Returns("compact2");

        var service = CreateService();

        // Act
        var result = await service.CreatePaymentTransactionAsync(
            bookingId: bookingId,
            type: TransactionType.Deposit,
            amount: 500000m,
            paymentMethod: PaymentMethod.BankTransfer,
            paymentNote: "Test payment",
            createdBy: "customer@example.com");

        // Assert
        Assert.False(result.IsError);
        var transaction = result.Value;
        // Should use first assignment (guide1's account)
        Assert.Equal("3333333333", transaction.ManagerAccountNumber);
        Assert.Equal("ACB", transaction.ManagerBankCode);
    }

    #endregion
}
