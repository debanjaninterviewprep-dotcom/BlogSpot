-- =============================================
-- BlogSpot Database - Full Setup Script
-- Run this in SSMS or Azure Data Studio
-- =============================================

-- 1. CREATE DATABASE
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'BlogSpotDb')
BEGIN
    CREATE DATABASE [BlogSpotDb];
END
GO

USE [BlogSpotDb];
GO

-- =============================================
-- 2. TABLES
-- =============================================

-- Users
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE [dbo].[Users]
    (
        [Id]                 UNIQUEIDENTIFIER   NOT NULL DEFAULT NEWSEQUENTIALID(),
        [UserName]           NVARCHAR(50)       NOT NULL,
        [NormalizedUserName] NVARCHAR(50)       NOT NULL,
        [Email]              NVARCHAR(256)      NOT NULL,
        [NormalizedEmail]    NVARCHAR(256)      NOT NULL,
        [PasswordHash]       NVARCHAR(MAX)      NOT NULL,
        [Role]               NVARCHAR(20)       NOT NULL DEFAULT 'User',
        [RefreshToken]       NVARCHAR(512)      NULL,
        [RefreshTokenExpiry] DATETIME2          NULL,
        [IsActive]           BIT                NOT NULL DEFAULT 1,
        [IsBanned]           BIT                NOT NULL DEFAULT 0,
        [BanReason]          NVARCHAR(500)      NULL,
        [EmailConfirmed]     BIT                NOT NULL DEFAULT 0,
        [LockoutEnd]         DATETIMEOFFSET     NULL,
        [AccessFailedCount]  INT                NOT NULL DEFAULT 0,
        [CreatedAt]          DATETIME2          NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt]          DATETIME2          NULL,
        [LastLoginAt]        DATETIME2          NULL,

        CONSTRAINT [PK_Users] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [UQ_Users_UserName] UNIQUE ([NormalizedUserName]),
        CONSTRAINT [UQ_Users_Email] UNIQUE ([NormalizedEmail]),
        CONSTRAINT [CK_Users_Role] CHECK ([Role] IN ('Admin', 'User'))
    );

    CREATE NONCLUSTERED INDEX [IX_Users_Email] ON [dbo].[Users]([NormalizedEmail]);
    CREATE NONCLUSTERED INDEX [IX_Users_UserName] ON [dbo].[Users]([NormalizedUserName]);
    CREATE NONCLUSTERED INDEX [IX_Users_IsActive] ON [dbo].[Users]([IsActive]) INCLUDE ([UserName], [Email]);
END
GO

-- UserProfiles
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserProfiles')
BEGIN
    CREATE TABLE [dbo].[UserProfiles]
    (
        [Id]                UNIQUEIDENTIFIER   NOT NULL DEFAULT NEWSEQUENTIALID(),
        [UserId]            UNIQUEIDENTIFIER   NOT NULL,
        [FirstName]         NVARCHAR(100)      NULL,
        [LastName]          NVARCHAR(100)      NULL,
        [DisplayName]       NVARCHAR(100)      NULL,
        [Bio]               NVARCHAR(1000)     NULL,
        [ProfilePictureUrl] NVARCHAR(500)      NULL,
        [CoverPhotoUrl]     NVARCHAR(500)      NULL,
        [Website]           NVARCHAR(256)      NULL,
        [Location]          NVARCHAR(200)      NULL,
        [DateOfBirth]       DATE               NULL,
        [FollowerCount]     INT                NOT NULL DEFAULT 0,
        [FollowingCount]    INT                NOT NULL DEFAULT 0,
        [PostCount]         INT                NOT NULL DEFAULT 0,
        [CreatedAt]         DATETIME2          NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt]         DATETIME2          NULL,

        CONSTRAINT [PK_UserProfiles] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_UserProfiles_Users] FOREIGN KEY ([UserId])
            REFERENCES [dbo].[Users]([Id]) ON DELETE CASCADE,
        CONSTRAINT [UQ_UserProfiles_UserId] UNIQUE ([UserId])
    );
END
GO

