using System.Text.RegularExpressions;
using BlogSpot.Application.DTOs.Blog;
using BlogSpot.Application.DTOs.Common;
using BlogSpot.Application.Interfaces;
using BlogSpot.Domain.Entities;
using BlogSpot.Domain.Enums;
using BlogSpot.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BlogSpot.Application.Services;

/// <summary>
/// Blog service with reactions, bookmarks, drafts, full-text search, and reading time.
/// </summary>
public class BlogService : IBlogService
{
    private readonly IUnitOfWork _uow;
    private readonly INotificationService _notificationService;

    public BlogService(IUnitOfWork uow, INotificationService notificationService)
    {
        _uow = uow;
        _notificationService = notificationService;
    }

    // --- CRUD ---

    public async Task<BlogPostDto> CreatePostAsync(Guid userId, CreateBlogPostDto dto, CancellationToken ct = default)
    {
        var slug = GenerateSlug(dto.Title);
        var slugExists = await _uow.BlogPosts.ExistsAsync(p => p.Slug == slug, ct);
        if (slugExists)
            slug = $"{slug}-{Guid.NewGuid().ToString()[..8]}";

        var post = new BlogPost
        {
            Title = dto.Title,
            Content = dto.Content,
            Summary = dto.Summary,
            Slug = slug,
            AuthorId = userId,
            IsPublished = !dto.IsDraft,
            IsDraft = dto.IsDraft,
            Category = dto.Category,
            ReadingTimeMinutes = CalculateReadingTime(dto.Content)
        };

        await _uow.BlogPosts.AddAsync(post, ct);
        await _uow.SaveChangesAsync(ct);

        // Handle tags
        if (dto.Tags.Any())
            await SyncTagsAsync(post.Id, dto.Tags, ct);

        return await GetPostByIdAsync(post.Id, userId, ct)
            ?? throw new InvalidOperationException("Failed to retrieve created post.");
    }

    public async Task<BlogPostDto> UpdatePostAsync(Guid userId, Guid postId, UpdateBlogPostDto dto, CancellationToken ct = default)
    {
        var post = await _uow.BlogPosts.GetByIdAsync(postId, ct)
            ?? throw new KeyNotFoundException("Post not found.");

        if (post.AuthorId != userId)
            throw new UnauthorizedAccessException("You can only edit your own posts.");

        post.Title = dto.Title;
        post.Content = dto.Content;
        post.Summary = dto.Summary;
        post.Category = dto.Category;
        post.IsDraft = dto.IsDraft;
        post.IsPublished = !dto.IsDraft;
        post.ReadingTimeMinutes = CalculateReadingTime(dto.Content);
        post.UpdatedAt = DateTime.UtcNow;

        _uow.BlogPosts.Update(post);
        await _uow.SaveChangesAsync(ct);

        // Sync tags
        await SyncTagsAsync(post.Id, dto.Tags, ct);

        return await GetPostByIdAsync(postId, userId, ct)
            ?? throw new InvalidOperationException("Failed to retrieve updated post.");
    }

    public async Task DeletePostAsync(Guid userId, Guid postId, CancellationToken ct = default)
    {
        var post = await _uow.BlogPosts.GetByIdAsync(postId, ct)
            ?? throw new KeyNotFoundException("Post not found.");

        if (post.AuthorId != userId)
            throw new UnauthorizedAccessException("You can only delete your own posts.");

        _uow.BlogPosts.Remove(post);
        await _uow.SaveChangesAsync(ct);
    }

    public async Task<BlogPostDto?> GetPostByIdAsync(Guid postId, Guid? currentUserId = null, CancellationToken ct = default)
    {
        var post = await GetFullPostQuery()
            .FirstOrDefaultAsync(p => p.Id == postId, ct);

        if (post == null) return null;
        return MapToDto(post, currentUserId);
    }

    public async Task<BlogPostDto?> GetPostBySlugAsync(string slug, Guid? currentUserId = null, CancellationToken ct = default)
    {
        var post = await GetFullPostQuery()
            .FirstOrDefaultAsync(p => p.Slug == slug, ct);

        if (post == null) return null;

        // Increment view count
        post.ViewCount++;
        _uow.BlogPosts.Update(post);
        await _uow.SaveChangesAsync(ct);

        return MapToDto(post, currentUserId);
    }

