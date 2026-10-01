-- =============================================
-- Phase 1 Engagement Backfill (Neon / PostgreSQL)
-- Fixes a gap where SeedPhase1Async() only ever created Likes + Comments:
-- adds Reactions (Love/Fire/Clap), Reposts, and Polls+Options+Votes for the
-- 34 Phase 1 blogs (Science/Sports/Cinema/Health/Travel).
--
-- Idempotent: every block only touches posts/polls that don't already have
-- that kind of engagement, so it is safe to run this more than once.
-- Run in the Neon SQL editor (or psql) against the production database.
-- =============================================

BEGIN;

-- Safety net: this Neon DB is missing some migrations entirely (confirmed: AddReactionCount's
-- "Count" column AND the whole AddReposts table were never applied, despite being later than
-- AddReadingLists in migration order) — recreate everything this script needs so it isn't
-- blocked. Mirrors the exact DDL in Database/BlogSpot_FullSetup_PostgreSQL.sql; harmless no-op
-- if a table/column already exists. Check "__EFMigrationsHistory" separately to find out why
-- these never applied (e.g. a history row may have been inserted without the DDL actually running).
ALTER TABLE "Reactions" ADD COLUMN IF NOT EXISTS "Count" integer NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS "Reposts"
(
    "Id"         uuid          NOT NULL DEFAULT gen_random_uuid(),
    "BlogPostId" uuid          NOT NULL,
    "UserId"     uuid          NOT NULL,
    "Quote"      varchar(280)  NULL,
    "CreatedAt"  timestamp     NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    "UpdatedAt"  timestamp     NULL,

    CONSTRAINT "PK_Reposts" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Reposts_BlogPosts" FOREIGN KEY ("BlogPostId")
        REFERENCES "BlogPosts"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Reposts_Users" FOREIGN KEY ("UserId")
        REFERENCES "Users"("Id") ON DELETE NO ACTION,
    CONSTRAINT "UQ_Reposts_User_Post" UNIQUE ("UserId", "BlogPostId")
);
CREATE INDEX IF NOT EXISTS "IX_Reposts_BlogPostId" ON "Reposts"("BlogPostId");

CREATE TABLE IF NOT EXISTS "Polls"
(
    "Id"         uuid          NOT NULL DEFAULT gen_random_uuid(),
    "BlogPostId" uuid          NOT NULL,
    "Question"   varchar(200)  NOT NULL,
    "ExpiresAt"  timestamp     NULL,
    "CreatedAt"  timestamp     NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    "UpdatedAt"  timestamp     NULL,

    CONSTRAINT "PK_Polls" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Polls_BlogPosts" FOREIGN KEY ("BlogPostId")
        REFERENCES "BlogPosts"("Id") ON DELETE CASCADE,
    CONSTRAINT "UQ_Polls_BlogPostId" UNIQUE ("BlogPostId")
);

