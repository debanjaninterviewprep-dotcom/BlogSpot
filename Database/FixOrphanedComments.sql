-- Diagnostic: find comments whose ParentCommentId points to a non-existent parent (orphaned replies)
SELECT c."Id", c."BlogPostId", c."ParentCommentId", c."Content", c."CreatedAt"
FROM "Comments" c
WHERE c."ParentCommentId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "Comments" p WHERE p."Id" = c."ParentCommentId");

-- Fix: promote orphaned replies back to top-level comments so they render on the post detail page
UPDATE "Comments" c
SET "ParentCommentId" = NULL
WHERE c."ParentCommentId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "Comments" p WHERE p."Id" = c."ParentCommentId");
