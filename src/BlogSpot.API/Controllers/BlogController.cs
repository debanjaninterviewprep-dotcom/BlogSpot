using System.Security.Claims;
using BlogSpot.Application.DTOs.Blog;
using BlogSpot.Application.DTOs.Common;
using BlogSpot.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BlogSpot.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BlogController : ControllerBase
{
    private readonly IBlogService _blogService;
    private readonly IFileStorageService _fileStorage;

    public BlogController(IBlogService blogService, IFileStorageService fileStorage)
    {
        _blogService = blogService;
        _fileStorage = fileStorage;
    }

    private Guid? GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return claim != null ? Guid.Parse(claim.Value) : null;
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<BlogPostDto>> CreatePost([FromBody] CreateBlogPostDto dto, CancellationToken ct)
    {
        var userId = GetCurrentUserId()!.Value;
        var result = await _blogService.CreatePostAsync(userId, dto, ct);
        return CreatedAtAction(nameof(GetPostById), new { id = result.Id }, result);
    }

    [Authorize]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<BlogPostDto>> UpdatePost(Guid id, [FromBody] UpdateBlogPostDto dto, CancellationToken ct)
    {
        var userId = GetCurrentUserId()!.Value;
        var result = await _blogService.UpdatePostAsync(userId, id, dto, ct);
        return Ok(result);
    }

    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeletePost(Guid id, CancellationToken ct)
    {
        var userId = GetCurrentUserId()!.Value;
        await _blogService.DeletePostAsync(userId, id, ct);
        return NoContent();
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<BlogPostDto>> GetPostById(Guid id, CancellationToken ct)
    {
        var post = await _blogService.GetPostByIdAsync(id, GetCurrentUserId(), ct);
        return post == null ? NotFound() : Ok(post);
    }

    [HttpGet("slug/{slug}")]
    public async Task<ActionResult<BlogPostDto>> GetPostBySlug(string slug, CancellationToken ct)
    {
        var post = await _blogService.GetPostBySlugAsync(slug, GetCurrentUserId(), ct);
        return post == null ? NotFound() : Ok(post);
    }

    [HttpGet("user/{userId:guid}")]
    public async Task<ActionResult<PagedResult<BlogPostDto>>> GetPostsByUser(
        Guid userId, [FromQuery] PaginationParams pagination, CancellationToken ct)
    {
        var result = await _blogService.GetPostsByUserAsync(userId, pagination, GetCurrentUserId(), ct);
        return Ok(result);
    }

    [HttpGet("search")]
    public async Task<ActionResult<PagedResult<BlogPostDto>>> SearchPosts(
        [FromQuery] string q, [FromQuery] PaginationParams pagination, CancellationToken ct)
    {
        var result = await _blogService.SearchPostsAsync(q, pagination, GetCurrentUserId(), ct);
        return Ok(result);
    }

    // --- Full-Text Search ---

    [HttpGet("fullsearch")]
    public async Task<ActionResult<SearchResultDto>> FullTextSearch(
        [FromQuery] string q, [FromQuery] PaginationParams pagination, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(q))
            return BadRequest("Search query is required.");

        var result = await _blogService.FullTextSearchAsync(q, pagination, ct);
        return Ok(result);
    }

    // --- Likes ---

    [Authorize]
    [HttpPost("{id:guid}/like")]
    public async Task<ActionResult<object>> ToggleLike(Guid id, CancellationToken ct)
    {
        var userId = GetCurrentUserId()!.Value;
        var liked = await _blogService.ToggleLikeAsync(userId, id, ct);
        return Ok(new { liked });
    }

    // --- Reactions ---

    [Authorize]
    [HttpPost("{id:guid}/reactions")]
    public async Task<ActionResult<ReactionSummaryDto>> ToggleReaction(
        Guid id, [FromBody] ReactionDto dto, CancellationToken ct)
    {
        var userId = GetCurrentUserId()!.Value;
        var result = await _blogService.ToggleReactionAsync(userId, id, dto.Type, ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}/reactions")]
    public async Task<ActionResult<ReactionSummaryDto>> GetReactions(Guid id, CancellationToken ct)
    {
        var result = await _blogService.GetReactionsAsync(id, GetCurrentUserId(), ct);
        return Ok(result);
    }

    // --- Bookmarks ---

    [Authorize]
    [HttpPost("{id:guid}/bookmark")]
    public async Task<ActionResult<object>> ToggleBookmark(Guid id, CancellationToken ct)
    {
        var userId = GetCurrentUserId()!.Value;
        var bookmarked = await _blogService.ToggleBookmarkAsync(userId, id, ct);
        return Ok(new { bookmarked });
    }

    [Authorize]
    [HttpGet("bookmarks")]
    public async Task<ActionResult<PagedResult<BlogPostDto>>> GetBookmarkedPosts(
        [FromQuery] PaginationParams pagination, CancellationToken ct)
    {
        var userId = GetCurrentUserId()!.Value;
        var result = await _blogService.GetBookmarkedPostsAsync(userId, pagination, ct);
        return Ok(result);
    }

    // --- Drafts ---

    [Authorize]
    [HttpPost("drafts")]
    public async Task<ActionResult<DraftBlogDto>> SaveDraft([FromBody] SaveDraftDto dto, CancellationToken ct)
    {
        var userId = GetCurrentUserId()!.Value;
        var result = await _blogService.SaveDraftAsync(userId, dto, ct);
        return Ok(result);
    }

    [Authorize]
    [HttpGet("drafts")]
    public async Task<ActionResult<List<DraftBlogDto>>> GetDrafts(CancellationToken ct)
    {
        var userId = GetCurrentUserId()!.Value;
        var result = await _blogService.GetDraftsAsync(userId, ct);
        return Ok(result);
    }

    [Authorize]
    [HttpGet("drafts/{id:guid}")]
    public async Task<ActionResult<DraftBlogDto>> GetDraftById(Guid id, CancellationToken ct)
    {
        var userId = GetCurrentUserId()!.Value;
        var result = await _blogService.GetDraftByIdAsync(userId, id, ct);
        return result == null ? NotFound() : Ok(result);
    }

    [Authorize]
    [HttpDelete("drafts/{id:guid}")]
    public async Task<ActionResult> DeleteDraft(Guid id, CancellationToken ct)
    {
        var userId = GetCurrentUserId()!.Value;
        await _blogService.DeleteDraftAsync(userId, id, ct);
        return NoContent();
    }

    // --- Comments ---

    [Authorize]
    [HttpPost("{id:guid}/comments")]
    public async Task<ActionResult<CommentDto>> AddComment(Guid id, [FromBody] CreateCommentDto dto, CancellationToken ct)
    {
        var userId = GetCurrentUserId()!.Value;
        var result = await _blogService.AddCommentAsync(userId, id, dto, ct);
        return CreatedAtAction(nameof(GetComments), new { id }, result);
    }

    [HttpGet("{id:guid}/comments")]
    public async Task<ActionResult<PagedResult<CommentDto>>> GetComments(
        Guid id, [FromQuery] PaginationParams pagination, CancellationToken ct)
    {
        var result = await _blogService.GetCommentsAsync(id, pagination, ct);
        return Ok(result);
    }

    [Authorize]
    [HttpDelete("comments/{commentId:guid}")]
    public async Task<ActionResult> DeleteComment(Guid commentId, CancellationToken ct)
    {
        var userId = GetCurrentUserId()!.Value;
        await _blogService.DeleteCommentAsync(userId, commentId, ct);
        return NoContent();
    }

    // --- Images ---

    [Authorize]
    [HttpPost("{id:guid}/images")]
    public async Task<ActionResult<PostImageDto>> UploadImage(Guid id, IFormFile file, [FromForm] string? altText, CancellationToken ct)
    {
        if (file.Length == 0)
            return BadRequest("File is empty.");

        if (file.Length > 5 * 1024 * 1024)
            return BadRequest("File size exceeds 5MB limit.");

        var userId = GetCurrentUserId()!.Value;
        await using var stream = file.OpenReadStream();
        var imageUrl = await _fileStorage.UploadFileAsync(stream, file.FileName, file.ContentType, ct);
        var result = await _blogService.AddImageToPostAsync(userId, id, imageUrl, altText, ct);
        return Ok(result);
    }

    [Authorize]
    [HttpDelete("{postId:guid}/images/{imageId:guid}")]
    public async Task<ActionResult> RemoveImage(Guid postId, Guid imageId, CancellationToken ct)
    {
        var userId = GetCurrentUserId()!.Value;
        await _blogService.RemoveImageFromPostAsync(userId, postId, imageId, ct);
        return NoContent();
    }
}
