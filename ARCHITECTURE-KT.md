# BLOGSPOT — COMPLETE ARCHITECTURE WALKTHROUGH & KNOWLEDGE TRANSFER

---

# PHASE 1 — EXECUTIVE SUMMARY

## 1. Application Name
**BlogSpot** — A full-stack blogging and social platform.

## 2. Business Purpose
A Medium/Dev.to-style blogging platform where users create, publish, and discover blog posts, follow other creators, react with emoji, comment, bookmark, and receive real-time notifications.

## 3. Problem It Solves
Provides a modern content publishing and discovery experience with social engagement features — eliminating the need for users to rely on generic CMS tools that lack community interaction.

## 4. Primary Users
| Role | Description |
|------|-------------|
| **Reader** | Browses feed, searches, reads posts, reacts, comments, follows creators |
| **Creator** | Writes blog posts (rich text with Quill editor), tracks analytics, manages drafts |
| **Admin** | Manages users, moderates posts/comments, seeds data, views activity logs, sends emails |

## 5. Key Features
- OTP-based registration with email verification
- JWT authentication with refresh tokens
- Rich text blog editor (Quill) with grammar checking (LanguageTool API)
- Draft auto-save and post scheduling (future auto-publish with IST email confirmation + "now live" alert)
- Emoji reactions (Like, Love, Fire, Clap), bookmarks, threaded comments
- Personalized home feed, trending, latest feeds
- Follow/unfollow with suggested users
- Real-time notifications via SignalR WebSockets
- Creator analytics dashboard (views, reactions, followers growth)
- Admin panel (user management, moderation, email queue, data seeding)
- Dark/light theme toggle
- Excel export for admin data
- Responsive design (mobile, tablet, desktop)

## 6. High-Level Architecture Overview
Clean Architecture (.NET 8 backend) + Angular 17 SPA frontend, communicating over REST + SignalR WebSocket.

## 7. Technology Stack Summary
| Layer | Technology |
|-------|-----------|
| Frontend | Angular 17, Angular Material, RxJS, Quill Editor, SignalR Client |
| Backend | .NET 8, ASP.NET Core Web API, Entity Framework Core 8 |
| Database | SQL Server (dev) / PostgreSQL (prod, Neon) |
| Auth | JWT Bearer + Refresh Tokens, BCrypt password hashing |
| Real-time | ASP.NET Core SignalR |
| Background Jobs | EmailProcessorJob (email queue), PostSchedulerService (scheduled-post publishing) |
| Email | Brevo (Sendinblue) API, background EmailProcessorJob |
| File Storage | Cloudinary (prod) / local wwwroot (dev) |
| Logging | Serilog (console + file) + custom ActivityLog table |
| Containerization | Docker, Docker Compose |
| Deployment | Render (API), Vercel (Angular), Neon (PostgreSQL) |

### System Context Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SYSTEMS                          │
│                                                                  │
│   ┌──────────┐   ┌──────────────┐   ┌──────────────────────┐    │
│   │  Brevo   │   │  Cloudinary  │   │  LanguageTool API    │    │
│   │(Email API)│   │ (Image CDN) │   │  (Grammar Check)     │    │
│   └─────▲────┘   └──────▲───────┘   └──────────▲───────────┘    │
│         │               │                      │                 │
└─────────┼───────────────┼──────────────────────┼─────────────────┘
          │               │                      │
┌─────────┼───────────────┼──────────────────────┼─────────────────┐
│         │        BLOGSPOT SYSTEM               │                 │
│   ┌─────┴─────────┴───────────┐    ┌───────────┴──────────┐     │
│   │  .NET 8 Web API           │    │  Angular 17 SPA      │     │
│   │  (REST + SignalR)         │◄───┤  (Vercel)            │     │
│   │  (Render)                 │    │                      │     │
│   └───────────┬───────────────┘    └──────────────────────┘     │
│               │                                                  │
│   ┌───────────▼───────────────┐                                  │
│   │  PostgreSQL (Neon) /      │                                  │
│   │  SQL Server (local dev)   │                                  │
│   └───────────────────────────┘                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Architecture Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ANGULAR 17 SPA                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────┐ ┌─────────┐     │
│  │  Auth    │ │  Feed    │ │  Blog    │ │Profile│ │  Admin  │     │
│  │ Module   │ │ Module   │ │ Module   │ │Module │ │ Module  │     │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬───┘ └────┬────┘     │
│       │            │            │            │          │           │
│  ┌────▼────────────▼────────────▼────────────▼──────────▼────┐     │
│  │              Core Services Layer                          │     │
│  │  AuthService │ BlogService │ UserService │ FeedService    │     │
│  │  SignalR     │ Notification│ Theme       │ SearchCache    │     │
│  └──────────────────────┬────────────────────────────────────┘     │
│                         │ HTTP + WebSocket                         │
└─────────────────────────┼──────────────────────────────────────────┘
                          │
┌─────────────────────────┼──────────────────────────────────────────┐
│                    .NET 8 WEB API                                   │
│  ┌──────────────────────▼────────────────────────────────────┐     │
│  │ Middleware: ExceptionHandling → CORS → RateLimiter →      │     │
│  │            Auth → Authorization → Controllers + SignalR   │     │
│  └──────────────────────┬────────────────────────────────────┘     │
│  ┌──────────────────────▼────────────────────────────────────┐     │
│  │ Controllers: Auth │ Blog │ User │ Feed │ Notification │Admin│    │
│  └──────────────────────┬────────────────────────────────────┘     │
│  ┌──────────────────────▼────────────────────────────────────┐     │
│  │ Application Layer: BlogService│UserService│FeedService    │     │
│  │   AdminService │ NotificationService │ ActivityLogService │     │
│  └──────────────────────┬────────────────────────────────────┘     │
│  ┌──────────────────────▼────────────────────────────────────┐     │
│  │ Infrastructure: AuthService│EmailQueue│FileStorage│EF Core│     │
│  │   Repository<T> │ UnitOfWork │ EmailProcessorJob          │     │
│  └──────────────────────┬────────────────────────────────────┘     │
│                         │                                          │
└─────────────────────────┼──────────────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────────────┐
│  DATABASE (PostgreSQL / SQL Server)                                 │
│  17 Tables │ 7 Stored Procedures │ 50+ Indexes                     │
└────────────────────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
User Browser
    │
    ▼
Angular SPA ──HTTP──► .NET API Controller
    │                      │
    │ SignalR WS           ▼
    │◄─────────── NotificationHub    Application Service
    │                                       │
    │                                  Repository<T>
    │                                       │
    │                                  UnitOfWork
    │                                       │
    │                                  EF Core DbContext
    │                                       │
    │                                  Database (17 tables)
    │
    ├──HTTP──► LanguageTool API (grammar)
    │
    └──── Brevo API (email, via backend EmailProcessorJob)
```

---

# PHASE 2 — COMPLETE REPOSITORY ANALYSIS

## Solution Structure

```
BlogSpot.sln
│
├── src/
│   ├── BlogSpot.Domain/          ← Innermost layer: entities, enums, repository interfaces
│   ├── BlogSpot.Application/     ← Business logic: services, DTOs, interfaces
│   ├── BlogSpot.Infrastructure/  ← External concerns: EF Core, email, file storage, auth
│   └── BlogSpot.API/             ← Entry point: controllers, middleware, hubs, startup
│
├── blogspot-client/              ← Angular 17 SPA
│   └── src/app/
│       ├── core/                 ← Singletons: services, guards, interceptors, models
│       ├── features/             ← Lazy-loaded feature modules (auth, feed, blog, profile, admin)
│       └── shared/               ← Reusable UI components, pipes
│
├── Database/                     ← Full SQL setup script (schema, SPs, seed data)
├── future-plans/                 ← Planned feature roadmap documents
├── Dockerfile                    ← .NET API multi-stage build
├── Dockerfile.frontend           ← Angular build → Nginx
├── docker-compose.yml            ← Local dev orchestration (SQL+API+Client)
└── render.yaml                   ← Render.com cloud deployment manifest
```

## Backend Folder Analysis

```
src/BlogSpot.Domain/                     ← No external dependencies
├── Entities/                            ← 16 domain entity classes
│   ├── BaseEntity.cs                    ← Id(Guid), CreatedAt, UpdatedAt
│   ├── User.cs                          ← Auth, role, profile navigation
│   ├── Profile.cs                       ← Bio, social links, skills, picture
│   ├── BlogPost.cs                      ← Title, content, slug, viewcount, soft delete
│   ├── Comment.cs                       ← Threaded via ParentCommentId
│   ├── Like.cs, Reaction.cs             ← Legacy likes + emoji reactions
│   ├── Bookmark.cs                      ← Saved posts
│   ├── CommentLike.cs                   ← Comment engagement
│   ├── Follow.cs                        ← User-to-user social graph
│   ├── Tag.cs, BlogPostTag.cs           ← Tagging system (junction)
│   ├── PostImage.cs                     ← Blog post images
│   ├── Notification.cs                  ← In-app notifications
│   ├── DraftBlog.cs                     ← Auto-save drafts
│   ├── EmailQueue.cs                    ← Outbound email queue
│   ├── OtpVerification.cs              ← OTP codes for registration
│   └── ActivityLog.cs                   ← Structured activity logging
├── Enums/                               ← UserRole, ReactionType, NotificationType, PostStatus, etc.
├── Interfaces/                          ← IRepository<T>, IUnitOfWork
└── Common/                              ← Base abstractions
```

```
src/BlogSpot.Application/               ← References Domain only
├── Interfaces/                          ← 9 service interfaces (IBlogService, etc.)
├── Services/                            ← 7 service implementations
│   ├── BlogService.cs                   ← CRUD, reactions, comments, drafts, scheduling, search
│   ├── UserService.cs                   ← Profiles, follows, analytics
│   ├── FeedService.cs                   ← Home/trending/latest feeds
│   ├── AdminService.cs                  ← User mgmt, moderation, seeding
│   ├── NotificationService.cs           ← Create/read/mark notifications
│   ├── ActivityLogService.cs            ← Info/Warn/Error logging
│   └── PostSchedulerService.cs          ← BackgroundService: auto-publishes scheduled posts
├── DTOs/                                ← Data transfer objects
│   ├── Auth/                            ← LoginDto, RegisterDto, AuthResponseDto
│   ├── Blog/                            ← CreateBlogPostDto, CommentDto, ReactionDto, etc.
│   ├── User/                            ← UserProfileDto, CreatorAnalyticsDto
│   ├── Admin/                           ← AdminUserDto, AdminPostDto, ActivityLogDto
│   └── Common/                          ← PagedResult<T>, PaginationParams
├── Constants/                           ← ActivityActions.cs (Login, PostBlog, etc.)
└── DependencyInjection.cs              ← AddApplication() extension
```

```
src/BlogSpot.Infrastructure/            ← References Application + Domain
├── Data/
│   └── AppDbContext.cs                  ← EF Core DbContext, entity configurations
├── Repositories/
│   ├── Repository.cs                    ← Generic CRUD repository
│   └── UnitOfWork.cs                    ← Exposes typed repositories, SaveChanges
├── Services/
│   ├── AuthService.cs                   ← Registration, login, JWT generation
│   ├── EmailQueueService.cs             ← Brevo API integration, OTP
│   ├── FileStorageService.cs            ← Cloudinary / local file storage
│   └── EmailProcessorJob.cs             ← BackgroundService (1-min interval)
├── Migrations/                          ← 6 EF Core migrations
└── DependencyInjection.cs              ← AddInfrastructure() extension
```

```
src/BlogSpot.API/                        ← References all layers
├── Controllers/                         ← 6 API controllers (60+ endpoints)
│   ├── AuthController.cs                ← Register, login, OTP, refresh, logout
│   ├── BlogController.cs               ← CRUD, reactions, comments, drafts, search
│   ├── UserController.cs               ← Profile, follow, analytics, notifications prefs
│   ├── FeedController.cs               ← Home/trending/latest feeds
│   ├── NotificationController.cs        ← Get/mark-read notifications
│   └── AdminController.cs              ← User mgmt, moderation, seeding, email queue
├── Hubs/
│   └── NotificationHub.cs              ← SignalR hub at /hubs/notifications
├── Middleware/
│   └── ExceptionHandlingMiddleware.cs   ← Global exception → HTTP status mapping
├── Program.cs                           ← Startup: DI, middleware pipeline, migration
├── appsettings.json                     ← Production config (PostgreSQL)
├── appsettings.Development.json         ← Dev config (SQL Server)
└── wwwroot/uploads/                     ← Local file storage
```

## Frontend Folder Analysis

```
blogspot-client/src/app/
├── core/                                ← Singleton services, loaded once
│   ├── components/
│   │   └── navbar/                      ← Global navbar with search, notifications, theme
│   ├── services/
│   │   ├── auth.service.ts              ← Login/register/token management
│   │   ├── blog.service.ts              ← CRUD, reactions, comments, drafts, images
│   │   ├── user.service.ts              ← Profiles, follows, analytics
│   │   ├── feed.service.ts              ← Home/trending/latest feeds
│   │   ├── notification.service.ts      ← Unread count, mark read
│   │   ├── signalr.service.ts           ← Real-time WebSocket notifications
│   │   ├── admin.service.ts             ← Admin API calls
│   │   ├── theme.service.ts             ← Dark/light toggle, localStorage
│   │   ├── search-cache.service.ts      ← Pre-loaded 150-post search cache
│   │   ├── grammar.service.ts           ← LanguageTool grammar check
│   │   └── export.service.ts            ← Excel file export (xlsx)
│   ├── guards/
│   │   ├── auth.guard.ts               ← Protects authenticated routes
│   │   └── admin.guard.ts              ← Protects admin routes
│   ├── interceptors/
│   │   └── auth.interceptor.ts          ← JWT attachment + 401 refresh
│   ├── models/
│   │   ├── auth.model.ts               ← User, AuthResponse, LoginRequest
│   │   ├── blog.model.ts               ← BlogPost, Comment, Reaction, Draft
│   │   ├── user.model.ts               ← UserProfile, CreatorAnalytics
│   │   ├── notification.model.ts       ← Notification types
│   │   └── pagination.model.ts         ← PagedResult<T>, PaginationParams
│   └── core.module.ts                   ← Exports NavbarComponent
│
├── features/                            ← All lazy-loaded
│   ├── auth/                            ← Login + Register with OTP
│   ├── feed/                            ← Home feed (For You/Latest/Trending tabs)
│   ├── blog/                            ← Create/Edit, Detail, Search, Bookmarks, Drafts, Scheduled
│   ├── profile/                         ← View, Edit, Analytics, Notifications page
│   └── admin/                           ← Dashboard with Users/Posts/Comments/Emails tabs
│
├── shared/                              ← Reusable across modules
│   ├── components/
│   │   ├── post-card/                   ← Blog post card with engagement actions
│   │   ├── user-card/                   ← User card with follow button
│   │   ├── loading-spinner/             ← Full-page and inline spinners
│   │   └── error-state/                 ← Retry error display
│   ├── pipes/
│   │   ├── image-url.pipe.ts            ← Resolves relative → absolute image URLs
│   │   └── format-content.pipe.ts       ← Markdown-like → HTML conversion
│   └── shared.module.ts                 ← Exports all Material modules + shared components
│
├── app-routing.module.ts                ← Root routes with lazy loading
├── app.module.ts                        ← Root module bootstrap
└── app.component.ts                     ← Root component with route animation
```

---

# PHASE 3 — BUSINESS DOMAIN UNDERSTANDING

## Business Entities

| Entity | Purpose |
|--------|---------|
| **User** | Authenticated account with role (User/Admin) |
| **Profile** | Extended user info: bio, avatar, social links, skills |
| **BlogPost** | Published or draft article with rich text content |
| **Comment** | Threaded comments on posts (nested replies) |
| **Reaction** | Emoji reactions: Like, Love, Fire, Clap |
| **Bookmark** | Saved posts for later reading |
| **Follow** | User-to-user social relationship |
| **Tag** | Content categorization label |
| **DraftBlog** | Auto-saved draft before publishing |
| **Notification** | Follow, reaction, comment alerts |
| **EmailQueue** | Outbound emails (welcome, moderation, reports) |
| **OtpVerification** | Email verification codes |
| **ActivityLog** | System event audit trail |

## Core Business Workflows

### Workflow 1: User Registration

```
User fills Register form
       ↓
