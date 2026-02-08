using BlogSpot.Application.DTOs.Blog;
using BlogSpot.Application.DTOs.Common;

namespace BlogSpot.Application.Interfaces;

public interface IFeedService
{
    Task<PagedResult<BlogPostDto>> GetHomeFeedAsync(Guid userId, PaginationParams pagination, CancellationToken ct = default);
    Task<PagedResult<BlogPostDto>> GetTrendingPostsAsync(PaginationParams pagination, Guid? currentUserId = null, CancellationToken ct = default);
    Task<PagedResult<BlogPostDto>> GetLatestPostsAsync(PaginationParams pagination, Guid? currentUserId = null, CancellationToken ct = default);
}
