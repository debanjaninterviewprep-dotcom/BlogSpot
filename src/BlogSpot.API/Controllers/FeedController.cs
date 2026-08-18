using System.Security.Claims;
using BlogSpot.Application.DTOs.Blog;
using BlogSpot.Application.DTOs.Common;
using BlogSpot.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BlogSpot.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FeedController : ControllerBase
{
    private readonly IFeedService _feedService;

    public FeedController(IFeedService feedService)
    {
        _feedService = feedService;
    }

    private Guid? GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return claim != null ? Guid.Parse(claim.Value) : null;
    }

    [Authorize]
    [HttpGet("home")]
    public async Task<ActionResult<PagedResult<BlogPostDto>>> GetHomeFeed(
        [FromQuery] PaginationParams pagination, CancellationToken ct)
    {
        var userId = GetCurrentUserId()!.Value;
        var result = await _feedService.GetHomeFeedAsync(userId, pagination, ct);
        return Ok(result);
    }

    [HttpGet("trending")]
    public async Task<ActionResult<PagedResult<BlogPostDto>>> GetTrending(
        [FromQuery] PaginationParams pagination, CancellationToken ct)
    {
        var result = await _feedService.GetTrendingPostsAsync(pagination, GetCurrentUserId(), ct);
        return Ok(result);
    }

    [HttpGet("latest")]
    public async Task<ActionResult<PagedResult<BlogPostDto>>> GetLatest(
        [FromQuery] PaginationParams pagination, CancellationToken ct)
    {
        var result = await _feedService.GetLatestPostsAsync(pagination, GetCurrentUserId(), ct);
        return Ok(result);
    }
}
