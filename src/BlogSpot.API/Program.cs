using BlogSpot.API.Hubs;
using BlogSpot.API.Middleware;
using BlogSpot.Application;
using BlogSpot.Application.Services;
using BlogSpot.Infrastructure;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Serilog;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/blogspot-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services - Clean Architecture layers
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// Background services
builder.Services.AddHostedService<PostSchedulerService>();

// In-memory cache
builder.Services.AddMemoryCache();

// Controllers
builder.Services.AddControllers();

// HttpClient for external API calls (Resend email)
builder.Services.AddHttpClient();

// SignalR
builder.Services.AddSignalR();

// Response compression
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<GzipCompressionProvider>();
});

// Response caching
builder.Services.AddResponseCaching();

// Trust X-Forwarded-For from Render's reverse proxy so rate limiting uses real client IP
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// Rate limiting — per-IP, fixed window
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.OnRejected = async (context, ct) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsync(
            "{\"error\":\"Too many requests. Please try again later.\"}", ct);
    };

    static string GetIp(HttpContext ctx) =>
        ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";

    options.AddPolicy("otp-send", ctx =>
        RateLimitPartition.GetFixedWindowLimiter(GetIp(ctx),
            _ => new FixedWindowRateLimiterOptions { Window = TimeSpan.FromMinutes(10), PermitLimit = 5, QueueLimit = 0 }));

    options.AddPolicy("otp-verify", ctx =>
        RateLimitPartition.GetFixedWindowLimiter(GetIp(ctx),
            _ => new FixedWindowRateLimiterOptions { Window = TimeSpan.FromMinutes(10), PermitLimit = 10, QueueLimit = 0 }));

    options.AddPolicy("auth-register", ctx =>
        RateLimitPartition.GetFixedWindowLimiter(GetIp(ctx),
            _ => new FixedWindowRateLimiterOptions { Window = TimeSpan.FromMinutes(10), PermitLimit = 5, QueueLimit = 0 }));
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins(
                builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                ?? new[] { "http://localhost:4200" })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "BlogSpot API",
        Version = "v1",
        Description = "A social blog platform API"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Auto-apply migrations and seed admin on startup (non-fatal if DB is unavailable)
try
{
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BlogSpot.Infrastructure.Data.AppDbContext>();
    db.Database.Migrate();
    Log.Information("Database migration completed successfully");

    // Auto-seed admin account if none exists
    var adminExists = await db.Set<BlogSpot.Domain.Entities.User>()
        .AnyAsync(u => u.Role == BlogSpot.Domain.Enums.UserRole.Admin);

    if (!adminExists)
    {
        var adminConfig = app.Configuration.GetSection("AdminSeed");
        var seedEmail = adminConfig["Email"] ?? "admin@blogspot.com";
        var seedUserName = adminConfig["UserName"] ?? "admin";

        // Check if user with same email or username already exists — promote instead of duplicating
        var existingUser = await db.Set<BlogSpot.Domain.Entities.User>()
            .FirstOrDefaultAsync(u => u.Email == seedEmail || u.UserName == seedUserName);

        if (existingUser != null)
        {
            existingUser.Role = BlogSpot.Domain.Enums.UserRole.Admin;
            await db.SaveChangesAsync();
            Log.Information("Existing user '{Username}' promoted to Admin", existingUser.UserName);
        }
        else
        {
            var adminUser = new BlogSpot.Domain.Entities.User
            {
                UserName = seedUserName,
                Email = seedEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminConfig["Password"] ?? "Admin@123456"),
                Role = BlogSpot.Domain.Enums.UserRole.Admin,
                IsActive = true
            };
            db.Set<BlogSpot.Domain.Entities.User>().Add(adminUser);

            var adminProfile = new BlogSpot.Domain.Entities.Profile
            {
                UserId = adminUser.Id,
                DisplayName = adminConfig["DisplayName"] ?? "Administrator"
            };
            db.Set<BlogSpot.Domain.Entities.Profile>().Add(adminProfile);

            await db.SaveChangesAsync();
            Log.Information("Admin account seeded: {Username}", adminUser.UserName);
        }
    }
}
}
catch (Exception ex)
{
    Log.Error(ex, "Database migration/seeding failed — {Message}", ex.Message);
    if (ex.InnerException != null)
        Log.Error("Inner exception: {Inner}", ex.InnerException.Message);
}

// Middleware pipeline
app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "BlogSpot API v1"));

app.UseForwardedHeaders(); // must be first so real client IP is available to rate limiter

app.UseMiddleware<ExceptionHandlingMiddleware>();

// Only redirect to HTTPS in development (Render handles SSL at proxy level)
if (app.Environment.IsDevelopment())
    app.UseHttpsRedirection();

app.UseResponseCompression();
app.UseResponseCaching();

app.UseCors("AllowAngular");

app.UseRateLimiter();

app.UseStaticFiles(); // Serve uploaded images (after CORS so cross-origin requests work)

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");

// Health check endpoints (root + /api/health for keep-alive cron jobs)
app.MapGet("/", () => Results.Ok(new { status = "healthy", service = "BlogSpot API", timestamp = DateTime.UtcNow }));
app.MapGet("/api/health", () => Results.Ok(new { status = "healthy", service = "BlogSpot API", timestamp = DateTime.UtcNow }));

app.Run();
