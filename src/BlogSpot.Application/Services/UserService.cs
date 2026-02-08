using BlogSpot.Application.DTOs.Common;
using BlogSpot.Application.DTOs.User;
using BlogSpot.Application.Interfaces;
using BlogSpot.Domain.Entities;
using BlogSpot.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BlogSpot.Application.Services;

/// <summary>
/// User service with enhanced profile, suggested users, and creator analytics.
/// </summary>
public class UserService : IUserService
{
    private readonly IUnitOfWork _uow;
    private readonly INotificationService _notificationService;

    public UserService(IUnitOfWork uow, INotificationService notificationService)
    {
        _uow = uow;
        _notificationService = notificationService;
    }

    public async Task<UserProfileDto?> GetProfileAsync(Guid userId, Guid? currentUserId = null, CancellationToken ct = default)
    {
        var user = await _uow.Users.Query()
            .Include(u => u.Profile)
            .Include(u => u.Followers)
            .Include(u => u.Following)
            .Include(u => u.BlogPosts)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (user == null) return null;
        return MapToProfileDto(user, currentUserId);
    }

    public async Task<UserProfileDto?> GetProfileByUserNameAsync(string userName, Guid? currentUserId = null, CancellationToken ct = default)
    {
        var user = await _uow.Users.Query()
            .Include(u => u.Profile)
            .Include(u => u.Followers)
            .Include(u => u.Following)
            .Include(u => u.BlogPosts)
            .FirstOrDefaultAsync(u => u.UserName == userName, ct);

        if (user == null) return null;
        return MapToProfileDto(user, currentUserId);
    }