-- BlogPosts
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'BlogPosts')
BEGIN
    CREATE TABLE [dbo].[BlogPosts]
    (
        [Id]               UNIQUEIDENTIFIER   NOT NULL DEFAULT NEWSEQUENTIALID(),
        [AuthorId]         UNIQUEIDENTIFIER   NOT NULL,
        [Title]            NVARCHAR(300)      NOT NULL,
        [Slug]             NVARCHAR(350)      NOT NULL,
        [Content]          NVARCHAR(MAX)      NOT NULL,
        [Excerpt]          NVARCHAR(500)      NULL,
        [FeaturedImageUrl] NVARCHAR(500)      NULL,
        [Status]           NVARCHAR(20)       NOT NULL DEFAULT 'Draft',
        [LikeCount]        INT                NOT NULL DEFAULT 0,
        [CommentCount]     INT                NOT NULL DEFAULT 0,
        [ViewCount]        BIGINT             NOT NULL DEFAULT 0,
        [IsModerated]      BIT                NOT NULL DEFAULT 0,
        [ModeratedBy]      UNIQUEIDENTIFIER   NULL,
        [ModeratedAt]      DATETIME2          NULL,
        [ModerationReason] NVARCHAR(500)      NULL,
        [PublishedAt]      DATETIME2          NULL,
        [CreatedAt]        DATETIME2          NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt]        DATETIME2          NULL,

        CONSTRAINT [PK_BlogPosts] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_BlogPosts_Users] FOREIGN KEY ([AuthorId])
            REFERENCES [dbo].[Users]([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_BlogPosts_Moderator] FOREIGN KEY ([ModeratedBy])
            REFERENCES [dbo].[Users]([Id]) ON DELETE NO ACTION,
        CONSTRAINT [UQ_BlogPosts_Slug] UNIQUE ([Slug]),
        CONSTRAINT [CK_BlogPosts_Status] CHECK ([Status] IN ('Draft','Published','Archived','Removed'))
    );

    CREATE NONCLUSTERED INDEX [IX_BlogPosts_AuthorId] ON [dbo].[BlogPosts]([AuthorId])
        INCLUDE ([Title], [Slug], [Status], [PublishedAt]);
    CREATE NONCLUSTERED INDEX [IX_BlogPosts_Slug] ON [dbo].[BlogPosts]([Slug]);
    CREATE NONCLUSTERED INDEX [IX_BlogPosts_Status_PublishedAt] ON [dbo].[BlogPosts]([Status], [PublishedAt] DESC)
        INCLUDE ([AuthorId], [Title], [LikeCount], [ViewCount]);
    CREATE NONCLUSTERED INDEX [IX_BlogPosts_Trending] ON [dbo].[BlogPosts]([Status], [LikeCount] DESC, [ViewCount] DESC)
        WHERE [Status] = 'Published';
END
GO

-- PostImages
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PostImages')
BEGIN
    CREATE TABLE [dbo].[PostImages]
    (
        [Id]            UNIQUEIDENTIFIER   NOT NULL DEFAULT NEWSEQUENTIALID(),
        [BlogPostId]    UNIQUEIDENTIFIER   NOT NULL,
        [ImageUrl]      NVARCHAR(500)      NOT NULL,
        [ThumbnailUrl]  NVARCHAR(500)      NULL,
        [AltText]       NVARCHAR(300)      NULL,
        [SortOrder]     INT                NOT NULL DEFAULT 0,
        [FileSizeBytes] BIGINT             NULL,
        [ContentType]   NVARCHAR(100)      NULL,
        [CreatedAt]     DATETIME2          NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT [PK_PostImages] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_PostImages_BlogPosts] FOREIGN KEY ([BlogPostId])
            REFERENCES [dbo].[BlogPosts]([Id]) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX [IX_PostImages_BlogPostId] ON [dbo].[PostImages]([BlogPostId])
        INCLUDE ([ImageUrl], [SortOrder]);
END
GO

-- Tags
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tags')
BEGIN
    CREATE TABLE [dbo].[Tags]
    (
        [Id]             UNIQUEIDENTIFIER   NOT NULL DEFAULT NEWSEQUENTIALID(),
        [Name]           NVARCHAR(50)       NOT NULL,
        [NormalizedName] NVARCHAR(50)       NOT NULL,
        [PostCount]      INT                NOT NULL DEFAULT 0,
        [CreatedAt]      DATETIME2          NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT [PK_Tags] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [UQ_Tags_NormalizedName] UNIQUE ([NormalizedName])
    );
END
GO

-- PostTags (Junction)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PostTags')
BEGIN
    CREATE TABLE [dbo].[PostTags]
    (
        [BlogPostId]    UNIQUEIDENTIFIER   NOT NULL,
        [TagId]         UNIQUEIDENTIFIER   NOT NULL,

        CONSTRAINT [PK_PostTags] PRIMARY KEY CLUSTERED ([BlogPostId], [TagId]),
        CONSTRAINT [FK_PostTags_BlogPosts] FOREIGN KEY ([BlogPostId])
            REFERENCES [dbo].[BlogPosts]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_PostTags_Tags] FOREIGN KEY ([TagId])
            REFERENCES [dbo].[Tags]([Id]) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX [IX_PostTags_TagId] ON [dbo].[PostTags]([TagId]);
END
GO