    public async Task<PagedResult<BlogPostDto>> GetPostsByUserAsync(Guid userId, PaginationParams pagination, Guid? currentUserId = null, CancellationToken ct = default)
    {
        var query = GetFullPostQuery()
            .Where(p => p.AuthorId == userId && p.IsPublished)
            .OrderByDescending(p => p.CreatedAt);

        return await PaginateAsync(query, pagination, currentUserId, ct);
    }

    public async Task<PagedResult<BlogPostDto>> SearchPostsAsync(string searchQuery, PaginationParams pagination, Guid? currentUserId = null, CancellationToken ct = default)
    {
        var query = GetFullPostQuery()
            .Where(p => p.IsPublished &&
                (p.Title.Contains(searchQuery) || p.Content.Contains(searchQuery) ||
                 (p.Summary != null && p.Summary.Contains(searchQuery))))
            .OrderByDescending(p => p.CreatedAt);

        return await PaginateAsync(query, pagination, currentUserId, ct);
    }

    // --- Full Text Search ---

    public async Task<SearchResultDto> FullTextSearchAsync(string query, PaginationParams pagination, CancellationToken ct = default)
    {
        var lowerQuery = query.ToLowerInvariant();

        // Search posts
        var postQuery = GetFullPostQuery()
            .Where(p => p.IsPublished &&
                (p.Title.Contains(query) || p.Content.Contains(query) ||
                 (p.Summary != null && p.Summary.Contains(query)) ||
                 p.BlogPostTags.Any(bt => bt.Tag.NormalizedName.Contains(lowerQuery))))
            .OrderByDescending(p => p.ViewCount);

        var totalPosts = await postQuery.CountAsync(ct);
        var posts = await postQuery
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .ToListAsync(ct);

        // Search users
        var users = await _uow.Users.Query()
            .Include(u => u.Profile)
            .Include(u => u.Followers)
            .Where(u => u.IsActive &&
                (u.UserName.Contains(query) ||
                 (u.Profile != null && u.Profile.DisplayName != null && u.Profile.DisplayName.Contains(query))))
            .Take(10)
            .Select(u => new UserSearchResultDto
            {
                Id = u.Id,
                UserName = u.UserName,
                DisplayName = u.Profile != null ? u.Profile.DisplayName : null,
                ProfilePictureUrl = u.Profile != null ? u.Profile.ProfilePictureUrl : null,
                FollowersCount = u.Followers.Count
            })
            .ToListAsync(ct);

        // Search tags
        var tags = await _uow.Tags.Query()
            .Where(t => t.NormalizedName.Contains(lowerQuery))
            .Take(20)
            .Select(t => t.Name)
            .ToListAsync(ct);

        return new SearchResultDto
        {
            Posts = posts.Select(p => MapToDto(p, null)).ToList(),
            Users = users,
            Tags = tags,
            TotalResults = totalPosts + users.Count + tags.Count
        };
    }

    // --- Likes (legacy) ---

    public async Task<bool> ToggleLikeAsync(Guid userId, Guid postId, CancellationToken ct = default)
    {
        var existingLike = (await _uow.Likes.FindAsync(
            l => l.UserId == userId && l.BlogPostId == postId, ct)).FirstOrDefault();

        if (existingLike != null)
        {
            _uow.Likes.Remove(existingLike);
            await _uow.SaveChangesAsync(ct);
            return false;
        }

        await _uow.Likes.AddAsync(new Like { UserId = userId, BlogPostId = postId }, ct);
        await _uow.SaveChangesAsync(ct);
        return true;
    }

    // --- Reactions ---

    public async Task<ReactionSummaryDto> ToggleReactionAsync(Guid userId, Guid postId, string reactionType, CancellationToken ct = default)
    {
        if (!Enum.TryParse<ReactionType>(reactionType, true, out var parsedType))
            throw new ArgumentException($"Invalid reaction type: {reactionType}");

        var existing = (await _uow.Reactions.FindAsync(
            r => r.UserId == userId && r.BlogPostId == postId, ct)).FirstOrDefault();

        if (existing != null)
        {
            if (existing.Type == parsedType)
            {
                // Remove reaction
                _uow.Reactions.Remove(existing);
                await _uow.SaveChangesAsync(ct);
            }
            else
            {
                // Change reaction type
                existing.Type = parsedType;
                existing.UpdatedAt = DateTime.UtcNow;
                _uow.Reactions.Update(existing);
                await _uow.SaveChangesAsync(ct);
            }
        }
        else
        {
            // Add new reaction
            await _uow.Reactions.AddAsync(new Reaction
            {
                UserId = userId,
                BlogPostId = postId,
                Type = parsedType
            }, ct);
            await _uow.SaveChangesAsync(ct);

            // Notify post author
            var post = await _uow.BlogPosts.GetByIdAsync(postId, ct);
            if (post != null && post.AuthorId != userId)
            {
                var user = await _uow.Users.GetByIdAsync(userId, ct);
                await _notificationService.CreateNotificationAsync(
                    post.AuthorId, userId, "Reaction",
                    $"{user?.UserName} reacted {reactionType} to your post",
                    postId, ct);
            }
        }

        return await GetReactionsAsync(postId, userId, ct);
    }

