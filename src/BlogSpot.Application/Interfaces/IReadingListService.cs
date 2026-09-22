using BlogSpot.Application.DTOs.Common;
using BlogSpot.Application.DTOs.ReadingList;

namespace BlogSpot.Application.Interfaces;

public interface IReadingListService
{
    Task<ReadingListDto> CreateAsync(Guid userId, CreateReadingListDto dto, CancellationToken ct = default);
    Task<ReadingListDto> UpdateAsync(Guid userId, Guid listId, UpdateReadingListDto dto, CancellationToken ct = default);
    Task DeleteAsync(Guid userId, Guid listId, CancellationToken ct = default);
    Task<ReadingListDetailDto?> GetByIdAsync(Guid listId, Guid? currentUserId = null, CancellationToken ct = default);
    Task<PagedResult<ReadingListDto>> GetByUserAsync(Guid userId, Guid? currentUserId, PaginationParams pagination, CancellationToken ct = default);
    Task AddPostAsync(Guid userId, Guid listId, Guid postId, CancellationToken ct = default);
    Task RemovePostAsync(Guid userId, Guid listId, Guid postId, CancellationToken ct = default);
    Task<bool> ToggleFollowAsync(Guid userId, Guid listId, CancellationToken ct = default);
}