-- Comments
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Comments')
BEGIN
    CREATE TABLE [dbo].[Comments]
    (
        [Id]               UNIQUEIDENTIFIER   NOT NULL DEFAULT NEWSEQUENTIALID(),
        [BlogPostId]       UNIQUEIDENTIFIER   NOT NULL,
        [UserId]           UNIQUEIDENTIFIER   NOT NULL,
        [ParentCommentId]  UNIQUEIDENTIFIER   NULL,
        [Content]          NVARCHAR(2000)     NOT NULL,
        [LikeCount]        INT                NOT NULL DEFAULT 0,
        [IsEdited]         BIT                NOT NULL DEFAULT 0,
        [IsModerated]      BIT                NOT NULL DEFAULT 0,
        [ModeratedBy]      UNIQUEIDENTIFIER   NULL,
        [ModeratedAt]      DATETIME2          NULL,
        [ModerationReason] NVARCHAR(500)      NULL,
        [IsDeleted]        BIT                NOT NULL DEFAULT 0,
        [CreatedAt]        DATETIME2          NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt]        DATETIME2          NULL,

        CONSTRAINT [PK_Comments] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_Comments_BlogPosts] FOREIGN KEY ([BlogPostId])
            REFERENCES [dbo].[BlogPosts]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Comments_Users] FOREIGN KEY ([UserId])
            REFERENCES [dbo].[Users]([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Comments_Parent] FOREIGN KEY ([ParentCommentId])
            REFERENCES [dbo].[Comments]([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Comments_Moderator] FOREIGN KEY ([ModeratedBy])
            REFERENCES [dbo].[Users]([Id]) ON DELETE NO ACTION
    );

    CREATE NONCLUSTERED INDEX [IX_Comments_BlogPostId] ON [dbo].[Comments]([BlogPostId], [CreatedAt])
        INCLUDE ([UserId], [Content], [IsDeleted]);
    CREATE NONCLUSTERED INDEX [IX_Comments_UserId] ON [dbo].[Comments]([UserId]);
    CREATE NONCLUSTERED INDEX [IX_Comments_ParentId] ON [dbo].[Comments]([ParentCommentId])
        WHERE [ParentCommentId] IS NOT NULL;
END
GO

-- Likes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Likes')
BEGIN
    CREATE TABLE [dbo].[Likes]
    (
        [Id]         UNIQUEIDENTIFIER   NOT NULL DEFAULT NEWSEQUENTIALID(),
        [UserId]     UNIQUEIDENTIFIER   NOT NULL,
        [BlogPostId] UNIQUEIDENTIFIER   NULL,
        [CommentId]  UNIQUEIDENTIFIER   NULL,
        [CreatedAt]  DATETIME2          NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT [PK_Likes] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_Likes_Users] FOREIGN KEY ([UserId])
            REFERENCES [dbo].[Users]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Likes_BlogPosts] FOREIGN KEY ([BlogPostId])
            REFERENCES [dbo].[BlogPosts]([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Likes_Comments] FOREIGN KEY ([CommentId])
            REFERENCES [dbo].[Comments]([Id]) ON DELETE NO ACTION,
        CONSTRAINT [CK_Likes_Target] CHECK (
            ([BlogPostId] IS NOT NULL AND [CommentId] IS NULL) OR
            ([BlogPostId] IS NULL AND [CommentId] IS NOT NULL)
        )
    );

    CREATE UNIQUE NONCLUSTERED INDEX [UQ_Likes_User_Post]
        ON [dbo].[Likes]([UserId], [BlogPostId])
        WHERE [BlogPostId] IS NOT NULL;
    CREATE UNIQUE NONCLUSTERED INDEX [UQ_Likes_User_Comment]
        ON [dbo].[Likes]([UserId], [CommentId])
        WHERE [CommentId] IS NOT NULL;
    CREATE NONCLUSTERED INDEX [IX_Likes_BlogPostId] ON [dbo].[Likes]([BlogPostId])
        WHERE [BlogPostId] IS NOT NULL;
    CREATE NONCLUSTERED INDEX [IX_Likes_CommentId] ON [dbo].[Likes]([CommentId])
        WHERE [CommentId] IS NOT NULL;
END
GO

-- Follows
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Follows')
BEGIN
    CREATE TABLE [dbo].[Follows]
    (
        [Id]          UNIQUEIDENTIFIER   NOT NULL DEFAULT NEWSEQUENTIALID(),
        [FollowerId]  UNIQUEIDENTIFIER   NOT NULL,
        [FollowingId] UNIQUEIDENTIFIER   NOT NULL,
        [CreatedAt]   DATETIME2          NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT [PK_Follows] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_Follows_Follower] FOREIGN KEY ([FollowerId])
            REFERENCES [dbo].[Users]([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Follows_Following] FOREIGN KEY ([FollowingId])
            REFERENCES [dbo].[Users]([Id]) ON DELETE NO ACTION,
        CONSTRAINT [CK_Follows_NoSelfFollow] CHECK ([FollowerId] <> [FollowingId])
    );

    CREATE UNIQUE NONCLUSTERED INDEX [UQ_Follows_Pair]
        ON [dbo].[Follows]([FollowerId], [FollowingId]);
    CREATE NONCLUSTERED INDEX [IX_Follows_FollowerId] ON [dbo].[Follows]([FollowerId])
        INCLUDE ([FollowingId], [CreatedAt]);
    CREATE NONCLUSTERED INDEX [IX_Follows_FollowingId] ON [dbo].[Follows]([FollowingId])
        INCLUDE ([FollowerId], [CreatedAt]);
END
GO