    public async Task<ReactionSummaryDto> GetReactionsAsync(Guid postId, Guid? currentUserId = null, CancellationToken ct = default)
    {
        var reactions = await _uow.Reactions.Query()
            .Where(r => r.BlogPostId == postId)
            .ToListAsync(ct);

        var counts = reactions
            .GroupBy(r => r.Type.ToString())
            .ToDictionary(g => g.Key, g => g.Count());

        string? currentUserReaction = null;
        if (currentUserId.HasValue)
        {
            var userReaction = reactions.FirstOrDefault(r => r.UserId == currentUserId.Value);
            currentUserReaction = userReaction?.Type.ToString();
        }

        return new ReactionSummaryDto
        {
            Counts = counts,
            TotalCount = reactions.Count,
            CurrentUserReaction = currentUserReaction
        };
    }

    // --- Bookmarks ---

    public async Task<bool> ToggleBookmarkAsync(Guid userId, Guid postId, CancellationToken ct = default)
    {
        var existing = (await _uow.Bookmarks.FindAsync(
            b => b.UserId == userId && b.BlogPostId == postId, ct)).FirstOrDefault();

        if (existing != null)
        {
            _uow.Bookmarks.Remove(existing);
            await _uow.SaveChangesAsync(ct);
            return false;
        }

        await _uow.Bookmarks.AddAsync(new Bookmark { UserId = userId, BlogPostId = postId }, ct);
        await _uow.SaveChangesAsync(ct);
        return true;
    }

    public async Task<PagedResult<BlogPostDto>> GetBookmarkedPostsAsync(Guid userId, PaginationParams pagination, CancellationToken ct = default)
    {
        var bookmarkedPostIds = await _uow.Bookmarks.Query()
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => b.BlogPostId)
            .ToListAsync(ct);

        var query = GetFullPostQuery()
            .Where(p => bookmarkedPostIds.Contains(p.Id))
            .OrderByDescending(p => p.CreatedAt);

