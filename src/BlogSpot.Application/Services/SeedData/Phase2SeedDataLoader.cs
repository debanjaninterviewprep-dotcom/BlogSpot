using System.Text.Json;

namespace BlogSpot.Application.Services.SeedData;

/// <summary>
/// Helper class to load Phase 2 seed data from JSON files. Reuses Phase1BlogSeedData's shape
/// since the blog JSON schema (title/category/tags/summary/content/withPoll/poll*) is identical.
/// </summary>
public static class Phase2SeedDataLoader
{
    private static readonly string[] Phase2Categories = { "History", "Economics", "Nature", "Education", "Art" };

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
    /// Load all Phase 2 blogs from JSON files in the SeedData directory
    /// </summary>
    public static async Task<Dictionary<string, List<Phase1BlogSeedData>>> LoadPhase2BlogsAsync(string? seedDataPath = null)
    {
        seedDataPath ??= FindSeedDataDirectory();
        var result = new Dictionary<string, List<Phase1BlogSeedData>>();

        foreach (var category in Phase2Categories)
        {
            var fileName = $"phase2-{category.ToLowerInvariant()}-blogs.json";
            var filePath = Path.Combine(seedDataPath, fileName);

            if (!File.Exists(filePath))
            {
                throw new FileNotFoundException($"Phase 2 seed data file not found: {filePath}. Searched in: {seedDataPath}");
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
        var fileName = $"phase2-{category.ToLowerInvariant()}-blogs.json";
        var filePath = Path.Combine(seedDataPath, fileName);

        if (!File.Exists(filePath))
        {
            throw new FileNotFoundException($"Phase 2 seed data file not found: {filePath}. Searched in: {seedDataPath}");
        }

        var jsonContent = await File.ReadAllTextAsync(filePath);
        var blogs = JsonSerializer.Deserialize<List<Phase1BlogSeedData>>(jsonContent, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        return blogs ?? new List<Phase1BlogSeedData>();
    }

    /// <summary>
    /// Get reading list configuration for Phase 2
    /// </summary>
    public static List<(string Name, string Description, string OwnerUsername, string Category)> GetPhase2ReadingListsConfig()
    {
        return new List<(string, string, string, string)>
        {
            ("History Chronicles", "A curated journey through pivotal moments, empires, and turning points that shaped human history", "divya_nair", "History"),
            ("Finance & Investment", "Essential reads on economics, markets, and personal finance for building financial literacy", "vikram_reddy", "Economics"),
            ("Wildlife & Conservation", "Explore the natural world's most fascinating creatures and the fight to protect their habitats", "ananya_singh", "Nature"),
            ("Learning Pathways", "Insights on how we learn, teach, and build a lifelong habit of continuous education", "karthik_rajan", "Education"),
            ("Arts & Creativity", "Celebrating literature, painting, and creative movements that shaped culture across the ages", "pooja_desai", "Art"),
        };
    }
}