-- Notifications
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
BEGIN
    CREATE TABLE [dbo].[Notifications]
    (
        [Id]             UNIQUEIDENTIFIER   NOT NULL DEFAULT NEWSEQUENTIALID(),
        [UserId]         UNIQUEIDENTIFIER   NOT NULL,
        [ActorId]        UNIQUEIDENTIFIER   NOT NULL,
        [Type]           NVARCHAR(30)       NOT NULL,
        [ReferenceId]    UNIQUEIDENTIFIER   NULL,
        [ReferenceType]  NVARCHAR(30)       NULL,
        [Message]        NVARCHAR(500)      NOT NULL,
        [IsRead]         BIT                NOT NULL DEFAULT 0,
        [CreatedAt]      DATETIME2          NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT [PK_Notifications] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_Notifications_User] FOREIGN KEY ([UserId])
            REFERENCES [dbo].[Users]([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Notifications_Actor] FOREIGN KEY ([ActorId])
            REFERENCES [dbo].[Users]([Id]) ON DELETE NO ACTION,
        CONSTRAINT [CK_Notifications_Type] CHECK ([Type] IN ('Like','Comment','Follow','PostPublished','Moderation'))
    );

    CREATE NONCLUSTERED INDEX [IX_Notifications_UserId] ON [dbo].[Notifications]([UserId], [IsRead], [CreatedAt] DESC);
END
GO

-- =============================================
-- 2B. NEW TABLES & COLUMNS (v2 Upgrade)
-- =============================================

-- Add new columns to BlogPosts
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BlogPosts') AND name = 'IsDraft')
BEGIN
    ALTER TABLE [dbo].[BlogPosts] ADD [IsDraft] BIT NOT NULL DEFAULT 0;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BlogPosts') AND name = 'ReadingTimeMinutes')
BEGIN
    ALTER TABLE [dbo].[BlogPosts] ADD [ReadingTimeMinutes] INT NOT NULL DEFAULT 0;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BlogPosts') AND name = 'Category')
BEGIN
    ALTER TABLE [dbo].[BlogPosts] ADD [Category] NVARCHAR(100) NULL;
END
GO

-- Add new columns to UserProfiles
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.UserProfiles') AND name = 'SocialLinks')
BEGIN
    ALTER TABLE [dbo].[UserProfiles] ADD [SocialLinks] NVARCHAR(MAX) NULL;  -- JSON: {"github":"...","twitter":"...","linkedin":"..."}
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.UserProfiles') AND name = 'Skills')
BEGIN
    ALTER TABLE [dbo].[UserProfiles] ADD [Skills] NVARCHAR(1000) NULL;  -- Comma-separated: "C#,Angular,SQL"
END
GO

-- Reactions (emoji reactions: Like, Love, Fire, Clap)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Reactions')
BEGIN
    CREATE TABLE [dbo].[Reactions]
    (
        [Id]         UNIQUEIDENTIFIER   NOT NULL DEFAULT NEWSEQUENTIALID(),
        [UserId]     UNIQUEIDENTIFIER   NOT NULL,
        [BlogPostId] UNIQUEIDENTIFIER   NOT NULL,
        [Type]       INT                NOT NULL,  -- 0=Like, 1=Love, 2=Fire, 3=Clap
        [CreatedAt]  DATETIME2          NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt]  DATETIME2          NULL,

        CONSTRAINT [PK_Reactions] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_Reactions_Users] FOREIGN KEY ([UserId])
            REFERENCES [dbo].[Users]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Reactions_BlogPosts] FOREIGN KEY ([BlogPostId])
            REFERENCES [dbo].[BlogPosts]([Id]) ON DELETE CASCADE,
        CONSTRAINT [CK_Reactions_Type] CHECK ([Type] IN (0, 1, 2, 3))
    );

    CREATE UNIQUE NONCLUSTERED INDEX [UQ_Reactions_User_Post_Type]
        ON [dbo].[Reactions]([UserId], [BlogPostId], [Type]);
    CREATE NONCLUSTERED INDEX [IX_Reactions_BlogPostId] ON [dbo].[Reactions]([BlogPostId]);
END
GO

-- Bookmarks (saved posts)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Bookmarks')
BEGIN
    CREATE TABLE [dbo].[Bookmarks]
    (
        [Id]         UNIQUEIDENTIFIER   NOT NULL DEFAULT NEWSEQUENTIALID(),
        [UserId]     UNIQUEIDENTIFIER   NOT NULL,
        [BlogPostId] UNIQUEIDENTIFIER   NOT NULL,
        [CreatedAt]  DATETIME2          NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt]  DATETIME2          NULL,

        CONSTRAINT [PK_Bookmarks] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_Bookmarks_Users] FOREIGN KEY ([UserId])
            REFERENCES [dbo].[Users]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Bookmarks_BlogPosts] FOREIGN KEY ([BlogPostId])
            REFERENCES [dbo].[BlogPosts]([Id]) ON DELETE CASCADE
    );

    CREATE UNIQUE NONCLUSTERED INDEX [UQ_Bookmarks_User_Post]
        ON [dbo].[Bookmarks]([UserId], [BlogPostId]);
    CREATE NONCLUSTERED INDEX [IX_Bookmarks_UserId] ON [dbo].[Bookmarks]([UserId], [CreatedAt] DESC);
END
GO

