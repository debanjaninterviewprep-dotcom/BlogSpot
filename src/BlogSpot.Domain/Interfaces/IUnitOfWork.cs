using BlogSpot.Domain.Entities;

namespace BlogSpot.Domain.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IRepository<User> Users { get; }
    IRepository<Profile> Profiles { get; }
    IRepository<BlogPost> BlogPosts { get; }
    IRepository<Comment> Comments { get; }
    IRepository<Like> Likes { get; }
    IRepository<PostImage> PostImages { get; }
    IRepository<Reaction> Reactions { get; }
    IRepository<Bookmark> Bookmarks { get; }
    IRepository<Notification> Notifications { get; }
    IRepository<DraftBlog> Drafts { get; }
    IRepository<Tag> Tags { get; }
    IRepository<CommentLike> CommentLikes { get; }
    IRepository<EmailQueue> EmailQueues { get; }
    IRepository<OtpVerification> OtpVerifications { get; }
    IRepository<Repost> Reposts { get; }
    IRepository<ReadingList> ReadingLists { get; }
    IRepository<ReadingListItem> ReadingListItems { get; }
    IRepository<ReadingListFollow> ReadingListFollows { get; }
    IRepository<Poll> Polls { get; }
    IRepository<PollOption> PollOptions { get; }
    IRepository<PollVote> PollVotes { get; }
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
