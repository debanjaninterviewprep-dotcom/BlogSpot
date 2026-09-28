namespace BlogSpot.Application.DTOs.Admin;

/// <summary>
/// DTO for deserializing Phase 1 blog data from JSON files.
/// </summary>
public class Phase1BlogDto
{
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new();
    public string Summary { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool WithPoll { get; set; } = false;
    public string? PollQuestion { get; set; }
    public List<string>? PollOptions { get; set; }
}