-- DraftBlogs (auto-save drafts)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DraftBlogs')
BEGIN
    CREATE TABLE [dbo].[DraftBlogs]
    (
        [Id]         UNIQUEIDENTIFIER   NOT NULL DEFAULT NEWSEQUENTIALID(),
        [UserId]     UNIQUEIDENTIFIER   NOT NULL,
        [BlogPostId] UNIQUEIDENTIFIER   NULL,  -- If editing an existing post
        [Title]      NVARCHAR(300)      NOT NULL DEFAULT '',
        [Content]    NVARCHAR(MAX)      NOT NULL DEFAULT '',
        [Category]   NVARCHAR(100)      NULL,
        [Tags]       NVARCHAR(500)      NULL,  -- Comma-separated
        [CreatedAt]  DATETIME2          NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt]  DATETIME2          NULL,

        CONSTRAINT [PK_DraftBlogs] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_DraftBlogs_Users] FOREIGN KEY ([UserId])
            REFERENCES [dbo].[Users]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_DraftBlogs_BlogPosts] FOREIGN KEY ([BlogPostId])
            REFERENCES [dbo].[BlogPosts]([Id]) ON DELETE SET NULL
    );

    CREATE NONCLUSTERED INDEX [IX_DraftBlogs_UserId] ON [dbo].[DraftBlogs]([UserId], [UpdatedAt] DESC);
END
GO

-- Update Notifications Type constraint to include Reaction
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Notifications_Type')
BEGIN
    ALTER TABLE [dbo].[Notifications] DROP CONSTRAINT [CK_Notifications_Type];
    ALTER TABLE [dbo].[Notifications] ADD CONSTRAINT [CK_Notifications_Type]
        CHECK ([Type] IN ('Like','Comment','Follow','PostPublished','Moderation','Reaction'));
END
GO

-- AuditLogs
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditLogs')
BEGIN
    CREATE TABLE [dbo].[AuditLogs]
    (
        [Id]         BIGINT IDENTITY(1,1) NOT NULL,
        [UserId]     UNIQUEIDENTIFIER     NULL,
        [Action]     NVARCHAR(100)        NOT NULL,
        [EntityType] NVARCHAR(50)         NOT NULL,
        [EntityId]   NVARCHAR(50)         NULL,
        [OldValues]  NVARCHAR(MAX)        NULL,
        [NewValues]  NVARCHAR(MAX)        NULL,
        [IpAddress]  NVARCHAR(45)         NULL,
        [UserAgent]  NVARCHAR(500)        NULL,
        [CreatedAt]  DATETIME2            NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT [PK_AuditLogs] PRIMARY KEY CLUSTERED ([Id])
    );

    CREATE NONCLUSTERED INDEX [IX_AuditLogs_UserId] ON [dbo].[AuditLogs]([UserId], [CreatedAt] DESC);
    CREATE NONCLUSTERED INDEX [IX_AuditLogs_EntityType] ON [dbo].[AuditLogs]([EntityType], [EntityId]);
END
GO

-- =============================================
-- 3. SEED DATA - Admin User
-- Password: Admin@123 (BCrypt hash)
-- =============================================
IF NOT EXISTS (SELECT 1 FROM [dbo].[Users] WHERE [NormalizedEmail] = 'ADMIN@BLOGSPOT.COM')
BEGIN
    DECLARE @AdminId UNIQUEIDENTIFIER = '00000000-0000-0000-0000-000000000001';
    DECLARE @ProfileId UNIQUEIDENTIFIER = '00000000-0000-0000-0000-000000000002';

    INSERT INTO [dbo].[Users] ([Id], [UserName], [NormalizedUserName], [Email], [NormalizedEmail],
        [PasswordHash], [Role], [IsActive], [EmailConfirmed], [CreatedAt])
    VALUES (@AdminId, 'admin', 'ADMIN', 'admin@blogspot.com', 'ADMIN@BLOGSPOT.COM',
        -- BCrypt hash of 'Admin@123' - REPLACE with actual hash from your app on first run
        '$2a$11$placeholder.hash.replace.with.real.one.from.app',
        'Admin', 1, 1, SYSUTCDATETIME());

    INSERT INTO [dbo].[UserProfiles] ([Id], [UserId], [DisplayName], [Bio], [CreatedAt])
    VALUES (@ProfileId, @AdminId, 'Administrator', 'System Administrator', SYSUTCDATETIME());

    PRINT 'Admin user seeded successfully.';
END
GO

-- =============================================
-- 4. STORED PROCEDURES
-- =============================================

