# High-Impact Feature Additions

### 1. Post Scheduling & Publishing Queue
Allow creators to write posts and schedule them for future publishing. Add a `Scheduled` status with a `ScheduledPublishAt` field and a background job to auto-publish.

### 2. Series/Collections
Let authors group related posts into a series (e.g., "Learn C# in 30 days"). Increases session time and gives creators a way to structure long-form content.

### 3. Newsletter/Subscription System
Followers get email digests (daily/weekly) of new posts from people they follow. The email queue infrastructure already exists — this layers on top.

### 4. Reading History & "Continue Reading"
Track which posts a user has partially read (scroll position) and surface a "Continue Reading" section in the feed.

### 5. Post Analytics for Creators (Time-Series)
Current analytics only show totals. Add daily/weekly/monthly breakdowns — views over time, follower growth charts, top-performing posts by period.
