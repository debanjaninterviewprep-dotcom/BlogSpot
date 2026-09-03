using BlogSpot.Application.Interfaces;
using BlogSpot.Domain.Enums;
using BlogSpot.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
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
    private readonly TimeSpan _interval;

    public PostSchedulerService(IServiceProvider serviceProvider, ILogger<PostSchedulerService> logger, IConfiguration configuration)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        var minutes = double.Parse(configuration["PostScheduler:JobIntervalMinutes"] ?? "30");
        _interval = TimeSpan.FromMinutes(minutes);
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
            var emailService = scope.ServiceProvider.GetRequiredService<IEmailQueueService>();

            var now = DateTime.UtcNow;

            // Lightweight check: only proceed if there are any scheduled posts
            var hasScheduledPosts = await uow.BlogPosts.Query()
                .AnyAsync(p => p.Status == PostStatus.Scheduled && !p.IsDeleted, cancellationToken);

            if (!hasScheduledPosts)
            {
                _logger.LogDebug("No scheduled posts found. Skipping database processing.");
                return;
            }

            // Find all posts scheduled for publishing that are now due
            var duePostsQuery = uow.BlogPosts.Query()
                .Include(p => p.Author)
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

            // Notify each author that their scheduled post is now live
            foreach (var post in duePosts)
            {
                if (!string.IsNullOrWhiteSpace(post.Author?.Email))
                {
                    await emailService.EnqueueAsync(
                        post.Author.Email,
                        $"Your post is now live: {post.Title}",
                        $@"<div style='font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px'>
                            <h2 style='color:#1d9bf0'>Post Published</h2>
                            <h3>{post.Title}</h3>
                            <p style='color:#536471'>Your scheduled post has just been published and is now live on BlogSpot.</p>
                        </div>",
                        cancellationToken);
                }
            }
        }
    }
}