-- SP: Get Home Feed
CREATE OR ALTER PROCEDURE [dbo].[sp_GetHomeFeed]
    @UserId     UNIQUEIDENTIFIER,
    @PageNumber INT = 1,
    @PageSize   INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

    WITH FeedPosts AS
    (
        SELECT
            bp.[Id], bp.[AuthorId], bp.[Title], bp.[Slug], bp.[Excerpt],
            bp.[FeaturedImageUrl], bp.[LikeCount], bp.[CommentCount],
            bp.[ViewCount], bp.[PublishedAt], bp.[CreatedAt],
            u.[UserName] AS AuthorUserName,
            up.[DisplayName] AS AuthorDisplayName,
            up.[ProfilePictureUrl] AS AuthorAvatar,
            1 AS FeedType,
            CASE WHEN EXISTS (SELECT 1 FROM [dbo].[Likes] l WHERE l.[BlogPostId] = bp.[Id] AND l.[UserId] = @UserId)
                THEN 1 ELSE 0 END AS IsLikedByCurrentUser
        FROM [dbo].[BlogPosts] bp
        INNER JOIN [dbo].[Follows] f ON f.[FollowingId] = bp.[AuthorId]
        INNER JOIN [dbo].[Users] u ON u.[Id] = bp.[AuthorId]
        LEFT JOIN [dbo].[UserProfiles] up ON up.[UserId] = bp.[AuthorId]
        WHERE f.[FollowerId] = @UserId AND bp.[Status] = 'Published'

        UNION

        SELECT
            bp.[Id], bp.[AuthorId], bp.[Title], bp.[Slug], bp.[Excerpt],
            bp.[FeaturedImageUrl], bp.[LikeCount], bp.[CommentCount],
            bp.[ViewCount], bp.[PublishedAt], bp.[CreatedAt],
            u.[UserName] AS AuthorUserName,
            up.[DisplayName] AS AuthorDisplayName,
            up.[ProfilePictureUrl] AS AuthorAvatar,
            2 AS FeedType,
            CASE WHEN EXISTS (SELECT 1 FROM [dbo].[Likes] l WHERE l.[BlogPostId] = bp.[Id] AND l.[UserId] = @UserId)
                THEN 1 ELSE 0 END AS IsLikedByCurrentUser
        FROM [dbo].[BlogPosts] bp
        INNER JOIN [dbo].[Users] u ON u.[Id] = bp.[AuthorId]
        LEFT JOIN [dbo].[UserProfiles] up ON up.[UserId] = bp.[AuthorId]
        WHERE bp.[Status] = 'Published'
          AND bp.[PublishedAt] >= DATEADD(DAY, -7, SYSUTCDATETIME())
          AND NOT EXISTS (SELECT 1 FROM [dbo].[Follows] f WHERE f.[FollowerId] = @UserId AND f.[FollowingId] = bp.[AuthorId])
          AND bp.[AuthorId] <> @UserId
    )
    SELECT *, COUNT(*) OVER() AS TotalCount
    FROM FeedPosts
    ORDER BY FeedType ASC, [PublishedAt] DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- SP: Get Trending Posts
CREATE OR ALTER PROCEDURE [dbo].[sp_GetTrendingPosts]
    @DaysBack INT = 7,
    @TopN     INT = 50
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (@TopN)
        bp.[Id], bp.[AuthorId], bp.[Title], bp.[Slug], bp.[Excerpt],
        bp.[FeaturedImageUrl], bp.[LikeCount], bp.[CommentCount],
        bp.[ViewCount], bp.[PublishedAt],
        u.[UserName] AS AuthorUserName,
        up.[DisplayName] AS AuthorDisplayName,
        up.[ProfilePictureUrl] AS AuthorAvatar,
        (bp.[LikeCount] * 3.0 + bp.[CommentCount] * 5.0 + bp.[ViewCount] * 0.1)
        / POWER(DATEDIFF(HOUR, bp.[PublishedAt], SYSUTCDATETIME()) + 2, 1.5) AS TrendingScore
    FROM [dbo].[BlogPosts] bp
    INNER JOIN [dbo].[Users] u ON u.[Id] = bp.[AuthorId]
    LEFT JOIN [dbo].[UserProfiles] up ON up.[UserId] = bp.[AuthorId]
    WHERE bp.[Status] = 'Published'
      AND bp.[PublishedAt] >= DATEADD(DAY, -@DaysBack, SYSUTCDATETIME())
      AND u.[IsActive] = 1 AND u.[IsBanned] = 0
    ORDER BY TrendingScore DESC;
END;
GO

-- SP: Toggle Post Like
CREATE OR ALTER PROCEDURE [dbo].[sp_TogglePostLike]
    @UserId     UNIQUEIDENTIFIER,
    @BlogPostId UNIQUEIDENTIFIER,
    @IsLiked    BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRANSACTION;
        IF EXISTS (SELECT 1 FROM [dbo].[Likes] WHERE [UserId] = @UserId AND [BlogPostId] = @BlogPostId)
        BEGIN
            DELETE FROM [dbo].[Likes] WHERE [UserId] = @UserId AND [BlogPostId] = @BlogPostId;
            UPDATE [dbo].[BlogPosts]
            SET [LikeCount] = CASE WHEN [LikeCount] > 0 THEN [LikeCount] - 1 ELSE 0 END,
                [UpdatedAt] = SYSUTCDATETIME()
            WHERE [Id] = @BlogPostId;
            SET @IsLiked = 0;
        END
        ELSE
        BEGIN
            INSERT INTO [dbo].[Likes] ([UserId], [BlogPostId]) VALUES (@UserId, @BlogPostId);
            UPDATE [dbo].[BlogPosts]
            SET [LikeCount] = [LikeCount] + 1, [UpdatedAt] = SYSUTCDATETIME()
            WHERE [Id] = @BlogPostId;
            SET @IsLiked = 1;
        END
    COMMIT TRANSACTION;
END;
GO

