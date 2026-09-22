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

        // If user follows nobody or is on page > 1 with few followed posts, mix in popular posts
        IQueryable<BlogPost> query;

        if (followingIds.Count == 0)
        {
            // No follows — show trending/popular posts
            query = GetFullPostQuery()
                .Where(p => p.IsPublished)
                .OrderByDescending(p => p.ViewCount + (p.Reactions.Count * 3) + (p.Comments.Count * 5))
                .ThenByDescending(p => p.CreatedAt);
        }
        else
        {
            // Followed activity = own posts by followed authors + reposts by followed users, merged by activity time
            var followedPostActivity = await _uow.BlogPosts.Query()
                .Where(p => p.IsPublished && followingIds.Contains(p.AuthorId))
                .Select(p => new FeedActivity { PostId = p.Id, ActivityAt = p.CreatedAt, RepostedByUserId = null })
                .ToListAsync(ct);

            var followedRepostActivity = await _uow.Reposts.Query()
                .Where(r => followingIds.Contains(r.UserId) && r.BlogPost.IsPublished && r.BlogPost.AuthorId != userId)
                .Select(r => new FeedActivity { PostId = r.BlogPostId, ActivityAt = r.CreatedAt, RepostedByUserId = r.UserId })
                .ToListAsync(ct);

            var followedActivity = followedPostActivity.Concat(followedRepostActivity)
                .OrderByDescending(a => a.ActivityAt)
                .ThenBy(a => a.PostId)
                .ToList();

            var followedCount = followedActivity.Count;
            var skip = (pagination.Page - 1) * pagination.PageSize;

            if (skip < followedCount)
            {
                // Still have followed activity on this page — return it, fill remainder with others
                var pageActivity = followedActivity.Skip(skip).Take(pagination.PageSize).ToList();
                var items = await HydrateFeedActivityAsync(pageActivity, userId, ct);

                if (items.Count < pagination.PageSize)
                {
                    var needed = pagination.PageSize - items.Count;
                    var usedPostIds = pageActivity.Select(a => a.PostId).ToList();
                    var otherPosts = await GetFullPostQuery()
                        .Where(p => p.IsPublished && !followingIds.Contains(p.AuthorId) && !usedPostIds.Contains(p.Id))
                        .OrderByDescending(p => p.ViewCount + (p.Reactions.Count * 3))
                        .ThenByDescending(p => p.CreatedAt)
                        .ThenBy(p => p.Id)
                        .Take(needed)
                        .ToListAsync(ct);

                    items.AddRange(otherPosts.Select(p => MapToDto(p, userId)));

                    return new PagedResult<BlogPostDto>
                    {
                        Items = items,
                        TotalCount = followedCount + await GetFullPostQuery().Where(p => p.IsPublished && !followingIds.Contains(p.AuthorId)).CountAsync(ct),
                        Page = pagination.Page,
                        PageSize = pagination.PageSize
                    };
                }

                return new PagedResult<BlogPostDto>
                {
                    Items = items,
                    TotalCount = followedCount,
                    Page = pagination.Page,
                    PageSize = pagination.PageSize
                };
            }
            else
            {
                // Past followed activity — show popular posts from non-followed users
                var otherQuery = GetFullPostQuery()
                    .Where(p => p.IsPublished && !followingIds.Contains(p.AuthorId))
                    .OrderByDescending(p => p.ViewCount + (p.Reactions.Count * 3) + (p.Comments.Count * 5))
                    .ThenByDescending(p => p.CreatedAt);

                return await PaginateAsync(otherQuery, new PaginationParams { Page = 1, PageSize = pagination.PageSize }, userId, ct);
            }
        }

        return await PaginateAsync(query, pagination, userId, ct);
    }

    public async Task<PagedResult<BlogPostDto>> GetTrendingPostsAsync(PaginationParams pagination, Guid? currentUserId = null, CancellationToken ct = default)
    {
        // Try cache first
        var cacheKey = $"{TrendingCacheKey}_{pagination.Page}_{pagination.PageSize}";

        if (!_cache.TryGetValue(cacheKey, out PagedResult<BlogPostDto>? cachedResult))
        {
            var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);

            var recentQuery = GetFullPostQuery()
                .Where(p => p.IsPublished && p.CreatedAt >= sevenDaysAgo);

            var hasRecent = await recentQuery.AnyAsync(ct);

            var query = (hasRecent ? recentQuery : GetFullPostQuery().Where(p => p.IsPublished))
                .OrderByDescending(p =>
                    p.ViewCount +
                    (p.Reactions.Count * 3) +
                    (p.Comments.Count * 5))
                .ThenByDescending(p => p.ViewCount)
                .ThenByDescending(p => p.CreatedAt)
                .ThenBy(p => p.Id);

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
            .Include(p => p.Reposts)
            .Include(p => p.BlogPostTags).ThenInclude(bt => bt.Tag);
    }

    // Hydrates a chronologically-ordered list of feed activity (own posts + reposts by followed users)
    // into fully-mapped BlogPostDtos, preserving the activity order and attaching FeedRepost info.
    private async Task<List<BlogPostDto>> HydrateFeedActivityAsync(List<FeedActivity> activity, Guid userId, CancellationToken ct)
    {
        if (activity.Count == 0) return new List<BlogPostDto>();

        var postIds = activity.Select(a => a.PostId).Distinct().ToList();
        var posts = await GetFullPostQuery().Where(p => postIds.Contains(p.Id)).ToListAsync(ct);
        var postsById = posts.ToDictionary(p => p.Id);

        var reposterIds = activity.Where(a => a.RepostedByUserId.HasValue).Select(a => a.RepostedByUserId!.Value).Distinct().ToList();
        var reposters = reposterIds.Count > 0
            ? await _uow.Users.Query().Include(u => u.Profile).Where(u => reposterIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id, ct)
            : new Dictionary<Guid, User>();

        var items = new List<BlogPostDto>();
        foreach (var entry in activity)
        {
            if (!postsById.TryGetValue(entry.PostId, out var post)) continue;

            var dto = MapToDto(post, userId);

            if (entry.RepostedByUserId.HasValue && reposters.TryGetValue(entry.RepostedByUserId.Value, out var reposter))
            {
                dto.FeedRepost = new FeedRepostInfoDto
                {
                    UserId = reposter.Id,
                    UserName = reposter.UserName,
                    DisplayName = reposter.Profile?.DisplayName,
                    ProfilePictureUrl = reposter.Profile?.ProfilePictureUrl,
                    Quote = post.Reposts?.FirstOrDefault(r => r.UserId == entry.RepostedByUserId.Value)?.Quote,
                    RepostedAt = entry.ActivityAt
                };
            }

            items.Add(dto);
        }

        return items;
    }

    private class FeedActivity
    {
        public Guid PostId { get; set; }
        public DateTime ActivityAt { get; set; }
        public Guid? RepostedByUserId { get; set; }
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
            RepostCount = post.Reposts?.Count ?? 0,
            IsRepostedByCurrentUser = currentUserId.HasValue && (post.Reposts?.Any(r => r.UserId == currentUserId.Value) ?? false),
            CurrentUserRepostQuote = currentUserId.HasValue ? post.Reposts?.FirstOrDefault(r => r.UserId == currentUserId.Value)?.Quote : null,
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
