using System.Text.Json;

namespace BlogSpot.Application.Services.SeedData;

/// <summary>
/// Helper class to load Phase 4 seed data from JSON files. Reuses Phase1BlogSeedData's shape
/// since the blog JSON schema (title/category/tags/summary/content/withPoll/poll*) is identical.
/// </summary>
public static class Phase4SeedDataLoader
{
    private static readonly string[] Phase4Categories = { "Society", "Mythology", "Hobbies", "Innovation", "Religion", "Parenting", "SelfImprovement", "NonDevTech", "News", "Environment" };

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
    /// Load all Phase 4 blogs from JSON files in the SeedData directory
    /// </summary>
    public static async Task<Dictionary<string, List<Phase1BlogSeedData>>> LoadPhase4BlogsAsync(string? seedDataPath = null)
    {
        seedDataPath ??= FindSeedDataDirectory();
        var result = new Dictionary<string, List<Phase1BlogSeedData>>();

        foreach (var category in Phase4Categories)
        {
            var fileName = $"phase4-{category.ToLowerInvariant()}-blogs.json";
            var filePath = Path.Combine(seedDataPath, fileName);

            if (!File.Exists(filePath))
            {
                throw new FileNotFoundException($"Phase 4 seed data file not found: {filePath}. Searched in: {seedDataPath}");
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
        var fileName = $"phase4-{category.ToLowerInvariant()}-blogs.json";
        var filePath = Path.Combine(seedDataPath, fileName);

        if (!File.Exists(filePath))
        {
            throw new FileNotFoundException($"Phase 4 seed data file not found: {filePath}. Searched in: {seedDataPath}");
        }

        var jsonContent = await File.ReadAllTextAsync(filePath);
        var blogs = JsonSerializer.Deserialize<List<Phase1BlogSeedData>>(jsonContent, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        return blogs ?? new List<Phase1BlogSeedData>();
    }

    /// <summary>
    /// Get reading list configuration for Phase 4
    /// </summary>
    public static List<(string Name, string Description, string OwnerUsername, string Category)> GetPhase4ReadingListsConfig()
    {
        return new List<(string, string, string, string)>
        {
            ("Social Change", "Essays on inequality, community, and the forces reshaping how we live together", "manish_gupta", "Society"),
            ("Myths & Legends", "Timeless stories of gods, heroes, and folklore from cultures around the world", "tanvi_shah", "Mythology"),
            ("Lifestyle & Hobbies", "Ideas and inspiration for cultivating hobbies that bring balance and joy", "ajay_kumar", "Hobbies"),
            ("Innovation Hub", "Stories of invention, patents, and the people who shaped how we innovate", "riya_chakraborty", "Innovation"),
            ("Religious Wisdom", "Exploring faith, ritual, and the shared questions behind the world's religions", "sanjay_pillai", "Religion"),
            ("Family & Parenting", "Practical, research-backed insights for raising children in a changing world", "meera_rajput", "Parenting"),
            ("Personal Growth", "Tools and ideas for building focus, confidence, and lasting personal change", "deepak_nambiar", "SelfImprovement"),
            ("Tech for Everyone", "Everyday technology, gadgets, and digital life beyond the world of software", "neha_trivedi", "NonDevTech"),
            ("Current Affairs", "Perspectives on media, journalism, and how we make sense of the news", "aakash_mishra", "News"),
            ("Environmental Action", "Climate, conservation, and the systems shaping our planet's future", "ishita_banerjee", "Environment"),
        };
    }
}
