-- =============================================
-- BlogSpot Database - Full Setup Script (SQL Server / MSSQL)
-- Matches the current EF Core model (AppDbContextModelSnapshot, RedesignActivityLog migration).
-- Run this in SSMS or Azure Data Studio.
-- Supersedes the stale BlogSpot_FullSetup.sql (old schema: UserProfiles/PostTags/Status/AuditLogs no longer exist).
-- =============================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'BlogSpotDb')
BEGIN
    CREATE DATABASE [BlogSpotDb];
END
GO

USE [BlogSpotDb];
GO

-- =============================================
-- TABLES (created in FK-dependency order)
-- =============================================

-- Users
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE [dbo].[Users]
    (
        [Id]           UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
        [UserName]     NVARCHAR(50)     NOT NULL,
        [Email]        NVARCHAR(256)    NOT NULL,
        [PasswordHash] NVARCHAR(MAX)    NOT NULL,
        [Role]         NVARCHAR(20)     NOT NULL DEFAULT 'User',
        [IsActive]     BIT              NOT NULL DEFAULT 1,
        [CreatedAt]    DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt]    DATETIME2        NULL,

        CONSTRAINT [PK_Users] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [UQ_Users_UserName] UNIQUE ([UserName]),
        CONSTRAINT [UQ_Users_Email] UNIQUE ([Email]),
        CONSTRAINT [CK_Users_Role] CHECK ([Role] IN ('Admin', 'User'))
    );
END
GO

-- Profiles (1-1 with Users)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Profiles')
BEGIN
    CREATE TABLE [dbo].[Profiles]
    (
        [Id]                      UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
        [UserId]                  UNIQUEIDENTIFIER NOT NULL,
        [DisplayName]             NVARCHAR(100)    NULL,
        [Bio]                     NVARCHAR(1000)   NULL,
        [ProfilePictureUrl]       NVARCHAR(500)    NULL,
        [CoverPhotoUrl]           NVARCHAR(500)    NULL,
        [Website]                 NVARCHAR(200)    NULL,
        [Location]                NVARCHAR(100)    NULL,
        [Skills]                  NVARCHAR(1000)   NULL,
        [SocialLinks]             NVARCHAR(2000)   NULL,
        [NotificationPreferences] NVARCHAR(MAX)    NULL,
        [CreatedAt]               DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt]               DATETIME2        NULL,

        CONSTRAINT [PK_Profiles] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_Profiles_Users] FOREIGN KEY ([UserId])
            REFERENCES [dbo].[Users]([Id]) ON DELETE CASCADE,
        CONSTRAINT [UQ_Profiles_UserId] UNIQUE ([UserId])
    );
END
GO

-- Tags
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tags')
BEGIN
    CREATE TABLE [dbo].[Tags]
    (
        [Id]             UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
        [Name]           NVARCHAR(50)     NOT NULL,
        [NormalizedName] NVARCHAR(50)     NOT NULL,
        [CreatedAt]      DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt]      DATETIME2        NULL,

        CONSTRAINT [PK_Tags] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [UQ_Tags_NormalizedName] UNIQUE ([NormalizedName])
    );
END
GO

