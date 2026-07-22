using BlogSpot.Application.DTOs.Admin;
using BlogSpot.Application.DTOs.Common;
using BlogSpot.Application.Interfaces;
using BlogSpot.Domain.Entities;
using BlogSpot.Domain.Enums;
using BlogSpot.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BlogSpot.Application.Services;

public class AdminService : IAdminService
{
    private readonly IUnitOfWork _uow;
    private readonly DbContext _dbContext;

    public AdminService(IUnitOfWork uow, DbContext dbContext)
    {
        _uow = uow;
        _dbContext = dbContext;
    }

    public async Task<PagedResult<AdminUserDto>> GetAllUsersAsync(PaginationParams pagination, CancellationToken ct = default)
    {
        var query = _uow.Users.Query()
            .Include(u => u.BlogPosts)
            .Include(u => u.Comments)
            .OrderByDescending(u => u.CreatedAt);

        var totalCount = await query.CountAsync(ct);
        var users = await query
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .ToListAsync(ct);

        return new PagedResult<AdminUserDto>
        {
            Items = users.Select(u => new AdminUserDto
            {
                Id = u.Id,
                UserName = u.UserName,
                Email = u.Email,
                Role = u.Role.ToString(),
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt,
                PostsCount = u.BlogPosts.Count,
                CommentsCount = u.Comments.Count
            }).ToList(),
            TotalCount = totalCount,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task ToggleUserActiveStatusAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _uow.Users.GetByIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("User not found.");

        user.IsActive = !user.IsActive;
        user.UpdatedAt = DateTime.UtcNow;
        _uow.Users.Update(user);
        await _uow.SaveChangesAsync(ct);
    }

    public async Task ChangeUserRoleAsync(Guid userId, string role, CancellationToken ct = default)
    {
        var user = await _uow.Users.GetByIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("User not found.");

        if (!Enum.TryParse<UserRole>(role, true, out var parsedRole))
            throw new ArgumentException($"Invalid role: {role}");

        user.Role = parsedRole;
        user.UpdatedAt = DateTime.UtcNow;
        _uow.Users.Update(user);
        await _uow.SaveChangesAsync(ct);
    }

    public async Task<PagedResult<AdminPostDto>> GetAllPostsAsync(PaginationParams pagination, CancellationToken ct = default)
    {
        var query = _uow.BlogPosts.Query()
            .Include(p => p.Author)
            .Include(p => p.Likes)
            .Include(p => p.Comments)
            .OrderByDescending(p => p.CreatedAt);

        var totalCount = await query.CountAsync(ct);
        var posts = await query
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .ToListAsync(ct);

        return new PagedResult<AdminPostDto>
        {
            Items = posts.Select(p => new AdminPostDto
            {
                Id = p.Id,
                Title = p.Title,
                Slug = p.Slug,
                AuthorUserName = p.Author.UserName,
                IsPublished = p.IsPublished,
                LikeCount = p.Likes.Count,
                CommentCount = p.Comments.Count,
                CreatedAt = p.CreatedAt
            }).ToList(),
            TotalCount = totalCount,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task AdminDeletePostAsync(Guid postId, CancellationToken ct = default)
    {
        var post = await _uow.BlogPosts.GetByIdAsync(postId, ct)
            ?? throw new KeyNotFoundException("Post not found.");

        _uow.BlogPosts.Remove(post);
        await _uow.SaveChangesAsync(ct);
    }

    public async Task<PagedResult<AdminCommentDto>> GetAllCommentsAsync(PaginationParams pagination, CancellationToken ct = default)
    {
        var query = _uow.Comments.Query()
            .Include(c => c.User)
            .Include(c => c.BlogPost)
            .OrderByDescending(c => c.CreatedAt);

        var totalCount = await query.CountAsync(ct);
        var comments = await query
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .ToListAsync(ct);

        return new PagedResult<AdminCommentDto>
        {
            Items = comments.Select(c => new AdminCommentDto
            {
                Id = c.Id,
                Content = c.Content,
                UserName = c.User.UserName,
                PostTitle = c.BlogPost.Title,
                CreatedAt = c.CreatedAt
            }).ToList(),
            TotalCount = totalCount,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task AdminDeleteCommentAsync(Guid commentId, CancellationToken ct = default)
    {
        var comment = await _uow.Comments.GetByIdAsync(commentId, ct)
            ?? throw new KeyNotFoundException("Comment not found.");

        _uow.Comments.Remove(comment);
        await _uow.SaveChangesAsync(ct);
    }

    public async Task<string> SeedDummyDataAsync(CancellationToken ct = default)
    {
        // Check if already seeded (more than 5 users means data exists)
        var existingCount = await _uow.Users.CountAsync(ct: ct);
        if (existingCount > 5)
            return "Data already seeded. Delete existing users first if you want to re-seed.";

        var password = BCrypt.Net.BCrypt.HashPassword("Test@1234");
        var random = new Random(42);

        // --- 1. Create Users with Profiles ---
        var userData = new[]
        {
            ("alexcoder", "alex.coder@demo.com", "Alex Johnson", "Full-stack developer passionate about clean code and open source.", "San Francisco, CA", "C#, Angular, Docker, PostgreSQL", "https://alexjohnson.dev"),
            ("priya_writes", "priya.r@demo.com", "Priya Ramaswamy", "Tech writer & blogger. Making complex topics simple.", "Bangalore, India", "Technical Writing, React, Node.js", "https://priyawrites.com"),
            ("marco_dev", "marco.b@demo.com", "Marco Benedetti", "Backend engineer. Coffee addict. Building scalable systems.", "Milan, Italy", "Java, Kotlin, AWS, Kubernetes", null),
            ("sarah_designs", "sarah.k@demo.com", "Sarah Kim", "UI/UX designer turned developer. Pixel perfect everything.", "Seoul, South Korea", "Figma, CSS, Angular, TypeScript", "https://sarahkim.design"),
            ("javier_code", "javier.m@demo.com", "Javier Martinez", "DevOps engineer. Automating everything since 2015.", "Madrid, Spain", "Terraform, CI/CD, Python, Linux", null),
            ("emma_tech", "emma.w@demo.com", "Emma Williams", "Data scientist exploring ML and AI. Love sharing knowledge.", "London, UK", "Python, TensorFlow, SQL, Data Viz", "https://emmawilliams.io"),
            ("ryu_dev", "ryu.t@demo.com", "Ryu Tanaka", "Mobile developer. Flutter & Swift enthusiast.", "Tokyo, Japan", "Flutter, Swift, Firebase, Dart", null),
            ("nina_cloud", "nina.s@demo.com", "Nina Sharma", "Cloud architect. Helping teams go serverless.", "Toronto, Canada", "AWS, Azure, Serverless, Go", "https://ninacloud.dev"),
            ("carlos_ai", "carlos.g@demo.com", "Carlos Garcia", "AI researcher and educator. Demystifying machine learning.", "Mexico City, Mexico", "PyTorch, NLP, Computer Vision", null),
            ("lisa_rust", "lisa.chen@demo.com", "Lisa Chen", "Systems programmer. Rust advocate. Performance matters.", "Seattle, WA", "Rust, C++, WebAssembly, Linux", "https://lisachen.dev"),
            ("omar_sec", "omar.f@demo.com", "Omar Farouk", "Cybersecurity expert. Bug bounty hunter.", "Cairo, Egypt", "Pentesting, Python, Network Security", null),
            ("anna_data", "anna.p@demo.com", "Anna Petrova", "Database engineer. Query optimization is my therapy.", "Berlin, Germany", "PostgreSQL, MongoDB, Redis, SQL", "https://annapetrova.tech"),
            ("dev_mike", "mike.j@demo.com", "Mike Johnson", "Startup CTO. Building products that matter.", "Austin, TX", ".NET, React, Azure, Microservices", null),
            ("zara_web", "zara.a@demo.com", "Zara Ahmed", "Frontend developer. Accessibility advocate.", "Dubai, UAE", "Angular, WCAG, HTML, CSS", "https://zaraahmed.dev"),
            ("tom_ops", "tom.b@demo.com", "Tom Brown", "SRE at scale. Monitoring all the things.", "Sydney, Australia", "Prometheus, Grafana, Go, K8s", null),
        };

        var users = new List<User>();
        var profiles = new List<Profile>();

        foreach (var (username, email, displayName, bio, location, skills, website) in userData)
        {
            var user = new User
            {
                UserName = username,
                Email = email,
                PasswordHash = password,
                Role = UserRole.User,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-random.Next(10, 90))
            };
            users.Add(user);

            var profile = new Profile
            {
                UserId = user.Id,
                DisplayName = displayName,
                Bio = bio,
                Location = location,
                Skills = skills,
                Website = website,
                CreatedAt = user.CreatedAt
            };
            profiles.Add(profile);
        }

        await _uow.Users.AddRangeAsync(users, ct);
        await _uow.Profiles.AddRangeAsync(profiles, ct);
        await _uow.SaveChangesAsync(ct);

        // --- 2. Create Tags ---
        var tagNames = new[] { "CSharp", "Angular", "Python", "JavaScript", "DevOps", "AI", "Cloud", "Docker", "React", "Database", "Security", "Career", "Tutorial", "WebDev", "Mobile" };
        var tags = tagNames.Select(t => new Tag { Name = t, NormalizedName = t.ToUpperInvariant() }).ToList();
        await _uow.Tags.AddRangeAsync(tags, ct);
        await _uow.SaveChangesAsync(ct);

        // --- 3. Create Blog Posts ---
        var postData = new[]
        {
            ("Getting Started with .NET 8 Minimal APIs", "Learn how to build blazing-fast APIs with .NET 8 minimal API pattern. We cover routing, dependency injection, and middleware in a clean, concise way that gets you productive fast.", "A practical guide to building APIs with .NET 8 minimal pattern.", "CSharp,WebDev,Tutorial"),
            ("Angular Signals: The Future of Reactivity", "Angular Signals represent a paradigm shift in how we handle reactivity. This deep dive covers signals, computed values, and effects with real-world examples.", "Deep dive into Angular's new reactivity model with Signals.", "Angular,JavaScript,Tutorial"),
            ("Building a CI/CD Pipeline with GitHub Actions", "Automate your deployments with GitHub Actions. From testing to production deployment, this guide walks you through setting up a complete pipeline.", "Step-by-step guide to automated deployments with GitHub Actions.", "DevOps,Tutorial"),
            ("Machine Learning for Web Developers", "You don't need a PhD to use ML. Learn how to integrate TensorFlow.js into your web applications for smart features like image recognition and text analysis.", "Practical ML integration for web developers using TensorFlow.js.", "AI,JavaScript,Tutorial"),
            ("PostgreSQL Performance Tuning: A Practical Guide", "Slow queries killing your app? This guide covers indexing strategies, query optimization, EXPLAIN ANALYZE, and connection pooling for real-world performance gains.", "Essential PostgreSQL optimization techniques for production databases.", "Database,Tutorial"),
            ("Microservices vs Monolith: When to Choose What", "The microservices hype is real, but is it right for you? A balanced analysis of when to choose microservices over monoliths, with real-world case studies.", "Honest comparison of microservices and monolithic architectures.", "Cloud,DevOps,Career"),
            ("Rust for Backend Development: Why It Matters", "Rust isn't just for systems programming. Explore how Rust frameworks like Actix and Axum are challenging the traditional backend landscape.", "Exploring Rust as a serious backend development language.", "WebDev"),
            ("Docker Best Practices for Production", "Stop using Docker like it's development. Learn production-grade Dockerfile patterns, multi-stage builds, security scanning, and orchestration basics.", "Production-ready Docker patterns and security best practices.", "Docker,DevOps,Security"),
            ("React vs Angular vs Vue in 2026", "The frontend framework war continues. An objective comparison based on performance benchmarks, developer experience, ecosystem, and enterprise adoption.", "Objective comparison of the big three frontend frameworks in 2026.", "React,Angular,JavaScript"),
            ("Securing Your API: OWASP Top 10 Explained", "API security is not optional. Walk through the OWASP Top 10 API security risks with practical examples and mitigation strategies for each vulnerability.", "Understanding and preventing the top API security vulnerabilities.", "Security,WebDev,Tutorial"),
            ("The Complete Guide to Redis Caching", "Redis is more than a cache. Learn about data structures, pub/sub, streams, and how to architect your caching layer for maximum performance.", "Comprehensive guide to Redis caching architecture and patterns.", "Database,Cloud"),
            ("Flutter vs React Native: Mobile Development in 2026", "Building cross-platform mobile apps? Compare Flutter and React Native on performance, developer experience, and ecosystem maturity.", "Comparing the two leading cross-platform mobile frameworks.", "Mobile,JavaScript"),
            ("Kubernetes for Beginners: Your First Deployment", "Kubernetes doesn't have to be scary. This beginner-friendly guide gets you from zero to your first deployed application with clear, simple steps.", "Beginner-friendly introduction to deploying apps on Kubernetes.", "Cloud,Docker,DevOps,Tutorial"),
            ("Writing Clean Code: Principles That Actually Work", "Uncle Bob's principles revisited for modern development. Practical clean code techniques that improve readability without over-engineering.", "Practical clean code principles for modern software development.", "Career,Tutorial"),
            ("GraphQL vs REST: Making the Right Choice", "GraphQL isn't always the answer. Understand the trade-offs between GraphQL and REST APIs with real scenarios where each shines.", "Balanced comparison of GraphQL and REST for API design decisions.", "WebDev,Tutorial"),
            ("Python Type Hints: Why You Should Use Them", "Dynamic typing is great until your codebase grows. Learn how Python type hints improve code quality, IDE support, and team collaboration.", "Making Python codebases more maintainable with type hints.", "Python,Tutorial"),
            ("AWS Lambda vs Azure Functions: Serverless Showdown", "Two cloud giants, two serverless platforms. Compare pricing, cold starts, language support, and developer experience.", "Head-to-head comparison of AWS Lambda and Azure Functions.", "Cloud"),
            ("Building Real-time Features with SignalR", "Add real-time notifications, chat, and live updates to your .NET application using SignalR. Covers WebSocket fallbacks and scaling strategies.", "Guide to building real-time web features with SignalR.", "CSharp,WebDev,Tutorial"),
            ("The Art of Code Review: Beyond Nitpicking", "Great code reviews build better teams. Learn how to give constructive feedback, what to focus on, and how to create a positive review culture.", "Building better teams through effective code review practices.", "Career"),
            ("Intro to WebAssembly: Running C++ in the Browser", "WebAssembly is changing what's possible in the browser. Learn how to compile C++ to Wasm and integrate it with your JavaScript applications.", "Getting started with WebAssembly for high-performance web apps.", "WebDev,JavaScript"),
        };

        var posts = new List<BlogPost>();
        var postTags = new List<BlogPostTag>();

        for (int i = 0; i < postData.Length; i++)
        {
            var (title, content, summary, tagCsv) = postData[i];
            var author = users[i % users.Count];
            var slug = title.ToLowerInvariant()
                .Replace(":", "").Replace("?", "").Replace("'", "")
                .Replace("  ", " ").Replace(" ", "-")
                .Replace(".", "").Replace(",", "");

            var post = new BlogPost
            {
                Title = title,
                Content = content,
                Summary = summary,
                Slug = slug,
                IsPublished = true,
                IsDraft = false,
                AuthorId = author.Id,
                ViewCount = random.Next(5, 500),
                ReadingTimeMinutes = random.Next(2, 12),
                Category = tagCsv.Split(',')[0],
                CreatedAt = DateTime.UtcNow.AddDays(-random.Next(1, 60)).AddHours(-random.Next(0, 24))
            };
            posts.Add(post);

            // Attach tags
            foreach (var tagName in tagCsv.Split(','))
            {
                var tag = tags.FirstOrDefault(t => t.Name == tagName.Trim());
                if (tag != null)
                    postTags.Add(new BlogPostTag { BlogPostId = post.Id, TagId = tag.Id });
            }
        }

        await _uow.BlogPosts.AddRangeAsync(posts, ct);
        await _uow.SaveChangesAsync(ct);

        // Save post tags via DbContext directly
        _dbContext.Set<BlogPostTag>().AddRange(postTags);
        await _dbContext.SaveChangesAsync(ct);

        // --- 4. Create Follows (random connections) ---
        var follows = new List<Follow>();
        foreach (var user in users)
        {
            var toFollow = users.Where(u => u.Id != user.Id).OrderBy(_ => random.Next()).Take(random.Next(2, 6));
            foreach (var target in toFollow)
            {
                if (!follows.Any(f => f.FollowerId == user.Id && f.FollowingId == target.Id))
                    follows.Add(new Follow { FollowerId = user.Id, FollowingId = target.Id });
            }
        }
        _dbContext.Set<Follow>().AddRange(follows);
        await _uow.SaveChangesAsync(ct);

        // --- 5. Create Likes (random) ---
        var likes = new List<Like>();
        foreach (var post in posts)
        {
            var likers = users.OrderBy(_ => random.Next()).Take(random.Next(1, 8));
            foreach (var liker in likers)
            {
                likes.Add(new Like { UserId = liker.Id, BlogPostId = post.Id });
            }
        }
        await _uow.Likes.AddRangeAsync(likes, ct);
        await _uow.SaveChangesAsync(ct);

        // --- 6. Create Comments ---
        var commentTexts = new[]
        {
            "Great article! Really helped me understand the concept.",
            "Thanks for sharing this, very informative.",
            "I've been looking for something like this. Bookmarked!",
            "Excellent write-up. Would love a follow-up on advanced topics.",
            "This is exactly what I needed for my project.",
            "Well explained! The examples are very practical.",
            "Interesting perspective. I hadn't thought about it this way.",
            "Solid content as always. Keep it coming!",
            "Just implemented this in my project. Works perfectly.",
            "Can you elaborate more on the performance aspects?",
            "This should be mandatory reading for all developers.",
            "Love the balanced approach. Not just hype but real analysis.",
        };

        var comments = new List<Comment>();
        foreach (var post in posts.Take(15))
        {
            var commentCount = random.Next(1, 5);
            for (int c = 0; c < commentCount; c++)
            {
                var commenter = users[random.Next(users.Count)];
                comments.Add(new Comment
                {
                    BlogPostId = post.Id,
                    UserId = commenter.Id,
                    Content = commentTexts[random.Next(commentTexts.Length)],
                    CreatedAt = post.CreatedAt.AddHours(random.Next(1, 72))
                });
            }
        }
        await _uow.Comments.AddRangeAsync(comments, ct);
        await _uow.SaveChangesAsync(ct);

        return $"Seeded {users.Count} users, {posts.Count} posts, {follows.Count} follows, {likes.Count} likes, {comments.Count} comments.";
    }
}
