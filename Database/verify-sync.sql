-- Row counts used to verify the Neon backup sync.
-- Enumerates every base table in `public`, so tables added by future migrations
-- are covered automatically. query_to_xml is needed because plain SQL cannot
-- count a table whose name is only known at runtime.
SELECT table_name,
       (xpath('/row/c/text()', xml_count))[1]::text::bigint AS row_count
FROM (
    SELECT table_name,
           query_to_xml(format('SELECT count(*) AS c FROM public.%I', table_name),
                        false, true, '') AS xml_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
) counts
UNION ALL
SELECT '_TABLE_COUNT_', count(*)
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY 1;