RegisterComponent (Angular)
       ↓
AuthService.sendOtp(email) → POST /api/auth/send-otp
       ↓
AuthController.SendOtp → EmailQueueService.SendOtpAsync
       ↓
OtpVerification table (6-digit code, 10-min expiry)
       ↓
Brevo API sends email (via EmailProcessorJob background)
       ↓
User enters OTP code
       ↓
AuthService.verifyOtp → POST /api/auth/verify-otp
       ↓
AuthService.register → POST /api/auth/register
       ↓
AuthController.Register → AuthService.RegisterAsync
       ↓
BCrypt hash password → Create User + Profile → Welcome email queued
       ↓
Returns JWT + RefreshToken → stored in localStorage
       ↓
User redirected to /feed
```

### Workflow 2: Create and Publish Blog Post

```
User navigates to /blog/create
       ↓
BlogCreateComponent (Quill editor loads)
       ↓
User writes content, adds tags, selects category
       ↓
[Optional] Grammar check → GrammarService → LanguageTool API
       ↓
Save as Draft: BlogService.saveDraft → POST /api/blog/drafts
   OR
Publish: BlogService.createPost → POST /api/blog
       ↓
BlogController.Create → BlogService.CreatePostAsync
       ↓
Generate slug → Sanitize HTML → Calculate reading time
       ↓
Sync tags (create new, link existing) → Save BlogPost
       ↓
UnitOfWork.SaveChangesAsync → Database
       ↓
Returns BlogPostDto → Navigate to /blog/{slug}
```

### Workflow 3: Feed & Content Discovery

```
User opens /feed
       ↓
FeedComponent loads → tabs: "For You" | "Latest" | "Trending"
       ↓
"For You": FeedService.getHomeFeed → GET /api/feed/home
   → FeedService.GetHomeFeedAsync
      → Posts from followed users (ordered by date)
      → Fill remaining with trending posts
      → Returns PagedResult<BlogPostDto>
       ↓
"Trending": FeedService.getTrending → GET /api/feed/trending
   → 5-minute MemoryCache
   → Score = ViewCount + (Reactions×3) + (Comments×5)
   → 7-day window
       ↓
"Latest": FeedService.getLatest → GET /api/feed/latest
   → Newest published posts
       ↓
PostCardComponent renders each post
   → Like, React, Bookmark, Comment count visible
   → Click → navigates to /blog/{slug}
```

### Workflow 4: Real-Time Notification

```
User A follows User B
       ↓
UserService.ToggleFollowAsync
       ↓
NotificationService.CreateNotificationAsync(userId=B, type=Follow)
       ↓
Check B's NotificationPreferences → if Follow enabled:
       ↓
Save Notification to DB
       ↓
SignalR HubContext → send to group "user_{B.Id}"
       ↓
Angular SignalRService receives "ReceiveNotification"
       ↓
notification$ BehaviorSubject emits → NavbarComponent shows toast
       ↓
unreadCount$ incremented → badge updated
```

### Workflow 5: Admin Moderation

```
Admin navigates to /admin (AdminGuard validates role)
       ↓
AdminDashboardComponent → tabs load via AdminService
       ↓
Delete Post: AdminService.deletePost → DELETE /api/admin/posts/{id}
       ↓
AdminController.DeletePost [AdminOnly policy]
       ↓
AdminService.AdminDeletePostAsync
       ↓
Soft delete (IsDeleted = true) → Email author notification
       ↓
ActivityLogService.Info("AdminAction", ...)
       ↓
Response → Post removed from admin table
```

### Workflow 6: Scheduled Post Auto-Publish

```
Author sets a future publish date/time in editor (Material calendar + time)
       ↓
Frontend validates: scheduled ≥ now + 30 minutes
       ↓
BlogService.createPost → POST /api/v1/blog (with scheduledPublishAt)
       ↓
BlogController.Create → BlogService.CreatePostAsync
       ↓
Backend re-validates 30-min minimum lead time
       ↓
Status = Scheduled, ScheduledPublishAt = UTC time, IsPublished = false
       ↓
Confirmation email queued (publish time formatted in IST)
       ↓
[time passes] PostSchedulerService polls every 30 min (configurable)
       ↓
Finds due posts: Status=Scheduled AND ScheduledPublishAt ≤ UtcNow AND !IsDeleted
       ↓
Sets Status = Published, IsPublished = true, ScheduledPublishAt = null
       ↓
"Your post is now live" email queued to each author
       ↓
Author can review upcoming posts anytime at /blog/scheduled
```

---

# PHASE 4 — BACKEND DEEP DIVE (.NET)

## 1. Architecture Pattern

**Clean Architecture** — 4 concentric layers with dependency inversion:

```
┌────────────────────────────────────────┐
│  BlogSpot.API (Presentation)           │
│  Controllers, Middleware, Hubs         │
├────────────────────────────────────────┤
│  BlogSpot.Infrastructure (Infra)       │
│  EF Core, Repositories, External APIs  │
├────────────────────────────────────────┤
│  BlogSpot.Application (Business)       │
│  Services, DTOs, Interfaces            │
├────────────────────────────────────────┤
│  BlogSpot.Domain (Core)                │
│  Entities, Enums, Repo Interfaces      │
│  *** NO EXTERNAL DEPENDENCIES ***      │
└────────────────────────────────────────┘
```

Domain has zero NuGet dependencies. Application depends only on Domain. Infrastructure implements interfaces defined in Application/Domain. API references all layers and wires DI.

## 2. Startup Flow (Program.cs)

```
Application Launch
    ↓
Serilog configured (Console + File rolling)
    ↓
WebApplication.CreateBuilder
    ↓
AddApplication()          ← BlogService, UserService, FeedService, etc. (Scoped)
    ↓
AddInfrastructure(config) ← DbContext, Repository<T>, UnitOfWork, AuthService,
                             EmailQueue, FileStorage, EmailProcessorJob (Scoped/Hosted)
    ↓
AddHostedService<PostSchedulerService> ← polls & auto-publishes scheduled posts
    ↓
JWT Bearer Authentication (HS256, 24hr expiry)
    ↓
Authorization Policies: "AdminOnly", "UserOrAdmin"
    ↓
SignalR registration
    ↓
Rate Limiting: otp-send(5/10min), otp-verify(10/10min), auth-register(5/10min)
    ↓
CORS: AllowedOrigins from config
    ↓
ResponseCompression (Gzip) + ResponseCaching
    ↓
HttpClient + MemoryCache
    ↓
Build app
    ↓
Middleware Pipeline:
  Swagger → ForwardedHeaders → ExceptionHandling → HTTPS(dev) →
  Compression → Caching → CORS → RateLimiter → StaticFiles →
  Authentication → Authorization → Controllers + SignalR Hub
    ↓
Auto-migrate database (db.Database.Migrate())
    ↓
Auto-seed Admin account (from AdminSeed config)
    ↓
