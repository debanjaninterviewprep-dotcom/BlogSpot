using System.Text.Json;

namespace BlogSpot.Application.Services.SeedData;

/// <summary>
/// Helper class to load Phase 3 seed data from JSON files. Reuses Phase1BlogSeedData's shape
/// since the blog JSON schema (title/category/tags/summary/content/withPoll/poll*) is identical.
/// </summary>
public static class Phase3SeedDataLoader
{
    private static readonly string[] Phase3Categories = { "Business", "Psychology", "Food", "Geopolitics", "Philosophy" };

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
    /// Load all Phase 3 blogs from JSON files in the SeedData directory
    /// </summary>
    public static async Task<Dictionary<string, List<Phase1BlogSeedData>>> LoadPhase3BlogsAsync(string? seedDataPath = null)
    {
        seedDataPath ??= FindSeedDataDirectory();
        var result = new Dictionary<string, List<Phase1BlogSeedData>>();

        foreach (var category in Phase3Categories)
        {
            var fileName = $"phase3-{category.ToLowerInvariant()}-blogs.json";
            var filePath = Path.Combine(seedDataPath, fileName);

            if (!File.Exists(filePath))
            {
                throw new FileNotFoundException($"Phase 3 seed data file not found: {filePath}. Searched in: {seedDataPath}");
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
        var fileName = $"phase3-{category.ToLowerInvariant()}-blogs.json";
        var filePath = Path.Combine(seedDataPath, fileName);

        if (!File.Exists(filePath))
        {
            throw new FileNotFoundException($"Phase 3 seed data file not found: {filePath}. Searched in: {seedDataPath}");
        }

        var jsonContent = await File.ReadAllTextAsync(filePath);
        var blogs = JsonSerializer.Deserialize<List<Phase1BlogSeedData>>(jsonContent, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        return blogs ?? new List<Phase1BlogSeedData>();
    }

    /// <summary>
    /// Get reading list configuration for Phase 3
    /// </summary>
    public static List<(string Name, string Description, string OwnerUsername, string Category)> GetPhase3ReadingListsConfig()
    {
        return new List<(string, string, string, string)>
        {
            ("Business Innovation", "Insights on startups, leadership, and the strategies behind building lasting companies", "suresh_menon", "Business"),
            ("Mind & Behavior", "Explore the psychology behind decisions, habits, and what truly drives human behavior", "lakshmi_krishnan", "Psychology"),
            ("Culinary Journey", "A flavorful tour through global food culture, cooking science, and culinary traditions", "nikhil_joshi", "Food"),
            ("Global Politics", "Essential reads on international relations, diplomacy, and the forces shaping world power", "shreya_agarwal", "Geopolitics"),
            ("Philosophy & Wisdom", "Timeless philosophical ideas and ethical questions for understanding ourselves and the world", "rohan_malhotra", "Philosophy"),
        };
    }
}
