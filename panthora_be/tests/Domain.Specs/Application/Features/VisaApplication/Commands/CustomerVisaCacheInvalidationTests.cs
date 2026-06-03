using Application.Common;
using Application.Features.VisaApplication.Commands;
using Contracts.Interfaces;
using FluentAssertions;
using Xunit;

namespace Domain.Specs.Application.Features.VisaApplication.Commands;

/// <summary>
/// Verifies that all visa/passport commands correctly implement ICacheInvalidator
/// with the Booking tag, so CacheInvalidationBehavior clears
/// "Booking:participants:{id}" (and other Booking-scoped keys) after mutation.
///
/// Pre-existing limitation: CacheInvalidationBehavior runs AFTER next().
/// If the handler throws after SaveChangeAsync succeeds, cache may remain stale.
/// This is an infra-level issue outside the scope of this fix.
/// </summary>
public sealed class CustomerVisaCacheInvalidationTests
{
    // ── Customer-side commands ────────────────────────────────────────────

    [Fact]
    public void SubmitCustomerVisaApplicationCommand_ShouldImplementICacheInvalidator_WithBookingTag()
    {
        var command = new SubmitCustomerVisaApplicationCommand(
            BookingId: Guid.NewGuid(),
            BookingParticipantId: Guid.NewGuid(),
            PassportId: Guid.NewGuid(),
            DestinationCountry: "VN");

        command.Should().BeAssignableTo<ICacheInvalidator>();
        command.CacheKeysToInvalidate.Should().ContainSingle()
            .Which.Should().Be(CacheKey.Booking);
    }

    [Fact]
    public void UpdateCustomerVisaApplicationCommand_ShouldImplementICacheInvalidator_WithBookingTag()
    {
        var command = new UpdateCustomerVisaApplicationCommand(
            BookingId: Guid.NewGuid(),
            VisaApplicationId: Guid.NewGuid(),
            PassportId: Guid.NewGuid(),
            DestinationCountry: "VN");

        command.Should().BeAssignableTo<ICacheInvalidator>();
        command.CacheKeysToInvalidate.Should().ContainSingle()
            .Which.Should().Be(CacheKey.Booking);
    }

    [Fact]
    public void RequestVisaSupportCommand_ShouldImplementICacheInvalidator_WithBookingTag()
    {
        var command = new RequestVisaSupportCommand(
            BookingId: Guid.NewGuid(),
            BookingParticipantId: Guid.NewGuid());

        command.Should().BeAssignableTo<ICacheInvalidator>();
        command.CacheKeysToInvalidate.Should().ContainSingle()
            .Which.Should().Be(CacheKey.Booking);
    }

    [Fact]
    public void UpdateCustomerPassportCommand_ShouldImplementICacheInvalidator_WithBookingTag()
    {
        var command = new UpdateCustomerPassportCommand(
            BookingId: Guid.NewGuid(),
            ParticipantId: Guid.NewGuid(),
            PassportNumber: "A12345678",
            Nationality: "VN",
            IssuedAt: DateTimeOffset.UtcNow.AddYears(-1),
            ExpiresAt: DateTimeOffset.UtcNow.AddYears(9),
            FileUrl: null);

        command.Should().BeAssignableTo<ICacheInvalidator>();
        command.CacheKeysToInvalidate.Should().ContainSingle()
            .Which.Should().Be(CacheKey.Booking);
    }

    // ── Admin-side commands (boil lake — same bug pattern) ────────────────

    [Fact]
    public void CreateVisaApplicationCommand_ShouldImplementICacheInvalidator_WithBookingTag()
    {
        var command = new CreateVisaApplicationCommand(
            BookingParticipantId: Guid.NewGuid(),
            PassportId: Guid.NewGuid(),
            DestinationCountry: "VN");

        command.Should().BeAssignableTo<ICacheInvalidator>();
        command.CacheKeysToInvalidate.Should().ContainSingle()
            .Which.Should().Be(CacheKey.Booking);
    }