app.Run()
```

## 3. Controllers — Complete Endpoint Map

### AuthController (`api/auth`)

| Method | Route | Auth | Rate Limit | Input DTO | Output | Purpose |
|--------|-------|------|-----------|-----------|--------|---------|
| POST | `/send-otp` | No | otp-send (5/10min) | `SendOtpRequest` | message | Send 6-digit OTP to email |
| POST | `/verify-otp` | No | otp-verify (10/10min) | `VerifyOtpRequest` | success bool | Verify OTP code |
| POST | `/register` | No | auth-register (5/10min) | `RegisterDto` | `AuthResponseDto` | Create account |
| POST | `/login` | No | 10 fails/5min (in-memory) | `LoginDto` | `AuthResponseDto` | JWT + refresh token |
| POST | `/refresh` | No | — | `RefreshTokenRequest` | `AuthResponseDto` | Refresh expired JWT |
| POST | `/logout` | Yes | — | — | message | Log activity |
| POST | `/promote-admin` | No | — | `PromoteAdminRequest` | message | Secret key admin promotion |

### BlogController (`api/blog`)

| Method | Route | Auth | Input DTO | Output | Purpose |
|--------|-------|------|-----------|--------|---------|
| POST | `/` | Yes | `CreateBlogPostDto` | `BlogPostDto` | Create post |
| PUT | `/{id}` | Yes | `UpdateBlogPostDto` | `BlogPostDto` | Update post |
| DELETE | `/{id}` | Yes | — | message | Soft delete post |
| GET | `/{id}` | No | — | `BlogPostDto` | Get by ID |
| GET | `/slug/{slug}` | No | — | `BlogPostDto` | Get by slug (increments views) |
| GET | `/user/{userId}` | No | `PaginationParams` | `PagedResult<BlogPostDto>` | User's posts |
| GET | `/search` | No | query + pagination | `PagedResult<BlogPostDto>` | Title/content search |
| GET | `/fullsearch` | No | query + pagination | `SearchResultDto` | Posts + users + tags |
| POST | `/{id}/like` | Yes | — | bool | Toggle like (legacy) |
| POST | `/{id}/reactions` | Yes | `ReactionDto` | `ReactionSummaryDto` | Toggle emoji reaction |
| GET | `/{id}/reactions` | No | — | `ReactionSummaryDto` | Get reaction counts |
| POST | `/{id}/bookmark` | Yes | — | bool | Toggle bookmark |
| GET | `/bookmarks` | Yes | pagination | `PagedResult<BlogPostDto>` | Bookmarked posts |
| POST | `/{id}/comments` | Yes | `CreateCommentDto` | `CommentDto` | Add comment/reply |
| GET | `/{id}/comments` | No | pagination | `PagedResult<CommentDto>` | Get threaded comments |
| POST | `/comments/{id}/like` | Yes | — | bool | Like comment |
| DELETE | `/comments/{id}` | Yes | — | message | Delete comment |
| POST | `/{id}/images` | Yes | FormFile | `PostImageDto` | Upload image (max 5MB) |
| DELETE | `/{postId}/images/{imageId}` | Yes | — | message | Remove image |
| POST | `/drafts` | Yes | `SaveDraftDto` | `DraftBlogDto` | Save/update draft |
| GET | `/drafts` | Yes | — | `List<DraftBlogDto>` | List drafts |
| GET | `/drafts/{id}` | Yes | — | `DraftBlogDto` | Get draft |
| DELETE | `/drafts/{id}` | Yes | — | message | Delete draft |
| GET | `/scheduled` | Yes | — | `List<BlogPostDto>` | Current user's scheduled posts |

### UserController (`api/user`)

| Method | Route | Auth | Input | Output | Purpose |
|--------|-------|------|-------|--------|---------|
| GET | `/{userId}` | No | — | `UserProfileDto` | Get profile by ID |
| GET | `/username/{userName}` | No | — | `UserProfileDto` | Get profile by username |
| GET | `/search` | No | query + pagination | `PagedResult<UserProfileDto>` | Search users |
| PUT | `/profile` | Yes | `UpdateProfileDto` | `UserProfileDto` | Update own profile |
| POST | `/profile/picture` | Yes | FormFile (max 2MB) | URL | Upload avatar |
| POST | `/profile/cover` | Yes | FormFile (max 5MB) | URL | Upload cover photo |
| POST | `/{userId}/follow` | Yes | — | bool | Toggle follow |
| DELETE | `/{followerId}/remove-follower` | Yes | — | message | Remove a follower |
| GET | `/{userId}/followers` | No | pagination | `PagedResult<UserProfileDto>` | List followers |
| GET | `/{userId}/following` | No | pagination | `PagedResult<UserProfileDto>` | List following |
| GET | `/suggested` | Yes | count=5 | `List<UserProfileDto>` | Suggested users |
| GET | `/analytics` | Yes | — | `CreatorAnalyticsDto` | Creator dashboard data |
| GET | `/notification-preferences` | Yes | — | `NotificationPreferencesDto` | Get notification prefs |
| PUT | `/notification-preferences` | Yes | `NotificationPreferencesDto` | `NotificationPreferencesDto` | Update prefs |

### FeedController (`api/feed`)

| Method | Route | Auth | Output | Purpose |
|--------|-------|------|--------|---------|
| GET | `/home` | Yes | `PagedResult<BlogPostDto>` | Personalized feed (followed + trending fill) |
| GET | `/trending` | No | `PagedResult<BlogPostDto>` | Top trending (5-min cache, 7-day window) |
| GET | `/latest` | No | `PagedResult<BlogPostDto>` | Newest posts |

### NotificationController (`api/notification`)

| Method | Route | Auth | Output | Purpose |
|--------|-------|------|--------|---------|
| GET | `/` | Yes | `PagedResult<NotificationDto>` | Get notifications |
| GET | `/unread-count` | Yes | `{ count }` | Unread badge count |
| PUT | `/{id}/read` | Yes | message | Mark one as read |
| PUT | `/read-all` | Yes | message | Mark all as read |

### AdminController (`api/admin`) — All require `AdminOnly` policy

| Method | Route | Input | Output | Purpose |
|--------|-------|-------|--------|---------|
| GET | `/users` | pagination | `PagedResult<AdminUserDto>` | All users |
| PUT | `/users/{id}/toggle-status` | — | message | Toggle active/inactive |
| PUT | `/users/{id}/role` | `ChangeRoleRequest` | message | Change role |
| GET | `/posts` | pagination | `PagedResult<AdminPostDto>` | All posts |
| DELETE | `/posts/{id}` | — | message | Admin delete + email author |
| GET | `/comments` | pagination | `PagedResult<AdminCommentDto>` | All comments |
| DELETE | `/comments/{id}` | — | message | Admin delete + email commenter |
| POST | `/seed` | — | message | Seed 30 users, 40 posts, follows |
| POST | `/format-posts` | — | message | Convert plain text → HTML |
| GET | `/emails` | pagination | `PagedResult<EmailQueueDto>` | Email queue |
| POST | `/send-report-email` | `SendReportEmailRequest` | message | Send custom report |
| GET | `/activity-logs` | filter params | `PagedResult<ActivityLogDto>` | Filtered logs |

## 4. Services — Business Logic

| Service | Key Responsibilities |
|---------|---------------------|
| **BlogService** | Post CRUD, slug generation, HTML sanitization (Ganss.XSS), reading time calc (~200 wpm), tag sync, reactions (add/change/remove), bookmarks, threaded comments, comment likes, image management, draft CRUD, full-text search (posts + users + tags), post scheduling (30-min min lead time, IST confirmation email, list scheduled posts) |
| **UserService** | Profile CRUD, picture/cover upload, follow toggle with notification, follower removal, paginated followers/following, suggested users (top-5 by follower count), user search, creator analytics (views, reactions, comments, followers growth 30d, daily stats, top posts), notification preference management |
| **FeedService** | Home feed (followed + trending fill), trending (MemoryCache 5 min, score = Views + Reactions×3 + Comments×5, 7-day window), latest (newest first) |
| **AdminService** | Paginated admin views, toggle user status (email notification), change role (email notification), admin delete post/comment (soft delete + email), seed 30 Indian demo users + 40 posts + follows + likes + comments, format plain text posts to HTML |
| **NotificationService** | Create notification (respects user preferences, no self-notify), paginated retrieval, unread count, mark read/all read |
| **ActivityLogService** | `Info()`, `Warn()`, `Error()` → writes to ActivityLog table with action, logger class name, level, message, username |
| **AuthService** (Infra) | Register (BCrypt hash, create user+profile, welcome email), login (email or username lookup, verify BCrypt), JWT token generation (HS256, claims: UserId/Name/Email/Role/Jti), refresh token (7-day, validates expired JWT), logout logging |
| **EmailQueueService** (Infra) | Enqueue single/bulk emails, process queue (Brevo API, 50/batch, 3 retries), send OTP (6-digit, 10-min expiry), verify OTP |
| **FileStorageService** (Infra) | Upload to Cloudinary (if configured) or local wwwroot/uploads, delete from Cloudinary or local |
| **EmailProcessorJob** (Infra) | BackgroundService, configurable interval via `Email:JobIntervalMinutes` (15 min in prod), batches queued emails (50/batch, 3 retries), calls ProcessQueueAsync() |
| **PostSchedulerService** (App) | BackgroundService, configurable interval via `PostScheduler:JobIntervalMinutes` (default 30 min), publishes due scheduled posts (Status=Scheduled, ScheduledPublishAt ≤ now) and emails authors "now live" |

## 5. Repositories

### Generic Repository (`Repository<T>`)
All entities use a single generic repository implementation:
- `GetByIdAsync(id)`, `GetAllAsync()`, `FindAsync(predicate)`
- `AddAsync(entity)`, `AddRangeAsync(entities)`
- `Update(entity)`, `Remove(entity)`, `RemoveRange(entities)`
- `ExistsAsync(predicate)`, `CountAsync(predicate)`
- `Query()` → `IQueryable<T>` for LINQ composition

### UnitOfWork
Exposes typed `IRepository<T>` for all 15 entities:
`Users`, `Profiles`, `BlogPosts`, `Comments`, `Likes`, `PostImages`, `Reactions`, `Bookmarks`, `Notifications`, `Drafts`, `Tags`, `CommentLikes`, `EmailQueues`, `OtpVerifications`
Plus `SaveChangesAsync()`.

## 6. Domain Models & DTOs

### Entities

| Entity | Key Properties |
|--------|---------------|
| **BaseEntity** | Id (Guid), CreatedAt, UpdatedAt |
| **User** | UserName (50, unique), Email (256, unique), PasswordHash, Role (enum), IsActive, RefreshToken, RefreshTokenExpiry. Nav: Profile (1:1), BlogPosts, Comments, Likes, Reactions, Bookmarks, Notifications, Drafts, Followers, Following |
| **Profile** | DisplayName, Bio, ProfilePictureUrl, CoverPhotoUrl, Website, Location, SocialLinks (JSON), Skills (CSV), NotificationPreferences (JSON), UserId (FK, cascade) |
| **BlogPost** | Title (200), Content, Summary (500), Slug (250, unique), Status (PostStatus enum), ScheduledPublishAt (nullable — auto-publish time), IsPublished, IsDraft, IsDeleted (query filter), ViewCount, ReadingTimeMinutes, Category (100), FeaturedImageUrl, AuthorId (FK). Nav: Images, Comments, Likes, Reactions, Bookmarks, BlogPostTags |
| **Comment** | Content, IsEdited, IsDeleted, ParentCommentId (self-ref for nesting), UserId (FK, restrict), BlogPostId (FK, cascade). Nav: Replies, CommentLikes |
| **Reaction** | Type (enum: Like/Love/Fire/Clap), UserId (FK), BlogPostId (FK) |
| **Bookmark** | UserId (FK), BlogPostId (FK) |
| **Follow** | FollowerId (FK), FollowingId (FK), composite PK |
| **Tag** | Name, NormalizedName (uppercase). Nav: BlogPostTags |
| **DraftBlog** | Title, Content, Summary, Category, Tags (CSV), BlogPostId (FK, nullable), AuthorId (FK, cascade) |
| **Notification** | UserId (FK), ActorId (FK), Type (enum), ReferenceId, Message (500), IsRead |
| **EmailQueue** | ToEmail, Subject, Body, Status (enum: Queued/Sent/Failed), RetryCount, SentAt, Error |
| **OtpVerification** | Email, OtpCode (6-digit), ExpiresAt, IsUsed |
| **ActivityLog** | Id (long), Action, Logger, Level (enum), Message, UserName, Timestamp |

### Enums

```
UserRole:         User = 0, Admin = 1
ReactionType:     Like = 0, Love = 1, Fire = 2, Clap = 3
NotificationType: Follow = 0, Reaction = 1, Comment = 2, PostPublished = 3, CommentLike = 4
EmailStatus:      Queued = 0, Sent = 1, Failed = 2
LogLevel:         Info = 0, Error = 1, Warning = 2
PostStatus:       Draft = 0, Scheduled = 1, Published = 2, Archived = 3
```

### Key DTOs

| DTO | Properties |
|-----|-----------|
| **AuthResponseDto** | Token, RefreshToken, Expiration, UserInfoDto (Id, UserName, Email, Role, ProfilePictureUrl, DisplayName) |
| **BlogPostDto** | Full post data with author info, aggregates (likeCount, commentCount, viewCount), reactionCounts, currentUserReaction, tags, images, isLikedByCurrentUser, isBookmarkedByCurrentUser |
| **CommentDto** | Id, Content, IsEdited, CreatedAt, User details, ParentCommentId, LikeCount, IsLikedByCurrentUser, Replies[] (nested) |
| **UserProfileDto** | Id, UserName, DisplayName, Bio, Avatar, Cover, Website, Location, SocialLinks, Skills[], JoinedAt, FollowersCount, FollowingCount, PostsCount, IsFollowedByCurrentUser |
| **CreatorAnalyticsDto** | TotalViews, TotalReactions, TotalComments, TotalFollowers, FollowersGrowthLast30Days, TopPosts[], DailyStats[] |
| **PagedResult\<T\>** | Items[], TotalCount, Page, PageSize, TotalPages, HasPreviousPage, HasNextPage |
| **SearchResultDto** | Posts[], Users[], Tags[], TotalResults |

## 7. Dependency Injection Graph

```
Program.cs
├── AddApplication()
│   ├── IBlogService          → BlogService          (Scoped)
│   ├── IUserService          → UserService          (Scoped)
│   ├── IFeedService          → FeedService          (Scoped)
│   ├── IAdminService         → AdminService         (Scoped)
│   ├── INotificationService  → NotificationService  (Scoped)
│   ├── IActivityLogService   → ActivityLogService   (Scoped)
│   └── PostSchedulerService                          (HostedService — registered in Program.cs)
│
└── AddInfrastructure(config)
    ├── AppDbContext                                  (Scoped)
    ├── IRepository<T>        → Repository<T>        (Scoped)
    ├── IUnitOfWork            → UnitOfWork           (Scoped)
    ├── IAuthService           → AuthService          (Scoped)
    ├── IFileStorageService    → FileStorageService   (Scoped)
    ├── IEmailQueueService     → EmailQueueService    (Scoped)
    ├── EmailProcessorJob                            (HostedService)
    ├── JWT Bearer Authentication
    └── Authorization Policies (AdminOnly, UserOrAdmin)
