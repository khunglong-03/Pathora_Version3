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
        {
            // Nullable DateOnly: omitted query param is null. Required DateOnly: do not leave default(0001-01-01) — that trips FluentValidation with a confusing year message.
            if (Nullable.GetUnderlyingType(bindingContext.ModelType) == typeof(DateOnly))
            {
                bindingContext.Result = ModelBindingResult.Success(null);
                return Task.CompletedTask;
            }

            bindingContext.ModelState.TryAddModelError(
                modelName,
                $"The '{modelName}' field is required.");
            bindingContext.Result = ModelBindingResult.Failed();
            return Task.CompletedTask;
        }

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
