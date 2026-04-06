//using FluentValidation;
//using Microsoft.AspNetCore.Diagnostics;

//namespace Api.Infrastructure;

//public class CustomExceptionHandler : IExceptionHandler
//{
//    private readonly Dictionary<Type, Func<HttpContext, Exception, CancellationToken, Task>> _exceptionHandlers;

//    public CustomExceptionHandler()
//    {
//        _exceptionHandlers = new Dictionary<Type, Func<HttpContext, Exception, CancellationToken, Task>>
//        {
//            { typeof(ValidationException), HandleValidationException },
//        };
//    }

//    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception,
//        CancellationToken cancellationToken)
//    {
//        var exceptionType = exception.GetType();

//        if (_exceptionHandlers.TryGetValue(exceptionType, out var handler))
//        {
//            await handler.Invoke(httpContext, exception, cancellationToken);
//            return true;
//        }

//        return false;
//    }

//    private static async Task HandleValidationException(
//        HttpContext httpContext,
//        Exception ex,
//        CancellationToken cancellationToken)
//    {
//        var exception = (ValidationException)ex;

//        httpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
//        await httpContext.Response.WriteAsJsonAsync(new
//        {
//            Title = "Validation Failed",
//            Status = StatusCodes.Status400BadRequest,
//            Errors = exception.Errors
//                .GroupBy(e => e.PropertyName)
//                .ToDictionary(
//                    g => g.Key,
//                    g => g.Select(e => e.ErrorMessage).ToArray())
//        }, cancellationToken);
//    }
//}
