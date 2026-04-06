using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace Api.Swagger;

public sealed class AuthorizeCheckOperationFilter : IOpenApiOperationTransformer
{
    public Task TransformAsync(
        OpenApiOperation operation,
        OpenApiOperationTransformerContext context,
        CancellationToken cancellationToken)
    {
        var hasAuthorize = context.Description
            .ActionDescriptor
            .EndpointMetadata
            .OfType<IAuthorizeData>()
            .Any();

        if (!hasAuthorize) return Task.CompletedTask;

        operation.Responses ??= new OpenApiResponses();
        operation.Responses.TryAdd("401", new OpenApiResponse { Description = "Unauthorized" });
        operation.Responses.TryAdd("403", new OpenApiResponse { Description = "Forbidden" });

        operation.Security =
        [
            new OpenApiSecurityRequirement
            {
                { new OpenApiSecuritySchemeReference("Bearer"), [] }
            }
        ];

        return Task.CompletedTask;
    }
}
