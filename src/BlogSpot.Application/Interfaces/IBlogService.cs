using BlogSpot.Application.DTOs.Blog;
using BlogSpot.Application.DTOs.Common;

namespace BlogSpot.Application.Interfaces;

public interface IBlogService
{
    // CRUD
    Task<BlogPostDto> CreatePostAsync(Guid userId, CreateBlogPostDto dto, CancellationToken ct = default);
    Task<BlogPostDto> UpdatePostAsync(Guid userId, Guid postId, UpdateBlogPostDto dto, CancellationToken ct = default);
    Task DeletePostAsync(Guid userId, Guid postId, CancellationToken ct = default);
    Task<BlogPostDto?> GetPostByIdAsync(Guid postId, Guid? currentUserId = null, CancellationToken ct = default);
    Task<BlogPostDto?> GetPostBySlugAsync(string slug, Guid? currentUserId = null, CancellationToken ct = default);
    Task<PagedResult<BlogPostDto>> GetPostsByUserAsync(Guid userId, PaginationParams pagination, Guid? currentUserId = null, CancellationToken ct = default);
    Task<PagedResult<BlogPostDto>> SearchPostsAsync(string query, PaginationParams pagination, Guid? currentUserId = null, CancellationToken ct = default);

    // Likes (legacy)
    Task<bool> ToggleLikeAsync(Guid userId, Guid postId, CancellationToken ct = default);

    // Reactions
    Task<ReactionSummaryDto> ToggleReactionAsync(Guid userId, Guid postId, string reactionType, CancellationToken ct = default);
    Task<ReactionSummaryDto> GetReactionsAsync(Guid postId, Guid? currentUserId = null, CancellationToken ct = default);

    // Bookmarks
    Task<bool> ToggleBookmarkAsync(Guid userId, Guid postId, CancellationToken ct = default);
    Task<PagedResult<BlogPostDto>> GetBookmarkedPostsAsync(Guid userId, PaginationParams pagination, CancellationToken ct = default);

    // Comments
    Task<CommentDto> AddCommentAsync(Guid userId, Guid postId, CreateCommentDto dto, CancellationToken ct = default);
    Task DeleteCommentAsync(Guid userId, Guid commentId, CancellationToken ct = default);
    Task<PagedResult<CommentDto>> GetCommentsAsync(Guid postId, PaginationParams pagination, CancellationToken ct = default);

    // Images
    Task<PostImageDto> AddImageToPostAsync(Guid userId, Guid postId, string imageUrl, string? altText, CancellationToken ct = default);
    Task RemoveImageFromPostAsync(Guid userId, Guid postId, Guid imageId, CancellationToken ct = default);

    // Drafts
    Task<DraftBlogDto> SaveDraftAsync(Guid userId, SaveDraftDto dto, CancellationToken ct = default);
    Task<List<DraftBlogDto>> GetDraftsAsync(Guid userId, CancellationToken ct = default);
    Task DeleteDraftAsync(Guid userId, Guid draftId, CancellationToken ct = default);
    Task<DraftBlogDto?> GetDraftByIdAsync(Guid userId, Guid draftId, CancellationToken ct = default);

    // Search
    Task<SearchResultDto> FullTextSearchAsync(string query, PaginationParams pagination, CancellationToken ct = default);
}
