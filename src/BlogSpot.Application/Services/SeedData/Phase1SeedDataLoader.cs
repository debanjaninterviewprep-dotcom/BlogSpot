using System.Text.Json;

namespace BlogSpot.Application.Services.SeedData;

/// <summary>
/// Helper class to load Phase 1 seed data from JSON files
/// </summary>
public static class Phase1SeedDataLoader
{
    private static readonly string[] Phase1Categories = { "Science", "Sports", "Cinema", "Health", "Travel" };

    /// <summary>
    /// Find the seed data directory by checking multiple possible locations
    /// </summary>
    private static string FindSeedDataDirectory()
    {
        // Try multiple possible paths
        var possiblePaths = new[]
        {
            // Path from API project (debug)
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "BlogSpot.API", "Data", "SeedData"),
            
            // Path from API project (release)
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "BlogSpot.API", "Data", "SeedData"),
            
            // Absolute path attempt - look for Data/SeedData from app root
            Path.Combine(AppContext.BaseDirectory, "Data", "SeedData"),
            
            // Try from parent directories
            Path.Combine(AppContext.BaseDirectory, "..", "Data", "SeedData"),
            Path.Combine(AppContext.BaseDirectory, "..", "..", "Data", "SeedData"),
            
            // Try from current working directory
            Path.Combine(Directory.GetCurrentDirectory(), "Data", "SeedData"),
            Path.Combine(Directory.GetCurrentDirectory(), "SeedData"),
            
            // Docker container path - files might be copied to a specific location
            "/app/Data/SeedData",
            "/app/SeedData",
        };

        foreach (var path in possiblePaths)
        {
            try
            {
                if (Directory.Exists(path))
                {
                    return path;
                }
            }
            catch { /* Ignore path resolution errors */ }
        }

        // If none found, return the first option (for better error message)
        return possiblePaths[0];
    }

    /// <summary>
    /// Load all Phase 1 blogs from JSON files in the SeedData directory
    /// </summary>
    public static async Task<Dictionary<string, List<Phase1BlogSeedData>>> LoadPhase1BlogsAsync(string? seedDataPath = null)
    {
        seedDataPath ??= FindSeedDataDirectory();
        var result = new Dictionary<string, List<Phase1BlogSeedData>>();

        foreach (var category in Phase1Categories)
        {
            var fileName = $"phase1-{category.ToLowerInvariant()}-blogs.json";
            var filePath = Path.Combine(seedDataPath, fileName);

            if (!File.Exists(filePath))
            {
                throw new FileNotFoundException($"Phase 1 seed data file not found: {filePath}. Searched in: {seedDataPath}");
            }

            var jsonContent = await File.ReadAllTextAsync(filePath);
            var blogs = JsonSerializer.Deserialize<List<Phase1BlogSeedData>>(jsonContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (blogs != null)
            {
                result[category] = blogs;
            }
        }

        return result;
    }

    /// <summary>
    /// Get a specific category's blogs
    /// </summary>
    public static async Task<List<Phase1BlogSeedData>> LoadCategoryBlogsAsync(string? seedDataPath, string category)
    {
        seedDataPath ??= FindSeedDataDirectory();
        var fileName = $"phase1-{category.ToLowerInvariant()}-blogs.json";
        var filePath = Path.Combine(seedDataPath, fileName);

        if (!File.Exists(filePath))
        {
            throw new FileNotFoundException($"Phase 1 seed data file not found: {filePath}. Searched in: {seedDataPath}");
        }

        var jsonContent = await File.ReadAllTextAsync(filePath);
        var blogs = JsonSerializer.Deserialize<List<Phase1BlogSeedData>>(jsonContent, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        return blogs ?? new List<Phase1BlogSeedData>();
    }

    /// <summary>
    /// Get reading list configuration for Phase 1
    /// </summary>
    public static List<(string Name, string Description, int OwnerId, string Category)> GetPhase1ReadingListsConfig()
    {
        return new List<(string, string, int, string)>
        {
            ("Essential Science Readings", "Curated collection of foundational science and research articles covering physics, biology, and cutting-edge discoveries", 0, "Science"),
            ("Sports Champions Guide", "Comprehensive guide to the world's greatest sports, athletes, and competitions", 1, "Sports"),
            ("Entertainment Deep Dive", "Explore cinema, music, and pop culture's most influential works and personalities", 2, "Cinema"),
            ("Wellness & Vitality", "Holistic health knowledge covering physical fitness, mental wellness, and nutrition science", 3, "Health"),
            ("World Travel Essentials", "Travel guides, cultural insights, and tips for exploring the world sustainably", 4, "Travel"),
        };
    }
}