-- SP: Toggle Follow
CREATE OR ALTER PROCEDURE [dbo].[sp_ToggleFollow]
    @FollowerId  UNIQUEIDENTIFIER,
    @FollowingId UNIQUEIDENTIFIER,
    @IsFollowing BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @FollowerId = @FollowingId
    BEGIN
        RAISERROR('Cannot follow yourself.', 16, 1);
        RETURN;
    END

    BEGIN TRANSACTION;
        IF EXISTS (SELECT 1 FROM [dbo].[Follows] WHERE [FollowerId] = @FollowerId AND [FollowingId] = @FollowingId)
        BEGIN
            DELETE FROM [dbo].[Follows] WHERE [FollowerId] = @FollowerId AND [FollowingId] = @FollowingId;
            UPDATE [dbo].[UserProfiles] SET [FollowingCount] = CASE WHEN [FollowingCount] > 0 THEN [FollowingCount] - 1 ELSE 0 END WHERE [UserId] = @FollowerId;
            UPDATE [dbo].[UserProfiles] SET [FollowerCount] = CASE WHEN [FollowerCount] > 0 THEN [FollowerCount] - 1 ELSE 0 END WHERE [UserId] = @FollowingId;
            SET @IsFollowing = 0;
        END
        ELSE
        BEGIN
            INSERT INTO [dbo].[Follows] ([FollowerId], [FollowingId]) VALUES (@FollowerId, @FollowingId);
            UPDATE [dbo].[UserProfiles] SET [FollowingCount] = [FollowingCount] + 1 WHERE [UserId] = @FollowerId;
            UPDATE [dbo].[UserProfiles] SET [FollowerCount] = [FollowerCount] + 1 WHERE [UserId] = @FollowingId;
            SET @IsFollowing = 1;
        END
    COMMIT TRANSACTION;
END;
GO

-- SP: Admin Dashboard Stats
CREATE OR ALTER PROCEDURE [dbo].[sp_GetAdminDashboardStats]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        (SELECT COUNT(*) FROM [dbo].[Users])                                                           AS TotalUsers,
        (SELECT COUNT(*) FROM [dbo].[Users] WHERE [IsActive] = 1)                                      AS ActiveUsers,
        (SELECT COUNT(*) FROM [dbo].[Users] WHERE [IsBanned] = 1)                                      AS BannedUsers,
        (SELECT COUNT(*) FROM [dbo].[Users] WHERE [CreatedAt] >= DATEADD(DAY, -30, SYSUTCDATETIME()))   AS NewUsersLast30Days,
        (SELECT COUNT(*) FROM [dbo].[BlogPosts])                                                        AS TotalPosts,
        (SELECT COUNT(*) FROM [dbo].[BlogPosts] WHERE [Status] = 'Published')                           AS PublishedPosts,
        (SELECT COUNT(*) FROM [dbo].[BlogPosts] WHERE [Status] = 'Removed')                             AS RemovedPosts,
        (SELECT COUNT(*) FROM [dbo].[BlogPosts] WHERE [CreatedAt] >= DATEADD(DAY, -30, SYSUTCDATETIME())) AS NewPostsLast30Days,
        (SELECT COUNT(*) FROM [dbo].[Comments])                                                         AS TotalComments,
        (SELECT COUNT(*) FROM [dbo].[Comments] WHERE [IsModerated] = 1)                                 AS ModeratedComments,
        (SELECT COUNT(*) FROM [dbo].[Likes])                                                            AS TotalLikes,
        (SELECT COUNT(*) FROM [dbo].[Follows])                                                          AS TotalFollows;
END;
GO

-- SP: Moderate Post
CREATE OR ALTER PROCEDURE [dbo].[sp_ModeratePost]
    @PostId      UNIQUEIDENTIFIER,
    @ModeratorId UNIQUEIDENTIFIER,
    @Action      NVARCHAR(20),
    @Reason      NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRANSACTION;
        IF @Action = 'Remove'
        BEGIN
            UPDATE [dbo].[BlogPosts]
            SET [Status] = 'Removed', [IsModerated] = 1, [ModeratedBy] = @ModeratorId,
                [ModeratedAt] = SYSUTCDATETIME(), [ModerationReason] = @Reason, [UpdatedAt] = SYSUTCDATETIME()
            WHERE [Id] = @PostId;

            UPDATE up SET up.[PostCount] = CASE WHEN up.[PostCount] > 0 THEN up.[PostCount] - 1 ELSE 0 END
            FROM [dbo].[UserProfiles] up
            INNER JOIN [dbo].[BlogPosts] bp ON bp.[AuthorId] = up.[UserId]
            WHERE bp.[Id] = @PostId;
        END
        ELSE IF @Action = 'Restore'
        BEGIN
            UPDATE [dbo].[BlogPosts]
            SET [Status] = 'Published', [IsModerated] = 0, [ModeratedBy] = NULL,
                [ModeratedAt] = NULL, [ModerationReason] = NULL, [UpdatedAt] = SYSUTCDATETIME()
            WHERE [Id] = @PostId;

            UPDATE up SET up.[PostCount] = up.[PostCount] + 1
            FROM [dbo].[UserProfiles] up
            INNER JOIN [dbo].[BlogPosts] bp ON bp.[AuthorId] = up.[UserId]
            WHERE bp.[Id] = @PostId;
        END

        INSERT INTO [dbo].[AuditLogs] ([UserId], [Action], [EntityType], [EntityId], [NewValues])
        VALUES (@ModeratorId, 'Moderate_' + @Action, 'BlogPost', CAST(@PostId AS NVARCHAR(50)), @Reason);
    COMMIT TRANSACTION;
