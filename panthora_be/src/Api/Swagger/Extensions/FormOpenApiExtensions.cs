using Microsoft.OpenApi;

namespace Api.Swagger.Extensions;

public static class FormOpenApiExtensions
{
    public static RouteHandlerBuilder WithMultipartForm<T>(
        this RouteHandlerBuilder builder,
        string[]? required = null) where T : class
    {
        return builder.Accepts<T>("multipart/form-data")
            .WithOpenApi(op =>
            {
                var schema = new OpenApiSchema
                {
                    Type = JsonSchemaType.Object,
                    Properties = new Dictionary<string, IOpenApiSchema>()
                };
                var media = new OpenApiMediaType { Schema = schema };

                foreach (var p in typeof(T).GetProperties())
                {
                    var name = char.ToLowerInvariant(p.Name[0]) + p.Name[1..];
                    var t = p.PropertyType;
                    var u = Nullable.GetUnderlyingType(t) ?? t;
                    if (typeof(IFormFile).IsAssignableFrom(u))
                    {
                        schema.Properties![name] = new OpenApiSchema { Type = JsonSchemaType.String, Format = "binary" };
                        continue;
                    }

                    if (typeof(IEnumerable<IFormFile>).IsAssignableFrom(u) && u != typeof(string))
                    {
                        schema.Properties![name] = new OpenApiSchema
                        {
                            Type = JsonSchemaType.Array,
                            Items = new OpenApiSchema { Type = JsonSchemaType.String, Format = "binary" }
                        };
                        continue;
                    }

                    if (typeof(System.Collections.IEnumerable).IsAssignableFrom(u) && u != typeof(string))
                    {
                        var elemType = u.IsArray ? u.GetElementType()! :
                                       u.GenericTypeArguments.FirstOrDefault() ?? typeof(string);

                        schema.Properties![name] = new OpenApiSchema
                        {
                            Type = JsonSchemaType.Array,
                            Items = MapPrimitive(elemType)
                        };

                        media.Encoding ??= new Dictionary<string, OpenApiEncoding>();
                        media.Encoding[name] = new OpenApiEncoding
                        {
                            Style = ParameterStyle.Form,
                            Explode = true
                        };
                        continue;
                    }

                    var s = MapPrimitive(u);
                    if (Nullable.GetUnderlyingType(t) != null)
                        s.Type |= JsonSchemaType.Null;
                    schema.Properties![name] = s;
                }

                if (required != null)
                    foreach (var r in required) (schema.Required ??= new HashSet<string>()).Add(r);

                op.RequestBody = new OpenApiRequestBody
                {
                    Required = true,
                    Content = new Dictionary<string, OpenApiMediaType>
                    {
                        ["multipart/form-data"] = media
                    }
                };

                return op;
            });
    }

    private static OpenApiSchema MapPrimitive(Type t)
    {
        if (t == typeof(string)) return new() { Type = JsonSchemaType.String };
        if (t == typeof(bool)) return new() { Type = JsonSchemaType.Boolean };
        if (t == typeof(int)) return new() { Type = JsonSchemaType.Integer, Format = "int32" };
        if (t == typeof(long)) return new() { Type = JsonSchemaType.Integer, Format = "int64" };
        if (t == typeof(float) || t == typeof(double) || t == typeof(decimal))
            return new() { Type = JsonSchemaType.Number };
        if (t == typeof(DateTime) || t == typeof(DateTimeOffset))
            return new() { Type = JsonSchemaType.String, Format = "date-time" };
        return new() { Type = JsonSchemaType.String };
    }
}
