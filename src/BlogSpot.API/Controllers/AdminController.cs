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
    private readonly IEmailQueueService _emailQueueService;

    public AdminController(IAdminService adminService, IEmailQueueService emailQueueService)
    {
        _adminService = adminService;
        _emailQueueService = emailQueueService;
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

    // --- Seed ---

    [HttpPost("seed")]
    public async Task<ActionResult> SeedData(CancellationToken ct)
    {
        var result = await _adminService.SeedDummyDataAsync(ct);
        return Ok(new { message = result });
    }

    // --- Email Queue ---

    [HttpGet("emails")]
    public async Task<ActionResult<PagedResult<EmailQueueDto>>> GetEmails(
        [FromQuery] PaginationParams pagination, CancellationToken ct)
    {
        var result = await _emailQueueService.GetEmailQueueAsync(pagination, ct);
        return Ok(result);
    }

    [HttpPost("send-report-email")]
    public async Task<ActionResult> SendReportEmail([FromBody] SendReportEmailRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.ToEmail) || string.IsNullOrWhiteSpace(request.ReportHtml))
            return BadRequest(new { message = "Email and report content required." });

        await _emailQueueService.EnqueueAsync(
            request.ToEmail,
            $"BlogSpot Admin Report - {request.ReportType}",
            request.ReportHtml,
            ct);

        return Ok(new { message = "Report email queued successfully." });
    }
}

public class ChangeRoleRequest
{
    public string Role { get; set; } = string.Empty;
}

public class SendReportEmailRequest
{
    public string ToEmail { get; set; } = string.Empty;
    public string ReportType { get; set; } = string.Empty;
    public string ReportHtml { get; set; } = string.Empty;
}