END;
GO

-- SP: Ban/Unban User
CREATE OR ALTER PROCEDURE [dbo].[sp_BanUnbanUser]
    @TargetUserId UNIQUEIDENTIFIER,
    @AdminUserId  UNIQUEIDENTIFIER,
    @Action       NVARCHAR(10),
    @Reason       NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRANSACTION;
        IF @Action = 'Ban'
        BEGIN
            UPDATE [dbo].[Users]
            SET [IsBanned] = 1, [BanReason] = @Reason, [IsActive] = 0,
                [RefreshToken] = NULL, [RefreshTokenExpiry] = NULL, [UpdatedAt] = SYSUTCDATETIME()
            WHERE [Id] = @TargetUserId;

            UPDATE [dbo].[BlogPosts]
            SET [Status] = 'Archived', [UpdatedAt] = SYSUTCDATETIME()
            WHERE [AuthorId] = @TargetUserId AND [Status] = 'Published';
        END
        ELSE IF @Action = 'Unban'
        BEGIN
            UPDATE [dbo].[Users]
            SET [IsBanned] = 0, [BanReason] = NULL, [IsActive] = 1, [UpdatedAt] = SYSUTCDATETIME()
            WHERE [Id] = @TargetUserId;

            UPDATE [dbo].[BlogPosts]
            SET [Status] = 'Published', [UpdatedAt] = SYSUTCDATETIME()
            WHERE [AuthorId] = @TargetUserId AND [Status] = 'Archived';
        END

        INSERT INTO [dbo].[AuditLogs] ([UserId], [Action], [EntityType], [EntityId], [NewValues])
        VALUES (@AdminUserId, @Action + '_User', 'User', CAST(@TargetUserId AS NVARCHAR(50)), @Reason);
    COMMIT TRANSACTION;
END;
GO

-- SP: Search Posts
CREATE OR ALTER PROCEDURE [dbo].[sp_SearchPosts]
    @SearchTerm NVARCHAR(200),
    @TagFilter  NVARCHAR(50)  = NULL,
    @SortBy     NVARCHAR(20)  = 'Relevance',
    @PageNumber INT = 1,
    @PageSize   INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    DECLARE @SearchPattern NVARCHAR(210) = '%' + @SearchTerm + '%';

    SELECT
        bp.[Id], bp.[AuthorId], bp.[Title], bp.[Slug], bp.[Excerpt],
        bp.[FeaturedImageUrl], bp.[LikeCount], bp.[CommentCount],
        bp.[ViewCount], bp.[PublishedAt],
        u.[UserName] AS AuthorUserName,
        up.[DisplayName] AS AuthorDisplayName,
        up.[ProfilePictureUrl] AS AuthorAvatar,
        COUNT(*) OVER() AS TotalCount
    FROM [dbo].[BlogPosts] bp
    INNER JOIN [dbo].[Users] u ON u.[Id] = bp.[AuthorId]
    LEFT JOIN [dbo].[UserProfiles] up ON up.[UserId] = bp.[AuthorId]
    LEFT JOIN [dbo].[PostTags] pt ON pt.[BlogPostId] = bp.[Id]
    LEFT JOIN [dbo].[Tags] t ON t.[Id] = pt.[TagId]
    WHERE bp.[Status] = 'Published' AND u.[IsActive] = 1 AND u.[IsBanned] = 0
      AND (bp.[Title] LIKE @SearchPattern OR bp.[Excerpt] LIKE @SearchPattern OR bp.[Content] LIKE @SearchPattern)
      AND (@TagFilter IS NULL OR t.[NormalizedName] = UPPER(@TagFilter))
    GROUP BY bp.[Id], bp.[AuthorId], bp.[Title], bp.[Slug], bp.[Excerpt],
             bp.[FeaturedImageUrl], bp.[LikeCount], bp.[CommentCount],
             bp.[ViewCount], bp.[PublishedAt], bp.[CreatedAt],
             u.[UserName], up.[DisplayName], up.[ProfilePictureUrl]
    ORDER BY
        CASE WHEN @SortBy = 'Newest' THEN bp.[PublishedAt] END DESC,
        CASE WHEN @SortBy = 'Popular' THEN bp.[LikeCount] END DESC,
        CASE WHEN @SortBy = 'Relevance' THEN CASE WHEN bp.[Title] LIKE @SearchPattern THEN 0 ELSE 1 END END ASC,
        bp.[PublishedAt] DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- =============================================
-- 5. VERIFICATION
-- =============================================
PRINT '========================================';
PRINT 'BlogSpot Database Setup Complete!';
PRINT '========================================';

SELECT 'Tables' AS Category, COUNT(*) AS [Count] FROM sys.tables WHERE is_ms_shipped = 0
UNION ALL
SELECT 'Stored Procedures', COUNT(*) FROM sys.procedures WHERE is_ms_shipped = 0
UNION ALL
SELECT 'Indexes', COUNT(*) FROM sys.indexes WHERE is_primary_key = 0 AND type > 0
    AND object_id IN (SELECT object_id FROM sys.tables WHERE is_ms_shipped = 0);
GO
