using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace Api.Infrastructure;

public sealed class DateOnlyModelBinderProvider : IModelBinderProvider
{
    public IModelBinder? GetBinder(ModelBinderProviderContext context)
    {
        ArgumentNullException.ThrowIfNull(context);

        var t = context.Metadata.ModelType;
        if (t == typeof(DateOnly) || t == typeof(DateOnly?))
            return new DateOnlyModelBinder();
        return null;
    }
}
