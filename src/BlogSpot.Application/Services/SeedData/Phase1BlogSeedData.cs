using System.Text.Json.Serialization;

namespace BlogSpot.Application.Services.SeedData;

/// <summary>
/// Represents a blog post from Phase 1 seed data JSON files
/// </summary>
public class Phase1BlogSeedData
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;

    [JsonPropertyName("tags")]
    public List<string> Tags { get; set; } = new();

    [JsonPropertyName("summary")]
    public string Summary { get; set; } = string.Empty;

    [JsonPropertyName("content")]
    public string Content { get; set; } = string.Empty;

    [JsonPropertyName("withPoll")]
    public bool WithPoll { get; set; }

    [JsonPropertyName("pollQuestion")]
    public string? PollQuestion { get; set; }

    [JsonPropertyName("pollOptions")]
    public List<string>? PollOptions { get; set; }
}