-- BlogPosts
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'BlogPosts')
BEGIN
    CREATE TABLE [dbo].[BlogPosts]
    (
        [Id]                 UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
        [AuthorId]           UNIQUEIDENTIFIER NOT NULL,
        [Title]              NVARCHAR(200)    NOT NULL,
        [Slug]               NVARCHAR(250)    NOT NULL,
        [Content]            NVARCHAR(MAX)    NOT NULL,
        [Summary]            NVARCHAR(500)    NULL,
        [Category]           NVARCHAR(100)    NULL,
        [FeaturedImageUrl]   NVARCHAR(500)    NULL,
        [Status]             INT              NOT NULL DEFAULT 0, -- PostStatus: 0=Draft,1=Scheduled,2=Published,3=Archived
        [IsPublished]        BIT              NOT NULL DEFAULT 1,
        [IsDraft]            BIT              NOT NULL DEFAULT 0,
        [IsDeleted]          BIT              NOT NULL DEFAULT 0,
        [ScheduledPublishAt] DATETIME2        NULL, -- set when Status = Scheduled (auto-publish time, UTC)
        [ViewCount]          INT              NOT NULL DEFAULT 0,
        [ReadingTimeMinutes] INT              NOT NULL DEFAULT 0,
        [CreatedAt]          DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt]          DATETIME2        NULL,

        CONSTRAINT [PK_BlogPosts] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_BlogPosts_Users] FOREIGN KEY ([AuthorId])
            REFERENCES [dbo].[Users]([Id]) ON DELETE CASCADE,
        CONSTRAINT [UQ_BlogPosts_Slug] UNIQUE ([Slug])
    );

    CREATE NONCLUSTERED INDEX [IX_BlogPosts_AuthorId] ON [dbo].[BlogPosts]([AuthorId]);
    CREATE NONCLUSTERED INDEX [IX_BlogPosts_Category] ON [dbo].[BlogPosts]([Category]);
    CREATE NONCLUSTERED INDEX [IX_BlogPosts_CreatedAt] ON [dbo].[BlogPosts]([CreatedAt]);
    CREATE NONCLUSTERED INDEX [IX_BlogPosts_IsPublished_CreatedAt] ON [dbo].[BlogPosts]([IsPublished], [CreatedAt]);
END
GO

-- BlogPostTags (junction)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'BlogPostTags')
BEGIN
    CREATE TABLE [dbo].[BlogPostTags]
    (
        [BlogPostId] UNIQUEIDENTIFIER NOT NULL,
        [TagId]      UNIQUEIDENTIFIER NOT NULL,

        CONSTRAINT [PK_BlogPostTags] PRIMARY KEY CLUSTERED ([BlogPostId], [TagId]),
        CONSTRAINT [FK_BlogPostTags_BlogPosts] FOREIGN KEY ([BlogPostId])
            REFERENCES [dbo].[BlogPosts]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_BlogPostTags_Tags] FOREIGN KEY ([TagId])
            REFERENCES [dbo].[Tags]([Id]) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX [IX_BlogPostTags_TagId] ON [dbo].[BlogPostTags]([TagId]);
END
GO

-- Comments
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Comments')
BEGIN
    CREATE TABLE [dbo].[Comments]
    (
        [Id]              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
        [BlogPostId]      UNIQUEIDENTIFIER NOT NULL,
        [UserId]          UNIQUEIDENTIFIER NOT NULL,
        [ParentCommentId] UNIQUEIDENTIFIER NULL,
        [Content]         NVARCHAR(2000)   NOT NULL,
        [IsEdited]        BIT              NOT NULL DEFAULT 0,
        [IsDeleted]       BIT              NOT NULL DEFAULT 0,
        [CreatedAt]       DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt]       DATETIME2        NULL,

        CONSTRAINT [PK_Comments] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_Comments_BlogPosts] FOREIGN KEY ([BlogPostId])
            REFERENCES [dbo].[BlogPosts]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Comments_Users] FOREIGN KEY ([UserId])
            REFERENCES [dbo].[Users]([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Comments_Parent] FOREIGN KEY ([ParentCommentId])
            REFERENCES [dbo].[Comments]([Id]) ON DELETE NO ACTION
    );

    CREATE NONCLUSTERED INDEX [IX_Comments_BlogPostId] ON [dbo].[Comments]([BlogPostId]);
    CREATE NONCLUSTERED INDEX [IX_Comments_ParentCommentId] ON [dbo].[Comments]([ParentCommentId]);
    CREATE NONCLUSTERED INDEX [IX_Comments_UserId] ON [dbo].[Comments]([UserId]);
END
GO

