using System.Net;
using System.Text.Json;
using BlogSpot.Application.Constants;
using BlogSpot.Application.Interfaces;

namespace BlogSpot.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IActivityLogService log)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred.");
            try
            {
                await log.Error(
                    ActivityActions.UnhandledException,
                    nameof(ExceptionHandlingMiddleware),
                    context.User.Identity?.Name,
                    ex.Message,
                    CancellationToken.None);
            }
            catch
            {
                // Never let logging failures mask the original exception
            }
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, message) = exception switch
        {
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized, exception.Message),
            KeyNotFoundException => (HttpStatusCode.NotFound, exception.Message),
            InvalidOperationException => (HttpStatusCode.BadRequest, exception.Message),
            ArgumentException => (HttpStatusCode.BadRequest, exception.Message),
            _ => (HttpStatusCode.InternalServerError, "An unexpected error occurred.")
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        // TEMPORARY DIAGNOSTIC: expose real error detail on 500s to locate the root cause.
        var detail = statusCode == HttpStatusCode.InternalServerError
            ? $"{exception.GetType().Name}: {exception.Message}" +
              (exception.InnerException != null ? $" | INNER: {exception.InnerException.GetType().Name}: {exception.InnerException.Message}" : "")
            : null;

        var response = new
        {
            status = (int)statusCode,
            message,
            detail,
            timestamp = DateTime.UtcNow
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
}
