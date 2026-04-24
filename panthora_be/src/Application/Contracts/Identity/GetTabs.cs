using System.Text.Json.Serialization;

namespace Application.Contracts.Identity;

public sealed record TabVm(
    [property: JsonPropertyName("categoryId")] int CategoryId,
    [property: JsonPropertyName("description")] string Description,
    [property: JsonPropertyName("isVisitTab")] bool IsVisitTab);
