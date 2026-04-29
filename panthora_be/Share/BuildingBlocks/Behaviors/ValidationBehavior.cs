using ErrorOr;
using FluentValidation;
using MediatR;

namespace BuildingBlocks.Behaviors;

public sealed class ValidationBehavior<TRequest, TResponse>
    (IEnumerable<IValidator<TRequest>> validators)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull, IRequest<TResponse>
{
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        if (!validators.Any())
        {
            return await next();
        }

        var context = new ValidationContext<TRequest>(request);
        var validationResults =
            await Task.WhenAll(validators.Select(v => v.ValidateAsync(context, cancellationToken)));

        var failures = validationResults
            .SelectMany(r => r.Errors)
            .Where(f => f != null)
            .ToList();

        if (failures.Count == 0)
        {
            return await next();
        }

        // Convert FluentValidation failures to ErrorOr Errors
        var errors = failures
            .ConvertAll(failure => Error.Validation(
                code: failure.PropertyName,
                description: failure.ErrorMessage));

        // Use reflection to create ErrorOr<T> from errors if TResponse is ErrorOr
        if (typeof(TResponse).IsGenericType &&
            typeof(TResponse).GetGenericTypeDefinition() == typeof(ErrorOr<>))
        {
            return (TResponse)typeof(TResponse)
                .GetMethod("From", [typeof(List<Error>)])!
                .Invoke(null, [errors])!;
        }

        // Fallback for non-ErrorOr responses (though in this project most are ErrorOr)
        throw new ValidationException(failures);
    }
}