```

## 8. All Interfaces

### Application Layer

```
IAuthService:
  - RegisterAsync(RegisterDto) → AuthResponseDto
  - LoginAsync(LoginDto) → AuthResponseDto
  - RefreshTokenAsync(refreshToken) → AuthResponseDto
  - LogoutAsync(userName)

IBlogService:
  - CreatePostAsync, UpdatePostAsync, DeletePostAsync
  - GetPostByIdAsync, GetPostBySlugAsync, GetPostsByUserAsync
  - SearchPostsAsync, FullTextSearchAsync
  - ToggleLikeAsync, ToggleReactionAsync, GetReactionsAsync
  - ToggleBookmarkAsync, GetBookmarkedPostsAsync
  - AddCommentAsync, DeleteCommentAsync, GetCommentsAsync, ToggleCommentLikeAsync
  - AddImageToPostAsync, RemoveImageFromPostAsync
  - SaveDraftAsync, GetDraftsAsync, GetDraftByIdAsync, DeleteDraftAsync
  - GetScheduledPostsAsync

IUserService:
  - GetProfileAsync, GetProfileByUserNameAsync, UpdateProfileAsync
  - UpdateProfilePictureAsync, UpdateCoverPhotoAsync
  - ToggleFollowAsync, RemoveFollowerAsync
  - GetFollowersAsync, GetFollowingAsync, GetSuggestedUsersAsync
  - SearchUsersAsync, GetCreatorAnalyticsAsync
  - GetNotificationPreferencesAsync, UpdateNotificationPreferencesAsync

IFeedService:
  - GetHomeFeedAsync, GetTrendingPostsAsync, GetLatestPostsAsync

IAdminService:
  - GetAllUsersAsync, ToggleUserActiveStatusAsync, ChangeUserRoleAsync
  - GetAllPostsAsync, AdminDeletePostAsync
  - GetAllCommentsAsync, AdminDeleteCommentAsync
  - SeedDummyDataAsync, FormatExistingPostsAsync

INotificationService:
  - GetNotificationsAsync, GetUnreadCountAsync
  - MarkAsReadAsync, MarkAllAsReadAsync, CreateNotificationAsync

IActivityLogService:
  - Info(), Warn(), Error(), GetLogsAsync()

IFileStorageService:
  - UploadFileAsync, DeleteFileAsync

IEmailQueueService:
  - EnqueueAsync, EnqueueBulkAsync, ProcessQueueAsync
  - GetEmailQueueAsync, SendOtpAsync, VerifyOtpAsync
```

### Domain Repository Interfaces

```
IRepository<T> where T : BaseEntity:
  - GetByIdAsync, GetAllAsync, FindAsync
  - AddAsync, AddRangeAsync, Update, Remove, RemoveRange
  - ExistsAsync, CountAsync, Query()

IUnitOfWork:
  - IRepository<User> Users ... (15 typed repositories)
  - SaveChangesAsync() → int
```

## 9. Background Jobs

Two long-running `BackgroundService` workers run inside the API process:

| Job | Layer | Registration | Interval | Responsibility |
|-----|-------|-------------|----------|----------------|
| **EmailProcessorJob** | Infrastructure | `AddHostedService` in `AddInfrastructure()` | `Email:JobIntervalMinutes` (15 min prod) | Dequeues `EmailQueue` rows (50/batch, 3 retries), sends via Brevo API |
| **PostSchedulerService** | Application | `AddHostedService` in `Program.cs` | `PostScheduler:JobIntervalMinutes` (30 min default) | Publishes due scheduled posts and emails authors |

### Post Scheduling Flow

1. Author picks a future date/time in the editor (Material calendar + separate time field). The frontend enforces a **30-minute minimum lead time**; the backend re-validates (`ScheduledPublishAt >= UtcNow + 30 min`) as a safety net for direct API calls.
2. `BlogService.CreatePostAsync` sets `Status = Scheduled`, stores `ScheduledPublishAt` (UTC), keeps `IsPublished = false`, and queues a **confirmation email** showing the publish time converted to **IST** (`India Standard Time`).
3. `PostSchedulerService` polls every N minutes for `Status == Scheduled && ScheduledPublishAt <= UtcNow && !IsDeleted`, flips them to `Published` (`IsPublished = true`, `ScheduledPublishAt = null`), and queues a **"your post is now live"** email to each author (query eager-loads `Author` for the address).
4. Authors review upcoming posts at `/blog/scheduled` (`GET /api/v1/blog/scheduled` → `GetScheduledPostsAsync`, ordered by publish time) and can edit/reschedule through the normal edit route.

> **Trade-off:** a 30-minute poll keeps the Neon free-tier DB awake more than a longer interval would; the interval is configurable to balance publish latency against compute-hour usage.

---

# PHASE 5 — FRONTEND DEEP DIVE (ANGULAR)

## 1. Bootstrap Flow

```
main.ts → platformBrowserDynamic().bootstrapModule(AppModule)
    ↓
AppModule
    ↓
Imports: BrowserModule, BrowserAnimationsModule, HttpClientModule,
         CoreModule, SharedModule, AppRoutingModule
    ↓
Providers: AuthInterceptor (HTTP_INTERCEPTORS)
    ↓
Bootstrap: AppComponent
    ↓
