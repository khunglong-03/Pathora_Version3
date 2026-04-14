namespace Api.Endpoint;

public static class VisaApplicationEndpoint
{
    public const string Base = "api/visa-application";
    public const string Id = "{id:guid}";
    public const string ByBookingParticipant = "by-participant/{bookingParticipantId:guid}";
}
