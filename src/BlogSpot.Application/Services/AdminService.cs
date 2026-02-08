using BlogSpot.Application.DTOs.Admin;
using BlogSpot.Application.DTOs.Common;
using BlogSpot.Application.Interfaces;
using BlogSpot.Domain.Enums;
using BlogSpot.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BlogSpot.Application.Services;

public class AdminService : IAdminService
{
    private readonly IUnitOfWork _uow;

    public AdminService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<PagedResult<AdminUserDto>> GetAllUsersAsync(PaginationParams pagination, CancellationToken ct = default)
    {
        var query = _uow.Users.Query()
            .Include(u => u.BlogPosts)
            .Include(u => u.Comments)
            .OrderByDescending(u => u.CreatedAt);

        var totalCount = await query.CountAsync(ct);
        var users = await query
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .ToListAsync(ct);

        return new PagedResult<AdminUserDto>
        {
            Items = users.Select(u => new AdminUserDto
            {
                Id = u.Id,
                UserName = u.UserName,
                Email = u.Email,
                Role = u.Role.ToString(),
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt,
                PostsCount = u.BlogPosts.Count,
                CommentsCount = u.Comments.Count
            }).ToList(),
            TotalCount = totalCount,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task ToggleUserActiveStatusAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _uow.Users.GetByIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("User not found.");

        user.IsActive = !user.IsActive;
        user.UpdatedAt = DateTime.UtcNow;
        _uow.Users.Update(user);
        await _uow.SaveChangesAsync(ct);
    }

    public async Task ChangeUserRoleAsync(Guid userId, string role, CancellationToken ct = default)
    {
        var user = await _uow.Users.GetByIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("User not found.");

        if (!Enum.TryParse<UserRole>(role, true, out var parsedRole))
            throw new ArgumentException($"Invalid role: {role}");

        user.Role = parsedRole;
        user.UpdatedAt = DateTime.UtcNow;
        _uow.Users.Update(user);
        await _uow.SaveChangesAsync(ct);
    }

    public async Task<PagedResult<AdminPostDto>> GetAllPostsAsync(PaginationParams pagination, CancellationToken ct = default)
    {
        var query = _uow.BlogPosts.Query()
            .Include(p => p.Author)
            .Include(p => p.Likes)
            .Include(p => p.Comments)
            .OrderByDescending(p => p.CreatedAt);

        var totalCount = await query.CountAsync(ct);
        var posts = await query
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .ToListAsync(ct);

        return new PagedResult<AdminPostDto>
        {
            Items = posts.Select(p => new AdminPostDto
            {
                Id = p.Id,
                Title = p.Title,
                AuthorUserName = p.Author.UserName,
                IsPublished = p.IsPublished,
                LikeCount = p.Likes.Count,
                CommentCount = p.Comments.Count,
                CreatedAt = p.CreatedAt
            }).ToList(),
            TotalCount = totalCount,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task AdminDeletePostAsync(Guid postId, CancellationToken ct = default)
    {
        var post = await _uow.BlogPosts.GetByIdAsync(postId, ct)
            ?? throw new KeyNotFoundException("Post not found.");

        _uow.BlogPosts.Remove(post);
        await _uow.SaveChangesAsync(ct);
    }

    public async Task<PagedResult<AdminCommentDto>> GetAllCommentsAsync(PaginationParams pagination, CancellationToken ct = default)
    {
        var query = _uow.Comments.Query()
            .Include(c => c.User)
            .Include(c => c.BlogPost)
            .OrderByDescending(c => c.CreatedAt);

        var totalCount = await query.CountAsync(ct);
        var comments = await query
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .ToListAsync(ct);

        return new PagedResult<AdminCommentDto>
        {
            Items = comments.Select(c => new AdminCommentDto
            {
                Id = c.Id,
                Content = c.Content,
                UserName = c.User.UserName,
                PostTitle = c.BlogPost.Title,
                CreatedAt = c.CreatedAt
            }).ToList(),
            TotalCount = totalCount,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task AdminDeleteCommentAsync(Guid commentId, CancellationToken ct = default)
    {
        var comment = await _uow.Comments.GetByIdAsync(commentId, ct)
            ?? throw new KeyNotFoundException("Comment not found.");

        _uow.Comments.Remove(comment);
        await _uow.SaveChangesAsync(ct);
    }
}
