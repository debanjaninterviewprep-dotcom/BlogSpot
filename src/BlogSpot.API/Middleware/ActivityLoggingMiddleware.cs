using System.Security.Claims;
using BlogSpot.Application.Interfaces;

namespace BlogSpot.API.Middleware;

public class ActivityLoggingMiddleware
{
    private readonly RequestDelegate _next;

    public ActivityLoggingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IActivityLogService activityLogService)
    {
        await _next(context);

        // Skip health checks and swagger to avoid noise
        var path = context.Request.Path.Value ?? "";
        if (path == "/" || path.StartsWith("/swagger") || path == "/api/health")
            return;

        var userId = GetUserId(context);
        var action = DeriveAction(context.Request.Method, path);
        var level = context.Response.StatusCode >= 400 ? Domain.Enums.LogLevel.Error : Domain.Enums.LogLevel.Info;

        var ipAddress = context.Connection.RemoteIpAddress?.ToString();
        var userAgent = context.Request.Headers.UserAgent.ToString();
        if (userAgent.Length > 500) userAgent = userAgent[..500];

        try
        {
            await activityLogService.LogAsync(
                action: action,
                httpMethod: context.Request.Method,
                endpoint: path,
                userId: userId,
                level: level,
                ipAddress: ipAddress,
                userAgent: userAgent,
                statusCode: context.Response.StatusCode,
                ct: CancellationToken.None);
        }
        catch
        {
            // Never let logging failures break the request pipeline
        }
    }

    private static Guid? GetUserId(HttpContext context)
    {
        var claim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }

    private static string DeriveAction(string method, string path)
    {
        // Extract meaningful action from the route: e.g., "POST /api/blog" → "CreateBlog"
        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        var resource = segments.Length >= 2 ? segments[1] : segments.FirstOrDefault() ?? "Unknown";

        var verb = method.ToUpperInvariant() switch
        {
            "GET" => "View",
            "POST" => "Create",
            "PUT" => "Update",
            "DELETE" => "Delete",
            "PATCH" => "Patch",
            _ => method
        };

        // Capitalize first letter of resource
        if (resource.Length > 0)
            resource = char.ToUpperInvariant(resource[0]) + resource[1..];

        return $"{verb}{resource}";
    }
}