-- CommentLikes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CommentLikes')
BEGIN
    CREATE TABLE [dbo].[CommentLikes]
    (
        [Id]        UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
        [CommentId] UNIQUEIDENTIFIER NOT NULL,
        [UserId]    UNIQUEIDENTIFIER NOT NULL,
        [CreatedAt] DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] DATETIME2        NULL,

        CONSTRAINT [PK_CommentLikes] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_CommentLikes_Comments] FOREIGN KEY ([CommentId])
            REFERENCES [dbo].[Comments]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_CommentLikes_Users] FOREIGN KEY ([UserId])
            REFERENCES [dbo].[Users]([Id]) ON DELETE CASCADE,
        CONSTRAINT [UQ_CommentLikes_User_Comment] UNIQUE ([UserId], [CommentId])
    );

    CREATE NONCLUSTERED INDEX [IX_CommentLikes_CommentId] ON [dbo].[CommentLikes]([CommentId]);
END
GO

-- Likes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Likes')
BEGIN
    CREATE TABLE [dbo].[Likes]
    (
        [Id]         UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
        [BlogPostId] UNIQUEIDENTIFIER NOT NULL,
        [UserId]     UNIQUEIDENTIFIER NOT NULL,
        [CreatedAt]  DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt]  DATETIME2        NULL,

        CONSTRAINT [PK_Likes] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_Likes_BlogPosts] FOREIGN KEY ([BlogPostId])
            REFERENCES [dbo].[BlogPosts]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Likes_Users] FOREIGN KEY ([UserId])
            REFERENCES [dbo].[Users]([Id]) ON DELETE NO ACTION,
        CONSTRAINT [UQ_Likes_User_Post] UNIQUE ([UserId], [BlogPostId])
    );

    CREATE NONCLUSTERED INDEX [IX_Likes_BlogPostId] ON [dbo].[Likes]([BlogPostId]);
END
GO

-- Reactions (emoji-style reactions stored as string Type, e.g. Like/Love/Fire/Clap)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Reactions')
BEGIN
    CREATE TABLE [dbo].[Reactions]
    (
        [Id]         UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
        [BlogPostId] UNIQUEIDENTIFIER NOT NULL,
        [UserId]     UNIQUEIDENTIFIER NOT NULL,
        [Type]       NVARCHAR(20)     NOT NULL,
        [CreatedAt]  DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt]  DATETIME2        NULL,

        CONSTRAINT [PK_Reactions] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_Reactions_BlogPosts] FOREIGN KEY ([BlogPostId])
            REFERENCES [dbo].[BlogPosts]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Reactions_Users] FOREIGN KEY ([UserId])
            REFERENCES [dbo].[Users]([Id]) ON DELETE NO ACTION,
        CONSTRAINT [UQ_Reactions_User_Post_Type] UNIQUE ([UserId], [BlogPostId], [Type])
    );

    CREATE NONCLUSTERED INDEX [IX_Reactions_BlogPostId] ON [dbo].[Reactions]([BlogPostId]);
END
GO

-- Bookmarks
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Bookmarks')
BEGIN
    CREATE TABLE [dbo].[Bookmarks]
    (
        [Id]         UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
        [BlogPostId] UNIQUEIDENTIFIER NOT NULL,
        [UserId]     UNIQUEIDENTIFIER NOT NULL,
        [CreatedAt]  DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt]  DATETIME2        NULL,

        CONSTRAINT [PK_Bookmarks] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_Bookmarks_BlogPosts] FOREIGN KEY ([BlogPostId])
            REFERENCES [dbo].[BlogPosts]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Bookmarks_Users] FOREIGN KEY ([UserId])
            REFERENCES [dbo].[Users]([Id]) ON DELETE NO ACTION,
        CONSTRAINT [UQ_Bookmarks_User_Post] UNIQUE ([UserId], [BlogPostId])
    );

    CREATE NONCLUSTERED INDEX [IX_Bookmarks_BlogPostId] ON [dbo].[Bookmarks]([BlogPostId]);
END
GO