    [Fact]
    public void UpdateVisaApplicationStatusCommand_ShouldImplementICacheInvalidator_WithBookingTag()
    {
        var command = new UpdateVisaApplicationStatusCommand(
            Id: Guid.NewGuid(),
            Status: global::Domain.Enums.VisaStatus.Approved);

        command.Should().BeAssignableTo<ICacheInvalidator>();
        command.CacheKeysToInvalidate.Should().ContainSingle()
            .Which.Should().Be(CacheKey.Booking);
    }

    [Fact]
    public void RegisterVisaDetailsCommand_ShouldImplementICacheInvalidator_WithBookingTag()
    {
        var command = new RegisterVisaDetailsCommand(
            VisaApplicationId: Guid.NewGuid(),
            VisaNumber: "V123",
            IssuedAt: DateTimeOffset.UtcNow.AddMonths(-1),
            ExpiresAt: DateTimeOffset.UtcNow.AddYears(1),
            Category: global::Domain.Enums.VisaCategory.Business,
            Format: global::Domain.Enums.VisaFormat.Sticker,
            DestinationCountry: "VN");

        command.Should().BeAssignableTo<ICacheInvalidator>();
        command.CacheKeysToInvalidate.Should().ContainSingle()
            .Which.Should().Be(CacheKey.Booking);
    }

    // ── Regression: existing participant commands still correct ───────────

    [Fact]
    public void CreateParticipantCommand_ShouldStillInvalidateBookingCache()
    {
        var command = new global::Application.Features.BookingManagement.Participant.CreateParticipantCommand(
            BookingId: Guid.NewGuid(),
            ParticipantType: "Adult",
            FullName: "Test Participant",
            DateOfBirth: DateTimeOffset.UtcNow.AddYears(-25),
            Gender: null,
            Nationality: "VN");

        command.Should().BeAssignableTo<ICacheInvalidator>();
        command.CacheKeysToInvalidate.Should().Contain(CacheKey.Booking);
    }

    [Fact]
    public void UpdateParticipantCommand_ShouldStillInvalidateBookingCache()
    {
        var command = new global::Application.Features.BookingManagement.Participant.UpdateParticipantCommand(
            ParticipantId: Guid.NewGuid(),
            ParticipantType: "Adult",
            FullName: "Updated Name",
            DateOfBirth: DateTimeOffset.UtcNow.AddYears(-30),
            Gender: null,
            Nationality: "VN",
            Status: null);

        command.Should().BeAssignableTo<ICacheInvalidator>();
        command.CacheKeysToInvalidate.Should().Contain(CacheKey.Booking);
    }

    // ── Dead tag guard: no command should use raw "Admin" or "manager" ────

    [Fact]
    public void NoVisaCommand_ShouldUseDeadTags()
    {
        var commands = new ICacheInvalidator[]
        {
            new SubmitCustomerVisaApplicationCommand(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "VN"),
            new UpdateCustomerVisaApplicationCommand(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "VN"),
            new RequestVisaSupportCommand(Guid.NewGuid(), Guid.NewGuid()),
            new UpdateCustomerPassportCommand(Guid.NewGuid(), Guid.NewGuid(), "A1", "VN", null, null, null),
            new CreateVisaApplicationCommand(Guid.NewGuid(), Guid.NewGuid(), "VN"),
            new UpdateVisaApplicationStatusCommand(Guid.NewGuid(), global::Domain.Enums.VisaStatus.Approved),
            new RegisterVisaDetailsCommand(Guid.NewGuid(), "V1", DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddYears(1),
                global::Domain.Enums.VisaCategory.Business, global::Domain.Enums.VisaFormat.Sticker, "VN"),
        };

        foreach (var cmd in commands)
        {
            cmd.CacheKeysToInvalidate.Should().NotContain("Admin",
                because: $"{cmd.GetType().Name} should not invalidate dead 'Admin' tag");
            cmd.CacheKeysToInvalidate.Should().NotContain("manager",
                because: $"{cmd.GetType().Name} should not invalidate unrelated 'manager' tag");
        }
    }
}