AppComponent template: <app-navbar> + <router-outlet> with @routeFade animation
```

## 2. Module Structure

| Module | Type | Loading | Purpose |
|--------|------|---------|---------|
| **AppModule** | Root | Eager | Bootstrap, global providers |
| **CoreModule** | Core | Eager | NavbarComponent, all singleton services, guards, interceptors |
| **SharedModule** | Shared | Eager | PostCard, UserCard, LoadingSpinner, ErrorState, Pipes, all Material modules |
| **AuthModule** | Feature | Lazy | Login + Register with OTP |
| **FeedModule** | Feature | Lazy | Home feed with tabs (For You/Latest/Trending) |
| **BlogModule** | Feature | Lazy | Create/Edit, Detail, Search, Bookmarks, Drafts, Scheduled |
| **ProfileModule** | Feature | Lazy | View, Edit, Analytics, Notifications page |
| **AdminModule** | Feature | Lazy | Dashboard with Users/Posts/Comments/Emails tabs |

## 3. Complete Routing Map

```
/                              → redirect → /feed
/auth/login                    → LoginComponent
/auth/register                 → RegisterComponent
/feed                          → FeedComponent (tabs: For You*, Latest, Trending)
/blog/create                   → BlogCreateComponent [AuthGuard]
/blog/edit/:id                 → BlogCreateComponent (edit mode) [AuthGuard]
/blog/bookmarks                → BookmarksComponent [AuthGuard]
/blog/drafts                   → DraftsComponent [AuthGuard]
/blog/scheduled                → ScheduledPostsComponent [AuthGuard]
/blog/search?q=               → BlogSearchComponent
/blog/:slug                    → BlogDetailComponent
/profile/me                    → ProfileViewComponent [AuthGuard]
/profile/edit                  → ProfileEditComponent [AuthGuard]
/profile/analytics             → AnalyticsComponent [AuthGuard]
/profile/notifications         → NotificationsPageComponent [AuthGuard]
/profile/:username             → ProfileViewComponent (public)
/admin                         → AdminDashboardComponent [AdminGuard]
/notifications                 → redirect → /profile/notifications
/**                            → redirect → /feed

* "For You" tab requires auth
```

**Guards:**
- `AuthGuard`: Checks `authService.isLoggedIn`, redirects to `/auth/login?returnUrl=...`
- `AdminGuard`: Checks `authService.isAdmin` (role === 'Admin'), redirects to `/feed`

**Interceptor (`AuthInterceptor`):**
1. Attaches `Authorization: Bearer {token}` to all requests
2. On 401 (non-auth endpoints): attempts token refresh → retries original request
3. On 401 during refresh: logs out, redirects to `/auth/login`
4. Queues concurrent requests during refresh (BehaviorSubject wait pattern)

## 4. Key Components

| Component | Module | Purpose | Key Features |
|-----------|--------|---------|-------------|
| **NavbarComponent** | Core | Global navigation | Logo, search with live autocomplete (250ms debounce), notifications dropdown with SignalR toasts, theme toggle, user menu, mobile "More" menu |
| **LoginComponent** | Auth | Login form | Email/username + password, validation, redirect to returnUrl |
| **RegisterComponent** | Auth | Registration form | 3-step OTP flow, password strength validator (8+ chars, upper/lower/digit/special), real-time validation checkmarks |
| **FeedComponent** | Feed | Content feed | 3 tabs, infinite scroll (load more), post cards with engagement, sidebar with suggested users (logged in) or guest promo card |
| **BlogCreateComponent** | Blog | Rich text editor | Quill editor (ngx-quill), grammar check (LanguageTool), tags input (Enter/comma), category dropdown, save-as-draft, publish now / schedule (Material calendar + time, 30-min min lead time) |
| **BlogDetailComponent** | Blog | Post viewer | Read progress bar, author info, engagement bar (like burst animation, emoji reactions, bookmark), threaded comments with replies |
| **BlogSearchComponent** | Blog | Search results | Two tabs (Posts + People), full-text search, pagination |
| **BookmarksComponent** | Blog | Saved posts | Paginated bookmarked posts |
| **DraftsComponent** | Blog | Draft management | Cards with preview, continue editing, delete |
| **ScheduledPostsComponent** | Blog | Scheduled posts list | Cards showing publish time (`date:'medium'`), edit/reschedule button, empty state |
| **ProfileViewComponent** | Profile | User profile | Cover photo, avatar, stats, social links, tabs (Posts/Followers/Following), admin controls on others |
| **ProfileEditComponent** | Profile | Edit profile | Upload avatar/cover, bio/skills/social links, notification preference toggles |
| **AnalyticsComponent** | Profile | Creator analytics | Stat cards (views/reactions/comments/followers), top posts table |
| **NotificationsPageComponent** | Profile | Full notification list | Unread highlight, mark all read, click-to-navigate by type, load more |
| **AdminDashboardComponent** | Admin | Admin panel | 4 tabs (Users/Posts/Comments/Emails), inline edit, export to Excel, seed data, format posts |

## 5. Services API Mapping

| Angular Service | Backend Controller | Key Methods |
|----------------|-------------------|-------------|
| `AuthService` | AuthController | register, login, sendOtp, verifyOtp, refreshToken, logout |
| `BlogService` | BlogController | createPost, updatePost, deletePost, getBySlug, toggleReaction, addComment, saveDraft, getScheduledPosts, uploadImage, fullTextSearch |
| `UserService` | UserController | getProfile, updateProfile, toggleFollow, getFollowers, getSuggestedUsers, getCreatorAnalytics, notification prefs |
| `FeedService` | FeedController | getHomeFeed, getTrending, getLatest |
| `NotificationService` | NotificationController | getNotifications, getUnreadCount, markAsRead, markAllAsRead |
| `AdminService` | AdminController | getUsers, toggleStatus, changeRole, deletePost, deleteComment, seedData, getEmails |
| `SignalRService` | NotificationHub | WebSocket connection, ReceiveNotification listener |
| `GrammarService` | LanguageTool (external) | checkGrammar → strips HTML, calls API, returns matches |
| `SearchCacheService` | FeedService (indirect) | Pre-loads 150 posts, local filtering for navbar search |
| `ExportService` | — (client-only) | Excel export via xlsx library |
| `ThemeService` | — (client-only) | Dark/light toggle via CSS variables + localStorage |

## 6. State Management

**Pattern:** Distributed BehaviorSubject-based state in services (no NgRx).

| Service | State | Persistence |
|---------|-------|-------------|
| `AuthService` | `currentUser$` (BehaviorSubject) | localStorage (token, refreshToken, user) |
| `NotificationService` | `unreadCount$` (BehaviorSubject) | None (re-fetched on login) |
| `SignalRService` | `notification$` (BehaviorSubject) | None (real-time only) |
| `ThemeService` | `theme$` (BehaviorSubject) | localStorage['blogspot-theme'] |
| `SearchCacheService` | `cacheState$`, in-memory post array | None (re-initialized on page load) |

Components use optimistic updates for likes/follows/bookmarks.

## 7. Forms Strategy

| Form | Type | Validation |
|------|------|-----------|
| Login | Reactive (FormBuilder) | Required fields |
| Register | Reactive | Custom `passwordStrengthValidator` (8+ chars, upper, lower, digit, special), cross-field `passwordMismatch` |
| Blog Create | Reactive | Title required, content required |
| Profile Edit | Reactive + Template (ngModel for notification toggles) | Bio max 1000 chars, URL patterns |
| Navbar Search | Template (ngModel) | None (debounced live search) |
| Admin Filters | Template (ngModel) | None |

## 8. Shared Components

| Component | Inputs | Outputs | Usage |
|-----------|--------|---------|-------|
| `PostCardComponent` | `post: BlogPost` | `onLike`, `onBookmark`, `onReaction` | Feed, Search, Bookmarks, Profile posts tab |
| `UserCardComponent` | `user: UserProfile`, `showRemove?: boolean` | `onFollow`, `onRemove` | Followers, Following, Suggested Users, Search |
| `LoadingSpinnerComponent` | `inline?: boolean` | — | Full-page overlay or inline spinner |
| `ErrorStateComponent` | `title?, message?` | `onRetry` | Error recovery in any list view |
| `ImageUrlPipe` | URL string | Resolved absolute URL | All `<img>` tags with backend URLs |
| `FormatContentPipe` | HTML/text string | Safe HTML | Post content rendering |

---

# PHASE 6 — DATABASE ARCHITECTURE

## ER Diagram

```
┌──────────┐    1:1    ┌──────────────┐
│  Users   ├──────────►│ UserProfiles │
│          │           └──────────────┘
│ Id (PK)  │
│ UserName │    1:N    ┌──────────────┐    N:M   ┌──────┐
│ Email    ├──────────►│  BlogPosts   ├─────────►│ Tags │
│ Role     │           │              │ PostTags  └──────┘
│ IsActive │           │ Id (PK)      │
└──┬───┬───┘           │ AuthorId(FK) │    1:N    ┌────────────┐
   │   │               │ Slug         ├──────────►│ PostImages │
   │   │               │ IsDeleted    │           └────────────┘
   │   │               └──┬───┬───┬───┘
   │   │                  │   │   │
   │   │    1:N           │   │   │  1:N
   │   │  ┌───────────────┘   │   └──────────────┐
   │   │  │                   │                   │
   │   │  ▼                   ▼                   ▼
   │   │ ┌──────────┐   ┌──────────┐       ┌───────────┐
   │   │ │ Comments │   │ Reactions│       │ Bookmarks │
   │   │ │ (nested) │   │ (emoji)  │       └───────────┘
   │   │ │ Parent──►│   └──────────┘
   │   │ └────┬─────┘
   │   │      │ 1:N
   │   │      ▼
   │   │ ┌──────────────┐
   │   │ │ CommentLikes │
   │   │ └──────────────┘
   │   │
   │   │  Self-referencing (N:M)
   │   └──────────────────────────┐
   │          ┌───────────┐       │
   └─────────►│  Follows  │◄──────┘
              │ Follower  │
              │ Following │
              └───────────┘

   ┌────────────────┐   ┌───────────────────┐   ┌─────────────┐
   │ Notifications  │   │ OtpVerification   │   │ EmailQueue  │
   │ UserId(FK)     │   │ Email, Code, Exp  │   │ Status,Retry│
   │ ActorId(FK)    │   └───────────────────┘   └─────────────┘
   └────────────────┘
   ┌────────────────┐   ┌───────────────────┐
   │ DraftBlogs     │   │  ActivityLogs     │
   │ AuthorId(FK)   │   │  Action, Logger   │
   └────────────────┘   └───────────────────┘
```

## Tables (17 total)

### Users
| Column | Type | Constraints |
|--------|------|-------------|
| Id | UNIQUEIDENTIFIER | PK |
| UserName | NVARCHAR(50) | UNIQUE, NOT NULL |
| NormalizedUserName | NVARCHAR(50) | UNIQUE, NOT NULL |
| Email | NVARCHAR(256) | UNIQUE, NOT NULL |
| NormalizedEmail | NVARCHAR(256) | UNIQUE, NOT NULL |
| PasswordHash | NVARCHAR(MAX) | NOT NULL |
| Role | NVARCHAR(20) | CHECK IN ('Admin', 'User'), DEFAULT 'User' |
| RefreshToken | NVARCHAR(512) | NULL |
| RefreshTokenExpiry | DATETIME2 | NULL |
| IsActive | BIT | DEFAULT 1 |
| IsBanned | BIT | DEFAULT 0 |
| BanReason | NVARCHAR(500) | NULL |
| EmailConfirmed | BIT | DEFAULT 0 |
| LockoutEnd | DATETIMEOFFSET | NULL |
| AccessFailedCount | INT | DEFAULT 0 |
| CreatedAt | DATETIME2 | DEFAULT SYSUTCDATETIME() |
| UpdatedAt | DATETIME2 | NULL |
| LastLoginAt | DATETIME2 | NULL |

### UserProfiles (1:1 with Users)
| Column | Type | Constraints |
|--------|------|-------------|
| Id | UNIQUEIDENTIFIER | PK |
| UserId | UNIQUEIDENTIFIER | FK → Users.Id, UNIQUE, CASCADE |
| DisplayName | NVARCHAR(100) | NULL |
| Bio | NVARCHAR(1000) | NULL |
| ProfilePictureUrl | NVARCHAR(500) | NULL |
| CoverPhotoUrl | NVARCHAR(500) | NULL |
| Website | NVARCHAR(256) | NULL |
| Location | NVARCHAR(200) | NULL |
| FollowerCount | INT | DEFAULT 0 |
| FollowingCount | INT | DEFAULT 0 |
| PostCount | INT | DEFAULT 0 |
| SocialLinks | NVARCHAR(MAX) | NULL (JSON: {github, twitter, linkedin}) |
| Skills | NVARCHAR(1000) | NULL (comma-separated) |
| NotificationPreferences | NVARCHAR(MAX) | NULL (JSON) |
| CreatedAt | DATETIME2 | DEFAULT SYSUTCDATETIME() |
| UpdatedAt | DATETIME2 | NULL |

### BlogPosts
| Column | Type | Constraints |
|--------|------|-------------|
| Id | UNIQUEIDENTIFIER | PK |
| AuthorId | UNIQUEIDENTIFIER | FK → Users.Id |
| Title | NVARCHAR(300) | NOT NULL |
| Slug | NVARCHAR(350) | UNIQUE, NOT NULL |
| Content | NVARCHAR(MAX) | NOT NULL |
| Excerpt | NVARCHAR(500) | NULL |
| FeaturedImageUrl | NVARCHAR(500) | NULL |
| Status | INT | PostStatus enum: 0=Draft, 1=Scheduled, 2=Published, 3=Archived. DEFAULT 0 |
| ScheduledPublishAt | DATETIME2 / timestamptz | NULL — set when Status = Scheduled |
| LikeCount | INT | DEFAULT 0 |
| CommentCount | INT | DEFAULT 0 |
| ViewCount | BIGINT | DEFAULT 0 |
| IsDraft | BIT | DEFAULT 0 |
| ReadingTimeMinutes | INT | DEFAULT 0 |
| Category | NVARCHAR(100) | NULL |
| IsDeleted | BIT | DEFAULT 0 |
| CreatedAt | DATETIME2 | DEFAULT SYSUTCDATETIME() |
| UpdatedAt | DATETIME2 | NULL |

### Comments (Threaded)
| Column | Type | Constraints |
|--------|------|-------------|
| Id | UNIQUEIDENTIFIER | PK |
| BlogPostId | UNIQUEIDENTIFIER | FK → BlogPosts.Id, CASCADE |
| UserId | UNIQUEIDENTIFIER | FK → Users.Id |
| ParentCommentId | UNIQUEIDENTIFIER | FK → Comments.Id, NULL (self-ref) |
| Content | NVARCHAR(2000) | NOT NULL |
| LikeCount | INT | DEFAULT 0 |
| IsEdited | BIT | DEFAULT 0 |
| IsDeleted | BIT | DEFAULT 0 |
| CreatedAt | DATETIME2 | DEFAULT SYSUTCDATETIME() |

### Reactions (Emoji)
| Column | Type | Constraints |
|--------|------|-------------|
| Id | UNIQUEIDENTIFIER | PK |
| UserId | UNIQUEIDENTIFIER | FK → Users.Id, CASCADE |
| BlogPostId | UNIQUEIDENTIFIER | FK → BlogPosts.Id, CASCADE |
| Type | INT | CHECK IN (0=Like, 1=Love, 2=Fire, 3=Clap) |
| CreatedAt | DATETIME2 | DEFAULT SYSUTCDATETIME() |

### Other Tables

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| **Likes** | UserId, BlogPostId/CommentId (XOR) | Legacy like system |
| **Bookmarks** | UserId, BlogPostId (unique pair) | Saved posts |
| **CommentLikes** | UserId, CommentId | Comment engagement |
| **Follows** | FollowerId, FollowingId (unique pair, CHECK ≠) | Social graph |
| **Tags** | Name, NormalizedName (unique) | Content labels |
| **PostTags** | BlogPostId, TagId (composite PK) | Junction table |
| **PostImages** | BlogPostId, ImageUrl, AltText, SortOrder | Post media |
| **Notifications** | UserId, ActorId, Type, Message, IsRead | In-app alerts |
| **DraftBlogs** | UserId, Title, Content, Tags, BlogPostId? | Auto-save drafts |
| **EmailQueue** | ToEmail, Subject, Body, Status, RetryCount | Outbound emails |
| **OtpVerification** | Email, OtpCode, ExpiresAt, IsUsed | Registration OTP |
| **ActivityLogs** | Action, Logger, Level, Message, UserName, Timestamp | Audit trail |

## Stored Procedures (7)

| SP | Purpose | Key Logic |
|----|---------|-----------|
| `sp_GetHomeFeed` | Personalized feed | UNION: followed users' posts + trending from non-followed, paginated |
| `sp_GetTrendingPosts` | Trending calculation | Score = (Likes×3 + Comments×5 + Views×0.1) / POWER(hours+2, 1.5), time-decay |
| `sp_TogglePostLike` | Like toggle | Transaction: delete/insert + update LikeCount counter |
| `sp_ToggleFollow` | Follow toggle | Transaction: toggle + update both users' FollowerCount/FollowingCount |
| `sp_GetAdminDashboardStats` | Admin aggregates | TotalUsers, ActiveUsers, TotalPosts, TotalComments, etc. |
| `sp_ModeratePost` | Post moderation | Remove/Restore with status change + audit log |
| `sp_BanUnbanUser` | User ban/unban | Ban: deactivate + clear tokens + archive posts; Unban: reverse |
| `sp_SearchPosts` | Full-text search | LIKE on Title/Excerpt/Content + optional tag filter + sort |

## Indexes (50+)
Key performance indexes:
- `IX_BlogPosts_Trending` — filtered WHERE Status='Published', covers LikeCount + ViewCount
- `IX_Comments_BlogPostId` — compound (BlogPostId, CreatedAt) with INCLUDE
- `UQ_Likes_User_Post` / `UQ_Likes_User_Comment` — unique filtered indexes
- `IX_Notifications_UserId` — compound (UserId, IsRead, CreatedAt DESC)
- `IX_BlogPosts_Slug` — unique for URL resolution
- `IX_Follows_FollowerId` / `IX_Follows_FollowingId` — covering indexes with INCLUDE

---

# PHASE 7 — API DOCUMENTATION

**Base URL:** `https://blogspot-2-0.onrender.com/api` (prod) | `https://localhost:44346/api` (dev)

**Authentication:** JWT Bearer token in `Authorization: Bearer {token}` header.

### Example: Login

```
POST /api/auth/login
Content-Type: application/json

Request:
{
  "emailOrUsername": "john_doe",
  "password": "MyPass@123"
}

Response (200):
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "a1b2c3d4e5...",
  "expiration": "2026-08-21T10:00:00Z",
  "user": {
    "id": "guid-here",
    "userName": "john_doe",
    "email": "john@example.com",
    "role": "User",
    "profilePictureUrl": "/uploads/images/avatar.jpg",
    "displayName": "John Doe"
  }
}

Error (401): { "error": "Invalid credentials" }
Error (400): { "error": "Account is deactivated" }
```

### Example: Create Blog Post

```
POST /api/blog
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "title": "Getting Started with Angular 17",
  "content": "<p>Angular 17 introduces...</p>",
  "summary": "A beginner's guide to Angular 17",
  "category": "Technology",
  "tags": ["angular", "frontend", "typescript"],
  "isDraft": false
}

Response (200): Full BlogPostDto with generated slug, readingTimeMinutes, etc.
```

### Example: Toggle Reaction

```
POST /api/blog/{postId}/reactions
Authorization: Bearer {token}
Content-Type: application/json

Request: { "type": "Fire" }

Response (200):
{
  "totalCount": 15,
  "counts": { "Like": 8, "Love": 3, "Fire": 3, "Clap": 1 },
  "currentUserReaction": "Fire"
}
```

### Example: Get Home Feed

```
GET /api/feed/home?page=1&pageSize=10
Authorization: Bearer {token}

Response (200):
{
  "items": [ ...BlogPostDto[] ],
  "totalCount": 142,
  "page": 1,
  "pageSize": 10,
  "totalPages": 15,
  "hasPreviousPage": false,
  "hasNextPage": true
}
```

### Error Handling (Global via ExceptionHandlingMiddleware)
| Exception | HTTP Status | Response |
|-----------|-------------|----------|
| `UnauthorizedAccessException` | 401 | `{ "error": "..." }` |
| `KeyNotFoundException` | 404 | `{ "error": "..." }` |
| `InvalidOperationException` | 400 | `{ "error": "..." }` |
| `ArgumentException` | 400 | `{ "error": "..." }` |
| Unhandled | 500 | `{ "error": "An error occurred" }` (details logged) |

---

# PHASE 8 — SECURITY ANALYSIS

## Authentication Flow

```
Registration:
  Email → Send OTP (6-digit, 10-min expiry) → Verify OTP → Register
  → BCrypt hash password → Create User → Issue JWT + Refresh Token

Login:
  EmailOrUsername + Password → BCrypt.Verify → Issue JWT + Refresh Token
  → Rate limited: 10 failed attempts per 5 minutes (in-memory tracking)

Token Lifecycle:
  JWT: 24-hour expiry, HS256 signed
  Refresh Token: 7-day expiry, stored in User record
  Claims: UserId, UserName, Email, Role, Jti (unique ID)
```

## Authorization

| Policy | Requirement | Used By |
|--------|-------------|---------|
| `AdminOnly` | Role == "Admin" | AdminController (all endpoints) |
| `UserOrAdmin` | Role == "User" or "Admin" | Defined but controller-level `[Authorize]` used instead |

## Request Security Flow

```
Angular HTTP Request
       ↓
AuthInterceptor attaches Bearer token
       ↓
ASP.NET Core Middleware Pipeline
       ↓
CORS validation (AllowedOrigins whitelist)
       ↓
Rate Limiter (per-IP: otp-send, otp-verify, auth-register)
       ↓
JWT Bearer Authentication
  → Validate signature (HS256)
  → Validate issuer/audience
  → Validate expiry
  → Extract claims → HttpContext.User
       ↓
Authorization middleware
  → [Authorize] → requires any valid JWT
  → [Authorize(Policy = "AdminOnly")] → requires Admin role
       ↓
Controller action executes
       ↓
If 401 → Angular interceptor → attempt refresh → retry or logout
```

## Security Features
- **Password hashing:** BCrypt with salt (BCrypt.Net-Next)
- **HTML sanitization:** Ganss.XSS HtmlSanitizer on blog post content (server-side)
- **Rate limiting:** Per-IP on auth endpoints
- **CORS:** Whitelisted origins only
- **File upload validation:** Size limits (2MB avatar, 5MB images), type checking
- **Soft delete:** Data preserved, not permanently removed
- **Input validation:** DTO validation in controllers
- **Non-root Docker:** API container runs as non-root user

---

# PHASE 9 — CONFIGURATION ANALYSIS

## Backend (appsettings.json)

| Key | Value | Purpose |
|-----|-------|---------|
| `DatabaseProvider` | `"PostgreSQL"` (prod) / `"SqlServer"` (dev) | Selects EF Core provider |
| `ConnectionStrings:DefaultConnection` | Neon PostgreSQL URL (prod) / `DEBANJAN\SQLEXPRESS` (dev) | Database connection |
| `Jwt:Key` | 32+ char secret | HS256 signing key |
| `Jwt:Issuer` | `"BlogSpot.API"` | Token issuer claim |
| `Jwt:Audience` | `"BlogSpot.Client"` | Token audience claim |
| `Jwt:ExpirationInHours` | `"24"` | JWT lifetime |
| `AdminSeed:UserName` | `"admin"` | Auto-created admin username |
| `AdminSeed:Email` | `"blogspotadmin2@gmail.com"` | Auto-created admin email |
| `AdminSeed:Password` | `"Admin@123456"` | Auto-created admin password |
| `AdminSeed:DisplayName` | `"Administrator"` | Auto-created admin display name |
| `Cloudinary:CloudName/ApiKey/ApiSecret` | Empty = local storage | Image CDN config |
| `Email:BrevoApiKey` | API key | Transactional email provider |
| `Email:FromEmail/FromName` | Sender identity | Email from address |
| `Email:JobIntervalMinutes` | `"15"` | Background email processor interval (minutes) |
| `PostScheduler:JobIntervalMinutes` | `"30"` | Scheduled-post publisher poll interval (minutes) |
| `Cors:AllowedOrigins` | Array of URLs | Whitelisted frontend origins |

## Frontend Environments

| File | `apiUrl` | `production` |
|------|----------|-------------|
| `environment.ts` | `https://localhost:44346/api` | `false` |
| `environment.prod.ts` | `https://blogspot-2-0.onrender.com/api` | `true` |

## TypeScript Path Aliases (tsconfig.json)
- `@core/*` → `src/app/core/*`
- `@shared/*` → `src/app/shared/*`
- `@features/*` → `src/app/features/*`
- `@environments/*` → `src/environments/*`

---

# PHASE 10 — DEPLOYMENT ARCHITECTURE

## Actual Deployment Model

```
┌─────────────────────────────────────────────────────────┐
│                     PRODUCTION                           │
│                                                         │
│  ┌──────────────┐    ┌────────────────┐   ┌──────────┐  │
│  │   Vercel     │    │    Render      │   │   Neon   │  │
│  │  (Angular)   │───►│  (.NET API)    │──►│(Postgres)│  │
│  │  Static SPA  │    │  Docker        │   │ Free DB  │  │
│  │  Free tier   │    │  Free tier     │   │          │  │
│  └──────────────┘    └───────┬────────┘   └──────────┘  │
│                              │                           │
│                    ┌─────────┴─────────┐                 │
│                    │  External APIs    │                 │
│                    │  • Brevo (email)  │                 │
│                    │  • Cloudinary     │                 │
│                    │    (images)       │                 │
│                    └──────────────────┘                  │
│                                                         │
│  cron-job.org → GET /api/health every 14 min            │
│  (prevents Render free tier sleep)                      │
└─────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────┐
│               LOCAL DEVELOPMENT                          │
│                                                         │
│  ┌──────────────┐    ┌────────────────┐   ┌──────────┐  │
│  │ ng serve     │    │ dotnet run     │   │SQL Server│  │
│  │ :4200        │───►│ :44346 (HTTPS) │──►│ Express  │  │
│  │              │    │                │   │ (local)  │  │
│  └──────────────┘    └────────────────┘   └──────────┘  │
│                                                         │
│  proxy.conf.json: /uploads → localhost:44346             │
└─────────────────────────────────────────────────────────┘
```

## Docker (Local/Container Dev)

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `db` | `mcr.microsoft.com/mssql/server:2022-latest` | 1433 | SQL Server Express |
| `api` | Custom (multi-stage .NET 8 build) | 5000 → 8080 | Backend API |
| `client` | Custom (Node 20 build → Nginx) | 80 | Angular SPA + API proxy |

## Build Process
- **Backend:** `dotnet restore` → `dotnet build -c Release` → `dotnet publish` → multi-stage Docker
- **Frontend:** `npm ci` → `ng build --configuration production` → copy to Nginx container
- **Database:** Auto-migration on API startup (`db.Database.Migrate()`)
- **Render:** Auto-deploys on push to `master` branch

---

# PHASE 11 — REQUEST TRACE ANALYSIS (5 Major Screens)

## Trace 1: Home Feed Page

```
User opens /feed → FeedComponent initializes
    ↓
feed.component.ts calls FeedService.getHomeFeed(pagination)
    ↓
feed.service.ts → GET /api/feed/home (Bearer token)
    ↓
AuthInterceptor attaches JWT → auth.interceptor.ts
    ↓
FeedController.cs → GetHomeFeed() → extracts userId from claims
    ↓
FeedService.cs → GetHomeFeedAsync(userId, pagination)
    ↓
UnitOfWork → Query BlogPosts (followed users + trending fill)
    ↓
AppDbContext → EF Core SQL query → PostgreSQL/SQL Server
    ↓
Maps to PagedResult<BlogPostDto> → JSON response
    ↓
feed.component.ts renders PostCardComponent[] → post-card.component.ts
    ↓
Sidebar: user.service.ts → getSuggestedUsers → GET /api/user/suggested
```

## Trace 2: Blog Post Detail

```
User clicks post card → navigates to /blog/:slug
    ↓
blog-detail.component.ts → activatedRoute.params → slug
    ↓
blog.service.ts → getPostBySlug(slug) → GET /api/blog/slug/{slug}
    ↓
BlogController.cs → GetBySlug() → BlogService.cs → GetPostBySlugAsync
    ↓
Increments ViewCount in database
    ↓
Returns BlogPostDto (with author, reactions, tags, images, isLiked, isBookmarked)
    ↓
Renders: read progress bar, post content (ql-editor), engagement bar
    ↓
Comments: blog.service.ts → getComments(postId) → GET /api/blog/{id}/comments
    ↓
BlogService.cs → GetCommentsAsync → nested comment tree via ParentCommentId
    ↓
Reactions: blog.service.ts → getReactions(postId) → GET /api/blog/{id}/reactions
```

## Trace 3: User Registration

```
User navigates to /auth/register → RegisterComponent
    ↓
Step 1: Enter email → auth.service.ts → sendOtp(email)
    ↓
POST /api/auth/send-otp [Rate limited: 5/10min]
    ↓
AuthController.cs → EmailQueueService.cs → SendOtpAsync
    ↓
Generate 6-digit OTP → save OtpVerification (10-min expiry) → queue email
    ↓
EmailProcessorJob.cs (configurable cycle, 15 min in prod) → Brevo API sends OTP email
    ↓
Step 2: Enter OTP → auth.service.ts → verifyOtp(email, code)
    ↓
POST /api/auth/verify-otp → validates code, marks used
    ↓
Step 3: Fill form → auth.service.ts → register(dto)
    ↓
POST /api/auth/register → AuthService.cs → RegisterAsync
    ↓
BCrypt hash → Create User + Profile → Queue welcome email
    ↓
Generate JWT + RefreshToken → AuthResponseDto
    ↓
auth.service.ts stores in localStorage → currentUser$ emits
    ↓
Navigate to /feed
```

## Trace 4: Creator Analytics Dashboard

```
User navigates to /profile/analytics → AnalyticsComponent [AuthGuard]
    ↓
analytics.component.ts calls UserService.getCreatorAnalytics()
    ↓
user.service.ts → GET /api/user/analytics (Bearer token)
    ↓
UserController.cs → GetAnalytics() → userId from claims
    ↓
UserService.cs → GetCreatorAnalyticsAsync(userId)
    ↓
Queries via UnitOfWork:
  - TotalViews: SUM(BlogPosts.ViewCount) WHERE AuthorId = userId
  - TotalReactions: COUNT(Reactions) for user's posts
  - TotalComments: COUNT(Comments) for user's posts
  - TotalFollowers: COUNT(Follows) WHERE FollowingId = userId
  - FollowersGrowthLast30Days: COUNT new followers in 30 days
  - TopPosts: Top 5 by ViewCount
  - DailyStats: Last 30 days grouped by date
    ↓
Returns CreatorAnalyticsDto → renders stat cards + top posts table
```

## Trace 5: Admin User Management

```
Admin navigates to /admin → AdminDashboardComponent [AdminGuard]
    ↓
admin-dashboard.component.ts calls AdminService.getUsers(pagination)
    ↓
admin.service.ts → GET /api/admin/users (Bearer token, AdminOnly policy)
    ↓
AdminController.cs → GetUsers() → AdminService.cs → GetAllUsersAsync
    ↓
Queries Users with Profile data → maps to AdminUserDto
    ↓
Renders table with inline edit → Admin clicks "Toggle Status"
    ↓
admin.service.ts → toggleUserStatus(userId) → PUT /api/admin/users/{id}/toggle-status
    ↓
AdminService.cs → ToggleUserActiveStatusAsync → flips IsActive → email notification
    ↓
ActivityLogService.cs → Info("AdminAction", ...) → ActivityLogs table
    ↓
Table row updates in-place
```

---

# PHASE 12 — DESIGN PATTERNS

| Pattern | Where Used | Why | Benefit |
|---------|-----------|-----|---------|
| **Repository** | `Repository<T>` in Infrastructure | Abstracts EF Core data access behind `IRepository<T>` | Testability, persistence ignorance |
| **Unit of Work** | `UnitOfWork` exposes all repositories + `SaveChangesAsync()` | Coordinates multiple repository operations in one transaction | Consistency, prevents partial saves |
| **Dependency Injection** | Entire application via `AddApplication()` + `AddInfrastructure()` | Loose coupling between layers | Testability, swappable implementations |
| **Clean Architecture** | 4-project solution (Domain → Application → Infrastructure → API) | Domain logic independent of frameworks | Maintainability, framework independence |
| **DTO Pattern** | Separate DTOs for every API request/response | Decouple domain entities from API contracts | Security (no over-posting), versioning |
| **Mediator** (lightweight) | Services sit between controllers and repositories | Controllers don't access repositories directly | Separation of concerns |
| **Observer** | SignalR `ReceiveNotification` + Angular `BehaviorSubject` | Real-time push notifications | Decoupled event-driven updates |
| **Strategy** | `DatabaseProvider` config switches SQL Server / PostgreSQL | Support multiple DB providers with same codebase | Deployment flexibility |
| **Singleton** (Angular) | Core services (`AuthService`, `ThemeService`, etc.) provided in root | Single instance shared across app | Consistent state management |
| **Interceptor** | Angular `AuthInterceptor` | Cross-cutting concern (JWT attachment, token refresh) | DRY, centralized auth handling |
| **Guard** | `AuthGuard`, `AdminGuard` | Route protection | Security, UX |
| **Template Method** | `BaseEntity` with `Id`, `CreatedAt`, `UpdatedAt` | Common entity behavior | Consistency, less boilerplate |
| **Background Worker** | `EmailProcessorJob : BackgroundService` | Async email processing | Non-blocking, resilient delivery |
| **Soft Delete** | `IsDeleted` flag + EF query filters | Data recovery, audit trail | Data preservation |
| **Token Refresh** | JWT + Refresh Token with queued retry (Angular interceptor) | Transparent session extension | UX continuity |

---

# PHASE 13 — PERFORMANCE ANALYSIS

## Identified Bottlenecks & Recommendations

| Area | Issue | Impact | Recommendation |
|------|-------|--------|----------------|
| **Feed queries** | Home feed does 2 queries + merging in C# | Moderate latency | Use `sp_GetHomeFeed` stored procedure instead of EF LINQ |
| **N+1 queries** | Comment loading with nested replies can cause multiple DB trips | Slow comments on popular posts | Eager load with `.Include().ThenInclude()` or limit nesting depth |
| **View count** | Every slug GET does a DB write (increment ViewCount) | Write per read | Batch view counts with in-memory counter, flush periodically |
| **Full-text search** | LIKE-based search on Content (NVARCHAR MAX) | Slow on large datasets | Implement SQL Server Full-Text Index or PostgreSQL `tsvector` |
| **SearchCacheService** | Pre-loads 150 posts into browser memory on every page load | Memory on client, startup delay | Lazy-load cache on first search interaction, not on init |
| **Trending cache** | 5-minute MemoryCache with time-decay score | Acceptable | Good. Consider Redis for multi-instance deployments |
| **Image upload** | Synchronous upload to Cloudinary in request thread | Slow API response | Acceptable for now; consider background processing for bulk |
| **Email processing** | 50 emails/batch, configurable interval (15 min prod) | Acceptable | Good batching strategy |
| **Bundle size** | Angular budget: 5MB warning, 7MB error | Moderate | Monitor; Material + Quill are heavy. Tree-shake unused Material modules |

---

# PHASE 14 — NEW DEVELOPER KT GUIDE

## What to Learn First
1. The Clean Architecture pattern (Domain → Application → Infrastructure → API)
2. Angular module structure (Core/Features/Shared)
3. How authentication flows end-to-end (JWT + refresh + interceptor)
4. The blog post lifecycle (draft → publish → view → react → comment)

## Most Important Modules
1. **BlogService** / **BlogController** — core business logic
2. **AuthService** / **AuthInterceptor** — security foundation
3. **FeedService** — content discovery algorithm
4. **NotificationService** + **SignalRService** — real-time features

## Frequently Modified Files
- `src/BlogSpot.Application/Services/BlogService.cs` — any new post feature
- `src/BlogSpot.API/Controllers/BlogController.cs` — new endpoints
- `blogspot-client/src/app/core/services/blog.service.ts` — frontend API calls
- `blogspot-client/src/app/features/feed/feed.component.ts` — feed UI changes
- `blogspot-client/src/app/features/blog/blog-detail/blog-detail.component.ts` — post viewer
- `blogspot-client/src/styles.scss` — global theming

## Critical Business Flows
1. Registration with OTP verification
2. Blog post creation and publishing
3. Home feed generation (personalized + trending)
4. Real-time notification delivery via SignalR
5. Admin moderation (delete + email notification)

## Local Setup Guide
1. **Prerequisites:** .NET 8 SDK, Node.js 20+, SQL Server Express (or Docker)
2. **Backend:**
   ```
   cd src/BlogSpot.API
   dotnet restore
   dotnet run          # Starts on https://localhost:44346
   ```
   Migrations auto-apply on startup. Admin account auto-created from `AdminSeed` config.
3. **Frontend:**
   ```
   cd blogspot-client
   npm install
   ng serve             # Starts on http://localhost:4200
   ```
   Proxy config routes `/uploads` to backend.
4. **Docker (alternative):**
   ```
   docker-compose up    # SQL Server + API + Angular on localhost
   ```

## Debugging Approach
- **Backend errors:** Check `logs/blogspot-*.log` (Serilog) and `ActivityLogs` table
- **API issues:** Swagger UI at `https://localhost:44346/swagger`
- **Frontend issues:** Browser DevTools → Network tab for API calls, Console for JS errors
- **Auth issues:** Check JWT expiry, refresh token flow in interceptor, localStorage tokens
- **Database issues:** Check EF Core SQL logging (Serilog), migration status

## Common Production Issues
- **Render free tier sleep:** Service sleeps after 15 min inactivity. Cron job pings `/api/health` every 14 min.
- **Migration provider mismatch:** Migrations must use `ActiveProvider` branching for column types (e.g., `nvarchar` vs `character varying`).
- **Cloudinary not configured:** Falls back to local storage which doesn't persist across Render deploys. Must configure Cloudinary for production.
- **Email delivery:** Brevo API key must be valid; check EmailQueue table for Failed status.

## 30-Day Learning Roadmap

### Week 1 — Foundation
- Day 1-2: Read this KT document. Understand solution structure and Clean Architecture.
- Day 3: Run the application locally (both backend and frontend). Explore Swagger.
- Day 4: Trace the Login flow end-to-end (register, login, JWT, interceptor).
- Day 5: Trace the Blog Post creation flow end-to-end.

### Week 2 — Backend Mastery
- Day 6-7: Study all entities and their relationships. Read `Database/BlogSpot_FullSetup.sql`.
- Day 8: Understand Repository + UnitOfWork pattern. Read `Repository.cs`, `UnitOfWork.cs`.
- Day 9: Study `BlogService` and `UserService` in depth — most business logic lives here.
- Day 10: Study the notification system (SignalR hub + NotificationService + Angular SignalR).

### Week 3 — Frontend Mastery
- Day 11-12: Study Angular module structure, routing, lazy loading, guards, interceptor.
- Day 13: Understand the Feed component, post cards, and engagement actions.
- Day 14: Study the Blog editor (Quill integration, grammar check, drafts).
- Day 15: Study the Profile and Admin modules.

### Week 4 — Operations & Confidence
- Day 16-17: Understand the deployment pipeline (Docker, Render, Vercel, Neon).
- Day 18: Practice making a small feature change (e.g., add a new field to ProfileEdit).
- Day 19: Practice debugging a simulated issue (e.g., intentionally break a DTO mapping).
- Day 20: Review the `future-plans/` documents and identify potential first contributions.

---

# PHASE 15 — ARCHITECT REVIEW

## Why This Architecture Was Chosen
Clean Architecture provides maximum separation of concerns. The domain layer has zero dependencies, making business rules portable. The dual-database strategy (SQL Server for local dev, PostgreSQL for free cloud hosting) maximizes developer experience while minimizing hosting costs.

## Strengths
- Clean separation: 4-project structure with proper dependency flow
- Comprehensive features: Full blogging platform with social features, real-time notifications, admin panel
- Dual-DB support: Same codebase works on SQL Server and PostgreSQL
- Real-time: SignalR integration for instant notifications
- Background processing: Email queue with retry logic
- Security: JWT + refresh tokens, BCrypt, HTML sanitization, rate limiting, CORS
- Responsive UI: Material Design with dark mode, mobile support

## Weaknesses
- No automated tests: No unit or integration test projects exist
- No CQRS: Read and write operations use the same models/services
- No API versioning: Breaking changes would affect all clients
- No caching layer: Only MemoryCache for trending feed; no distributed cache (Redis)
- Monolith: Single API handles all domains; no microservice boundaries
- Frontend state: Scattered BehaviorSubjects; no centralized state management
- No Change Detection optimization: Components don't use OnPush strategy

## Critical Modules (Handle With Care)
1. **AuthService / JWT generation** — any bug breaks all authenticated features
2. **ExceptionHandlingMiddleware** — catches all unhandled errors; bugs here cause silent failures
3. **AuthInterceptor** — token refresh logic; race conditions can cause mass logouts
4. **UnitOfWork** — transaction boundary; bugs cause data inconsistency
5. **EF Migrations** — must use `ActiveProvider` branching or production PostgreSQL breaks

## Refactoring Opportunities
1. Add unit + integration test projects
2. Introduce MediatR for CQRS (separate read/write paths)
3. Add API versioning (`/api/v1/`)
4. Move to NgRx or Angular Signals for frontend state
5. Add OnPush change detection to components
6. Replace LIKE search with full-text search index
7. Batch ViewCount increments
8. Add health check endpoint with dependency checks

## Technical Debt
- Legacy `Like` entity co-exists with newer `Reaction` entity
- Some hardcoded colors in component SCSS instead of CSS variables
- Inconsistent dark mode (CSS variable overrides not complete)
- Scattered responsive breakpoints (768px, 600px, 599px, 480px, 400px)
- No error boundary components for feature modules
- `FormatContentPipe` uses `bypassSecurityTrustHtml` which bypasses Angular's built-in XSS protection

---

# PHASE 16 — VISUAL ARCHITECTURE DIAGRAMS

## Component Diagram

```
┌──────────────── ANGULAR SPA ──────────────────────────────────┐
│                                                                │
│  ┌─────────┐  ┌──────┐  ┌──────┐  ┌────────┐  ┌───────┐     │
│  │  Auth   │  │ Feed │  │ Blog │  │Profile │  │ Admin │     │
│  │LoginComp│  │FeedCp│  │Create│  │ViewComp│  │DashCp │     │
│  │RegComp  │  │      │  │Detail│  │EditComp│  │       │     │
│  └────┬────┘  └──┬───┘  │Search│  │Analyti │  └───┬───┘     │
│       │          │      │Drafts│  │Notific │      │         │
│       │          │      │Bookm │  └───┬────┘      │         │
│       │          │      └──┬───┘      │           │         │
│  ─────┼──────────┼─────────┼──────────┼───────────┼─────    │
│  ┌────▼──────────▼─────────▼──────────▼───────────▼────┐    │
│  │              CORE SERVICES                           │    │
│  │ Auth│Blog│User│Feed│Notification│SignalR│Theme│Cache │    │
│  └─────────────────────────┬───────────────────────────┘    │
│  ┌─────────────────────────┼───────────────────────────┐    │
│  │              SHARED                                  │    │
│  │ PostCard│UserCard│LoadingSpinner│ErrorState│Pipes    │    │
│  └─────────────────────────────────────────────────────┘    │
└────────────────────────────┼────────────────────────────────┘
                             │ HTTP + WebSocket
┌────────────────────────────┼────────────────────────────────┐
│               .NET 8 API   │                                 │
│  ┌─────────────────────────▼───────────────────────────┐    │
│  │ Auth│Blog│User│Feed│Notification│Admin (Controllers) │    │
│  └─────────────────────────┬───────────────────────────┘    │
│  ┌─────────────────────────▼───────────────────────────┐    │
│  │ Blog│User│Feed│Admin│Notification│ActivityLog (Svc)  │    │
│  └─────────────────────────┬───────────────────────────┘    │
│  ┌─────────────────────────▼───────────────────────────┐    │
│  │ Repository<T>│UnitOfWork│Auth│Email│File (Infra)     │    │
│  └─────────────────────────┬───────────────────────────┘    │
└────────────────────────────┼────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │    Database     │
                    │ 17 Tables / 7 SP│
                    └─────────────────┘
```

## Authentication Sequence Diagram

```
Browser              Angular                API                  DB
  │                    │                     │                    │
  │ Enter credentials  │                     │                    │
  ├───────────────────►│                     │                    │
  │                    │ POST /auth/login    │                    │
  │                    ├────────────────────►│                    │
  │                    │                     │ Find user by email │
  │                    │                     ├───────────────────►│
  │                    │                     │◄───────────────────┤
  │                    │                     │ BCrypt.Verify      │
  │                    │                     │ Generate JWT+RT    │
  │                    │ AuthResponseDto     │                    │
  │                    │◄────────────────────┤                    │
  │                    │ Store in localStorage                    │
  │                    │ Emit currentUser$   │                    │
  │ Redirect to /feed  │                     │                    │
  │◄───────────────────┤                     │                    │
  │                    │                     │                    │
  │ [Later: token expires]                   │                    │
  │                    │ GET /api/feed (401) │                    │
  │                    │◄────────────────────┤                    │
  │                    │ POST /auth/refresh  │                    │
  │                    ├────────────────────►│                    │
  │                    │ New JWT+RT          │                    │
  │                    │◄────────────────────┤                    │
  │                    │ Retry original req  │                    │
  │                    ├────────────────────►│                    │
```

## Deployment Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     INTERNET                             │
│                                                         │
│  Users ──────► Vercel CDN ──────► Render Free Tier      │
│                (Angular)          (.NET Docker)          │
│                   │                   │                  │
│                   │            ┌──────┴──────┐          │
│                   │            │             │          │
│                   │         Neon.tech     Brevo API     │
│                   │        (PostgreSQL)   (Email)       │
│                   │            │             │          │
│                   │         Cloudinary       │          │
│                   │        (Image CDN)       │          │
│                   │                          │          │
│              cron-job.org                    │          │
│            (keep-alive ping)                 │          │
└─────────────────────────────────────────────────────────┘
```

## Module Dependency Diagram

```
BlogSpot.API
    ├──► BlogSpot.Application
    │        └──► BlogSpot.Domain
    └──► BlogSpot.Infrastructure
             ├──► BlogSpot.Application
             └──► BlogSpot.Domain

Angular:
  AppModule
    ├── CoreModule (eager)
    │    └── NavbarComponent, all Services, Guards, Interceptors
    ├── SharedModule (eager)
    │    └── PostCard, UserCard, Spinner, ErrorState, Pipes
    └── Feature Modules (lazy)
         ├── AuthModule
         ├── FeedModule
         ├── BlogModule
         ├── ProfileModule
         └── AdminModule
```

---

# PHASE 17 — COMPLETE TECHNOLOGY INVENTORY

| Category | Items |
|----------|-------|
| **Projects** | BlogSpot.Domain, BlogSpot.Application, BlogSpot.Infrastructure, BlogSpot.API, blogspot-client |
| **Angular Modules** | App, Core, Shared, Auth, Feed, Blog, Profile, Admin (8) |
| **Controllers** | Auth, Blog, User, Feed, Notification, Admin (6, 60+ endpoints) |
| **Backend Services** | Blog, User, Feed, Admin, Notification, ActivityLog, PostScheduler, Auth, Email, File (10) |
| **Angular Services** | Auth, Blog, User, Feed, Notification, SignalR, Admin, Theme, Grammar, SearchCache, Export (11) |
| **Database Tables** | 17 |
| **Stored Procedures** | 7 |
| **EF Migrations** | 6 |
| **Entities** | 16 |
| **DTOs** | 25+ |
| **Angular Components** | ~15 feature + 4 shared + 1 navbar |
| **Guards** | AuthGuard, AdminGuard |
| **Interceptors** | AuthInterceptor |
| **Pipes** | ImageUrlPipe, FormatContentPipe |
| **Docker files** | Dockerfile (API), Dockerfile.frontend, docker-compose.yml |
| **Config files** | appsettings.json, appsettings.Development.json, angular.json, tsconfig.json, proxy.conf.json, nginx.conf, vercel.json, render.yaml |
| **NuGet packages** | Serilog, JWT Bearer, EF Core (SqlServer + Npgsql), Cloudinary, BCrypt, HtmlSanitizer, FluentValidation, AutoMapper, Swashbuckle |
| **npm packages** | Angular 17, Material 17, SignalR 8, ngx-quill 25, Quill 2, RxJS 7, xlsx, file-saver |
