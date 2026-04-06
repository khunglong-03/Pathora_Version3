using Api.Exceptions;
using Application.Common.Constant;
using Common.Constants;
using Contracts.ModelResponse;
using Domain.Constant;
using ErrorOr;
using FluentValidation;
using Infrastructure.Loging;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;

namespace Api.Exceptions.Handler;

public sealed class CustomExceptionHandler(
    ILogger<CustomExceptionHandler> logger,
    IConfiguration cfg,
    LogQueue logQueue) : IExceptionHandler
{
    #region Implementations

    public async ValueTask<bool> TryHandleAsync(
        HttpContext context,
        Exception exception,
        CancellationToken cancellationToken)
    {
        // If response already started (e.g. auth challenge wrote headers), don't touch it.
        // Let the auth middleware handle its own response.
        if (context.Response.HasStarted)
        {
            return true;
        }

        var includeInnerEx = cfg.GetValue<bool>("AppConfig:IncludeInnerException");
        var includeStackTrace = cfg.GetValue<bool>("AppConfig:IncludeExceptionStackTrace");

        int statusCode;
        string? details;
        string errorMessage;
        string innerException;

        switch (exception)
        {
            case ValidationException:
                statusCode = StatusCodes.Status400BadRequest;
                details = MessageCode.BadRequest;
                errorMessage = exception.Message;
                innerException = includeInnerEx ? exception.GetType().Name : string.Empty;
                break;
            case ClientValidationException:
                statusCode = StatusCodes.Status400BadRequest;
                details = MessageCode.BadRequest;
                errorMessage = exception.Message;
                innerException = includeInnerEx ? exception.GetType().Name : string.Empty;
                break;
            case ArgumentException:
                statusCode = StatusCodes.Status400BadRequest;
                details = MessageCode.BadRequest;
                errorMessage = exception.Message;
                innerException = includeInnerEx ? exception.GetType().Name : string.Empty;
                break;
            case NotFoundException:
                statusCode = StatusCodes.Status404NotFound;
                details = MessageCode.NotFound;
                errorMessage = exception.Message;
                innerException = includeInnerEx ? exception.GetType().Name : string.Empty;
                break;
            case UnauthorizedException:
                statusCode = StatusCodes.Status401Unauthorized;
                details = MessageCode.Unauthorized;
                errorMessage = exception.Message;
                innerException = includeInnerEx ? exception.GetType().Name : string.Empty;
                break;
            case NoPermissionException:
                statusCode = StatusCodes.Status401Unauthorized;
                details = MessageCode.AccessDenied;
                errorMessage = exception.Message;
                innerException = includeInnerEx ? exception.GetType().Name : string.Empty;
                break;
            case DbUpdateConcurrencyException:
                statusCode = StatusCodes.Status409Conflict;
                details = MessageCode.ConcurrencyConflict;
                errorMessage = ErrorConstants.Common.ConcurrencyConflictDescription.En;
                innerException = includeInnerEx ? exception.GetType().Name : string.Empty;
                break;
            default:
                statusCode = StatusCodes.Status500InternalServerError;
                details = includeStackTrace ? exception.StackTrace : null;
                errorMessage = includeInnerEx ? exception.Message : MessageCode.UnknownError;
                innerException = includeInnerEx ? exception.InnerException?.Message ?? string.Empty : string.Empty;
                break;
        }

        // Guard: if response started while building the details above, don't touch it.
        if (context.Response.HasStarted)
        {
            return true;
        }

        // Set status code safely — if it throws (response committed mid-flight), swallow it.
        try
        {
            context.Response.StatusCode = statusCode;
        }
        catch (InvalidOperationException)
        {
            // Response was committed between the HasStarted check and the StatusCode setter.
            // The response is already on its way; don't interfere.
            return true;
        }

        var errors = new List<ErrorResult>();

        if (exception is FluentValidation.ValidationException validationException)
        {
            foreach (var error in validationException.Errors)
            {
                errors.Add(new ErrorResult(error.ErrorMessage, error.PropertyName));
            }
        }
        else if (exception is ClientValidationException badRequestException)
        {
            errors.Add(new ErrorResult(badRequestException.Message, badRequestException.Details!));
        }
        else if (exception is NotFoundException notFoundException)
        {
            errors.Add(new ErrorResult(notFoundException.Message, notFoundException.Details!));
        }
        else if (exception is ArgumentException argumentException)
        {
            errors.Add(new ErrorResult(argumentException.Message, argumentException.ParamName ?? string.Empty));
        }
        else if (exception is DbUpdateConcurrencyException)
        {
            errors.Add(new ErrorResult(ErrorConstants.Common.ConcurrencyConflictDescription.En, ErrorConstants.Common.ConcurrencyConflictCode));
        }
        else
        {
            errors.Add(new ErrorResult(errorMessage, innerException));
        }

        var response = ResultSharedResponse<object>.Failure(
            statusCode: statusCode,
            instance: context.Request.Path,
            errors: errors,
            message: details);

        if (statusCode == StatusCodes.Status500InternalServerError)
        {
            logger.LogError("Error Message: {exceptionMessage}, Time of occurrence {time}", exception.Message, DateTime.UtcNow);

        }
        else
        {
            logger.LogWarning("Message: {exceptionMessage}, Time of occurrence {time}", exception.Message, DateTime.UtcNow);
        }
        var log = new LogError
        {
            Content = "[" + exception.GetType().Name + "]" + exception.Message + exception.StackTrace,
        };
        logQueue.Writer.TryWrite(log);

        // Guard: if response was committed between StatusCode set and WriteAsJson, skip writing.
        if (context.Response.HasStarted)
        {
            return true;
        }

        await context.Response.WriteAsJsonAsync(response, cancellationToken: cancellationToken);

        return true;
    }

    #endregion
}