-- PostImages
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PostImages')
BEGIN
    CREATE TABLE [dbo].[PostImages]
    (
        [Id]         UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
        [BlogPostId] UNIQUEIDENTIFIER NOT NULL,
        [ImageUrl]   NVARCHAR(500)    NOT NULL,
        [AltText]    NVARCHAR(200)    NULL,
        [SortOrder]  INT              NOT NULL DEFAULT 0,
        [CreatedAt]  DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt]  DATETIME2        NULL,

        CONSTRAINT [PK_PostImages] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_PostImages_BlogPosts] FOREIGN KEY ([BlogPostId])
            REFERENCES [dbo].[BlogPosts]([Id]) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX [IX_PostImages_BlogPostId] ON [dbo].[PostImages]([BlogPostId]);
END
GO

-- Follows
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Follows')
BEGIN
    CREATE TABLE [dbo].[Follows]
    (
        [FollowerId]  UNIQUEIDENTIFIER NOT NULL,
        [FollowingId] UNIQUEIDENTIFIER NOT NULL,
        [CreatedAt]   DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT [PK_Follows] PRIMARY KEY CLUSTERED ([FollowerId], [FollowingId]),
        CONSTRAINT [FK_Follows_Follower] FOREIGN KEY ([FollowerId])
            REFERENCES [dbo].[Users]([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Follows_Following] FOREIGN KEY ([FollowingId])
            REFERENCES [dbo].[Users]([Id]) ON DELETE NO ACTION,
        CONSTRAINT [CK_Follows_NoSelfFollow] CHECK ([FollowerId] <> [FollowingId])
    );

    CREATE NONCLUSTERED INDEX [IX_Follows_FollowingId] ON [dbo].[Follows]([FollowingId]);
END
GO

-- Notifications
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
BEGIN
    CREATE TABLE [dbo].[Notifications]
    (
        [Id]          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
        [UserId]      UNIQUEIDENTIFIER NOT NULL,
        [ActorId]     UNIQUEIDENTIFIER NOT NULL,
        [Type]        NVARCHAR(30)     NOT NULL,
        [ReferenceId] UNIQUEIDENTIFIER NULL,
        [Message]     NVARCHAR(500)    NOT NULL,
        [IsRead]      BIT              NOT NULL DEFAULT 0,
        [CreatedAt]   DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt]   DATETIME2        NULL,

        CONSTRAINT [PK_Notifications] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_Notifications_User] FOREIGN KEY ([UserId])
            REFERENCES [dbo].[Users]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Notifications_Actor] FOREIGN KEY ([ActorId])
            REFERENCES [dbo].[Users]([Id]) ON DELETE NO ACTION
    );

    CREATE NONCLUSTERED INDEX [IX_Notifications_ActorId] ON [dbo].[Notifications]([ActorId]);
    CREATE NONCLUSTERED INDEX [IX_Notifications_User_Read_Created] ON [dbo].[Notifications]([UserId], [IsRead], [CreatedAt]);
END
GO

-- DraftBlogs
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DraftBlogs')
BEGIN
    CREATE TABLE [dbo].[DraftBlogs]
    (
        [Id]         UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
        [AuthorId]   UNIQUEIDENTIFIER NOT NULL,
        [BlogPostId] UNIQUEIDENTIFIER NULL,
        [Title]      NVARCHAR(200)    NOT NULL,
        [Content]    NVARCHAR(MAX)    NOT NULL,
        [Summary]    NVARCHAR(500)    NULL,
        [Category]   NVARCHAR(100)    NULL,
        [Tags]       NVARCHAR(500)    NULL,
        [CreatedAt]  DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt]  DATETIME2        NULL,

        CONSTRAINT [PK_DraftBlogs] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_DraftBlogs_Author] FOREIGN KEY ([AuthorId])
            REFERENCES [dbo].[Users]([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_DraftBlogs_BlogPosts] FOREIGN KEY ([BlogPostId])
            REFERENCES [dbo].[BlogPosts]([Id]) ON DELETE SET NULL
    );

    CREATE NONCLUSTERED INDEX [IX_DraftBlogs_AuthorId] ON [dbo].[DraftBlogs]([AuthorId]);
    CREATE NONCLUSTERED INDEX [IX_DraftBlogs_BlogPostId] ON [dbo].[DraftBlogs]([BlogPostId]);
END
GO

