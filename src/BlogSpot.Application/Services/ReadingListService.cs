using BlogSpot.Application.Constants;
using BlogSpot.Application.DTOs.Common;
using BlogSpot.Application.DTOs.ReadingList;
using BlogSpot.Application.DTOs.User;
using BlogSpot.Application.Interfaces;
using BlogSpot.Domain.Entities;
using BlogSpot.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BlogSpot.Application.Services;

public class ReadingListService : IReadingListService
{
    private readonly IUnitOfWork _uow;
    private readonly IBlogService _blogService;
    private readonly INotificationService _notificationService;
    private readonly IActivityLogService _log;

    public ReadingListService(IUnitOfWork uow, IBlogService blogService, INotificationService notificationService, IActivityLogService log)
    {
        _uow = uow;
        _blogService = blogService;
        _notificationService = notificationService;
        _log = log;
    }

    public async Task<ReadingListDto> CreateAsync(Guid userId, CreateReadingListDto dto, CancellationToken ct = default)
    {
        var actor = await _uow.Users.GetByIdAsync(userId, ct);
        var list = new Domain.Entities.ReadingList
        {
            UserId = userId,
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            IsPublic = dto.IsPublic
        };

        await _uow.ReadingLists.AddAsync(list, ct);
        await _uow.SaveChangesAsync(ct);
        await _log.Info(ActivityActions.ReadingList, nameof(ReadingListService), actor?.UserName, $"Created '{list.Name}'", ct);

        return MapToDto(list, actor!.UserName, actor.Profile?.DisplayName, actor.Profile?.ProfilePictureUrl, 0, 0, false);
    }

    public async Task<ReadingListDto> UpdateAsync(Guid userId, Guid listId, UpdateReadingListDto dto, CancellationToken ct = default)
    {
        var list = await _uow.ReadingLists.GetByIdAsync(listId, ct)
            ?? throw new KeyNotFoundException("Reading list not found.");

        if (list.UserId != userId)
            throw new UnauthorizedAccessException("You can only edit your own reading lists.");

        list.Name = dto.Name.Trim();
        list.Description = dto.Description?.Trim();
        list.IsPublic = dto.IsPublic;
        _uow.ReadingLists.Update(list);
        await _uow.SaveChangesAsync(ct);

        var actor = await _uow.Users.GetByIdAsync(userId, ct);
        await _log.Info(ActivityActions.ReadingList, nameof(ReadingListService), actor?.UserName, $"Updated '{list.Name}'", ct);

        var itemCount = await _uow.ReadingListItems.CountAsync(i => i.ReadingListId == listId, ct);
        var followerCount = await _uow.ReadingListFollows.CountAsync(f => f.ReadingListId == listId, ct);
        return MapToDto(list, actor!.UserName, actor.Profile?.DisplayName, actor.Profile?.ProfilePictureUrl, itemCount, followerCount, false);
    }

    public async Task DeleteAsync(Guid userId, Guid listId, CancellationToken ct = default)
    {
        var list = await _uow.ReadingLists.GetByIdAsync(listId, ct)
            ?? throw new KeyNotFoundException("Reading list not found.");

        if (list.UserId != userId)
            throw new UnauthorizedAccessException("You can only delete your own reading lists.");

        _uow.ReadingLists.Remove(list);
        await _uow.SaveChangesAsync(ct);

        var actor = await _uow.Users.GetByIdAsync(userId, ct);
        await _log.Info(ActivityActions.ReadingList, nameof(ReadingListService), actor?.UserName, $"Deleted '{list.Name}'", ct);
    }

