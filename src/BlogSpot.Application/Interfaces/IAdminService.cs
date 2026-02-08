using BlogSpot.Application.DTOs.Admin;
using BlogSpot.Application.DTOs.Common;

namespace BlogSpot.Application.Interfaces;

public interface IAdminService
{
    Task<PagedResult<AdminUserDto>> GetAllUsersAsync(PaginationParams pagination, CancellationToken ct = default);
    Task ToggleUserActiveStatusAsync(Guid userId, CancellationToken ct = default);
    Task ChangeUserRoleAsync(Guid userId, string role, CancellationToken ct = default);

    Task<PagedResult<AdminPostDto>> GetAllPostsAsync(PaginationParams pagination, CancellationToken ct = default);
    Task AdminDeletePostAsync(Guid postId, CancellationToken ct = default);

    Task<PagedResult<AdminCommentDto>> GetAllCommentsAsync(PaginationParams pagination, CancellationToken ct = default);
    Task AdminDeleteCommentAsync(Guid commentId, CancellationToken ct = default);
}
