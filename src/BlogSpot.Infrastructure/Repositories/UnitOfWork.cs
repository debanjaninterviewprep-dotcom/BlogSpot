using BlogSpot.Domain.Entities;
using BlogSpot.Domain.Interfaces;
using BlogSpot.Infrastructure.Data;

namespace BlogSpot.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private bool _disposed;

    private IRepository<User>? _users;
    private IRepository<Profile>? _profiles;
    private IRepository<BlogPost>? _blogPosts;
    private IRepository<Comment>? _comments;
    private IRepository<Like>? _likes;
    private IRepository<PostImage>? _postImages;
    private IRepository<Reaction>? _reactions;
    private IRepository<Bookmark>? _bookmarks;
    private IRepository<Notification>? _notifications;
    private IRepository<DraftBlog>? _drafts;
    private IRepository<Tag>? _tags;
    private IRepository<CommentLike>? _commentLikes;
    private IRepository<EmailQueue>? _emailQueues;
    private IRepository<OtpVerification>? _otpVerifications;
    private IRepository<Repost>? _reposts;
    private IRepository<ReadingList>? _readingLists;
    private IRepository<ReadingListItem>? _readingListItems;
    private IRepository<ReadingListFollow>? _readingListFollows;
    private IRepository<Poll>? _polls;
    private IRepository<PollOption>? _pollOptions;
    private IRepository<PollVote>? _pollVotes;

    public UnitOfWork(AppDbContext context)
    {
        _context = context;
    }

    public IRepository<User> Users
        => _users ??= new Repository<User>(_context);

    public IRepository<Profile> Profiles
        => _profiles ??= new Repository<Profile>(_context);

    public IRepository<BlogPost> BlogPosts
        => _blogPosts ??= new Repository<BlogPost>(_context);

    public IRepository<Comment> Comments
        => _comments ??= new Repository<Comment>(_context);

    public IRepository<Like> Likes
        => _likes ??= new Repository<Like>(_context);

    public IRepository<PostImage> PostImages
        => _postImages ??= new Repository<PostImage>(_context);

    public IRepository<Reaction> Reactions
        => _reactions ??= new Repository<Reaction>(_context);

    public IRepository<Bookmark> Bookmarks
        => _bookmarks ??= new Repository<Bookmark>(_context);

    public IRepository<Notification> Notifications
        => _notifications ??= new Repository<Notification>(_context);

    public IRepository<DraftBlog> Drafts
        => _drafts ??= new Repository<DraftBlog>(_context);

    public IRepository<Tag> Tags
        => _tags ??= new Repository<Tag>(_context);

    public IRepository<CommentLike> CommentLikes
        => _commentLikes ??= new Repository<CommentLike>(_context);

    public IRepository<EmailQueue> EmailQueues
        => _emailQueues ??= new Repository<EmailQueue>(_context);

    public IRepository<OtpVerification> OtpVerifications
        => _otpVerifications ??= new Repository<OtpVerification>(_context);

    public IRepository<Repost> Reposts
        => _reposts ??= new Repository<Repost>(_context);

    public IRepository<ReadingList> ReadingLists
        => _readingLists ??= new Repository<ReadingList>(_context);

    public IRepository<ReadingListItem> ReadingListItems
        => _readingListItems ??= new Repository<ReadingListItem>(_context);

    public IRepository<ReadingListFollow> ReadingListFollows
        => _readingListFollows ??= new Repository<ReadingListFollow>(_context);

    public IRepository<Poll> Polls
        => _polls ??= new Repository<Poll>(_context);

    public IRepository<PollOption> PollOptions
        => _pollOptions ??= new Repository<PollOption>(_context);

    public IRepository<PollVote> PollVotes
        => _pollVotes ??= new Repository<PollVote>(_context);

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
        => await _context.SaveChangesAsync(ct);

    public void Dispose()
    {
        if (!_disposed)
        {
            _context.Dispose();
            _disposed = true;
        }
        GC.SuppressFinalize(this);
    }
}
