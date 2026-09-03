using BlogSpot.Domain.Enums;
using BlogSpot.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace BlogSpot.Application.Services;

/// <summary>
/// Background service that periodically checks for scheduled posts and publishes them.
/// </summary>
public class PostSchedulerService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<PostSchedulerService> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromMinutes(1); // Check every minute

    public PostSchedulerService(IServiceProvider serviceProvider, ILogger<PostSchedulerService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("PostSchedulerService started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await PublishScheduledPostsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in PostSchedulerService: {Message}", ex.Message);
            }

            await Task.Delay(_interval, stoppingToken);
        }

        _logger.LogInformation("PostSchedulerService stopped.");
    }

    private async Task PublishScheduledPostsAsync(CancellationToken cancellationToken)
    {
        using (var scope = _serviceProvider.CreateScope())
        {
            var uow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

            // Find all posts scheduled for publishing that are now due
            var now = DateTime.UtcNow;
            var duePostsQuery = uow.BlogPosts.Query()
                .Where(p => p.Status == PostStatus.Scheduled && p.ScheduledPublishAt <= now && !p.IsDeleted);

            var duePosts = await duePostsQuery.ToListAsync(cancellationToken);

            if (!duePosts.Any())
                return;

            foreach (var post in duePosts)
            {
                post.Status = PostStatus.Published;
                post.IsPublished = true;
                post.ScheduledPublishAt = null;
                post.UpdatedAt = DateTime.UtcNow;

                uow.BlogPosts.Update(post);
                _logger.LogInformation("Published scheduled post: {PostTitle} (ID: {PostId})", post.Title, post.Id);
            }

            await uow.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Published {Count} scheduled posts.", duePosts.Count);
        }
    }
}
