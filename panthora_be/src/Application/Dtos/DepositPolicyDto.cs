using Domain.Entities.Translations;
using Domain.Enums;
using Domain.ValueObjects;
using System.Text.Json.Serialization;

namespace Application.Dtos;

public sealed record DepositPolicyDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("depositType")] DepositType DepositType,
    [property: JsonPropertyName("depositValue")] decimal DepositValue,
    [property: JsonPropertyName("minDaysBeforeDeparture")] int MinDaysBeforeDeparture
);
