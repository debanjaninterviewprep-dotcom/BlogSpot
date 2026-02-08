using BlogSpot.Application.DTOs.Blog;
using BlogSpot.Application.DTOs.Common;
using BlogSpot.Application.Interfaces;
using BlogSpot.Domain.Entities;
using BlogSpot.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace BlogSpot.Application.Services;

/// <summary>
/// Feed service with Latest, Following, and cached Trending feeds.
/// </summary>
public class FeedService : IFeedService
{
    private readonly IUnitOfWork _uow;
    private readonly IMemoryCache _cache;
    private const string TrendingCacheKey = "trending_posts";

    public FeedService(IUnitOfWork uow, IMemoryCache cache)
    {
        _uow = uow;
        _cache = cache;
    }

    public async Task<PagedResult<BlogPostDto>> GetHomeFeedAsync(Guid userId, PaginationParams pagination, CancellationToken ct = default)
    {
        var followingIds = await _uow.Users.Query()
            .Where(u => u.Id == userId)
            .SelectMany(u => u.Following)
            .Select(f => f.FollowingId)
            .ToListAsync(ct);

        var query = GetFullPostQuery()
            .Where(p => p.IsPublished && followingIds.Contains(p.AuthorId))
            .OrderByDescending(p => p.CreatedAt);

        return await PaginateAsync(query, pagination, userId, ct);
    }

    public async Task<PagedResult<BlogPostDto>> GetTrendingPostsAsync(PaginationParams pagination, Guid? currentUserId = null, CancellationToken ct = default)
    {
        // Try cache first
        var cacheKey = $"{TrendingCacheKey}_{pagination.Page}_{pagination.PageSize}";

        if (!_cache.TryGetValue(cacheKey, out PagedResult<BlogPostDto>? cachedResult))
        {
            var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);

            var query = GetFullPostQuery()
                .Where(p => p.IsPublished && p.CreatedAt >= sevenDaysAgo)
                .OrderByDescending(p =>
                    p.ViewCount +
                    (p.Reactions.Count * 3) +
                    (p.Comments.Count * 5))
                .ThenByDescending(p => p.ViewCount);

            cachedResult = await PaginateAsync(query, pagination, currentUserId, ct);

            // Cache for 5 minutes
            _cache.Set(cacheKey, cachedResult, TimeSpan.FromMinutes(5));
        }

        return cachedResult!;
    }

    public async Task<PagedResult<BlogPostDto>> GetLatestPostsAsync(PaginationParams pagination, Guid? currentUserId = null, CancellationToken ct = default)
    {
        var query = GetFullPostQuery()
            .Where(p => p.IsPublished)
            .OrderByDescending(p => p.CreatedAt);

        return await PaginateAsync(query, pagination, currentUserId, ct);
    }

    // --- Private Helpers ---

    private IQueryable<BlogPost> GetFullPostQuery()
    {
        return _uow.BlogPosts.Query()
            .Include(p => p.Author).ThenInclude(a => a.Profile)
            .Include(p => p.Images.OrderBy(i => i.SortOrder))
            .Include(p => p.Likes)
            .Include(p => p.Comments)
            .Include(p => p.Reactions)
            .Include(p => p.Bookmarks)
            .Include(p => p.BlogPostTags).ThenInclude(bt => bt.Tag);
    }

    private async Task<PagedResult<BlogPostDto>> PaginateAsync(
        IQueryable<BlogPost> query, PaginationParams pagination, Guid? currentUserId, CancellationToken ct)
    {
        var totalCount = await query.CountAsync(ct);
        var posts = await query
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .ToListAsync(ct);

        return new PagedResult<BlogPostDto>
        {
            Items = posts.Select(p => MapToDto(p, currentUserId)).ToList(),
            TotalCount = totalCount,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    private static BlogPostDto MapToDto(BlogPost post, Guid? currentUserId)
    {
        var reactionCounts = post.Reactions?
            .GroupBy(r => r.Type.ToString())
            .ToDictionary(g => g.Key, g => g.Count()) ?? new();

        return new BlogPostDto
        {
            Id = post.Id,
            Title = post.Title,
            Content = post.Content,
            Summary = post.Summary,
            Slug = post.Slug,
            IsPublished = post.IsPublished,
            IsDraft = post.IsDraft,
            ViewCount = post.ViewCount,
            ReadingTimeMinutes = post.ReadingTimeMinutes,
            Category = post.Category,
            FeaturedImageUrl = post.FeaturedImageUrl,
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt,
            AuthorId = post.AuthorId,
            AuthorUserName = post.Author.UserName,
            AuthorDisplayName = post.Author.Profile?.DisplayName,
            AuthorProfilePictureUrl = post.Author.Profile?.ProfilePictureUrl,
            LikeCount = post.Likes?.Count ?? 0,
            CommentCount = post.Comments?.Count ?? 0,
            IsLikedByCurrentUser = currentUserId.HasValue && (post.Likes?.Any(l => l.UserId == currentUserId.Value) ?? false),
            IsBookmarkedByCurrentUser = currentUserId.HasValue && (post.Bookmarks?.Any(b => b.UserId == currentUserId.Value) ?? false),
            ReactionCounts = reactionCounts,
            CurrentUserReaction = currentUserId.HasValue
                ? post.Reactions?.FirstOrDefault(r => r.UserId == currentUserId.Value)?.Type.ToString()
                : null,
            Tags = post.BlogPostTags?.Select(bt => bt.Tag.Name).ToList() ?? new(),
            Images = post.Images?.Select(i => new PostImageDto
            {
                Id = i.Id,
                ImageUrl = i.ImageUrl,
                AltText = i.AltText,
                SortOrder = i.SortOrder
            }).ToList() ?? new()
        };
    }
}
