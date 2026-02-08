using System.Security.Claims;
using BlogSpot.Application.DTOs.Common;
using BlogSpot.Application.DTOs.User;
using BlogSpot.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BlogSpot.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IFileStorageService _fileStorage;

    public UserController(IUserService userService, IFileStorageService fileStorage)
    {
        _userService = userService;
        _fileStorage = fileStorage;
    }

    private Guid? GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return claim != null ? Guid.Parse(claim.Value) : null;
    }

    [HttpGet("{userId:guid}")]
    public async Task<ActionResult<UserProfileDto>> GetProfile(Guid userId, CancellationToken ct)
    {
        var profile = await _userService.GetProfileAsync(userId, GetCurrentUserId(), ct);
        return profile == null ? NotFound() : Ok(profile);
    }

    [HttpGet("username/{userName}")]
    public async Task<ActionResult<UserProfileDto>> GetProfileByUserName(string userName, CancellationToken ct)
    {
        var profile = await _userService.GetProfileByUserNameAsync(userName, GetCurrentUserId(), ct);
        return profile == null ? NotFound() : Ok(profile);
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<ActionResult<UserProfileDto>> UpdateProfile([FromBody] UpdateProfileDto dto, CancellationToken ct)
    {
        var userId = GetCurrentUserId()!.Value;
        var result = await _userService.UpdateProfileAsync(userId, dto, ct);
        return Ok(result);
    }

    [Authorize]
    [HttpPost("profile/picture")]
    public async Task<ActionResult<object>> UpdateProfilePicture(IFormFile file, CancellationToken ct)
    {
        if (file.Length == 0) return BadRequest("File is empty.");
        if (file.Length > 2 * 1024 * 1024) return BadRequest("File size exceeds 2MB limit.");

        var userId = GetCurrentUserId()!.Value;
        await using var stream = file.OpenReadStream();
        var imageUrl = await _fileStorage.UploadFileAsync(stream, file.FileName, file.ContentType, ct);
        var url = await _userService.UpdateProfilePictureAsync(userId, imageUrl, ct);
        return Ok(new { profilePictureUrl = url });
    }

    [Authorize]
    [HttpPost("profile/cover")]
    public async Task<ActionResult<object>> UpdateCoverPhoto(IFormFile file, CancellationToken ct)
    {
        if (file.Length == 0) return BadRequest("File is empty.");
        if (file.Length > 5 * 1024 * 1024) return BadRequest("File size exceeds 5MB limit.");

        var userId = GetCurrentUserId()!.Value;
        await using var stream = file.OpenReadStream();
        var imageUrl = await _fileStorage.UploadFileAsync(stream, file.FileName, file.ContentType, ct);
        var url = await _userService.UpdateCoverPhotoAsync(userId, imageUrl, ct);
        return Ok(new { coverPhotoUrl = url });
    }

    // --- Follow ---

    [Authorize]
    [HttpPost("{userId:guid}/follow")]
    public async Task<ActionResult<object>> ToggleFollow(Guid userId, CancellationToken ct)
    {
        var currentUserId = GetCurrentUserId()!.Value;
        var isFollowing = await _userService.ToggleFollowAsync(currentUserId, userId, ct);
        return Ok(new { isFollowing });
    }

    [HttpGet("{userId:guid}/followers")]
    public async Task<ActionResult<PagedResult<UserProfileDto>>> GetFollowers(
        Guid userId, [FromQuery] PaginationParams pagination, CancellationToken ct)
    {
        var result = await _userService.GetFollowersAsync(userId, pagination, GetCurrentUserId(), ct);
        return Ok(result);
    }

    [HttpGet("{userId:guid}/following")]
    public async Task<ActionResult<PagedResult<UserProfileDto>>> GetFollowing(
        Guid userId, [FromQuery] PaginationParams pagination, CancellationToken ct)
    {
        var result = await _userService.GetFollowingAsync(userId, pagination, GetCurrentUserId(), ct);
        return Ok(result);
    }

    // --- Suggested Users ---

    [Authorize]
    [HttpGet("suggested")]
    public async Task<ActionResult<List<UserProfileDto>>> GetSuggestedUsers(
        [FromQuery] int count = 5, CancellationToken ct = default)
    {
        var userId = GetCurrentUserId()!.Value;
        var result = await _userService.GetSuggestedUsersAsync(userId, count, ct);
        return Ok(result);
    }

    // --- Creator Analytics ---

    [Authorize]
    [HttpGet("analytics")]
    public async Task<ActionResult<CreatorAnalyticsDto>> GetCreatorAnalytics(CancellationToken ct)
    {
        var userId = GetCurrentUserId()!.Value;
        var result = await _userService.GetCreatorAnalyticsAsync(userId, ct);
        return Ok(result);
    }
}
