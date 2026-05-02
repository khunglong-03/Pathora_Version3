using System.Text.Json.Serialization;

namespace Application.Contracts.Identity
{
    public sealed record ConfirmRegisterRequest([property: JsonPropertyName("code")] string code);
}
