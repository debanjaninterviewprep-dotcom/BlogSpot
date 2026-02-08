using BlogSpot.Application.DTOs.Blog;
using BlogSpot.Application.DTOs.Common;
using BlogSpot.Application.DTOs.User;

namespace BlogSpot.Application.Interfaces;

public interface IUserService
{
    Task<UserProfileDto?> GetProfileAsync(Guid userId, Guid? currentUserId = null, CancellationToken ct = default);
    Task<UserProfileDto?> GetProfileByUserNameAsync(string userName, Guid? currentUserId = null, CancellationToken ct = default);
    Task<UserProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileDto dto, CancellationToken ct = default);
    Task<string> UpdateProfilePictureAsync(Guid userId, string imageUrl, CancellationToken ct = default);
    Task<string> UpdateCoverPhotoAsync(Guid userId, string imageUrl, CancellationToken ct = default);

    // Follow
    Task<bool> ToggleFollowAsync(Guid followerId, Guid followingId, CancellationToken ct = default);
    Task<PagedResult<UserProfileDto>> GetFollowersAsync(Guid userId, PaginationParams pagination, Guid? currentUserId = null, CancellationToken ct = default);
    Task<PagedResult<UserProfileDto>> GetFollowingAsync(Guid userId, PaginationParams pagination, Guid? currentUserId = null, CancellationToken ct = default);

    // Suggested users
    Task<List<UserProfileDto>> GetSuggestedUsersAsync(Guid userId, int count = 5, CancellationToken ct = default);

    // Analytics
    Task<CreatorAnalyticsDto> GetCreatorAnalyticsAsync(Guid userId, CancellationToken ct = default);
}