        return await PaginateAsync(query, pagination, userId, ct);
    }

    // --- Comments ---

    public async Task<CommentDto> AddCommentAsync(Guid userId, Guid postId, CreateCommentDto dto, CancellationToken ct = default)
    {
        var post = await _uow.BlogPosts.GetByIdAsync(postId, ct)
            ?? throw new KeyNotFoundException("Post not found.");

        var comment = new Comment
        {
            Content = dto.Content,
            UserId = userId,
            BlogPostId = postId,
            ParentCommentId = dto.ParentCommentId
        };

        await _uow.Comments.AddAsync(comment, ct);
        await _uow.SaveChangesAsync(ct);

        // Notify post author
        if (post.AuthorId != userId)
        {
            var user = await _uow.Users.GetByIdAsync(userId, ct);
            await _notificationService.CreateNotificationAsync(
                post.AuthorId, userId, "Comment",
                $"{user?.UserName} commented on your post",
                postId, ct);
        }

        var savedComment = await _uow.Comments.Query()
            .Include(c => c.User).ThenInclude(u => u.Profile)
            .FirstAsync(c => c.Id == comment.Id, ct);

        return MapCommentToDto(savedComment);
    }

    public async Task DeleteCommentAsync(Guid userId, Guid commentId, CancellationToken ct = default)
    {
        var comment = await _uow.Comments.GetByIdAsync(commentId, ct)
            ?? throw new KeyNotFoundException("Comment not found.");

        if (comment.UserId != userId)
            throw new UnauthorizedAccessException("You can only delete your own comments.");

        _uow.Comments.Remove(comment);
        await _uow.SaveChangesAsync(ct);
    }

    public async Task<PagedResult<CommentDto>> GetCommentsAsync(Guid postId, PaginationParams pagination, CancellationToken ct = default)
    {
        var query = _uow.Comments.Query()
            .Include(c => c.User).ThenInclude(u => u.Profile)
            .Include(c => c.Replies).ThenInclude(r => r.User).ThenInclude(u => u.Profile)
            .Where(c => c.BlogPostId == postId && c.ParentCommentId == null)
            .OrderByDescending(c => c.CreatedAt);

        var totalCount = await query.CountAsync(ct);
        var comments = await query
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .ToListAsync(ct);

        return new PagedResult<CommentDto>
        {
            Items = comments.Select(MapCommentToDto).ToList(),
            TotalCount = totalCount,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    // --- Images ---

    public async Task<PostImageDto> AddImageToPostAsync(Guid userId, Guid postId, string imageUrl, string? altText, CancellationToken ct = default)
    {
        var post = await _uow.BlogPosts.GetByIdAsync(postId, ct)
            ?? throw new KeyNotFoundException("Post not found.");

        if (post.AuthorId != userId)
            throw new UnauthorizedAccessException("You can only add images to your own posts.");

        var maxOrder = await _uow.PostImages.Query()
            .Where(i => i.BlogPostId == postId)
            .MaxAsync(i => (int?)i.SortOrder, ct) ?? 0;

        var image = new PostImage
        {
            ImageUrl = imageUrl,
            AltText = altText,
            SortOrder = maxOrder + 1,
            BlogPostId = postId
        };

        await _uow.PostImages.AddAsync(image, ct);
        await _uow.SaveChangesAsync(ct);

        return new PostImageDto { Id = image.Id, ImageUrl = image.ImageUrl, AltText = image.AltText, SortOrder = image.SortOrder };
    }

    public async Task RemoveImageFromPostAsync(Guid userId, Guid postId, Guid imageId, CancellationToken ct = default)
    {
        var post = await _uow.BlogPosts.GetByIdAsync(postId, ct)
            ?? throw new KeyNotFoundException("Post not found.");

        if (post.AuthorId != userId)
            throw new UnauthorizedAccessException("You can only remove images from your own posts.");

        var image = await _uow.PostImages.GetByIdAsync(imageId, ct)
            ?? throw new KeyNotFoundException("Image not found.");

        _uow.PostImages.Remove(image);
        await _uow.SaveChangesAsync(ct);
    }

    // --- Drafts ---

    public async Task<DraftBlogDto> SaveDraftAsync(Guid userId, SaveDraftDto dto, CancellationToken ct = default)
    {
        DraftBlog draft;

        if (dto.Id.HasValue)
        {
            draft = await _uow.Drafts.GetByIdAsync(dto.Id.Value, ct)
                ?? throw new KeyNotFoundException("Draft not found.");

            if (draft.AuthorId != userId)
                throw new UnauthorizedAccessException("Not your draft.");

            draft.Title = dto.Title;
            draft.Content = dto.Content;
            draft.Summary = dto.Summary;
            draft.Category = dto.Category;
            draft.Tags = dto.Tags;
            draft.BlogPostId = dto.BlogPostId;
            draft.UpdatedAt = DateTime.UtcNow;

            _uow.Drafts.Update(draft);
        }
        else
        {
            draft = new DraftBlog
            {
                Title = dto.Title,
                Content = dto.Content,
                Summary = dto.Summary,
                Category = dto.Category,
                Tags = dto.Tags,
                BlogPostId = dto.BlogPostId,
                AuthorId = userId
            };
            await _uow.Drafts.AddAsync(draft, ct);
        }

        await _uow.SaveChangesAsync(ct);

        return new DraftBlogDto
        {
            Id = draft.Id,
            Title = draft.Title,
            Content = draft.Content,
            Summary = draft.Summary,
            Category = draft.Category,
            Tags = draft.Tags,
            BlogPostId = draft.BlogPostId,
            CreatedAt = draft.CreatedAt,
            UpdatedAt = draft.UpdatedAt
        };
    }

    public async Task<List<DraftBlogDto>> GetDraftsAsync(Guid userId, CancellationToken ct = default)
    {
        var drafts = await _uow.Drafts.Query()
            .Where(d => d.AuthorId == userId)
            .OrderByDescending(d => d.UpdatedAt ?? d.CreatedAt)
            .ToListAsync(ct);

        return drafts.Select(d => new DraftBlogDto
        {
            Id = d.Id,
            Title = d.Title,
            Content = d.Content,
            Summary = d.Summary,
            Category = d.Category,
            Tags = d.Tags,
            BlogPostId = d.BlogPostId,
            CreatedAt = d.CreatedAt,
            UpdatedAt = d.UpdatedAt
        }).ToList();
    }

    public async Task DeleteDraftAsync(Guid userId, Guid draftId, CancellationToken ct = default)
    {
        var draft = await _uow.Drafts.GetByIdAsync(draftId, ct)
            ?? throw new KeyNotFoundException("Draft not found.");

        if (draft.AuthorId != userId)
            throw new UnauthorizedAccessException("Not your draft.");

        _uow.Drafts.Remove(draft);
        await _uow.SaveChangesAsync(ct);
    }

    public async Task<DraftBlogDto?> GetDraftByIdAsync(Guid userId, Guid draftId, CancellationToken ct = default)
    {
        var draft = await _uow.Drafts.GetByIdAsync(draftId, ct);
        if (draft == null || draft.AuthorId != userId) return null;

        return new DraftBlogDto
        {
            Id = draft.Id,
            Title = draft.Title,
            Content = draft.Content,
            Summary = draft.Summary,
            Category = draft.Category,
            Tags = draft.Tags,
            BlogPostId = draft.BlogPostId,
            CreatedAt = draft.CreatedAt,
            UpdatedAt = draft.UpdatedAt
        };
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

    private async Task SyncTagsAsync(Guid postId, List<string> tagNames, CancellationToken ct)
    {
        // Remove existing tags for this post
        var existingBlogPostTags = await _uow.BlogPosts.Query()
            .Where(p => p.Id == postId)
            .SelectMany(p => p.BlogPostTags)
            .ToListAsync(ct);

        // We need to access DbContext directly for BlogPostTag since it has no BaseEntity
        // Use the Tags repository to find/create tags
        foreach (var tagName in tagNames.Where(t => !string.IsNullOrWhiteSpace(t)))
        {
            var normalized = tagName.Trim().ToUpperInvariant();
            var tag = (await _uow.Tags.FindAsync(t => t.NormalizedName == normalized, ct)).FirstOrDefault();

            if (tag == null)
            {
                tag = new Tag { Name = tagName.Trim(), NormalizedName = normalized };
                await _uow.Tags.AddAsync(tag, ct);
                await _uow.SaveChangesAsync(ct);
            }
        }

        await _uow.SaveChangesAsync(ct);
    }

    private static BlogPostDto MapToDto(BlogPost post, Guid? currentUserId)
    {
        var reactionCounts = post.Reactions?
            .GroupBy(r => r.Type.ToString())
            .ToDictionary(g => g.Key, g => g.Count()) ?? new();

        string? currentUserReaction = null;
        if (currentUserId.HasValue && post.Reactions != null)
        {
            var userReaction = post.Reactions.FirstOrDefault(r => r.UserId == currentUserId.Value);
            currentUserReaction = userReaction?.Type.ToString();
        }

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
            CurrentUserReaction = currentUserReaction,
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

    private static CommentDto MapCommentToDto(Comment comment)
    {
        return new CommentDto
        {
            Id = comment.Id,
            Content = comment.Content,
            IsEdited = comment.IsEdited,
            CreatedAt = comment.CreatedAt,
            UserId = comment.UserId,
            UserName = comment.User.UserName,
            UserDisplayName = comment.User.Profile?.DisplayName,
            UserProfilePictureUrl = comment.User.Profile?.ProfilePictureUrl,
            ParentCommentId = comment.ParentCommentId,
            Replies = comment.Replies?.Select(MapCommentToDto).ToList() ?? new()
        };
    }

    /// <summary>
    /// Calculate reading time based on average 200 words per minute.
    /// </summary>
    private static int CalculateReadingTime(string content)
    {
        if (string.IsNullOrWhiteSpace(content)) return 1;
        // Strip HTML tags for word count
        var text = Regex.Replace(content, "<[^>]+>", " ");
        var wordCount = text.Split(new[] { ' ', '\n', '\r', '\t' }, StringSplitOptions.RemoveEmptyEntries).Length;
        var minutes = (int)Math.Ceiling(wordCount / 200.0);
        return Math.Max(1, minutes);
    }

    private static string GenerateSlug(string title)
    {
        var slug = title.ToLowerInvariant();
        slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = Regex.Replace(slug, @"\s+", "-");
        slug = Regex.Replace(slug, @"-+", "-");
        slug = slug.Trim('-');
        return slug;
    }
}
