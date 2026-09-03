using System.Security.Claims;
using BlogSpot.Application.Constants;
using BlogSpot.Application.DTOs.Auth;
using BlogSpot.Application.Interfaces;
using BlogSpot.Domain.Enums;
using BlogSpot.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace BlogSpot.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IEmailQueueService _emailQueueService;
    private readonly ILogger<AuthController> _logger;
    private readonly IActivityLogService _log;
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly IMemoryCache _cache;
    private const int MaxLoginAttempts = 10;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(5);

    public AuthController(IAuthService authService, IEmailQueueService emailQueueService, ILogger<AuthController> logger, IActivityLogService log, AppDbContext db, IConfiguration config, IMemoryCache cache)
    {
        _authService = authService;
        _emailQueueService = emailQueueService;
        _logger = logger;
        _log = log;
        _db = db;
        _config = config;
        _cache = cache;
    }

    [HttpPost("send-otp")]
    [EnableRateLimiting("otp-send")]
    public async Task<ActionResult> SendOtp([FromBody] SendOtpRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { message = "Email is required." });

        await _emailQueueService.SendOtpAsync(request.Email, ct);
        await _log.Info(ActivityActions.OtpSent, nameof(AuthController), null, request.Email, ct);
        return Ok(new { message = "OTP sent to your email." });
    }

    [HttpPost("verify-otp")]
    [EnableRateLimiting("otp-verify")]
    public async Task<ActionResult> VerifyOtp([FromBody] VerifyOtpRequest request, CancellationToken ct)
    {
        var isValid = await _emailQueueService.VerifyOtpAsync(request.Email, request.OtpCode, ct);
        if (!isValid)
            return BadRequest(new { message = "Invalid or expired OTP." });

        await _log.Info(ActivityActions.OtpVerified, nameof(AuthController), null, request.Email, ct);
        return Ok(new { verified = true });
    }

    [HttpPost("register")]
    [EnableRateLimiting("auth-register")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto, CancellationToken ct)
    {
        try
        {
            var result = await _authService.RegisterAsync(dto, ct);
            return Ok(result);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error during registration. Inner: {Inner}", ex.InnerException?.Message);
            return StatusCode(500, new { error = ex.InnerException?.Message ?? ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto, CancellationToken ct)
    {
        var key = $"login_fail:{dto.EmailOrUsername.Trim().ToLower()}";
        var attempts = _cache.GetOrCreate(key, e => { e.AbsoluteExpirationRelativeToNow = LockoutDuration; return 0; });

        if (attempts >= MaxLoginAttempts)
            return StatusCode(429, new { error = $"Too many failed attempts. Try again in {LockoutDuration.TotalMinutes} minutes." });

        try
        {
            var result = await _authService.LoginAsync(dto, ct);
            _cache.Remove(key);
            return Ok(result);
        }
        catch
        {
            _cache.Set(key, attempts + 1, LockoutDuration);
            await _log.Warn(ActivityActions.LoginFailed, nameof(AuthController), null, dto.EmailOrUsername, ct);
            throw;
        }
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponseDto>> Refresh([FromBody] RefreshTokenRequest request, CancellationToken ct)
    {
        var result = await _authService.RefreshTokenAsync(request.RefreshToken, ct);
        return Ok(result);
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<ActionResult> Logout(CancellationToken ct)
    {
        await _authService.LogoutAsync(User.Identity?.Name, ct);
        return Ok();
    }

    /// <summary>
    /// One-time endpoint to promote a user to Admin.
    /// Secured by the Jwt:Key as a secret. Remove or disable after first use.
    /// </summary>
    [HttpPost("promote-admin")]
    public async Task<ActionResult> PromoteToAdmin([FromBody] PromoteAdminRequest request, CancellationToken ct)
    {
        // Validate secret key
        var jwtKey = _config["Jwt:Key"] ?? "";
        if (string.IsNullOrEmpty(request.SecretKey) || request.SecretKey != jwtKey)
            return Unauthorized(new { error = "Invalid secret key." });

        var user = await _db.Users.FirstOrDefaultAsync(u => u.UserName == request.UserName, ct);

        if (user == null)
            return NotFound(new { error = $"User '{request.UserName}' not found." });

        if (user.Role == UserRole.Admin)
            return Ok(new { message = $"User '{request.UserName}' is already an Admin." });

        user.Role = UserRole.Admin;
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("User '{Username}' promoted to Admin via API", request.UserName);
        await _log.Info(ActivityActions.AdminAction, nameof(AuthController), null, $"Promoted '{request.UserName}' to Admin via secret-key endpoint", ct);
        return Ok(new { message = $"User '{request.UserName}' has been promoted to Admin." });
    }
}

public class RefreshTokenRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}

public class PromoteAdminRequest
{
    public string UserName { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
}

public class SendOtpRequest
{
    public string Email { get; set; } = string.Empty;
}

public class VerifyOtpRequest
{
    public string Email { get; set; } = string.Empty;
    public string OtpCode { get; set; } = string.Empty;
}
