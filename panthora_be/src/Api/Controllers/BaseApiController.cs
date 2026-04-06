using Application.Common.Constant;
using Contracts.Interfaces;
using Contracts.ModelResponse;
using ErrorOr;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;

namespace Api.Controllers;

[ApiController]
public abstract class BaseApiController : ControllerBase
{
    private ISender? _sender;
    protected ISender Sender => _sender ??= HttpContext.RequestServices.GetRequiredService<ISender>();
    protected string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
    protected string CurrentLanguage =>
        HttpContext.RequestServices.GetService<ILanguageContext>()?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;

    /// <summary>
    /// Returns an ObjectResult safely. If the response has already started (headers committed),
    /// returns EmptyResult to avoid InvalidOperationException from ObjectResult.OnFormatting.
    /// </summary>
    private IActionResult SafeResult(int statusCode, object? value)
    {
        if (HttpContext.Response.HasStarted)
            return new EmptyResult();
        return new ObjectResult(value) { StatusCode = statusCode };
    }

    protected IActionResult HandleResult<T>(
        ErrorOr<T> result,
        int successStatusCode = StatusCodes.Status200OK,
        LocalizedMessage? successMessage = null)
    {
        if (result.IsError)
        {
            var firstError = result.FirstError;
            var firstMessage = ErrorConstants.ResolveByCode(firstError.Code, CurrentLanguage, firstError.Description);
            var statusCode = firstError.Type switch
            {
                ErrorType.NotFound => StatusCodes.Status404NotFound,
                ErrorType.Validation => StatusCodes.Status400BadRequest,
                ErrorType.Conflict => StatusCodes.Status409Conflict,
                ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
                ErrorType.Forbidden => StatusCodes.Status403Forbidden,
                ErrorType.Unexpected when firstError.Code == ErrorConstants.Auth.ServiceUnavailableCode => StatusCodes.Status503ServiceUnavailable,
                _ => StatusCodes.Status500InternalServerError
            };

            return SafeResult(statusCode, ResultSharedResponse<object>.Failure(
                statusCode: statusCode,
                instance: HttpContext.Request.Path,
                errors: result.Errors.Select(e =>
                        new ErrorResult(ErrorConstants.ResolveByCode(e.Code, CurrentLanguage, e.Description), e.Code))
                    .ToList(),
                message: firstMessage));
        }

        return SafeResult(successStatusCode, ResultSharedResponse<T>.Success(
            result.Value,
            (successMessage ?? SuccessMessages.General).Resolve(CurrentLanguage),
            HttpContext.Request.Path,
            successStatusCode));
    }

    protected IActionResult HandleCreated<T>(
        ErrorOr<T> result,
        int successStatusCode = StatusCodes.Status201Created,
        LocalizedMessage? successMessage = null)
    {
        if (result.IsError)
            return HandleResult(result);

        return SafeResult(successStatusCode, ResultSharedResponse<T>.Success(
            result.Value,
            (successMessage ?? SuccessMessages.Created).Resolve(CurrentLanguage),
            HttpContext.Request.Path,
            successStatusCode));
    }

    protected IActionResult HandleUpdated<T>(
        ErrorOr<T> result,
        int successStatusCode = StatusCodes.Status200OK,
        LocalizedMessage? successMessage = null)
    {
        if (result.IsError)
            return HandleResult(result);

        return SafeResult(successStatusCode, ResultSharedResponse<ApiUpdatedResponse<T>>.Success(
            new ApiUpdatedResponse<T>(result.Value),
            (successMessage ?? SuccessMessages.Updated).Resolve(CurrentLanguage),
            HttpContext.Request.Path,
            successStatusCode));
    }

    protected IActionResult HandleDeleted<T>(
        ErrorOr<T> result,
        int successStatusCode = StatusCodes.Status200OK,
        LocalizedMessage? successMessage = null)
    {
        if (result.IsError)
            return HandleResult(result);

        return SafeResult(successStatusCode, ResultSharedResponse<ApiDeletedResponse<T>>.Success(
            new ApiDeletedResponse<T>(result.Value),
            (successMessage ?? SuccessMessages.Deleted).Resolve(CurrentLanguage),
            HttpContext.Request.Path,
            successStatusCode));
    }
    protected IActionResult HandleGet<T>(
        ErrorOr<T> result,
        int successStatusCode = StatusCodes.Status200OK,
        LocalizedMessage? successMessage = null)
    {
        if (result.IsError)
            return HandleResult(result);

        return SafeResult(successStatusCode, ResultSharedResponse<ApiGetResponse<T>>.Success(
            new ApiGetResponse<T>(result.Value),
            (successMessage ?? SuccessMessages.DataRetrieved).Resolve(CurrentLanguage),
            HttpContext.Request.Path,
            successStatusCode));
    }

    protected IActionResult HandlePerformed<T>(
        ErrorOr<T> result,
        int successStatusCode = StatusCodes.Status200OK,
        LocalizedMessage? successMessage = null)
    {
        if (result.IsError)
            return HandleResult(result);

        return SafeResult(successStatusCode, ResultSharedResponse<ApiPerformedResponse<T>>.Success(
            new ApiPerformedResponse<T>(result.Value),
            (successMessage ?? SuccessMessages.Performed).Resolve(CurrentLanguage),
            HttpContext.Request.Path,
            successStatusCode));
    }

    protected IActionResult HandleNoContent<T>(ErrorOr<T> result)
    {
        if (result.IsError)
            return HandleResult(result);
        return NoContent();
    }
}
