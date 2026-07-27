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
        var userName = context.User.Identity?.Name;
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
                userName: userName,
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
        // Parse: /api/{controller}/{...segments}
        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);

        // Remove "api" prefix
        if (segments.Length > 0 && segments[0].Equals("api", StringComparison.OrdinalIgnoreCase))
            segments = segments[1..];

        if (segments.Length == 0)
            return $"{method} Unknown";

        var controller = segments[0].ToLowerInvariant();

        // Filter out GUIDs from remaining segments to get meaningful route parts
        var routeParts = segments[1..]
            .Where(s => !Guid.TryParse(s, out _))
            .Select(s => s.ToLowerInvariant())
            .ToArray();

        // Map known routes to human-readable actions
        var action = (controller, method.ToUpperInvariant(), routeParts) switch
        {
            // Auth
            ("auth", "POST", ["login"]) => "Login",
            ("auth", "POST", ["register"]) => "Register",
            ("auth", "POST", ["send-otp"]) => "SendOtp",
            ("auth", "POST", ["verify-otp"]) => "VerifyOtp",
            ("auth", "POST", ["refresh"]) => "RefreshToken",
            ("auth", "POST", ["promote-admin"]) => "PromoteToAdmin",

            // Blog
            ("blog", "POST", []) => "CreateBlog",
            ("blog", "PUT", []) => "UpdateBlog",
            ("blog", "DELETE", []) => "DeleteBlog",
            ("blog", "GET", []) => "ViewBlog",
            ("blog", "GET", ["slug", ..]) => "ViewBlogBySlug",
            ("blog", "GET", ["user", ..]) => "ViewUserBlogs",
            ("blog", "GET", ["search"]) => "SearchBlogs",
            ("blog", "GET", ["fullsearch"]) => "FullSearchBlogs",
            ("blog", "POST", ["like"]) => "LikeBlog",
            ("blog", "POST", ["reactions"]) => "ReactToBlog",
            ("blog", "GET", ["reactions"]) => "ViewReactions",
            ("blog", "POST", ["bookmark"]) => "BookmarkBlog",
            ("blog", "GET", ["bookmarks"]) => "ViewBookmarks",
            ("blog", "POST", ["drafts"]) => "SaveDraft",
            ("blog", "GET", ["drafts"]) => "ViewDrafts",
            ("blog", "GET", ["drafts", ..]) => "ViewDraft",
            ("blog", "DELETE", ["drafts", ..]) => "DeleteDraft",
            ("blog", "POST", ["comments"]) => "AddComment",
            ("blog", "GET", ["comments"]) => "ViewComments",
            ("blog", "POST", ["comments", .., "like"]) => "LikeComment",
            ("blog", "DELETE", ["comments", ..]) => "DeleteComment",

            // User
            ("user", "GET", ["search"]) => "SearchUsers",
            ("user", "GET", ["username", ..]) => "ViewUserByUsername",
            ("user", "GET", ["suggested"]) => "ViewSuggestedUsers",
            ("user", "GET", ["analytics"]) => "ViewAnalytics",
            ("user", "PUT", ["profile"]) => "UpdateProfile",
            ("user", "POST", ["profile", "picture"]) => "UploadProfilePicture",
            ("user", "POST", ["profile", "cover"]) => "UploadCoverPhoto",
            ("user", "POST", ["follow"]) => "FollowUser",
            ("user", "DELETE", ["remove-follower"]) => "RemoveFollower",
            ("user", "GET", ["followers"]) => "ViewFollowers",
            ("user", "GET", ["following"]) => "ViewFollowing",
            ("user", "GET", []) => "ViewUserProfile",

            // Feed
            ("feed", "GET", _) => "ViewFeed",

            // Notification
            ("notification", "GET", _) => "ViewNotifications",
            ("notification", "PUT", _) => "MarkNotificationRead",

            // Admin
            ("admin", "GET", ["users"]) => "AdminViewUsers",
            ("admin", "PUT", ["users", .., "toggle-status"]) => "AdminToggleUserStatus",
            ("admin", "PUT", ["users", .., "role"]) => "AdminChangeRole",
            ("admin", "GET", ["posts"]) => "AdminViewPosts",
            ("admin", "DELETE", ["posts", ..]) => "AdminDeletePost",
            ("admin", "GET", ["comments"]) => "AdminViewComments",
            ("admin", "DELETE", ["comments", ..]) => "AdminDeleteComment",
            ("admin", "POST", ["seed"]) => "AdminSeedData",
            ("admin", "GET", ["emails"]) => "AdminViewEmails",
            ("admin", "POST", ["send-report-email"]) => "AdminSendReportEmail",
            ("admin", "GET", ["activity-logs"]) => "AdminViewActivityLogs",

            // Fallback: method + controller + first route part
            _ => BuildFallbackAction(method, controller, routeParts)
        };

        return action;
    }

    private static string BuildFallbackAction(string method, string controller, string[] routeParts)
    {
        var verb = method.ToUpperInvariant() switch
        {
            "GET" => "View",
            "POST" => "Create",
            "PUT" => "Update",
            "DELETE" => "Delete",
            "PATCH" => "Patch",
            _ => method
        };

        var resource = char.ToUpperInvariant(controller[0]) + controller[1..];
        var suffix = routeParts.Length > 0
            ? string.Concat(routeParts.Select(p => char.ToUpperInvariant(p[0]) + p[1..]))
            : "";

        return $"{verb}{resource}{suffix}";
    }
}