-- EmailQueues
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EmailQueues')
BEGIN
    CREATE TABLE [dbo].[EmailQueues]
    (
        [Id]         UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
        [ToEmail]    NVARCHAR(MAX)    NOT NULL,
        [Subject]    NVARCHAR(MAX)    NOT NULL,
        [Body]       NVARCHAR(MAX)    NOT NULL,
        [Status]     INT              NOT NULL DEFAULT 0, -- 0=Pending, 1=Sent, 2=Failed
        [RetryCount] INT              NOT NULL DEFAULT 0,
        [Error]      NVARCHAR(MAX)    NULL,
        [SentAt]     DATETIME2        NULL,
        [CreatedAt]  DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt]  DATETIME2        NULL,

        CONSTRAINT [PK_EmailQueues] PRIMARY KEY CLUSTERED ([Id])
    );
END
GO

-- OtpVerifications
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OtpVerifications')
BEGIN
    CREATE TABLE [dbo].[OtpVerifications]
    (
        [Id]        UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
        [Email]     NVARCHAR(MAX)    NOT NULL,
        [OtpCode]   NVARCHAR(MAX)    NOT NULL,
        [ExpiresAt] DATETIME2        NOT NULL,
        [IsUsed]    BIT              NOT NULL DEFAULT 0,
        [CreatedAt] DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] DATETIME2        NULL,

        CONSTRAINT [PK_OtpVerifications] PRIMARY KEY CLUSTERED ([Id])
    );
END
GO

-- ActivityLogs
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ActivityLogs')
BEGIN
    CREATE TABLE [dbo].[ActivityLogs]
    (
        [Id]        BIGINT         NOT NULL IDENTITY(1,1),
        [Action]    NVARCHAR(100)  NOT NULL,
        [Level]     NVARCHAR(10)   NOT NULL,
        [Logger]    NVARCHAR(100)  NOT NULL,
        [Message]   NVARCHAR(1000) NULL,
        [UserName]  NVARCHAR(50)   NULL,
        [Timestamp] DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT [PK_ActivityLogs] PRIMARY KEY CLUSTERED ([Id])
    );

    CREATE NONCLUSTERED INDEX [IX_ActivityLogs_Action] ON [dbo].[ActivityLogs]([Action]);
    CREATE NONCLUSTERED INDEX [IX_ActivityLogs_Level] ON [dbo].[ActivityLogs]([Level]);
    CREATE NONCLUSTERED INDEX [IX_ActivityLogs_Timestamp] ON [dbo].[ActivityLogs]([Timestamp]);
END
GO

-- =============================================
-- STORED PROCEDURES
-- Counts (likes/comments) are computed on the fly since no counter columns exist on BlogPosts/Profiles in the current schema.
-- =============================================