    public async Task<ReadingListDetailDto?> GetByIdAsync(Guid listId, Guid? currentUserId = null, CancellationToken ct = default)
    {
        var list = await _uow.ReadingLists.Query()
            .Include(r => r.User).ThenInclude(u => u.Profile)
            .FirstOrDefaultAsync(r => r.Id == listId, ct);

        if (list == null) return null;
        if (!list.IsPublic && list.UserId != currentUserId) return null; // hide private lists from non-owners

        var items = await _uow.ReadingListItems.Query()
            .Where(i => i.ReadingListId == listId)
            .OrderBy(i => i.CreatedAt)
            .ToListAsync(ct);
        var followerCount = await _uow.ReadingListFollows.CountAsync(f => f.ReadingListId == listId, ct);
        var isFollowed = currentUserId.HasValue &&
            await _uow.ReadingListFollows.ExistsAsync(f => f.ReadingListId == listId && f.UserId == currentUserId.Value, ct);

        var postDtos = await _blogService.GetPostsByIdsAsync(items.Select(i => i.BlogPostId).ToList(), currentUserId, ct);
        var postsById = postDtos.ToDictionary(p => p.Id);
        var orderedPosts = items
            .Where(i => postsById.ContainsKey(i.BlogPostId))
            .Select(i => postsById[i.BlogPostId])
            .ToList();

        var dto = MapToDto(list, list.User.UserName, list.User.Profile?.DisplayName, list.User.Profile?.ProfilePictureUrl,
            items.Count, followerCount, isFollowed);

        return new ReadingListDetailDto
        {
            Id = dto.Id,
            Name = dto.Name,
            Description = dto.Description,
            IsPublic = dto.IsPublic,
            CreatedAt = dto.CreatedAt,
            UserId = dto.UserId,
            UserName = dto.UserName,
            UserDisplayName = dto.UserDisplayName,
            UserProfilePictureUrl = dto.UserProfilePictureUrl,
            ItemCount = dto.ItemCount,
            FollowerCount = dto.FollowerCount,
            IsFollowedByCurrentUser = dto.IsFollowedByCurrentUser,
            Posts = orderedPosts
        };
    }

