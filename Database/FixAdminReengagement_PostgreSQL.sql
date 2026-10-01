-- =============================================
-- Fix: Admin account should never have Reposts or Reading List Follows
-- (SeedPhase1Async used allUsers, incl. Admin, for reading-list followers; the Phase 1
-- engagement backfill script similarly used allUsers for Reposts — both unintentionally
-- gave the Admin account some reposts/follows. AdminService.SeedPhase2Async /
-- SeedEngagementExtrasAsync have been fixed in code to exclude Admin going forward.)
--
-- Safe to run multiple times (a second run just deletes 0 rows).
-- =============================================

-- Preview what will be deleted (uncomment to check first)
-- SELECT * FROM "Reposts" WHERE "UserId" IN (SELECT "Id" FROM "Users" WHERE "Role" = 'Admin');
-- SELECT * FROM "ReadingListFollows" WHERE "UserId" IN (SELECT "Id" FROM "Users" WHERE "Role" = 'Admin');

BEGIN;

DELETE FROM "Reposts"
WHERE "UserId" IN (SELECT "Id" FROM "Users" WHERE "Role" = 'Admin');

DELETE FROM "ReadingListFollows"
WHERE "UserId" IN (SELECT "Id" FROM "Users" WHERE "Role" = 'Admin');

COMMIT;