-- sp_GetHomeFeed: followed authors' posts + trending fallback from non-followed authors (last 7 days)
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
            bp.[Id], bp.[AuthorId], bp.[Title], bp.[Slug], bp.[Summary],
            bp.[FeaturedImageUrl], bp.[ViewCount], bp.[CreatedAt],
            u.[UserName] AS AuthorUserName,
            p.[DisplayName] AS AuthorDisplayName,
            p.[ProfilePictureUrl] AS AuthorAvatar,
            (SELECT COUNT(*) FROM [dbo].[Likes] l WHERE l.[BlogPostId] = bp.[Id]) AS LikeCount,
            (SELECT COUNT(*) FROM [dbo].[Comments] c WHERE c.[BlogPostId] = bp.[Id] AND c.[IsDeleted] = 0) AS CommentCount,
            1 AS FeedType,
            CASE WHEN EXISTS (SELECT 1 FROM [dbo].[Likes] l WHERE l.[BlogPostId] = bp.[Id] AND l.[UserId] = @UserId)
                THEN 1 ELSE 0 END AS IsLikedByCurrentUser
        FROM [dbo].[BlogPosts] bp
        INNER JOIN [dbo].[Follows] f ON f.[FollowingId] = bp.[AuthorId]
        INNER JOIN [dbo].[Users] u ON u.[Id] = bp.[AuthorId]
        LEFT JOIN [dbo].[Profiles] p ON p.[UserId] = bp.[AuthorId]
        WHERE f.[FollowerId] = @UserId AND bp.[IsPublished] = 1 AND bp.[IsDeleted] = 0

        UNION

        SELECT
            bp.[Id], bp.[AuthorId], bp.[Title], bp.[Slug], bp.[Summary],
            bp.[FeaturedImageUrl], bp.[ViewCount], bp.[CreatedAt],
            u.[UserName] AS AuthorUserName,
            p.[DisplayName] AS AuthorDisplayName,
            p.[ProfilePictureUrl] AS AuthorAvatar,
            (SELECT COUNT(*) FROM [dbo].[Likes] l WHERE l.[BlogPostId] = bp.[Id]) AS LikeCount,
            (SELECT COUNT(*) FROM [dbo].[Comments] c WHERE c.[BlogPostId] = bp.[Id] AND c.[IsDeleted] = 0) AS CommentCount,
            2 AS FeedType,
            CASE WHEN EXISTS (SELECT 1 FROM [dbo].[Likes] l WHERE l.[BlogPostId] = bp.[Id] AND l.[UserId] = @UserId)
                THEN 1 ELSE 0 END AS IsLikedByCurrentUser
        FROM [dbo].[BlogPosts] bp
        INNER JOIN [dbo].[Users] u ON u.[Id] = bp.[AuthorId]
        LEFT JOIN [dbo].[Profiles] p ON p.[UserId] = bp.[AuthorId]
        WHERE bp.[IsPublished] = 1 AND bp.[IsDeleted] = 0
          AND bp.[CreatedAt] >= DATEADD(DAY, -7, SYSUTCDATETIME())
          AND NOT EXISTS (SELECT 1 FROM [dbo].[Follows] f WHERE f.[FollowerId] = @UserId AND f.[FollowingId] = bp.[AuthorId])
          AND bp.[AuthorId] <> @UserId
    )
    SELECT *, COUNT(*) OVER() AS TotalCount
    FROM FeedPosts
    ORDER BY FeedType ASC, [CreatedAt] DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- sp_GetTrendingPosts: time-decayed trending score
CREATE OR ALTER PROCEDURE [dbo].[sp_GetTrendingPosts]
    @DaysBack INT = 7,
    @TopN     INT = 50
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (@TopN)
        bp.[Id], bp.[AuthorId], bp.[Title], bp.[Slug], bp.[Summary],
        bp.[FeaturedImageUrl], bp.[ViewCount], bp.[CreatedAt],
        u.[UserName] AS AuthorUserName,
        p.[DisplayName] AS AuthorDisplayName,
        p.[ProfilePictureUrl] AS AuthorAvatar,
        (SELECT COUNT(*) FROM [dbo].[Likes] l WHERE l.[BlogPostId] = bp.[Id]) AS LikeCount,
        (SELECT COUNT(*) FROM [dbo].[Comments] c WHERE c.[BlogPostId] = bp.[Id] AND c.[IsDeleted] = 0) AS CommentCount,
        ((SELECT COUNT(*) FROM [dbo].[Likes] l WHERE l.[BlogPostId] = bp.[Id]) * 3.0
         + (SELECT COUNT(*) FROM [dbo].[Comments] c WHERE c.[BlogPostId] = bp.[Id] AND c.[IsDeleted] = 0) * 5.0
         + bp.[ViewCount] * 0.1)
        / POWER(DATEDIFF(HOUR, bp.[CreatedAt], SYSUTCDATETIME()) + 2, 1.5) AS TrendingScore
    FROM [dbo].[BlogPosts] bp
    INNER JOIN [dbo].[Users] u ON u.[Id] = bp.[AuthorId]
    LEFT JOIN [dbo].[Profiles] p ON p.[UserId] = bp.[AuthorId]
    WHERE bp.[IsPublished] = 1 AND bp.[IsDeleted] = 0
      AND bp.[CreatedAt] >= DATEADD(DAY, -@DaysBack, SYSUTCDATETIME())
      AND u.[IsActive] = 1
    ORDER BY TrendingScore DESC;