    public async Task<PagedResult<ReadingListDto>> GetByUserAsync(Guid userId, Guid? currentUserId, PaginationParams pagination, CancellationToken ct = default)
    {
        var isOwnLists = currentUserId.HasValue && currentUserId.Value == userId;

        var query = _uow.ReadingLists.Query()
            .Include(r => r.User).ThenInclude(u => u.Profile)
            .Where(r => r.UserId == userId);

        if (!isOwnLists)
            query = query.Where(r => r.IsPublic);

        query = query.OrderByDescending(r => r.CreatedAt);

        var totalCount = await query.CountAsync(ct);
        var lists = await query
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .ToListAsync(ct);

        return new PagedResult<ReadingListDto>
        {
            Items = await MapWithCountsAsync(lists, currentUserId, ct),
            TotalCount = totalCount,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task AddPostAsync(Guid userId, Guid listId, Guid postId, CancellationToken ct = default)
    {
        var list = await _uow.ReadingLists.GetByIdAsync(listId, ct)
            ?? throw new KeyNotFoundException("Reading list not found.");

        if (list.UserId != userId)
            throw new UnauthorizedAccessException("You can only add posts to your own reading lists.");

        var exists = await _uow.ReadingListItems.ExistsAsync(
            i => i.ReadingListId == listId && i.BlogPostId == postId, ct);
        if (exists) return;

        await _uow.ReadingListItems.AddAsync(new ReadingListItem { ReadingListId = listId, BlogPostId = postId }, ct);
        await _uow.SaveChangesAsync(ct);

        var actor = await _uow.Users.GetByIdAsync(userId, ct);
        await _log.Info(ActivityActions.ReadingList, nameof(ReadingListService), actor?.UserName, $"Added post to '{list.Name}'", ct);
    }

    public async Task RemovePostAsync(Guid userId, Guid listId, Guid postId, CancellationToken ct = default)
    {
        var list = await _uow.ReadingLists.GetByIdAsync(listId, ct)
            ?? throw new KeyNotFoundException("Reading list not found.");

        if (list.UserId != userId)
            throw new UnauthorizedAccessException("You can only remove posts from your own reading lists.");

        var item = (await _uow.ReadingListItems.FindAsync(
            i => i.ReadingListId == listId && i.BlogPostId == postId, ct)).FirstOrDefault();
        if (item == null) return;

        _uow.ReadingListItems.Remove(item);
        await _uow.SaveChangesAsync(ct);

        var actor = await _uow.Users.GetByIdAsync(userId, ct);
        await _log.Info(ActivityActions.ReadingList, nameof(ReadingListService), actor?.UserName, $"Removed post from '{list.Name}'", ct);
    }

    public async Task<bool> ToggleFollowAsync(Guid userId, Guid listId, CancellationToken ct = default)
    {
        var list = await _uow.ReadingLists.GetByIdAsync(listId, ct)
            ?? throw new KeyNotFoundException("Reading list not found.");

        if (!list.IsPublic)
            throw new UnauthorizedAccessException("This reading list is private.");
        if (list.UserId == userId)
            throw new InvalidOperationException("You cannot follow your own reading list.");

        var actor = await _uow.Users.GetByIdAsync(userId, ct);
        var existing = (await _uow.ReadingListFollows.FindAsync(
            f => f.UserId == userId && f.ReadingListId == listId, ct)).FirstOrDefault();

        if (existing != null)
        {
            _uow.ReadingListFollows.Remove(existing);
            await _uow.SaveChangesAsync(ct);
            await _log.Info(ActivityActions.ReadingListFollow, nameof(ReadingListService), actor?.UserName, $"Unfollowed '{list.Name}'", ct);
            return false;
        }

        await _uow.ReadingListFollows.AddAsync(new ReadingListFollow { UserId = userId, ReadingListId = listId }, ct);
        await _uow.SaveChangesAsync(ct);
        await _log.Info(ActivityActions.ReadingListFollow, nameof(ReadingListService), actor?.UserName, $"Followed '{list.Name}'", ct);

        if (list.UserId != userId)
        {
            await _notificationService.CreateNotificationAsync(
                list.UserId, userId, "ReadingListFollow",
                $"{actor?.UserName} followed your reading list \"{list.Name}\"",
                listId, ct);
        }

        return true;
    }

    public async Task<PagedResult<UserProfileDto>> GetFollowersAsync(Guid listId, Guid? currentUserId, PaginationParams pagination, CancellationToken ct = default)
    {
        var list = await _uow.ReadingLists.GetByIdAsync(listId, ct)
            ?? throw new KeyNotFoundException("Reading list not found.");

        if (!list.IsPublic && list.UserId != currentUserId)
            throw new UnauthorizedAccessException("This reading list is private.");

        var query = _uow.ReadingListFollows.Query()
            .Where(f => f.ReadingListId == listId)
            .Include(f => f.User).ThenInclude(u => u.Profile)
            .Include(f => f.User).ThenInclude(u => u.Followers)
            .Include(f => f.User).ThenInclude(u => u.Following)
            .Include(f => f.User).ThenInclude(u => u.BlogPosts)
            .OrderByDescending(f => f.CreatedAt);

        var totalCount = await query.CountAsync(ct);
        var followers = await query
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(f => f.User)
            .ToListAsync(ct);

        return new PagedResult<UserProfileDto>
        {
            Items = followers.Select(u => new UserProfileDto
            {
                Id = u.Id,
                UserName = u.UserName,
                DisplayName = u.Profile?.DisplayName,
                ProfilePictureUrl = u.Profile?.ProfilePictureUrl,
                JoinedAt = u.CreatedAt,
                FollowersCount = u.Followers?.Count ?? 0,
                FollowingCount = u.Following?.Count ?? 0,
                PostsCount = u.BlogPosts?.Count(p => p.IsPublished) ?? 0,
                IsFollowedByCurrentUser = currentUserId.HasValue &&
                    (u.Followers?.Any(f => f.FollowerId == currentUserId.Value) ?? false)
            }).ToList(),
            TotalCount = totalCount,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task<PagedResult<ReadingListDto>> GetFollowedByUserAsync(Guid userId, Guid? currentUserId, PaginationParams pagination, CancellationToken ct = default)
    {
        var followedIds = _uow.ReadingListFollows.Query()
            .Where(f => f.UserId == userId)
            .Select(f => f.ReadingListId);

        var query = _uow.ReadingLists.Query()
            .Include(r => r.User).ThenInclude(u => u.Profile)
            .Where(r => r.IsPublic && followedIds.Contains(r.Id))
            .OrderByDescending(r => r.CreatedAt)
            .ThenBy(r => r.Id);

        var totalCount = await query.CountAsync(ct);
        var lists = await query
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .ToListAsync(ct);

        return new PagedResult<ReadingListDto>
        {
            Items = await MapWithCountsAsync(lists, currentUserId, ct),
            TotalCount = totalCount,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task<PagedResult<ReadingListDto>> SearchAsync(string query, Guid? currentUserId, PaginationParams pagination, CancellationToken ct = default)
    {
        var normalizedQuery = (query ?? string.Empty).ToLower().Trim();
        if (normalizedQuery.Length == 0)
            return new PagedResult<ReadingListDto> { Items = new List<ReadingListDto>(), TotalCount = 0, Page = pagination.Page, PageSize = pagination.PageSize };

        // Private lists stay hidden from everyone but their owner, matching GetByUserAsync.
        var baseQuery = _uow.ReadingLists.Query()
            .Include(r => r.User).ThenInclude(u => u.Profile)
            .Where(r => (r.IsPublic || r.UserId == currentUserId) &&
                (r.Name.ToLower().Contains(normalizedQuery) ||
                 (r.Description != null && r.Description.ToLower().Contains(normalizedQuery))))
            .OrderByDescending(r => r.CreatedAt)
            .ThenBy(r => r.Id);

        var totalCount = await baseQuery.CountAsync(ct);
        var lists = await baseQuery
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .ToListAsync(ct);

        return new PagedResult<ReadingListDto>
        {
            Items = await MapWithCountsAsync(lists, currentUserId, ct),
            TotalCount = totalCount,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    private async Task<List<ReadingListDto>> MapWithCountsAsync(
        List<Domain.Entities.ReadingList> lists, Guid? currentUserId, CancellationToken ct)
    {
        var listIds = lists.Select(l => l.Id).ToList();
        var itemCounts = await _uow.ReadingListItems.Query()
            .Where(i => listIds.Contains(i.ReadingListId))
            .GroupBy(i => i.ReadingListId)
            .Select(g => new { ReadingListId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ReadingListId, x => x.Count, ct);
        var followerCounts = await _uow.ReadingListFollows.Query()
            .Where(f => listIds.Contains(f.ReadingListId))
            .GroupBy(f => f.ReadingListId)
            .Select(g => new { ReadingListId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ReadingListId, x => x.Count, ct);
        var followedIds = currentUserId.HasValue
            ? (await _uow.ReadingListFollows.Query()
                .Where(f => listIds.Contains(f.ReadingListId) && f.UserId == currentUserId.Value)
                .Select(f => f.ReadingListId)
                .ToListAsync(ct)).ToHashSet()
            : new HashSet<Guid>();

        return lists.Select(l => MapToDto(
            l, l.User.UserName, l.User.Profile?.DisplayName, l.User.Profile?.ProfilePictureUrl,
            itemCounts.GetValueOrDefault(l.Id), followerCounts.GetValueOrDefault(l.Id), followedIds.Contains(l.Id)
        )).ToList();
    }

    private static ReadingListDto MapToDto(
        Domain.Entities.ReadingList list, string userName, string? userDisplayName, string? userProfilePictureUrl,
        int itemCount, int followerCount, bool isFollowed)
    {
        return new ReadingListDto
        {
            Id = list.Id,
            Name = list.Name,
            Description = list.Description,
            IsPublic = list.IsPublic,
            CreatedAt = list.CreatedAt,
            UserId = list.UserId,
            UserName = userName,
            UserDisplayName = userDisplayName,
            UserProfilePictureUrl = userProfilePictureUrl,
            ItemCount = itemCount,
            FollowerCount = followerCount,
            IsFollowedByCurrentUser = isFollowed
        };
    }
}
