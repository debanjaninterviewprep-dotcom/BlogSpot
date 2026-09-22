using System.Security.Claims;
using BlogSpot.Application.DTOs.Common;
using BlogSpot.Application.DTOs.ReadingList;
using BlogSpot.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BlogSpot.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class ReadingListController : ControllerBase
{
    private readonly IReadingListService _readingListService;

    public ReadingListController(IReadingListService readingListService)
    {
        _readingListService = readingListService;
    }

    private Guid? GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return claim != null ? Guid.Parse(claim.Value) : null;
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ReadingListDto>> Create([FromBody] CreateReadingListDto dto, CancellationToken ct)
    {
        var userId = GetCurrentUserId()!.Value;
        var result = await _readingListService.CreateAsync(userId, dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [Authorize]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ReadingListDto>> Update(Guid id, [FromBody] UpdateReadingListDto dto, CancellationToken ct)
    {
        var userId = GetCurrentUserId()!.Value;
        var result = await _readingListService.UpdateAsync(userId, id, dto, ct);
        return Ok(result);
    }

    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(Guid id, CancellationToken ct)
    {
        var userId = GetCurrentUserId()!.Value;
        await _readingListService.DeleteAsync(userId, id, ct);
        return NoContent();
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ReadingListDetailDto>> GetById(Guid id, CancellationToken ct)
    {
        var result = await _readingListService.GetByIdAsync(id, GetCurrentUserId(), ct);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpGet("user/{userId:guid}")]
    public async Task<ActionResult<PagedResult<ReadingListDto>>> GetByUser(
        Guid userId, [FromQuery] PaginationParams pagination, CancellationToken ct)
    {
        var result = await _readingListService.GetByUserAsync(userId, GetCurrentUserId(), pagination, ct);
        return Ok(result);
    }

    [Authorize]
    [HttpPost("{id:guid}/posts/{postId:guid}")]
    public async Task<ActionResult> AddPost(Guid id, Guid postId, CancellationToken ct)
    {
        var userId = GetCurrentUserId()!.Value;
        await _readingListService.AddPostAsync(userId, id, postId, ct);
        return NoContent();
    }

    [Authorize]
    [HttpDelete("{id:guid}/posts/{postId:guid}")]
    public async Task<ActionResult> RemovePost(Guid id, Guid postId, CancellationToken ct)
    {
        var userId = GetCurrentUserId()!.Value;
        await _readingListService.RemovePostAsync(userId, id, postId, ct);
        return NoContent();
    }

    [Authorize]
    [HttpPost("{id:guid}/follow")]
    public async Task<ActionResult<object>> ToggleFollow(Guid id, CancellationToken ct)
    {
        var userId = GetCurrentUserId()!.Value;
        var following = await _readingListService.ToggleFollowAsync(userId, id, ct);
        return Ok(new { following });
    }
}
