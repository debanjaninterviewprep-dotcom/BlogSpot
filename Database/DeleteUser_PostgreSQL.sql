-- =============================================
-- Hard-delete a user and every record related to them (Neon / PostgreSQL).
--
-- Why this is not a single "DELETE FROM Users": most FKs pointing at Users are
-- ON DELETE NO ACTION, not CASCADE, so a plain delete fails with a FK violation.
-- Only Profiles, BlogPosts, CommentLikes and Notifications.UserId cascade.
-- Everything else has to be removed explicitly, in dependency order.
--
-- Set the target on the SELECT ... INTO below (by UserName or Email), then run.
-- The whole block is one implicit transaction: any error rolls it all back.
-- =============================================

DO $$
DECLARE
    v_user_id  uuid;
    v_username varchar(50);
    v_email    text;
BEGIN
    ---------------------------------------------------------------
    -- Target user. Swap to "Email" = '...' if you prefer.
    ---------------------------------------------------------------
    SELECT "Id", "UserName", "Email"
      INTO v_user_id, v_username, v_email
      FROM "Users"
     WHERE "UserName" = 'REPLACE_WITH_USERNAME';

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found — nothing deleted.';
    END IF;

    RAISE NOTICE 'Deleting user % (%)', v_username, v_user_id;

    ---------------------------------------------------------------
    -- 1. Comments written by the user, plus every reply underneath them.
    --    Comments.ParentCommentId is NO ACTION, so replies left behind by
    --    OTHER users would block the delete. The recursive CTE walks the
    --    whole subtree. CommentLikes cascade off Comments automatically.
    ---------------------------------------------------------------
    WITH RECURSIVE comment_tree AS (
        SELECT "Id"
          FROM "Comments"
         WHERE "UserId" = v_user_id
        UNION ALL
        SELECT c."Id"
          FROM "Comments" c
          JOIN comment_tree t ON c."ParentCommentId" = t."Id"
    )
    DELETE FROM "Comments"
     WHERE "Id" IN (SELECT "Id" FROM comment_tree);

    ---------------------------------------------------------------
    -- 2. Engagement the user produced on other people's content.
    ---------------------------------------------------------------
    DELETE FROM "CommentLikes"        WHERE "UserId"      = v_user_id;  -- cascades anyway, explicit for clarity
    DELETE FROM "Likes"               WHERE "UserId"      = v_user_id;
    DELETE FROM "Reactions"           WHERE "UserId"      = v_user_id;
    DELETE FROM "Bookmarks"           WHERE "UserId"      = v_user_id;
    DELETE FROM "Reposts"             WHERE "UserId"      = v_user_id;
    DELETE FROM "PollVotes"           WHERE "UserId"      = v_user_id;
    DELETE FROM "ReadingListFollows"  WHERE "UserId"      = v_user_id;  -- lists of others they followed

    ---------------------------------------------------------------
    -- 3. The user's own reading lists.
    --    Cascades to ReadingListItems and to other users' follows of them.
    ---------------------------------------------------------------
    DELETE FROM "ReadingLists" WHERE "UserId" = v_user_id;

    ---------------------------------------------------------------
    -- 4. Social graph + notifications they triggered.
    --    Notifications.UserId cascades; ActorId does not.
    ---------------------------------------------------------------
    DELETE FROM "Follows"       WHERE "FollowerId" = v_user_id
                                   OR "FollowingId" = v_user_id;
    DELETE FROM "Notifications" WHERE "ActorId"    = v_user_id;

    ---------------------------------------------------------------
    -- 5. Drafts (column is AuthorId, not UserId).
    ---------------------------------------------------------------
    DELETE FROM "DraftBlogs" WHERE "AuthorId" = v_user_id;

    ---------------------------------------------------------------
    -- 6. The user's posts. This one cascade cleans up a lot:
    --    BlogPostTags, PostImages, Comments on the post (any author),
    --    Likes / Reactions / Bookmarks / Reposts (any user),
    --    ReadingListItems referencing the post, and
    --    Polls -> PollOptions -> PollVotes.
    --    DraftBlogs.BlogPostId is SET NULL, so other drafts survive.
    ---------------------------------------------------------------
    DELETE FROM "BlogPosts" WHERE "AuthorId" = v_user_id;

    ---------------------------------------------------------------
    -- 7. The user row itself. Profiles and received Notifications cascade.
    ---------------------------------------------------------------
    DELETE FROM "Users" WHERE "Id" = v_user_id;

    ---------------------------------------------------------------
    -- 8. Tables with no FK to Users — matched by value, so clean them by hand.
    ---------------------------------------------------------------
    DELETE FROM "OtpVerifications" WHERE "Email" = v_email;

    -- Audit/history. Comment these out if you want to keep the trail.
    DELETE FROM "EmailQueues"  WHERE "ToEmail"  = v_email;
    DELETE FROM "ActivityLogs" WHERE "UserName" = v_username;

    RAISE NOTICE 'Done. User % removed.', v_username;
END $$;


-- =============================================
-- Optional: dry run. Run this FIRST to see what would be removed.
-- Replace the username in both places.
-- =============================================
-- WITH u AS (SELECT "Id", "UserName", "Email" FROM "Users" WHERE "UserName" = 'REPLACE_WITH_USERNAME')
-- SELECT 'BlogPosts'          AS "table", count(*) FROM "BlogPosts"         p, u WHERE p."AuthorId"   = u."Id"
-- UNION ALL SELECT 'Comments',           count(*) FROM "Comments"          c, u WHERE c."UserId"     = u."Id"
-- UNION ALL SELECT 'Likes',              count(*) FROM "Likes"             l, u WHERE l."UserId"     = u."Id"
-- UNION ALL SELECT 'Reactions',          count(*) FROM "Reactions"         r, u WHERE r."UserId"     = u."Id"
-- UNION ALL SELECT 'Bookmarks',          count(*) FROM "Bookmarks"         b, u WHERE b."UserId"     = u."Id"
-- UNION ALL SELECT 'Reposts',            count(*) FROM "Reposts"           rp, u WHERE rp."UserId"   = u."Id"
-- UNION ALL SELECT 'PollVotes',          count(*) FROM "PollVotes"         pv, u WHERE pv."UserId"   = u."Id"
-- UNION ALL SELECT 'ReadingLists',       count(*) FROM "ReadingLists"      rl, u WHERE rl."UserId"   = u."Id"
-- UNION ALL SELECT 'ReadingListFollows', count(*) FROM "ReadingListFollows" rf, u WHERE rf."UserId"  = u."Id"
-- UNION ALL SELECT 'DraftBlogs',         count(*) FROM "DraftBlogs"        d, u WHERE d."AuthorId"   = u."Id"
-- UNION ALL SELECT 'Follows',            count(*) FROM "Follows"           f, u WHERE f."FollowerId" = u."Id" OR f."FollowingId" = u."Id"
-- UNION ALL SELECT 'Notifications',      count(*) FROM "Notifications"     n, u WHERE n."UserId"     = u."Id" OR n."ActorId"     = u."Id";
