using BlogSpot.Application.Interfaces;
using BlogSpot.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace BlogSpot.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IBlogService, BlogService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IFeedService, FeedService>();
        services.AddScoped<IAdminService, AdminService>();
        services.AddScoped<INotificationService, NotificationService>();

        return services;
    }
}