END;
GO

-- sp_TogglePostLike
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
            SET @IsLiked = 0;
        END
        ELSE
        BEGIN
            INSERT INTO [dbo].[Likes] ([Id], [UserId], [BlogPostId], [CreatedAt])
            VALUES (NEWID(), @UserId, @BlogPostId, SYSUTCDATETIME());
            SET @IsLiked = 1;
        END
    COMMIT TRANSACTION;
END;
GO

-- sp_ToggleFollow
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
            SET @IsFollowing = 0;
        END
        ELSE
        BEGIN
            INSERT INTO [dbo].[Follows] ([FollowerId], [FollowingId], [CreatedAt])
            VALUES (@FollowerId, @FollowingId, SYSUTCDATETIME());
            SET @IsFollowing = 1;
        END
    COMMIT TRANSACTION;
END;
GO

-- sp_GetAdminDashboardStats
CREATE OR ALTER PROCEDURE [dbo].[sp_GetAdminDashboardStats]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        (SELECT COUNT(*) FROM [dbo].[Users])                                                            AS TotalUsers,
        (SELECT COUNT(*) FROM [dbo].[Users] WHERE [IsActive] = 1)                                       AS ActiveUsers,
        (SELECT COUNT(*) FROM [dbo].[Users] WHERE [CreatedAt] >= DATEADD(DAY, -30, SYSUTCDATETIME()))    AS NewUsersLast30Days,
        (SELECT COUNT(*) FROM [dbo].[BlogPosts] WHERE [IsDeleted] = 0)                                   AS TotalPosts,
        (SELECT COUNT(*) FROM [dbo].[BlogPosts] WHERE [IsPublished] = 1 AND [IsDeleted] = 0)             AS PublishedPosts,
        (SELECT COUNT(*) FROM [dbo].[BlogPosts] WHERE [IsDeleted] = 1)                                   AS RemovedPosts,
        (SELECT COUNT(*) FROM [dbo].[BlogPosts] WHERE [CreatedAt] >= DATEADD(DAY, -30, SYSUTCDATETIME()) AND [IsDeleted] = 0) AS NewPostsLast30Days,
        (SELECT COUNT(*) FROM [dbo].[Comments] WHERE [IsDeleted] = 0)                                    AS TotalComments,
        (SELECT COUNT(*) FROM [dbo].[Comments] WHERE [IsDeleted] = 1)                                    AS RemovedComments,
        (SELECT COUNT(*) FROM [dbo].[Likes])                                                             AS TotalLikes,
        (SELECT COUNT(*) FROM [dbo].[Follows])                                                           AS TotalFollows;
END;
GO

-- sp_ModeratePost: soft-delete/restore via IsDeleted (matches AdminService.cs AdminDeletePostAsync pattern), logs to ActivityLogs
CREATE OR ALTER PROCEDURE [dbo].[sp_ModeratePost]
    @PostId        UNIQUEIDENTIFIER,
    @ModeratorName NVARCHAR(50),
    @Action        NVARCHAR(20) -- 'Remove' or 'Restore'
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRANSACTION;
        IF @Action = 'Remove'
        BEGIN
            UPDATE [dbo].[BlogPosts]
            SET [IsDeleted] = 1, [UpdatedAt] = SYSUTCDATETIME()
            WHERE [Id] = @PostId;
        END
        ELSE IF @Action = 'Restore'
        BEGIN
            UPDATE [dbo].[BlogPosts]
            SET [IsDeleted] = 0, [UpdatedAt] = SYSUTCDATETIME()
            WHERE [Id] = @PostId;
        END

        INSERT INTO [dbo].[ActivityLogs] ([Action], [Level], [Logger], [Message], [UserName], [Timestamp])
        VALUES ('AdminAction', 'Info', 'AdminService', CONCAT('Post ', @Action, ': ', CAST(@PostId AS NVARCHAR(36))), @ModeratorName, SYSUTCDATETIME());
    COMMIT TRANSACTION;
END;
GO