    public async Task<UserProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileDto dto, CancellationToken ct = default)
    {
        var user = await _uow.Users.Query()
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new KeyNotFoundException("User not found.");

        if (user.Profile == null)
        {
            user.Profile = new Profile { UserId = userId };
            await _uow.Profiles.AddAsync(user.Profile, ct);
        }

        user.Profile.DisplayName = dto.DisplayName ?? user.Profile.DisplayName;
        user.Profile.Bio = dto.Bio ?? user.Profile.Bio;
        user.Profile.Website = dto.Website ?? user.Profile.Website;
        user.Profile.Location = dto.Location ?? user.Profile.Location;
        user.Profile.SocialLinks = dto.SocialLinks ?? user.Profile.SocialLinks;
        user.Profile.Skills = dto.Skills ?? user.Profile.Skills;
        user.Profile.UpdatedAt = DateTime.UtcNow;

        _uow.Profiles.Update(user.Profile);
        await _uow.SaveChangesAsync(ct);

        return (await GetProfileAsync(userId, userId, ct))!;
    }

    public async Task<string> UpdateProfilePictureAsync(Guid userId, string imageUrl, CancellationToken ct = default)
    {
        var user = await _uow.Users.Query()
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new KeyNotFoundException("User not found.");

        if (user.Profile == null)
        {
            user.Profile = new Profile { UserId = userId };
            await _uow.Profiles.AddAsync(user.Profile, ct);
        }

        user.Profile.ProfilePictureUrl = imageUrl;
        user.Profile.UpdatedAt = DateTime.UtcNow;

        _uow.Profiles.Update(user.Profile);
        await _uow.SaveChangesAsync(ct);

        return imageUrl;
    }

    public async Task<string> UpdateCoverPhotoAsync(Guid userId, string imageUrl, CancellationToken ct = default)
    {
        var user = await _uow.Users.Query()
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new KeyNotFoundException("User not found.");

        if (user.Profile == null)
        {
            user.Profile = new Profile { UserId = userId };
            await _uow.Profiles.AddAsync(user.Profile, ct);
        }

        user.Profile.CoverPhotoUrl = imageUrl;
        user.Profile.UpdatedAt = DateTime.UtcNow;

        _uow.Profiles.Update(user.Profile);
        await _uow.SaveChangesAsync(ct);

        return imageUrl;
    }

    public async Task<bool> ToggleFollowAsync(Guid followerId, Guid followingId, CancellationToken ct = default)
    {
        if (followerId == followingId)
            throw new InvalidOperationException("You cannot follow yourself.");

        var followingUser = await _uow.Users.GetByIdAsync(followingId, ct)
            ?? throw new KeyNotFoundException("User not found.");

        var user = await _uow.Users.Query()
            .Include(u => u.Following)
            .FirstAsync(u => u.Id == followerId, ct);

        var existingFollow = user.Following.FirstOrDefault(f => f.FollowingId == followingId);

        if (existingFollow != null)
        {
            user.Following.Remove(existingFollow);
            await _uow.SaveChangesAsync(ct);
            return false;
        }

        user.Following.Add(new Follow
        {
            FollowerId = followerId,
            FollowingId = followingId
        });
        await _uow.SaveChangesAsync(ct);

        // Notify followed user
        var follower = await _uow.Users.GetByIdAsync(followerId, ct);
        await _notificationService.CreateNotificationAsync(
            followingId, followerId, "Follow",
            $"{follower?.UserName} started following you",
            null, ct);

        return true;
    }

    public async Task<PagedResult<UserProfileDto>> GetFollowersAsync(Guid userId, PaginationParams pagination, Guid? currentUserId = null, CancellationToken ct = default)
    {
        var user = await _uow.Users.Query()
            .Include(u => u.Followers)
            .ThenInclude(f => f.Follower)
            .ThenInclude(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new KeyNotFoundException("User not found.");

        var followers = user.Followers
            .OrderByDescending(f => f.CreatedAt)
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(f => f.Follower)
            .ToList();

        return new PagedResult<UserProfileDto>
        {
            Items = followers.Select(u => MapToProfileDto(u, currentUserId)).ToList(),
            TotalCount = user.Followers.Count,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task<PagedResult<UserProfileDto>> GetFollowingAsync(Guid userId, PaginationParams pagination, Guid? currentUserId = null, CancellationToken ct = default)
    {
        var user = await _uow.Users.Query()
            .Include(u => u.Following)
            .ThenInclude(f => f.Following)
            .ThenInclude(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new KeyNotFoundException("User not found.");

        var following = user.Following
            .OrderByDescending(f => f.CreatedAt)
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(f => f.Following)
            .ToList();

        return new PagedResult<UserProfileDto>
        {
            Items = following.Select(u => MapToProfileDto(u, currentUserId)).ToList(),
            TotalCount = user.Following.Count,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task<List<UserProfileDto>> GetSuggestedUsersAsync(Guid userId, int count = 5, CancellationToken ct = default)
    {
        // Get users the current user already follows
        var followingIds = await _uow.Users.Query()
            .Where(u => u.Id == userId)
            .SelectMany(u => u.Following)
            .Select(f => f.FollowingId)
            .ToListAsync(ct);

        followingIds.Add(userId); // Exclude self

        // Suggest users with most followers who aren't already followed
        var suggestedUsers = await _uow.Users.Query()
            .Include(u => u.Profile)
            .Include(u => u.Followers)
            .Include(u => u.Following)
            .Include(u => u.BlogPosts)
            .Where(u => u.IsActive && !followingIds.Contains(u.Id))
            .OrderByDescending(u => u.Followers.Count)
            .Take(count)
            .ToListAsync(ct);

        return suggestedUsers.Select(u => MapToProfileDto(u, userId)).ToList();
    }

    public async Task<CreatorAnalyticsDto> GetCreatorAnalyticsAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _uow.Users.Query()
            .Include(u => u.BlogPosts).ThenInclude(p => p.Reactions)
            .Include(u => u.BlogPosts).ThenInclude(p => p.Comments)
            .Include(u => u.Followers)
            .FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new KeyNotFoundException("User not found.");

        var posts = user.BlogPosts.Where(p => p.IsPublished).ToList();
        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);

        var totalViews = posts.Sum(p => p.ViewCount);
        var totalReactions = posts.Sum(p => p.Reactions?.Count ?? 0);
        var totalComments = posts.Sum(p => p.Comments?.Count ?? 0);
        var totalFollowers = user.Followers?.Count ?? 0;

        var followersGrowth = user.Followers?
            .Count(f => f.CreatedAt >= thirtyDaysAgo) ?? 0;

        var topPosts = posts
            .OrderByDescending(p => p.ViewCount + (p.Reactions?.Count ?? 0) * 3)
            .Take(5)
            .Select(p => new TopPostDto
            {
                Id = p.Id,
                Title = p.Title,
                Slug = p.Slug,
                ViewCount = p.ViewCount,
                ReactionCount = p.Reactions?.Count ?? 0,
                CommentCount = p.Comments?.Count ?? 0,
                CreatedAt = p.CreatedAt
            }).ToList();

        return new CreatorAnalyticsDto
        {
            TotalViews = totalViews,
            TotalReactions = totalReactions,
            TotalComments = totalComments,
            TotalFollowers = totalFollowers,
            FollowersGrowthLast30Days = followersGrowth,
            TopPosts = topPosts
        };
    }

    private static UserProfileDto MapToProfileDto(User user, Guid? currentUserId)
    {
        return new UserProfileDto
        {
            Id = user.Id,
            UserName = user.UserName,
            DisplayName = user.Profile?.DisplayName,
            Bio = user.Profile?.Bio,
            ProfilePictureUrl = user.Profile?.ProfilePictureUrl,
            CoverPhotoUrl = user.Profile?.CoverPhotoUrl,
            Website = user.Profile?.Website,
            Location = user.Profile?.Location,
            SocialLinks = user.Profile?.SocialLinks,
            Skills = user.Profile?.Skills?
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(s => s.Trim()).ToList() ?? new(),
            JoinedAt = user.CreatedAt,
            FollowersCount = user.Followers?.Count ?? 0,
            FollowingCount = user.Following?.Count ?? 0,
            PostsCount = user.BlogPosts?.Count(p => p.IsPublished) ?? 0,
            IsFollowedByCurrentUser = currentUserId.HasValue &&
                (user.Followers?.Any(f => f.FollowerId == currentUserId.Value) ?? false)
        };
    }
}
