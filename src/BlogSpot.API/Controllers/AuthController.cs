using System.Security.Claims;
using BlogSpot.Application.DTOs.Auth;
using BlogSpot.Application.Interfaces;
using BlogSpot.Domain.Enums;
using BlogSpot.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BlogSpot.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IEmailQueueService _emailQueueService;
    private readonly ILogger<AuthController> _logger;
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthController(IAuthService authService, IEmailQueueService emailQueueService, ILogger<AuthController> logger, AppDbContext db, IConfiguration config)
    {
        _authService = authService;
        _emailQueueService = emailQueueService;
        _logger = logger;
        _db = db;
        _config = config;
    }

    [HttpPost("send-otp")]
    public async Task<ActionResult> SendOtp([FromBody] SendOtpRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { message = "Email is required." });

        await _emailQueueService.SendOtpAsync(request.Email, ct);
        return Ok(new { message = "OTP sent to your email." });
    }

    [HttpPost("verify-otp")]
    public async Task<ActionResult> VerifyOtp([FromBody] VerifyOtpRequest request, CancellationToken ct)
    {
        var isValid = await _emailQueueService.VerifyOtpAsync(request.Email, request.OtpCode, ct);
        if (!isValid)
            return BadRequest(new { message = "Invalid or expired OTP." });

        return Ok(new { verified = true });
    }

    [HttpPost("register")]
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
        var result = await _authService.LoginAsync(dto, ct);
        return Ok(result);
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponseDto>> Refresh([FromBody] RefreshTokenRequest request, CancellationToken ct)
    {
        var result = await _authService.RefreshTokenAsync(request.RefreshToken, ct);
        return Ok(result);
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
