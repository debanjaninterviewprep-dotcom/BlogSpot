using BlogSpot.Domain.Common;

namespace BlogSpot.Domain.Entities;

/// <summary>
/// One selectable answer within a Poll.
/// </summary>
public class PollOption : BaseEntity
{
    public string Text { get; set; } = string.Empty;
    public int SortOrder { get; set; }

    // Foreign key
    public Guid PollId { get; set; }
    public Poll Poll { get; set; } = null!;

    public ICollection<PollVote> Votes { get; set; } = new List<PollVote>();
}
