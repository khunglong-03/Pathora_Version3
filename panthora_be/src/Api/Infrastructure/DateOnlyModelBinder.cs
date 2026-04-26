using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace Api.Infrastructure;

/// <summary>
/// Binds <see cref="DateOnly"/> and <see cref="DateOnly"/>? from query/route values using <see cref="DateOnlyQueryParsing"/>.
/// </summary>
public sealed class DateOnlyModelBinder : IModelBinder
{
    public Task BindModelAsync(ModelBindingContext bindingContext)
    {
        ArgumentNullException.ThrowIfNull(bindingContext);

        var modelName = bindingContext.ModelName;
        var valueProviderResult = bindingContext.ValueProvider.GetValue(modelName);
        if (valueProviderResult == ValueProviderResult.None)
            return Task.CompletedTask;

        bindingContext.ModelState.SetModelValue(modelName, valueProviderResult);

        var value = valueProviderResult.FirstValue;
        if (string.IsNullOrWhiteSpace(value))
        {
            if (Nullable.GetUnderlyingType(bindingContext.ModelType) == typeof(DateOnly))
                bindingContext.Result = ModelBindingResult.Success(null);
            return Task.CompletedTask;
        }

        if (DateOnlyQueryParsing.TryParse(value, out var date))
        {
            if (Nullable.GetUnderlyingType(bindingContext.ModelType) == typeof(DateOnly))
                bindingContext.Result = ModelBindingResult.Success((DateOnly?)date);
            else
                bindingContext.Result = ModelBindingResult.Success(date);
            return Task.CompletedTask;
        }

        bindingContext.ModelState.TryAddModelError(
            modelName,
            $"The value '{value}' is not a valid date. Use yyyy-MM-dd or an ISO-8601 date-time.");
        return Task.CompletedTask;
    }
}
