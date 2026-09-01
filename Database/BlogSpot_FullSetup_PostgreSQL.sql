-- =============================================
-- BlogSpot Database - Full Setup Script (PostgreSQL)
-- Matches the current EF Core model (AppDbContextModelSnapshot, RedesignActivityLog migration).
-- Run this in Supabase SQL editor, Neon SQL editor, or psql.
-- =============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()

-- =============================================
-- TABLES (created in FK-dependency order)
-- =============================================

-- Users
CREATE TABLE IF NOT EXISTS "Users"
(
    "Id"           uuid             NOT NULL DEFAULT gen_random_uuid(),
    "UserName"     varchar(50)      NOT NULL,
    "Email"        varchar(256)     NOT NULL,
    "PasswordHash" text             NOT NULL,
    "Role"         varchar(20)      NOT NULL DEFAULT 'User',
    "IsActive"     boolean          NOT NULL DEFAULT true,
    "CreatedAt"    timestamp        NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    "UpdatedAt"    timestamp        NULL,

    CONSTRAINT "PK_Users" PRIMARY KEY ("Id"),
    CONSTRAINT "UQ_Users_UserName" UNIQUE ("UserName"),
    CONSTRAINT "UQ_Users_Email" UNIQUE ("Email"),
    CONSTRAINT "CK_Users_Role" CHECK ("Role" IN ('Admin', 'User'))
);

-- Profiles (1-1 with Users)
CREATE TABLE IF NOT EXISTS "Profiles"
(
    "Id"                      uuid          NOT NULL DEFAULT gen_random_uuid(),
    "UserId"                  uuid          NOT NULL,
    "DisplayName"             varchar(100)  NULL,
    "Bio"                     varchar(1000) NULL,
    "ProfilePictureUrl"       varchar(500)  NULL,
    "CoverPhotoUrl"           varchar(500)  NULL,
    "Website"                 varchar(200)  NULL,
    "Location"                varchar(100)  NULL,
    "Skills"                  varchar(1000) NULL,
    "SocialLinks"             varchar(2000) NULL,
    "NotificationPreferences" text          NULL,
    "CreatedAt"               timestamp     NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    "UpdatedAt"               timestamp     NULL,

    CONSTRAINT "PK_Profiles" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Profiles_Users" FOREIGN KEY ("UserId")
        REFERENCES "Users"("Id") ON DELETE CASCADE,
    CONSTRAINT "UQ_Profiles_UserId" UNIQUE ("UserId")
);

-- Tags
CREATE TABLE IF NOT EXISTS "Tags"
(
    "Id"             uuid         NOT NULL DEFAULT gen_random_uuid(),
    "Name"           varchar(50)  NOT NULL,
    "NormalizedName" varchar(50)  NOT NULL,
    "CreatedAt"      timestamp    NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    "UpdatedAt"      timestamp    NULL,

    CONSTRAINT "PK_Tags" PRIMARY KEY ("Id"),
    CONSTRAINT "UQ_Tags_NormalizedName" UNIQUE ("NormalizedName")
);

-- BlogPosts
CREATE TABLE IF NOT EXISTS "BlogPosts"
(
    "Id"                 uuid         NOT NULL DEFAULT gen_random_uuid(),
    "AuthorId"           uuid         NOT NULL,
    "Title"              varchar(200) NOT NULL,
    "Slug"               varchar(250) NOT NULL,
    "Content"            text         NOT NULL,
    "Summary"            varchar(500) NULL,
    "Category"           varchar(100) NULL,
    "FeaturedImageUrl"   varchar(500) NULL,
    "IsPublished"        boolean      NOT NULL DEFAULT true,
    "IsDraft"            boolean      NOT NULL DEFAULT false,
    "IsDeleted"          boolean      NOT NULL DEFAULT false,
    "ViewCount"          integer      NOT NULL DEFAULT 0,
    "ReadingTimeMinutes" integer      NOT NULL DEFAULT 0,
    "CreatedAt"          timestamp    NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    "UpdatedAt"          timestamp    NULL,

    CONSTRAINT "PK_BlogPosts" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_BlogPosts_Users" FOREIGN KEY ("AuthorId")
        REFERENCES "Users"("Id") ON DELETE CASCADE,
    CONSTRAINT "UQ_BlogPosts_Slug" UNIQUE ("Slug")
);

