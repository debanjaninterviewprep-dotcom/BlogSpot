using BlogSpot.Application.DTOs.Admin;
using BlogSpot.Application.DTOs.Common;
using BlogSpot.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BlogSpot.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "AdminOnly")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    // --- Users ---

    [HttpGet("users")]
    public async Task<ActionResult<PagedResult<AdminUserDto>>> GetUsers(
        [FromQuery] PaginationParams pagination, CancellationToken ct)
    {
        var result = await _adminService.GetAllUsersAsync(pagination, ct);
        return Ok(result);
    }

    [HttpPut("users/{userId:guid}/toggle-status")]
    public async Task<ActionResult> ToggleUserStatus(Guid userId, CancellationToken ct)
    {
        await _adminService.ToggleUserActiveStatusAsync(userId, ct);
        return NoContent();
    }

    [HttpPut("users/{userId:guid}/role")]
    public async Task<ActionResult> ChangeRole(Guid userId, [FromBody] ChangeRoleRequest request, CancellationToken ct)
    {
        await _adminService.ChangeUserRoleAsync(userId, request.Role, ct);
        return NoContent();
    }

    // --- Posts ---

    [HttpGet("posts")]
    public async Task<ActionResult<PagedResult<AdminPostDto>>> GetPosts(
        [FromQuery] PaginationParams pagination, CancellationToken ct)
    {
        var result = await _adminService.GetAllPostsAsync(pagination, ct);
        return Ok(result);
    }

    [HttpDelete("posts/{postId:guid}")]
    public async Task<ActionResult> DeletePost(Guid postId, CancellationToken ct)
    {
        await _adminService.AdminDeletePostAsync(postId, ct);
        return NoContent();
    }

    // --- Comments ---

    [HttpGet("comments")]
    public async Task<ActionResult<PagedResult<AdminCommentDto>>> GetComments(
        [FromQuery] PaginationParams pagination, CancellationToken ct)
    {
        var result = await _adminService.GetAllCommentsAsync(pagination, ct);
        return Ok(result);
    }

    [HttpDelete("comments/{commentId:guid}")]
    public async Task<ActionResult> DeleteComment(Guid commentId, CancellationToken ct)
    {
        await _adminService.AdminDeleteCommentAsync(commentId, ct);
        return NoContent();
    }
}

public class ChangeRoleRequest
{
    public string Role { get; set; } = string.Empty;
}
