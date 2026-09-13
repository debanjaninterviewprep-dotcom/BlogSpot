-- Row counts used to verify the Neon backup sync.
SELECT 'Users' AS table_name, count(*) AS row_count FROM public."Users"
UNION ALL SELECT 'BlogPosts', count(*) FROM public."BlogPosts"
UNION ALL SELECT 'Comments', count(*) FROM public."Comments"
UNION ALL SELECT 'Profiles', count(*) FROM public."Profiles"
UNION ALL SELECT 'Tags', count(*) FROM public."Tags"
UNION ALL SELECT 'Likes', count(*) FROM public."Likes"
UNION ALL SELECT 'Follows', count(*) FROM public."Follows"
UNION ALL SELECT 'Notifications', count(*) FROM public."Notifications"
UNION ALL SELECT 'ActivityLogs', count(*) FROM public."ActivityLogs"
UNION ALL SELECT 'Bookmarks', count(*) FROM public."Bookmarks"
UNION ALL SELECT 'DraftBlogs', count(*) FROM public."DraftBlogs"
UNION ALL SELECT '__EFMigrationsHistory', count(*) FROM public."__EFMigrationsHistory"
UNION ALL SELECT '_TABLE_COUNT_', count(*) FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY 1;