CREATE TABLE IF NOT EXISTS "PollOptions"
(
    "Id"        uuid         NOT NULL DEFAULT gen_random_uuid(),
    "PollId"    uuid         NOT NULL,
    "Text"      varchar(100) NOT NULL,
    "SortOrder" integer      NOT NULL DEFAULT 0,
    "CreatedAt" timestamp    NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    "UpdatedAt" timestamp    NULL,

    CONSTRAINT "PK_PollOptions" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_PollOptions_Polls" FOREIGN KEY ("PollId")
        REFERENCES "Polls"("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_PollOptions_PollId" ON "PollOptions"("PollId");

CREATE TABLE IF NOT EXISTS "PollVotes"
(
    "Id"           uuid      NOT NULL DEFAULT gen_random_uuid(),
    "PollOptionId" uuid      NOT NULL,
    "UserId"       uuid      NOT NULL,
    "CreatedAt"    timestamp NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    "UpdatedAt"    timestamp NULL,

    CONSTRAINT "PK_PollVotes" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_PollVotes_PollOptions" FOREIGN KEY ("PollOptionId")
        REFERENCES "PollOptions"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_PollVotes_Users" FOREIGN KEY ("UserId")
        REFERENCES "Users"("Id") ON DELETE NO ACTION,
    CONSTRAINT "UQ_PollVotes_User_Option" UNIQUE ("UserId", "PollOptionId")
);
CREATE INDEX IF NOT EXISTS "IX_PollVotes_PollOptionId" ON "PollVotes"("PollOptionId");

-- ---------------------------------------------
-- 1. REACTIONS: 8-25 random reactors per post, mix of Love/Fire/Clap
--    (only for Phase 1 posts that currently have zero reactions)
-- ---------------------------------------------
WITH phase1_posts AS (
    SELECT "Id", "AuthorId", (8 + floor(random() * 18))::int AS reactor_limit -- 8-25 inclusive
    FROM "BlogPosts"
    WHERE "Category" IN ('Science', 'Sports', 'Cinema', 'Health', 'Travel')
      AND "IsDeleted" = false
      AND NOT EXISTS (SELECT 1 FROM "Reactions" r WHERE r."BlogPostId" = "BlogPosts"."Id")
),
ranked AS (
    SELECT
        p."Id" AS "BlogPostId",
        p.reactor_limit,
        u."Id" AS "UserId",
        (ARRAY['Love', 'Fire', 'Clap'])[1 + floor(random() * 3)::int] AS "Type",
        row_number() OVER (PARTITION BY p."Id" ORDER BY random()) AS rn
    FROM phase1_posts p
    CROSS JOIN "Users" u
)
INSERT INTO "Reactions" ("Id", "BlogPostId", "UserId", "Type", "Count", "CreatedAt")
SELECT
    gen_random_uuid(),
    "BlogPostId",
    "UserId",
    "Type",
    CASE WHEN "Type" = 'Clap' THEN (1 + floor(random() * 50))::int ELSE 1 END, -- Clap cap 1-50, matches BlogService.MaxClapCount
    now() AT TIME ZONE 'UTC'
FROM ranked
WHERE rn <= reactor_limit
ON CONFLICT ("UserId", "BlogPostId", "Type") DO NOTHING;

-- ---------------------------------------------
-- 2. REPOSTS: 2-5 random reposters per post (never the author), ~40% include a quote
--    (only for Phase 1 posts that currently have zero reposts)
-- ---------------------------------------------
WITH phase1_posts AS (
    SELECT "Id", "AuthorId", (2 + floor(random() * 4))::int AS reposter_limit -- 2-5 inclusive
    FROM "BlogPosts"
    WHERE "Category" IN ('Science', 'Sports', 'Cinema', 'Health', 'Travel')
      AND "IsDeleted" = false
      AND NOT EXISTS (SELECT 1 FROM "Reposts" r WHERE r."BlogPostId" = "BlogPosts"."Id")
),
ranked AS (
    SELECT
        p."Id" AS "BlogPostId",
        p.reposter_limit,
        u."Id" AS "UserId",
        row_number() OVER (PARTITION BY p."Id" ORDER BY random()) AS rn
    FROM phase1_posts p
    CROSS JOIN "Users" u
    WHERE u."Id" != p."AuthorId"
)
INSERT INTO "Reposts" ("Id", "BlogPostId", "UserId", "Quote", "CreatedAt")
SELECT
    gen_random_uuid(),
    "BlogPostId",
    "UserId",
    CASE WHEN random() < 0.4 THEN
        (ARRAY[
            'This is a must-read!',
            'Sharing this with everyone I know.',
            'Such an important perspective.',
            'Couldn''t agree more with this.',
            'Everyone needs to see this.',
            'Adding this to my reading list.',
            'Well worth the read.',
            'This changed how I think about the topic.'
        ])[1 + floor(random() * 8)::int]
    ELSE NULL END,
    now() AT TIME ZONE 'UTC'
FROM ranked
WHERE rn <= reposter_limit
ON CONFLICT ("UserId", "BlogPostId") DO NOTHING;

-- ---------------------------------------------
-- 3. POLLS: only for the 19 Phase 1 blogs authored with poll data (phase1-*.json "withPoll": true)
--    (only creates a poll if that post doesn't already have one, per UQ_Polls_BlogPostId)
-- ---------------------------------------------
INSERT INTO "Polls" ("Id", "BlogPostId", "Question", "ExpiresAt", "CreatedAt")
SELECT gen_random_uuid(), bp."Id", v.question, NULL, now() AT TIME ZONE 'UTC'
FROM (VALUES
    ('Quantum Computing: The Next Frontier of Technology', 'What aspect of quantum computing interests you most?'),
    ('Exoplanets and the Search for Extraterrestrial Life', 'Where do you think extraterrestrial life is most likely to be found?'),
    ('Neuroscience Breakthroughs: Understanding the Human Brain', 'Which neuroscience breakthrough excites you most?'),
    ('The Microbiome Revolution: How Tiny Organisms Shape Our Health', 'What''s your biggest health concern related to microbiome?'),
    ('Football: The Beautiful Game and Global Phenomenon', 'Who is the greatest footballer of all time?'),
    ('Basketball: A Global Sport Breaking Barriers', 'Greatest basketball player ever?'),
    ('The Olympics: Celebrating Human Excellence and Global Unity', 'What''s your favorite Olympic sport?'),
    ('Extreme Sports: Pushing the Boundaries of Human Capability', 'Which extreme sport seems most thrilling?'),
    ('Bollywood: The Heartbeat of Indian Cinema', 'Greatest Bollywood actor of all time?'),
    ('Web Series Revolution: How Streaming Content Changed Entertainment', 'Best streaming web series ever?'),
    ('Celebrity Culture: Fame, Influence, and Responsibility', 'How should we view celebrity activism?'),
    ('Comedy and Stand-Up: Making People Laugh Through Wisdom', 'Greatest stand-up comedian?'),
    ('Mental Health Matters: Understanding and Managing Mental Wellness', 'What most impacts your mental health?'),
    ('Sleep Science: Why Rest is Essential for Health and Performance', 'What most disrupts your sleep?'),
    ('Fitness Transformation Stories: Overcoming Obstacles and Achieving Health Goals', 'What''s your biggest fitness challenge?'),
    ('Exploring Southeast Asia: A Traveler''s Guide to Culture and Adventure', 'What attracts you most to Southeast Asia?'),
    ('Cultural Immersion: Learning Languages and Understanding Different Traditions', 'What aspects of cultural immersion interest you most?'),
    ('UNESCO World Heritage Sites: Preserving Humanity''s Cultural Treasures', 'Which UNESCO site interests you most?'),
    ('Sustainable Tourism: Traveling Responsibly for Planet and People', 'Which sustainable practice concerns you most?')
) AS v(title, question)
JOIN "BlogPosts" bp ON bp."Title" = v.title
ON CONFLICT ("BlogPostId") DO NOTHING;

-- ---------------------------------------------
-- 4. POLL OPTIONS: options for each poll above, in the same order as the phase1-*.json "pollOptions"
--    (guarded against re-insert if the poll/options already exist from a prior run)
-- ---------------------------------------------
INSERT INTO "PollOptions" ("Id", "PollId", "Text", "SortOrder", "CreatedAt")
SELECT gen_random_uuid(), pl."Id", v.option_text, v.sort_order, now() AT TIME ZONE 'UTC'
FROM (VALUES
    ('Quantum Computing: The Next Frontier of Technology', 'Drug Discovery & Medicine', 0),
    ('Quantum Computing: The Next Frontier of Technology', 'Cryptography & Security', 1),
    ('Quantum Computing: The Next Frontier of Technology', 'AI & Machine Learning', 2),
    ('Quantum Computing: The Next Frontier of Technology', 'Financial Optimization', 3),
    ('Quantum Computing: The Next Frontier of Technology', 'Climate Modeling', 4),

    ('Exoplanets and the Search for Extraterrestrial Life', 'Ocean Worlds (Europa, Enceladus)', 0),
    ('Exoplanets and the Search for Extraterrestrial Life', 'Rocky Exoplanets', 1),
    ('Exoplanets and the Search for Extraterrestrial Life', 'Venus-like Planets', 2),
    ('Exoplanets and the Search for Extraterrestrial Life', 'Inside Asteroids', 3),
    ('Exoplanets and the Search for Extraterrestrial Life', 'We''re Probably Alone', 4),

    ('Neuroscience Breakthroughs: Understanding the Human Brain', 'Brain-Computer Interfaces', 0),
    ('Neuroscience Breakthroughs: Understanding the Human Brain', 'Understanding Consciousness', 1),
    ('Neuroscience Breakthroughs: Understanding the Human Brain', 'Treating Neurological Disease', 2),
    ('Neuroscience Breakthroughs: Understanding the Human Brain', 'Neuroplasticity & Learning', 3),
    ('Neuroscience Breakthroughs: Understanding the Human Brain', 'Memory and Aging', 4),

    ('The Microbiome Revolution: How Tiny Organisms Shape Our Health', 'Digestive Health', 0),
    ('The Microbiome Revolution: How Tiny Organisms Shape Our Health', 'Immune Function', 1),
    ('The Microbiome Revolution: How Tiny Organisms Shape Our Health', 'Mental Health', 2),
    ('The Microbiome Revolution: How Tiny Organisms Shape Our Health', 'Weight Management', 3),
    ('The Microbiome Revolution: How Tiny Organisms Shape Our Health', 'Allergies/Inflammation', 4),

    ('Football: The Beautiful Game and Global Phenomenon', 'Pelé', 0),
    ('Football: The Beautiful Game and Global Phenomenon', 'Diego Maradona', 1),
    ('Football: The Beautiful Game and Global Phenomenon', 'Johan Cruyff', 2),
    ('Football: The Beautiful Game and Global Phenomenon', 'Messi', 3),
    ('Football: The Beautiful Game and Global Phenomenon', 'Ronaldo', 4),
    ('Football: The Beautiful Game and Global Phenomenon', 'Other', 5),

    ('Basketball: A Global Sport Breaking Barriers', 'Michael Jordan', 0),
    ('Basketball: A Global Sport Breaking Barriers', 'LeBron James', 1),
    ('Basketball: A Global Sport Breaking Barriers', 'Kareem Abdul-Jabbar', 2),
    ('Basketball: A Global Sport Breaking Barriers', 'Kobe Bryant', 3),
    ('Basketball: A Global Sport Breaking Barriers', 'Wilt Chamberlain', 4),

    ('The Olympics: Celebrating Human Excellence and Global Unity', 'Track & Field', 0),
    ('The Olympics: Celebrating Human Excellence and Global Unity', 'Swimming', 1),
    ('The Olympics: Celebrating Human Excellence and Global Unity', 'Gymnastics', 2),
    ('The Olympics: Celebrating Human Excellence and Global Unity', 'Basketball', 3),
    ('The Olympics: Celebrating Human Excellence and Global Unity', 'Soccer', 4),
    ('The Olympics: Celebrating Human Excellence and Global Unity', 'Other', 5),

    ('Extreme Sports: Pushing the Boundaries of Human Capability', 'Rock Climbing', 0),
    ('Extreme Sports: Pushing the Boundaries of Human Capability', 'Skydiving', 1),
    ('Extreme Sports: Pushing the Boundaries of Human Capability', 'Big Wave Surfing', 2),
    ('Extreme Sports: Pushing the Boundaries of Human Capability', 'BASE Jumping', 3),
    ('Extreme Sports: Pushing the Boundaries of Human Capability', 'Free Solo Climbing', 4),

    ('Bollywood: The Heartbeat of Indian Cinema', 'Amitabh Bachchan', 0),
    ('Bollywood: The Heartbeat of Indian Cinema', 'Shah Rukh Khan', 1),
    ('Bollywood: The Heartbeat of Indian Cinema', 'Dilip Kumar', 2),
    ('Bollywood: The Heartbeat of Indian Cinema', 'Rajesh Khanna', 3),
    ('Bollywood: The Heartbeat of Indian Cinema', 'Aamir Khan', 4),

    ('Web Series Revolution: How Streaming Content Changed Entertainment', 'Breaking Bad', 0),
    ('Web Series Revolution: How Streaming Content Changed Entertainment', 'Game of Thrones', 1),
    ('Web Series Revolution: How Streaming Content Changed Entertainment', 'The Crown', 2),
    ('Web Series Revolution: How Streaming Content Changed Entertainment', 'Squid Game', 3),
    ('Web Series Revolution: How Streaming Content Changed Entertainment', 'Stranger Things', 4),
    ('Web Series Revolution: How Streaming Content Changed Entertainment', 'The Last of Us', 5),

    ('Celebrity Culture: Fame, Influence, and Responsibility', 'Valuable awareness raising', 0),
    ('Celebrity Culture: Fame, Influence, and Responsibility', 'Often performative', 1),
    ('Celebrity Culture: Fame, Influence, and Responsibility', 'Celebrities should stay quiet', 2),
    ('Celebrity Culture: Fame, Influence, and Responsibility', 'Depends on the cause', 3),
    ('Celebrity Culture: Fame, Influence, and Responsibility', 'Need more accountability', 4),

    ('Comedy and Stand-Up: Making People Laugh Through Wisdom', 'George Carlin', 0),
    ('Comedy and Stand-Up: Making People Laugh Through Wisdom', 'Richard Pryor', 1),
    ('Comedy and Stand-Up: Making People Laugh Through Wisdom', 'Jerry Seinfeld', 2),
    ('Comedy and Stand-Up: Making People Laugh Through Wisdom', 'Dave Chappelle', 3),
    ('Comedy and Stand-Up: Making People Laugh Through Wisdom', 'Amy Schumer', 4),
    ('Comedy and Stand-Up: Making People Laugh Through Wisdom', 'John Mulaney', 5),

    ('Mental Health Matters: Understanding and Managing Mental Wellness', 'Social Relationships', 0),
    ('Mental Health Matters: Understanding and Managing Mental Wellness', 'Work Stress', 1),
    ('Mental Health Matters: Understanding and Managing Mental Wellness', 'Physical Exercise', 2),
    ('Mental Health Matters: Understanding and Managing Mental Wellness', 'Sleep Quality', 3),
    ('Mental Health Matters: Understanding and Managing Mental Wellness', 'Financial Security', 4),

    ('Sleep Science: Why Rest is Essential for Health and Performance', 'Work Stress', 0),
    ('Sleep Science: Why Rest is Essential for Health and Performance', 'Social Media/Screens', 1),
    ('Sleep Science: Why Rest is Essential for Health and Performance', 'Caffeine', 2),
    ('Sleep Science: Why Rest is Essential for Health and Performance', 'Irregular Schedule', 3),
    ('Sleep Science: Why Rest is Essential for Health and Performance', 'Sleep Disorders', 4),

    ('Fitness Transformation Stories: Overcoming Obstacles and Achieving Health Goals', 'Motivation & Consistency', 0),
    ('Fitness Transformation Stories: Overcoming Obstacles and Achieving Health Goals', 'Time Management', 1),
    ('Fitness Transformation Stories: Overcoming Obstacles and Achieving Health Goals', 'Nutrition/Diet', 2),
    ('Fitness Transformation Stories: Overcoming Obstacles and Achieving Health Goals', 'Injury Recovery', 3),
    ('Fitness Transformation Stories: Overcoming Obstacles and Achieving Health Goals', 'Setting Realistic Goals', 4),

    ('Exploring Southeast Asia: A Traveler''s Guide to Culture and Adventure', 'Ancient Temples', 0),
    ('Exploring Southeast Asia: A Traveler''s Guide to Culture and Adventure', 'Beaches & Nature', 1),
    ('Exploring Southeast Asia: A Traveler''s Guide to Culture and Adventure', 'Food & Culture', 2),
    ('Exploring Southeast Asia: A Traveler''s Guide to Culture and Adventure', 'Budget-friendly', 3),
    ('Exploring Southeast Asia: A Traveler''s Guide to Culture and Adventure', 'Spiritual Retreats', 4),

    ('Cultural Immersion: Learning Languages and Understanding Different Traditions', 'Language Learning', 0),
    ('Cultural Immersion: Learning Languages and Understanding Different Traditions', 'Local Food & Cooking', 1),
    ('Cultural Immersion: Learning Languages and Understanding Different Traditions', 'Traditional Arts & Crafts', 2),
    ('Cultural Immersion: Learning Languages and Understanding Different Traditions', 'Religious/Spiritual Sites', 3),
    ('Cultural Immersion: Learning Languages and Understanding Different Traditions', 'Community Participation', 4),

    ('UNESCO World Heritage Sites: Preserving Humanity''s Cultural Treasures', 'Ancient Temples', 0),
    ('UNESCO World Heritage Sites: Preserving Humanity''s Cultural Treasures', 'Archaeological Ruins', 1),
    ('UNESCO World Heritage Sites: Preserving Humanity''s Cultural Treasures', 'Natural Landscapes', 2),
    ('UNESCO World Heritage Sites: Preserving Humanity''s Cultural Treasures', 'Historic Cities', 3),
    ('UNESCO World Heritage Sites: Preserving Humanity''s Cultural Treasures', 'Industrial Heritage', 4),

    ('Sustainable Tourism: Traveling Responsibly for Planet and People', 'Carbon Emissions', 0),
    ('Sustainable Tourism: Traveling Responsibly for Planet and People', 'Water & Waste', 1),
    ('Sustainable Tourism: Traveling Responsibly for Planet and People', 'Habitat Destruction', 2),
    ('Sustainable Tourism: Traveling Responsibly for Planet and People', 'Community Displacement', 3),
    ('Sustainable Tourism: Traveling Responsibly for Planet and People', 'Cultural Commodification', 4)
) AS v(title, option_text, sort_order)
JOIN "BlogPosts" bp ON bp."Title" = v.title
JOIN "Polls" pl ON pl."BlogPostId" = bp."Id"
WHERE NOT EXISTS (
    SELECT 1 FROM "PollOptions" po WHERE po."PollId" = pl."Id" AND po."Text" = v.option_text
);

-- ---------------------------------------------
-- 5. POLL VOTES: 10-40 random distinct voters per poll, one vote per user per poll
--    (only for polls that currently have zero votes)
-- ---------------------------------------------
WITH poll_meta AS (
    SELECT pl."Id" AS "PollId", (10 + floor(random() * 31))::int AS voter_limit -- 10-40 inclusive
    FROM "Polls" pl
    JOIN "BlogPosts" bp ON bp."Id" = pl."BlogPostId"
    WHERE bp."Category" IN ('Science', 'Sports', 'Cinema', 'Health', 'Travel')
      AND NOT EXISTS (
          SELECT 1 FROM "PollVotes" pv
          JOIN "PollOptions" po ON po."Id" = pv."PollOptionId"
          WHERE po."PollId" = pl."Id"
      )
),
ranked_voters AS (
    SELECT
        pm."PollId",
        pm.voter_limit,
        u."Id" AS "UserId",
        row_number() OVER (PARTITION BY pm."PollId" ORDER BY random()) AS rn
    FROM poll_meta pm
    CROSS JOIN "Users" u
),
chosen_voters AS (
    SELECT "PollId", "UserId" FROM ranked_voters WHERE rn <= voter_limit
)
INSERT INTO "PollVotes" ("Id", "PollOptionId", "UserId", "CreatedAt")
SELECT
    gen_random_uuid(),
    (SELECT po."Id" FROM "PollOptions" po WHERE po."PollId" = cv."PollId" ORDER BY random() LIMIT 1),
    cv."UserId",
    now() AT TIME ZONE 'UTC'
FROM chosen_voters cv
ON CONFLICT ("UserId", "PollOptionId") DO NOTHING;

COMMIT;

-- ---------------------------------------------
-- VERIFY: run after commit to confirm the backfill
-- ---------------------------------------------
-- SELECT bp."Title", bp."Category",
--        (SELECT count(*) FROM "Reactions" r WHERE r."BlogPostId" = bp."Id") AS reactions,
--        (SELECT count(*) FROM "Reposts" rp WHERE rp."BlogPostId" = bp."Id") AS reposts,
--        (SELECT count(*) FROM "Polls" pl WHERE pl."BlogPostId" = bp."Id") AS has_poll
-- FROM "BlogPosts" bp
-- WHERE bp."Category" IN ('Science', 'Sports', 'Cinema', 'Health', 'Travel')
-- ORDER BY bp."Category", bp."Title";