CREATE INDEX IF NOT EXISTS "IX_BlogPosts_AuthorId" ON "BlogPosts"("AuthorId");
CREATE INDEX IF NOT EXISTS "IX_BlogPosts_Category" ON "BlogPosts"("Category");
CREATE INDEX IF NOT EXISTS "IX_BlogPosts_CreatedAt" ON "BlogPosts"("CreatedAt");
CREATE INDEX IF NOT EXISTS "IX_BlogPosts_IsPublished_CreatedAt" ON "BlogPosts"("IsPublished", "CreatedAt");

-- BlogPostTags (junction)
CREATE TABLE IF NOT EXISTS "BlogPostTags"
(
    "BlogPostId" uuid NOT NULL,
    "TagId"      uuid NOT NULL,

    CONSTRAINT "PK_BlogPostTags" PRIMARY KEY ("BlogPostId", "TagId"),
    CONSTRAINT "FK_BlogPostTags_BlogPosts" FOREIGN KEY ("BlogPostId")
        REFERENCES "BlogPosts"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_BlogPostTags_Tags" FOREIGN KEY ("TagId")
        REFERENCES "Tags"("Id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IX_BlogPostTags_TagId" ON "BlogPostTags"("TagId");

-- Comments
CREATE TABLE IF NOT EXISTS "Comments"
(
    "Id"              uuid         NOT NULL DEFAULT gen_random_uuid(),
    "BlogPostId"      uuid         NOT NULL,
    "UserId"          uuid         NOT NULL,
    "ParentCommentId" uuid         NULL,
    "Content"         varchar(2000) NOT NULL,
    "IsEdited"        boolean      NOT NULL DEFAULT false,
    "IsDeleted"       boolean      NOT NULL DEFAULT false,
    "CreatedAt"       timestamp    NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    "UpdatedAt"       timestamp    NULL,

    CONSTRAINT "PK_Comments" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Comments_BlogPosts" FOREIGN KEY ("BlogPostId")
        REFERENCES "BlogPosts"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Comments_Users" FOREIGN KEY ("UserId")
        REFERENCES "Users"("Id") ON DELETE NO ACTION,
    CONSTRAINT "FK_Comments_Parent" FOREIGN KEY ("ParentCommentId")
        REFERENCES "Comments"("Id") ON DELETE NO ACTION
);

CREATE INDEX IF NOT EXISTS "IX_Comments_BlogPostId" ON "Comments"("BlogPostId");
CREATE INDEX IF NOT EXISTS "IX_Comments_ParentCommentId" ON "Comments"("ParentCommentId");
CREATE INDEX IF NOT EXISTS "IX_Comments_UserId" ON "Comments"("UserId");

-- CommentLikes
CREATE TABLE IF NOT EXISTS "CommentLikes"
(
    "Id"        uuid      NOT NULL DEFAULT gen_random_uuid(),
    "CommentId" uuid      NOT NULL,
    "UserId"    uuid      NOT NULL,
    "CreatedAt" timestamp NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    "UpdatedAt" timestamp NULL,

    CONSTRAINT "PK_CommentLikes" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_CommentLikes_Comments" FOREIGN KEY ("CommentId")
        REFERENCES "Comments"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_CommentLikes_Users" FOREIGN KEY ("UserId")
        REFERENCES "Users"("Id") ON DELETE CASCADE,
    CONSTRAINT "UQ_CommentLikes_User_Comment" UNIQUE ("UserId", "CommentId")
);

CREATE INDEX IF NOT EXISTS "IX_CommentLikes_CommentId" ON "CommentLikes"("CommentId");

-- Likes
CREATE TABLE IF NOT EXISTS "Likes"
(
    "Id"         uuid      NOT NULL DEFAULT gen_random_uuid(),
    "BlogPostId" uuid      NOT NULL,
    "UserId"     uuid      NOT NULL,
    "CreatedAt"  timestamp NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    "UpdatedAt"  timestamp NULL,

    CONSTRAINT "PK_Likes" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Likes_BlogPosts" FOREIGN KEY ("BlogPostId")
        REFERENCES "BlogPosts"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Likes_Users" FOREIGN KEY ("UserId")
        REFERENCES "Users"("Id") ON DELETE NO ACTION,
    CONSTRAINT "UQ_Likes_User_Post" UNIQUE ("UserId", "BlogPostId")
);

CREATE INDEX IF NOT EXISTS "IX_Likes_BlogPostId" ON "Likes"("BlogPostId");

-- Reactions (emoji-style reactions stored as string Type, e.g. Like/Love/Fire/Clap)
CREATE TABLE IF NOT EXISTS "Reactions"
(
    "Id"         uuid        NOT NULL DEFAULT gen_random_uuid(),
    "BlogPostId" uuid        NOT NULL,
    "UserId"     uuid        NOT NULL,
    "Type"       varchar(20) NOT NULL,
    "CreatedAt"  timestamp   NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    "UpdatedAt"  timestamp   NULL,

    CONSTRAINT "PK_Reactions" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Reactions_BlogPosts" FOREIGN KEY ("BlogPostId")
        REFERENCES "BlogPosts"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Reactions_Users" FOREIGN KEY ("UserId")
        REFERENCES "Users"("Id") ON DELETE NO ACTION,
    CONSTRAINT "UQ_Reactions_User_Post_Type" UNIQUE ("UserId", "BlogPostId", "Type")
);

CREATE INDEX IF NOT EXISTS "IX_Reactions_BlogPostId" ON "Reactions"("BlogPostId");

-- Bookmarks
CREATE TABLE IF NOT EXISTS "Bookmarks"
(
    "Id"         uuid      NOT NULL DEFAULT gen_random_uuid(),
    "BlogPostId" uuid      NOT NULL,
    "UserId"     uuid      NOT NULL,
    "CreatedAt"  timestamp NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    "UpdatedAt"  timestamp NULL,

    CONSTRAINT "PK_Bookmarks" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Bookmarks_BlogPosts" FOREIGN KEY ("BlogPostId")
        REFERENCES "BlogPosts"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Bookmarks_Users" FOREIGN KEY ("UserId")
        REFERENCES "Users"("Id") ON DELETE NO ACTION,
    CONSTRAINT "UQ_Bookmarks_User_Post" UNIQUE ("UserId", "BlogPostId")
);

CREATE INDEX IF NOT EXISTS "IX_Bookmarks_BlogPostId" ON "Bookmarks"("BlogPostId");

-- PostImages
CREATE TABLE IF NOT EXISTS "PostImages"
(
    "Id"         uuid         NOT NULL DEFAULT gen_random_uuid(),
    "BlogPostId" uuid         NOT NULL,
    "ImageUrl"   varchar(500) NOT NULL,
    "AltText"    varchar(200) NULL,
    "SortOrder"  integer      NOT NULL DEFAULT 0,
    "CreatedAt"  timestamp    NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    "UpdatedAt"  timestamp    NULL,

    CONSTRAINT "PK_PostImages" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_PostImages_BlogPosts" FOREIGN KEY ("BlogPostId")
        REFERENCES "BlogPosts"("Id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IX_PostImages_BlogPostId" ON "PostImages"("BlogPostId");

-- Follows
CREATE TABLE IF NOT EXISTS "Follows"
(
    "FollowerId"  uuid      NOT NULL,
    "FollowingId" uuid      NOT NULL,
    "CreatedAt"   timestamp NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),

    CONSTRAINT "PK_Follows" PRIMARY KEY ("FollowerId", "FollowingId"),
    CONSTRAINT "FK_Follows_Follower" FOREIGN KEY ("FollowerId")
        REFERENCES "Users"("Id") ON DELETE NO ACTION,
    CONSTRAINT "FK_Follows_Following" FOREIGN KEY ("FollowingId")
        REFERENCES "Users"("Id") ON DELETE NO ACTION,
    CONSTRAINT "CK_Follows_NoSelfFollow" CHECK ("FollowerId" <> "FollowingId")
);

CREATE INDEX IF NOT EXISTS "IX_Follows_FollowingId" ON "Follows"("FollowingId");

-- Notifications
CREATE TABLE IF NOT EXISTS "Notifications"
(
    "Id"          uuid         NOT NULL DEFAULT gen_random_uuid(),
    "UserId"      uuid         NOT NULL,
    "ActorId"     uuid         NOT NULL,
    "Type"        varchar(30)  NOT NULL,
    "ReferenceId" uuid         NULL,
    "Message"     varchar(500) NOT NULL,
    "IsRead"      boolean      NOT NULL DEFAULT false,
    "CreatedAt"   timestamp    NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    "UpdatedAt"   timestamp    NULL,

    CONSTRAINT "PK_Notifications" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Notifications_User" FOREIGN KEY ("UserId")
        REFERENCES "Users"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Notifications_Actor" FOREIGN KEY ("ActorId")
        REFERENCES "Users"("Id") ON DELETE NO ACTION
);

CREATE INDEX IF NOT EXISTS "IX_Notifications_ActorId" ON "Notifications"("ActorId");
CREATE INDEX IF NOT EXISTS "IX_Notifications_User_Read_Created" ON "Notifications"("UserId", "IsRead", "CreatedAt");

-- DraftBlogs
CREATE TABLE IF NOT EXISTS "DraftBlogs"
(
    "Id"         uuid         NOT NULL DEFAULT gen_random_uuid(),
    "AuthorId"   uuid         NOT NULL,
    "BlogPostId" uuid         NULL,
    "Title"      varchar(200) NOT NULL,
    "Content"    text         NOT NULL,
    "Summary"    varchar(500) NULL,
    "Category"   varchar(100) NULL,
    "Tags"       varchar(500) NULL,
    "CreatedAt"  timestamp    NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    "UpdatedAt"  timestamp    NULL,

    CONSTRAINT "PK_DraftBlogs" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_DraftBlogs_Author" FOREIGN KEY ("AuthorId")
        REFERENCES "Users"("Id") ON DELETE NO ACTION,
    CONSTRAINT "FK_DraftBlogs_BlogPosts" FOREIGN KEY ("BlogPostId")
        REFERENCES "BlogPosts"("Id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "IX_DraftBlogs_AuthorId" ON "DraftBlogs"("AuthorId");
CREATE INDEX IF NOT EXISTS "IX_DraftBlogs_BlogPostId" ON "DraftBlogs"("BlogPostId");

-- EmailQueues
CREATE TABLE IF NOT EXISTS "EmailQueues"
(
    "Id"         uuid      NOT NULL DEFAULT gen_random_uuid(),
    "ToEmail"    text      NOT NULL,
    "Subject"    text      NOT NULL,
    "Body"       text      NOT NULL,
    "Status"     integer   NOT NULL DEFAULT 0, -- 0=Pending, 1=Sent, 2=Failed
    "RetryCount" integer   NOT NULL DEFAULT 0,
    "Error"      text      NULL,
    "SentAt"     timestamp NULL,
    "CreatedAt"  timestamp NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    "UpdatedAt"  timestamp NULL,

    CONSTRAINT "PK_EmailQueues" PRIMARY KEY ("Id")
);

-- OtpVerifications
CREATE TABLE IF NOT EXISTS "OtpVerifications"
(
    "Id"        uuid      NOT NULL DEFAULT gen_random_uuid(),
    "Email"     text      NOT NULL,
    "OtpCode"   text      NOT NULL,
    "ExpiresAt" timestamp NOT NULL,
    "IsUsed"    boolean   NOT NULL DEFAULT false,
    "CreatedAt" timestamp NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    "UpdatedAt" timestamp NULL,

    CONSTRAINT "PK_OtpVerifications" PRIMARY KEY ("Id")
);

-- ActivityLogs
CREATE TABLE IF NOT EXISTS "ActivityLogs"
(
    "Id"        bigserial     NOT NULL,
    "Action"    varchar(100)  NOT NULL,
    "Level"     varchar(10)   NOT NULL,
    "Logger"    varchar(100)  NOT NULL,
    "Message"   varchar(1000) NULL,
    "UserName"  varchar(50)   NULL,
    "Timestamp" timestamp     NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),

    CONSTRAINT "PK_ActivityLogs" PRIMARY KEY ("Id")
);

CREATE INDEX IF NOT EXISTS "IX_ActivityLogs_Action" ON "ActivityLogs"("Action");
CREATE INDEX IF NOT EXISTS "IX_ActivityLogs_Level" ON "ActivityLogs"("Level");
CREATE INDEX IF NOT EXISTS "IX_ActivityLogs_Timestamp" ON "ActivityLogs"("Timestamp");

-- =============================================
-- FUNCTIONS (Postgres equivalent of SQL Server stored procedures)
-- Counts (likes/comments) are computed on the fly since no counter columns exist on BlogPosts/Profiles in the current schema.
-- =============================================

-- fn_get_home_feed: followed authors' posts + trending fallback from non-followed authors (last 7 days)
CREATE OR REPLACE FUNCTION fn_get_home_feed(
    p_user_id uuid,
    p_page_number int DEFAULT 1,
    p_page_size int DEFAULT 20
)
RETURNS TABLE (
    "Id" uuid,
    "AuthorId" uuid,
    "Title" varchar,
    "Slug" varchar,
    "Summary" varchar,
    "FeaturedImageUrl" varchar,
    "ViewCount" integer,
    "CreatedAt" timestamp,
    "AuthorUserName" varchar,
    "AuthorDisplayName" varchar,
    "AuthorAvatar" varchar,
    "LikeCount" bigint,
    "CommentCount" bigint,
    "FeedType" int,
    "IsLikedByCurrentUser" boolean,
    "TotalCount" bigint
) AS $$
DECLARE
    v_offset int := (p_page_number - 1) * p_page_size;
BEGIN
    RETURN QUERY
    WITH feed_posts AS (
        SELECT
            bp."Id", bp."AuthorId", bp."Title", bp."Slug", bp."Summary",
            bp."FeaturedImageUrl", bp."ViewCount", bp."CreatedAt",
            u."UserName" AS "AuthorUserName",
            pr."DisplayName" AS "AuthorDisplayName",
            pr."ProfilePictureUrl" AS "AuthorAvatar",
            (SELECT COUNT(*) FROM "Likes" l WHERE l."BlogPostId" = bp."Id") AS "LikeCount",
            (SELECT COUNT(*) FROM "Comments" c WHERE c."BlogPostId" = bp."Id" AND c."IsDeleted" = false) AS "CommentCount",
            1 AS "FeedType",
            EXISTS (SELECT 1 FROM "Likes" l WHERE l."BlogPostId" = bp."Id" AND l."UserId" = p_user_id) AS "IsLikedByCurrentUser"
        FROM "BlogPosts" bp
        INNER JOIN "Follows" f ON f."FollowingId" = bp."AuthorId"
        INNER JOIN "Users" u ON u."Id" = bp."AuthorId"
        LEFT JOIN "Profiles" pr ON pr."UserId" = bp."AuthorId"
        WHERE f."FollowerId" = p_user_id AND bp."IsPublished" = true AND bp."IsDeleted" = false

        UNION

        SELECT
            bp."Id", bp."AuthorId", bp."Title", bp."Slug", bp."Summary",
            bp."FeaturedImageUrl", bp."ViewCount", bp."CreatedAt",
            u."UserName" AS "AuthorUserName",
            pr."DisplayName" AS "AuthorDisplayName",
            pr."ProfilePictureUrl" AS "AuthorAvatar",
            (SELECT COUNT(*) FROM "Likes" l WHERE l."BlogPostId" = bp."Id") AS "LikeCount",
            (SELECT COUNT(*) FROM "Comments" c WHERE c."BlogPostId" = bp."Id" AND c."IsDeleted" = false) AS "CommentCount",
            2 AS "FeedType",
            EXISTS (SELECT 1 FROM "Likes" l WHERE l."BlogPostId" = bp."Id" AND l."UserId" = p_user_id) AS "IsLikedByCurrentUser"
        FROM "BlogPosts" bp
        INNER JOIN "Users" u ON u."Id" = bp."AuthorId"
        LEFT JOIN "Profiles" pr ON pr."UserId" = bp."AuthorId"
        WHERE bp."IsPublished" = true AND bp."IsDeleted" = false
          AND bp."CreatedAt" >= (now() AT TIME ZONE 'UTC') - INTERVAL '7 days'
          AND NOT EXISTS (SELECT 1 FROM "Follows" f WHERE f."FollowerId" = p_user_id AND f."FollowingId" = bp."AuthorId")
          AND bp."AuthorId" <> p_user_id
    )
    SELECT fp.*, COUNT(*) OVER() AS "TotalCount"
    FROM feed_posts fp
    ORDER BY fp."FeedType" ASC, fp."CreatedAt" DESC
    OFFSET v_offset LIMIT p_page_size;
END;
$$ LANGUAGE plpgsql STABLE;

-- fn_get_trending_posts: time-decayed trending score
CREATE OR REPLACE FUNCTION fn_get_trending_posts(
    p_days_back int DEFAULT 7,
    p_top_n int DEFAULT 50
)
RETURNS TABLE (
    "Id" uuid,
    "AuthorId" uuid,
    "Title" varchar,
    "Slug" varchar,
    "Summary" varchar,
    "FeaturedImageUrl" varchar,
    "ViewCount" integer,
    "CreatedAt" timestamp,
    "AuthorUserName" varchar,
    "AuthorDisplayName" varchar,
    "AuthorAvatar" varchar,
    "LikeCount" bigint,
    "CommentCount" bigint,
    "TrendingScore" numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        bp."Id", bp."AuthorId", bp."Title", bp."Slug", bp."Summary",
        bp."FeaturedImageUrl", bp."ViewCount", bp."CreatedAt",
        u."UserName" AS "AuthorUserName",
        pr."DisplayName" AS "AuthorDisplayName",
        pr."ProfilePictureUrl" AS "AuthorAvatar",
        (SELECT COUNT(*) FROM "Likes" l WHERE l."BlogPostId" = bp."Id") AS "LikeCount",
        (SELECT COUNT(*) FROM "Comments" c WHERE c."BlogPostId" = bp."Id" AND c."IsDeleted" = false) AS "CommentCount",
        (
            (SELECT COUNT(*) FROM "Likes" l WHERE l."BlogPostId" = bp."Id") * 3.0
            + (SELECT COUNT(*) FROM "Comments" c WHERE c."BlogPostId" = bp."Id" AND c."IsDeleted" = false) * 5.0
            + bp."ViewCount" * 0.1
        ) / POWER(EXTRACT(EPOCH FROM ((now() AT TIME ZONE 'UTC') - bp."CreatedAt")) / 3600 + 2, 1.5) AS "TrendingScore"
    FROM "BlogPosts" bp
    INNER JOIN "Users" u ON u."Id" = bp."AuthorId"
    LEFT JOIN "Profiles" pr ON pr."UserId" = bp."AuthorId"
    WHERE bp."IsPublished" = true AND bp."IsDeleted" = false
      AND bp."CreatedAt" >= (now() AT TIME ZONE 'UTC') - (p_days_back || ' days')::interval
      AND u."IsActive" = true
    ORDER BY "TrendingScore" DESC
    LIMIT p_top_n;
END;
$$ LANGUAGE plpgsql STABLE;

-- fn_toggle_post_like: returns the new liked state
CREATE OR REPLACE FUNCTION fn_toggle_post_like(
    p_user_id uuid,
    p_blog_post_id uuid
)
RETURNS boolean AS $$
DECLARE
    v_is_liked boolean;
BEGIN
    IF EXISTS (SELECT 1 FROM "Likes" WHERE "UserId" = p_user_id AND "BlogPostId" = p_blog_post_id) THEN
        DELETE FROM "Likes" WHERE "UserId" = p_user_id AND "BlogPostId" = p_blog_post_id;
        v_is_liked := false;
    ELSE
        INSERT INTO "Likes" ("Id", "UserId", "BlogPostId", "CreatedAt")
        VALUES (gen_random_uuid(), p_user_id, p_blog_post_id, now() AT TIME ZONE 'UTC');
        v_is_liked := true;
    END IF;
    RETURN v_is_liked;
END;
$$ LANGUAGE plpgsql;

-- fn_toggle_follow: returns the new following state
CREATE OR REPLACE FUNCTION fn_toggle_follow(
    p_follower_id uuid,
    p_following_id uuid
)
RETURNS boolean AS $$
DECLARE
    v_is_following boolean;
BEGIN
    IF p_follower_id = p_following_id THEN
        RAISE EXCEPTION 'Cannot follow yourself.';
    END IF;

    IF EXISTS (SELECT 1 FROM "Follows" WHERE "FollowerId" = p_follower_id AND "FollowingId" = p_following_id) THEN
        DELETE FROM "Follows" WHERE "FollowerId" = p_follower_id AND "FollowingId" = p_following_id;
        v_is_following := false;
    ELSE
        INSERT INTO "Follows" ("FollowerId", "FollowingId", "CreatedAt")
        VALUES (p_follower_id, p_following_id, now() AT TIME ZONE 'UTC');
        v_is_following := true;
    END IF;
    RETURN v_is_following;
END;
$$ LANGUAGE plpgsql;

-- fn_get_admin_dashboard_stats
CREATE OR REPLACE FUNCTION fn_get_admin_dashboard_stats()
RETURNS TABLE (
    "TotalUsers" bigint,
    "ActiveUsers" bigint,
    "NewUsersLast30Days" bigint,
    "TotalPosts" bigint,
    "PublishedPosts" bigint,
    "RemovedPosts" bigint,
    "NewPostsLast30Days" bigint,
    "TotalComments" bigint,
    "RemovedComments" bigint,
    "TotalLikes" bigint,
    "TotalFollows" bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM "Users"),
        (SELECT COUNT(*) FROM "Users" WHERE "IsActive" = true),
        (SELECT COUNT(*) FROM "Users" WHERE "CreatedAt" >= (now() AT TIME ZONE 'UTC') - INTERVAL '30 days'),
        (SELECT COUNT(*) FROM "BlogPosts" WHERE "IsDeleted" = false),
        (SELECT COUNT(*) FROM "BlogPosts" WHERE "IsPublished" = true AND "IsDeleted" = false),
        (SELECT COUNT(*) FROM "BlogPosts" WHERE "IsDeleted" = true),
        (SELECT COUNT(*) FROM "BlogPosts" WHERE "CreatedAt" >= (now() AT TIME ZONE 'UTC') - INTERVAL '30 days' AND "IsDeleted" = false),
        (SELECT COUNT(*) FROM "Comments" WHERE "IsDeleted" = false),
        (SELECT COUNT(*) FROM "Comments" WHERE "IsDeleted" = true),
        (SELECT COUNT(*) FROM "Likes"),
        (SELECT COUNT(*) FROM "Follows");
END;
$$ LANGUAGE plpgsql STABLE;

-- fn_moderate_post: soft-delete/restore via IsDeleted (matches AdminService.cs AdminDeletePostAsync pattern), logs to ActivityLogs
CREATE OR REPLACE FUNCTION fn_moderate_post(
    p_post_id uuid,
    p_moderator_name varchar,
    p_action varchar -- 'Remove' or 'Restore'
)
RETURNS void AS $$
BEGIN
    IF p_action = 'Remove' THEN
        UPDATE "BlogPosts" SET "IsDeleted" = true, "UpdatedAt" = (now() AT TIME ZONE 'UTC') WHERE "Id" = p_post_id;
    ELSIF p_action = 'Restore' THEN
        UPDATE "BlogPosts" SET "IsDeleted" = false, "UpdatedAt" = (now() AT TIME ZONE 'UTC') WHERE "Id" = p_post_id;
    END IF;

    INSERT INTO "ActivityLogs" ("Action", "Level", "Logger", "Message", "UserName", "Timestamp")
    VALUES ('AdminAction', 'Info', 'AdminService', 'Post ' || p_action || ': ' || p_post_id::text, p_moderator_name, now() AT TIME ZONE 'UTC');
END;
$$ LANGUAGE plpgsql;
