using BlogSpot.Application.Interfaces;
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
        using var scope = _serviceProvider.CreateScope();
        var blogService = scope.ServiceProvider.GetRequiredService<IBlogService>();

        var count = await blogService.PublishDuePostsAsync(cancellationToken);
        if (count > 0)
            _logger.LogInformation("Published {Count} scheduled posts.", count);
    }
}

