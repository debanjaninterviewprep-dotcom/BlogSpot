using BlogSpot.Application.DTOs.Admin;
using BlogSpot.Application.DTOs.Common;

namespace BlogSpot.Application.Interfaces;

public interface IAdminService
{
    Task<PagedResult<AdminUserDto>> GetAllUsersAsync(PaginationParams pagination, CancellationToken ct = default);
    Task ToggleUserActiveStatusAsync(Guid userId, string? actorUserName = null, CancellationToken ct = default);
    Task ChangeUserRoleAsync(Guid userId, string role, string? actorUserName = null, CancellationToken ct = default);

    Task<PagedResult<AdminPostDto>> GetAllPostsAsync(PaginationParams pagination, CancellationToken ct = default);
    Task AdminDeletePostAsync(Guid postId, string? actorUserName = null, CancellationToken ct = default);

    Task<PagedResult<AdminCommentDto>> GetAllCommentsAsync(PaginationParams pagination, CancellationToken ct = default);
    Task AdminDeleteCommentAsync(Guid commentId, string? actorUserName = null, CancellationToken ct = default);

    Task<PagedResult<AdminReadingListDto>> GetAllReadingListsAsync(PaginationParams pagination, CancellationToken ct = default);
    Task ToggleReadingListVisibilityAsync(Guid readingListId, string? actorUserName = null, CancellationToken ct = default);
    Task AdminDeleteReadingListAsync(Guid readingListId, string? actorUserName = null, CancellationToken ct = default);

    Task<string> SeedDummyDataAsync(string? actorUserName = null, CancellationToken ct = default);
    Task<string> SeedPhase1Async(string? actorUserName = null, CancellationToken ct = default);
    Task<string> SeedPhase2Async(string? actorUserName = null, CancellationToken ct = default);
    Task<string> SeedPhase3Async(string? actorUserName = null, CancellationToken ct = default);
    Task<string> SeedPhase4Async(string? actorUserName = null, CancellationToken ct = default);
    Task<string> FormatExistingPostsAsync(string? actorUserName = null, CancellationToken ct = default);

    // Manual job triggers
    Task<string> RunEmailQueueJobAsync(string? actorUserName = null, CancellationToken ct = default);
    Task<string> RunPostSchedulerJobAsync(string? actorUserName = null, CancellationToken ct = default);
    Task<string> RunHealthCheckJobAsync(string? actorUserName = null, CancellationToken ct = default);
}
