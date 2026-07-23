using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BlogSpot.Application.DTOs.Auth;
using BlogSpot.Application.Interfaces;
using BlogSpot.Domain.Entities;
using BlogSpot.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace BlogSpot.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _uow;
    private readonly IConfiguration _config;
    private readonly IEmailQueueService _emailQueueService;

    public AuthService(IUnitOfWork uow, IConfiguration config, IEmailQueueService emailQueueService)
    {
        _uow = uow;
        _config = config;
        _emailQueueService = emailQueueService;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto, CancellationToken ct = default)
    {
        // Check if email or username already exists
        if (await _uow.Users.ExistsAsync(u => u.Email == dto.Email, ct))
            throw new InvalidOperationException("Email is already registered.");

        if (await _uow.Users.ExistsAsync(u => u.UserName == dto.UserName, ct))
            throw new InvalidOperationException("Username is already taken.");

        var user = new User
        {
            UserName = dto.UserName,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = Domain.Enums.UserRole.User,
            IsActive = true
        };

        await _uow.Users.AddAsync(user, ct);

        // Create default profile
        var profile = new Profile
        {
            UserId = user.Id,
            DisplayName = dto.DisplayName ?? dto.UserName
        };
        await _uow.Profiles.AddAsync(profile, ct);

        await _uow.SaveChangesAsync(ct);

        // Send welcome email
        await _emailQueueService.EnqueueAsync(user.Email,
            "Welcome to BlogSpot!",
            $@"<div style='font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px'>
                <h2 style='color:#1d9bf0'>Welcome to BlogSpot, {dto.DisplayName ?? dto.UserName}!</h2>
                <p>We're thrilled to have you join our community of writers and readers.</p>
                <p>Here's what you can do:</p>
                <ul style='line-height:2;color:#0f1419'>
                    <li>Write and publish your own blog posts</li>
                    <li>Comment and engage with other writers</li>
                    <li>React to posts and comments you love</li>
                    <li>Bookmark posts to read later</li>
                    <li>Follow your favorite authors</li>
                </ul>
                <p>Start exploring and share your stories with the world!</p>
                <p style='color:#536471;font-size:13px;margin-top:24px'>Happy blogging! -- The BlogSpot Team</p>
            </div>", ct);

        return GenerateAuthResponse(user, profile);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto, CancellationToken ct = default)
    {
        var input = dto.EmailOrUsername.Trim();
        var user = await _uow.Users.Query()
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Email == input || u.UserName == input, ct)
            ?? throw new UnauthorizedAccessException("Invalid credentials.");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("Account is deactivated. Contact support.");

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        return GenerateAuthResponse(user, user.Profile);
    }

    public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken, CancellationToken ct = default)
    {
        // In production, store refresh tokens in DB. For now, validate the JWT-based refresh.
        var principal = GetPrincipalFromExpiredToken(refreshToken);
        var userId = Guid.Parse(principal.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var user = await _uow.Users.Query()
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new UnauthorizedAccessException("Invalid refresh token.");

        return GenerateAuthResponse(user, user.Profile);
    }

    private AuthResponseDto GenerateAuthResponse(User user, Profile? profile)
    {
        var token = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken(user);

        return new AuthResponseDto
        {
            Token = token,
            RefreshToken = refreshToken,
            Expiration = DateTime.UtcNow.AddHours(
                double.Parse(_config["Jwt:ExpirationInHours"] ?? "24")),
            User = new UserInfoDto
            {
                Id = user.Id,
                UserName = user.UserName,
                Email = user.Email,
                Role = user.Role.ToString(),
                ProfilePictureUrl = profile?.ProfilePictureUrl,
                DisplayName = profile?.DisplayName
            }
        };
    }

    private string GenerateJwtToken(User user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Key"]
                ?? throw new InvalidOperationException("JWT Key not configured.")));

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.UserName),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiration = DateTime.UtcNow.AddHours(
            double.Parse(_config["Jwt:ExpirationInHours"] ?? "24"));

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: expiration,
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string GenerateRefreshToken(User user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new("token_type", "refresh")
        };

        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiration = DateTime.UtcNow.AddDays(7);

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: expiration,
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private ClaimsPrincipal GetPrincipalFromExpiredToken(string token)
    {
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidAudience = _config["Jwt:Audience"],
            ValidateIssuer = true,
            ValidIssuer = _config["Jwt:Issuer"],
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_config["Jwt:Key"]!)),
            ValidateLifetime = false // Allow expired tokens for refresh
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);

        if (securityToken is not JwtSecurityToken jwtToken ||
            !jwtToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            throw new SecurityTokenException("Invalid token.");

        return principal;
    }
}
