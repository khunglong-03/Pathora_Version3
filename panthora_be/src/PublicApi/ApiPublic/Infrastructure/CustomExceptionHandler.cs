using Application.Common.Constant;
using Common.Constants;
using Contracts.ModelResponse;
using Domain.Constant;
using ErrorOr;
using FluentValidation;
using Infrastructure.Loging;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;

namespace ApiPublic.Infrastructure;

public sealed class CustomExceptionHandler(
    ILogger<CustomExceptionHandler> logger,
    IConfiguration cfg,
    LogQueue logQueue) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext context,
        Exception exception,
        CancellationToken cancellationToken)
    {
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
            case ArgumentException:
                statusCode = StatusCodes.Status400BadRequest;
                details = MessageCode.BadRequest;
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

        if (context.Response.HasStarted)
        {
            return true;
        }

        try
        {
            context.Response.StatusCode = statusCode;
        }
        catch (InvalidOperationException)
        {
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

        if (context.Response.HasStarted)
        {
            return true;
        }

        await context.Response.WriteAsJsonAsync(response, cancellationToken: cancellationToken);

        return true;
    }
}
