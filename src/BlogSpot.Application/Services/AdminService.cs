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
    private readonly IEmailQueueService _emailQueueService;

    public AdminService(IUnitOfWork uow, DbContext dbContext, IEmailQueueService emailQueueService)
    {
        _uow = uow;
        _dbContext = dbContext;
        _emailQueueService = emailQueueService;
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

        // Email notification
        var status = user.IsActive ? "activated" : "deactivated";
        await _emailQueueService.EnqueueAsync(user.Email,
            $"BlogSpot - Your account has been {status}",
            $@"<div style='font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px'>
                <h2 style='color:#1d9bf0'>Account Update</h2>
                <p>Hi <strong>{user.UserName}</strong>,</p>
                <p>Your BlogSpot account has been <strong>{status}</strong> by an administrator.</p>
                {(user.IsActive ? "<p>You can now log in and use all features.</p>" : "<p>If you believe this is a mistake, please contact support.</p>")}
                <p style='color:#536471;font-size:13px;margin-top:24px'>-- The BlogSpot Team</p>
            </div>", ct);
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

        // Email notification
        await _emailQueueService.EnqueueAsync(user.Email,
            "BlogSpot - Your role has been updated",
            $@"<div style='font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px'>
                <h2 style='color:#1d9bf0'>Role Update</h2>
                <p>Hi <strong>{user.UserName}</strong>,</p>
                <p>Your role on BlogSpot has been changed to <strong>{role}</strong>.</p>
                {(role == "Admin" ? "<p>You now have access to the Admin Dashboard and management features.</p>" : "<p>Your permissions have been updated accordingly.</p>")}
                <p style='color:#536471;font-size:13px;margin-top:24px'>-- The BlogSpot Team</p>
            </div>", ct);
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
        var post = await _uow.BlogPosts.Query()
            .Include(p => p.Author)
            .FirstOrDefaultAsync(p => p.Id == postId, ct)
            ?? throw new KeyNotFoundException("Post not found.");

        var authorEmail = post.Author.Email;
        var authorName = post.Author.UserName;
        var postTitle = post.Title;

        _uow.BlogPosts.Remove(post);
        await _uow.SaveChangesAsync(ct);

        // Email notification to author
        await _emailQueueService.EnqueueAsync(authorEmail,
            "BlogSpot - Your post has been removed",
            $@"<div style='font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px'>
                <h2 style='color:#f4212e'>Post Removed</h2>
                <p>Hi <strong>{authorName}</strong>,</p>
                <p>Your post <strong>{postTitle}</strong> has been removed by an administrator for violating our community guidelines.</p>
                <p>If you believe this is a mistake, please contact support.</p>
                <p style='color:#536471;font-size:13px;margin-top:24px'>-- The BlogSpot Team</p>
            </div>", ct);
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
        var comment = await _uow.Comments.Query()
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == commentId, ct)
            ?? throw new KeyNotFoundException("Comment not found.");

        var userEmail = comment.User.Email;
        var userName = comment.User.UserName;
        var commentSnippet = comment.Content.Length > 50 ? comment.Content[..50] + "..." : comment.Content;

        _uow.Comments.Remove(comment);
        await _uow.SaveChangesAsync(ct);

        // Email notification to comment author
        await _emailQueueService.EnqueueAsync(userEmail,
            "BlogSpot - Your comment has been removed",
            $@"<div style='font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px'>
                <h2 style='color:#f4212e'>Comment Removed</h2>
                <p>Hi <strong>{userName}</strong>,</p>
                <p>Your comment <em>{commentSnippet}</em> has been removed by an administrator for violating our community guidelines.</p>
                <p>Please ensure your comments follow our community standards.</p>
                <p style='color:#536471;font-size:13px;margin-top:24px'>-- The BlogSpot Team</p>
            </div>", ct);
    }

    public async Task<string> SeedDummyDataAsync(CancellationToken ct = default)
    {
        // Check if already seeded (more than 5 users means data exists)
        var existingCount = await _uow.Users.CountAsync(ct: ct);
        if (existingCount > 5)
            return "Data already seeded. Delete existing users first if you want to re-seed.";

        var password = BCrypt.Net.BCrypt.HashPassword("Test@1234");
        var random = new Random(42);

        // --- 1. Create Users with Profiles (30 Indian users) ---
        var userData = new[]
        {
            ("arjun_sharma", "arjun.sharma92@gmail.com", "Arjun Sharma", "Full-stack .NET developer from Delhi. Passionate about clean architecture and microservices.", "New Delhi", "C#, Angular, Docker, PostgreSQL", "https://arjunsharma.dev"),
            ("priya_iyer", "priya.iyer.tech@gmail.com", "Priya Iyer", "Tech blogger and React enthusiast. Simplifying web development one post at a time.", "Chennai", "React, JavaScript, Node.js, CSS", "https://priyaiyer.in"),
            ("rahul_verma", "rahul.verma.codes@gmail.com", "Rahul Verma", "Backend engineer at a Bengaluru startup. Java and Kotlin fanatic.", "Bengaluru", "Java, Kotlin, Spring Boot, AWS", null),
            ("sneha_kulkarni", "sneha.kulkarni99@gmail.com", "Sneha Kulkarni", "UI/UX designer turned Angular developer. I make beautiful things work.", "Pune", "Angular, TypeScript, Figma, CSS", "https://snehakulkarni.design"),
            ("amit_patel", "amit.patel.devops@gmail.com", "Amit Patel", "DevOps engineer automating deployments across 50+ microservices in production.", "Ahmedabad", "Terraform, Kubernetes, CI/CD, Linux", null),
            ("divya_nair", "divya.nair.data@gmail.com", "Divya Nair", "Data scientist at a Kochi fintech. Turning raw data into business insights.", "Kochi", "Python, TensorFlow, SQL, Tableau", "https://divyanair.io"),
            ("vikram_reddy", "vikram.reddy.mobile@gmail.com", "Vikram Reddy", "Mobile developer building Flutter apps used by millions. Hyderabad based.", "Hyderabad", "Flutter, Dart, Firebase, Android", null),
            ("ananya_singh", "ananya.singh.cloud@gmail.com", "Ananya Singh", "AWS certified cloud architect helping Indian startups scale globally.", "Mumbai", "AWS, Azure, Serverless, Go", "https://ananyasingh.dev"),
            ("karthik_rajan", "karthik.rajan.ai@gmail.com", "Karthik Rajan", "AI researcher at IIT Madras spin-off. Making ML accessible to all developers.", "Chennai", "PyTorch, NLP, Computer Vision, Python", null),
            ("pooja_desai", "pooja.desai.systems@gmail.com", "Pooja Desai", "Systems programmer and Rust advocate. Performance is not optional.", "Surat", "Rust, C++, WebAssembly, Linux", "https://poojadesai.tech"),
            ("suresh_menon", "suresh.menon.security@gmail.com", "Suresh Menon", "Cybersecurity consultant and bug bounty hunter. Securing Indian fintech.", "Trivandrum", "Pentesting, Python, Network Security, OWASP", null),
            ("lakshmi_krishnan", "lakshmi.krishnan.db@gmail.com", "Lakshmi Krishnan", "Database engineer. PostgreSQL query optimization is my daily meditation.", "Coimbatore", "PostgreSQL, MongoDB, Redis, SQL", "https://lakshmikrishnan.tech"),
            ("nikhil_joshi", "nikhil.joshi.startup@gmail.com", "Nikhil Joshi", "Startup CTO building products that matter for Bharat's next billion users.", "Nashik", ".NET, React, Azure, Microservices", null),
            ("shreya_agarwal", "shreya.agarwal.frontend@gmail.com", "Shreya Agarwal", "Frontend developer and accessibility advocate. Web for everyone.", "Lucknow", "Angular, WCAG, HTML, CSS, React", "https://shreyaagarwal.dev"),
            ("rohan_malhotra", "rohan.malhotra.sre@gmail.com", "Rohan Malhotra", "SRE at a Gurugram unicorn. Keeping systems up at 3am so you don't have to.", "Gurugram", "Prometheus, Grafana, Go, Kubernetes", null),
            ("kavya_bhat", "kavya.bhat.fullstack@gmail.com", "Kavya Bhat", "Full-stack developer building edtech platforms. Mangalore roots, Bengaluru life.", "Bengaluru", "Vue.js, Node.js, MongoDB, Docker", "https://kavyabhat.in"),
            ("manish_gupta", "manish.gupta.architect@gmail.com", "Manish Gupta", "Software architect with 12 years experience. Clean code evangelist.", "Noida", "Java, Microservices, DDD, Spring", null),
            ("tanvi_shah", "tanvi.shah.ux@gmail.com", "Tanvi Shah", "Product designer and front-end developer. Crafting delightful experiences.", "Mumbai", "Figma, React, CSS, Design Systems", "https://tanvishah.design"),
            ("ajay_kumar", "ajay.kumar.devops@gmail.com", "Ajay Kumar", "Platform engineer building internal developer platforms at scale.", "Patna", "Helm, ArgoCD, Terraform, Go", null),
            ("riya_chakraborty", "riya.chakraborty.ml@gmail.com", "Riya Chakraborty", "ML engineer at Kolkata healthtech. Applying AI to save lives.", "Kolkata", "Python, Scikit-learn, FastAPI, Docker", "https://riyachakraborty.tech"),
            ("sanjay_pillai", "sanjay.pillai.backend@gmail.com", "Sanjay Pillai", "Backend developer specializing in high-throughput payment systems.", "Bengaluru", "Go, gRPC, Kafka, PostgreSQL", null),
            ("meera_rajput", "meera.rajput.webdev@gmail.com", "Meera Rajput", "Web developer and open source contributor. Building for rural India.", "Jaipur", "JavaScript, React, Node.js, MongoDB", "https://meerarajput.dev"),
            ("deepak_nambiar", "deepak.nambiar.ios@gmail.com", "Deepak Nambiar", "iOS developer creating apps that make a difference. Swift and SwiftUI.", "Thrissur", "Swift, SwiftUI, CoreData, Xcode", null),
            ("neha_trivedi", "neha.trivedi.data@gmail.com", "Neha Trivedi", "Data engineer building robust ETL pipelines for India's largest e-commerce.", "Vadodara", "Apache Spark, Airflow, Python, SQL", "https://nehatrivedi.in"),
            ("aakash_mishra", "aakash.mishra.security@gmail.com", "Aakash Mishra", "Application security engineer. Helping startups build secure from day one.", "Bhopal", "SAST, DAST, Python, OWASP", null),
            ("ishita_banerjee", "ishita.banerjee.angular@gmail.com", "Ishita Banerjee", "Angular specialist. State management and performance optimization nerd.", "Kolkata", "Angular, NgRx, RxJS, TypeScript", "https://ishitabanerjee.dev"),
            ("varun_saxena", "varun.saxena.cloud@gmail.com", "Varun Saxena", "Multi-cloud architect. GCP and AWS certified. Serverless-first mindset.", "Indore", "GCP, AWS, Kubernetes, Terraform", null),
            ("preethi_subramaniam", "preethi.subramaniam.dev@gmail.com", "Preethi Subramaniam", "Senior developer at Chennai-based SaaS startup. React and GraphQL fan.", "Chennai", "React, GraphQL, TypeScript, AWS", "https://preethisubramaniam.dev"),
            ("gaurav_tiwari", "gaurav.tiwari.opensource@gmail.com", "Gaurav Tiwari", "Open source maintainer and community builder. Spreading the coding culture.", "Allahabad", ".NET, Open Source, Git, Community", null),
            ("swati_pandey", "swati.pandey.infra@gmail.com", "Swati Pandey", "Infrastructure engineer at a Pune unicorn. Obsessed with reliability.", "Pune", "Linux, Ansible, Docker, Monitoring", "https://swatipandey.tech"),
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
        var tagNames = new[] { "CSharp", "Angular", "Python", "JavaScript", "DevOps", "AI", "Cloud", "Docker", "React", "Database", "Security", "Career", "Tutorial", "WebDev", "Mobile", "OpenSource", "DataEngineering", "MachineLearning" };
        var tags = tagNames.Select(t => new Tag { Name = t, NormalizedName = t.ToUpperInvariant() }).ToList();
        await _uow.Tags.AddRangeAsync(tags, ct);
        await _uow.SaveChangesAsync(ct);

        // --- 3. Create 40 Blog Posts ---
        var postData = new[]
        {
            ("Getting Started with .NET 8 Minimal APIs", "Learn how to build blazing-fast APIs with .NET 8 minimal API pattern. We cover routing, dependency injection, and middleware.", "A practical guide to building APIs with .NET 8 minimal pattern.", "CSharp,WebDev,Tutorial"),
            ("Angular Signals: The Future of Reactivity", "Angular Signals represent a paradigm shift in how we handle reactivity. This deep dive covers signals, computed values, and effects.", "Deep dive into Angular's new reactivity model with Signals.", "Angular,JavaScript,Tutorial"),
            ("Building a CI/CD Pipeline with GitHub Actions", "Automate your deployments with GitHub Actions. From testing to production, this guide walks you through a complete pipeline.", "Step-by-step guide to automated deployments with GitHub Actions.", "DevOps,Tutorial"),
            ("Machine Learning for Web Developers", "You don't need a PhD to use ML. Learn how to integrate TensorFlow.js into your web applications for smart features.", "Practical ML integration for web developers using TensorFlow.js.", "AI,JavaScript,Tutorial"),
            ("PostgreSQL Performance Tuning: A Practical Guide", "Slow queries killing your app? This guide covers indexing, query optimization, EXPLAIN ANALYZE, and connection pooling.", "Essential PostgreSQL optimization techniques for production.", "Database,Tutorial"),
            ("Microservices vs Monolith: When to Choose What", "The microservices hype is real, but is it right for you? A balanced analysis with real-world case studies.", "Honest comparison of microservices and monolithic architectures.", "Cloud,DevOps,Career"),
            ("Rust for Backend Development: Why It Matters", "Rust isn't just for systems programming. Explore how Actix and Axum are challenging the traditional backend landscape.", "Exploring Rust as a serious backend development language.", "WebDev"),
            ("Docker Best Practices for Production", "Stop using Docker like it's development. Learn multi-stage builds, security scanning, and orchestration basics.", "Production-ready Docker patterns and security best practices.", "Docker,DevOps,Security"),
            ("React vs Angular vs Vue in 2026", "The frontend framework war continues. An objective comparison based on benchmarks, developer experience, and enterprise adoption.", "Objective comparison of the big three frontend frameworks.", "React,Angular,JavaScript"),
            ("Securing Your API: OWASP Top 10 Explained", "API security is not optional. Walk through the OWASP Top 10 API risks with practical mitigation strategies.", "Understanding and preventing the top API security vulnerabilities.", "Security,WebDev,Tutorial"),
            ("The Complete Guide to Redis Caching", "Redis is more than a cache. Learn about data structures, pub/sub, streams, and caching architecture patterns.", "Comprehensive guide to Redis caching architecture and patterns.", "Database,Cloud"),
            ("Flutter vs React Native: Mobile Development in 2026", "Building cross-platform mobile apps? Compare Flutter and React Native on performance and ecosystem maturity.", "Comparing the two leading cross-platform mobile frameworks.", "Mobile,JavaScript"),
            ("Kubernetes for Beginners: Your First Deployment", "Kubernetes doesn't have to be scary. This beginner-friendly guide gets you from zero to deployed in minutes.", "Beginner-friendly introduction to deploying apps on Kubernetes.", "Cloud,Docker,DevOps,Tutorial"),
            ("Writing Clean Code: Principles That Actually Work", "Uncle Bob's principles revisited for modern development. Practical techniques without over-engineering.", "Practical clean code principles for modern software development.", "Career,Tutorial"),
            ("GraphQL vs REST: Making the Right Choice", "GraphQL isn't always the answer. Understand the trade-offs with real scenarios where each shines.", "Balanced comparison of GraphQL and REST for API design.", "WebDev,Tutorial"),
            ("Python Type Hints: Why You Should Use Them", "Dynamic typing is great until your codebase grows. Learn how type hints improve quality and team collaboration.", "Making Python codebases more maintainable with type hints.", "Python,Tutorial"),
            ("AWS Lambda vs Azure Functions: Serverless Showdown", "Two cloud giants, two serverless platforms. Compare pricing, cold starts, and developer experience.", "Head-to-head comparison of AWS Lambda and Azure Functions.", "Cloud"),
            ("Building Real-time Features with SignalR", "Add real-time notifications, chat, and live updates to your .NET application using SignalR.", "Guide to building real-time web features with SignalR.", "CSharp,WebDev,Tutorial"),
            ("The Art of Code Review: Beyond Nitpicking", "Great code reviews build better teams. Learn constructive feedback and how to create a positive review culture.", "Building better teams through effective code review practices.", "Career"),
            ("Intro to WebAssembly: Running C++ in the Browser", "WebAssembly is changing what's possible. Learn how to compile C++ to Wasm and integrate with JavaScript.", "Getting started with WebAssembly for high-performance web apps.", "WebDev,JavaScript"),
            ("Apache Kafka for Beginners: Event-Driven Architecture", "Kafka is the backbone of modern data pipelines. Learn producers, consumers, topics, and partitions from scratch.", "Introduction to event-driven architecture with Apache Kafka.", "DataEngineering,Tutorial"),
            ("SwiftUI vs UIKit: Which Should You Learn in 2026", "Apple's ecosystem is evolving fast. Compare SwiftUI and UIKit to decide where to invest your iOS learning time.", "Choosing between SwiftUI and UIKit for iOS development in 2026.", "Mobile,Tutorial"),
            ("Mastering CSS Grid and Flexbox", "Stop fighting CSS layouts. Master Grid and Flexbox with practical examples covering every real-world layout scenario.", "Complete guide to modern CSS layout with Grid and Flexbox.", "WebDev,Tutorial"),
            ("Go Lang: Why Gophers Love It", "Go's simplicity, speed, and built-in concurrency make it perfect for cloud-native services. Here's why it matters.", "Understanding Go's appeal for modern backend development.", "WebDev,Cloud"),
            ("MongoDB Schema Design Best Practices", "Schema-less doesn't mean schema-free. Learn data modeling patterns that scale in production MongoDB deployments.", "Effective data modeling strategies for MongoDB production apps.", "Database"),
            ("TypeScript Generics: A Complete Guide", "Generics unlock the full power of TypeScript's type system. From basics to advanced patterns with real examples.", "Mastering TypeScript generics from beginner to advanced.", "JavaScript,Tutorial"),
            ("Building Accessible Web Apps with Angular Material", "Accessibility is a feature, not an afterthought. Learn ARIA, keyboard navigation, and WCAG 2.2 in Angular.", "Creating WCAG-compliant Angular apps with Angular Material.", "Angular,WebDev,Tutorial"),
            ("The 12-Factor App: Modern Application Design", "The 12-factor methodology for building software-as-a-service apps that are scalable, maintainable, and portable.", "Applying the 12-factor app methodology to modern applications.", "Cloud,DevOps,Career"),
            ("Apache Spark for Data Engineers", "Process petabytes of data with Apache Spark. Covers RDDs, DataFrames, Spark SQL, and streaming fundamentals.", "Practical Apache Spark guide for data engineers.", "DataEngineering,Python"),
            ("Contributing to Open Source: A Beginner's Roadmap", "Open source contribution transformed my career. Here's the roadmap I wish I had when I started.", "How to start contributing to open source and grow your career.", "OpenSource,Career"),
            ("JWT vs Session Auth: What Should You Use", "Authentication is critical to get right. Compare JWT and session-based auth with security implications for each.", "Understanding the trade-offs between JWT and session authentication.", "Security,WebDev"),
            ("React Server Components: The Complete Guide", "React Server Components change how we think about data fetching. Learn the new mental model and migration path.", "Understanding and implementing React Server Components.", "React,JavaScript,Tutorial"),
            ("Python FastAPI: Build APIs 3x Faster", "FastAPI is taking the Python world by storm. Learn how to build production-ready APIs with automatic docs.", "Build modern Python APIs with FastAPI and Pydantic.", "Python,WebDev,Tutorial"),
            ("Effective Logging and Observability in .NET", "Logs nobody reads are useless. Learn structured logging, distributed tracing, and building useful dashboards.", "Building observable .NET applications with proper logging and tracing.", "CSharp,DevOps,Tutorial"),
            ("The Senior Developer Mindset: Lessons Learned", "Becoming senior isn't about years of experience -- it's about thinking differently. Lessons from my journey.", "Insights on developing a senior engineering mindset.", "Career"),
            ("Nginx vs Caddy vs Traefik: Choosing a Reverse Proxy", "Your reverse proxy affects performance, security, and ops complexity. Compare the top three choices.", "Comparing Nginx, Caddy, and Traefik for modern web applications.", "DevOps"),
            ("Flutter State Management: Provider vs Riverpod vs Bloc", "State management in Flutter is confusing. This guide cuts through the noise with practical comparisons.", "Choosing the right state management solution for Flutter apps.", "Mobile,Tutorial"),
            ("Designing a Scalable Notification System", "Notifications at scale are deceptively hard. Learn the architecture behind systems handling millions of events.", "Architecture guide for building scalable notification systems.", "Cloud,Database,Career"),
            ("Introduction to Domain-Driven Design", "DDD isn't just about code -- it's about aligning software with business reality. An accessible introduction.", "Getting started with Domain-Driven Design for complex systems.", "Career,CSharp,Tutorial"),
            ("GitHub Copilot and AI Tools: Changing How We Code", "AI coding assistants are here to stay. How to use them effectively without losing your engineering instincts.", "Using AI coding tools effectively while maintaining code quality.", "AI,Career"),
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

        // --- 4. Create Follows (5-12 per user = ~240 follows total) ---
        var follows = new List<Follow>();
        foreach (var user in users)
        {
            var toFollow = users.Where(u => u.Id != user.Id).OrderBy(_ => random.Next()).Take(random.Next(5, 13));
            foreach (var target in toFollow)
            {
                if (!follows.Any(f => f.FollowerId == user.Id && f.FollowingId == target.Id))
                    follows.Add(new Follow { FollowerId = user.Id, FollowingId = target.Id });
            }
        }
        _dbContext.Set<Follow>().AddRange(follows);
        await _uow.SaveChangesAsync(ct);

        // --- 5. Create Likes (5-20 per post = ~500 likes total) ---
        var likes = new List<Like>();
        foreach (var post in posts)
        {
            var likers = users.OrderBy(_ => random.Next()).Take(random.Next(5, 21));
            foreach (var liker in likers)
                likes.Add(new Like { UserId = liker.Id, BlogPostId = post.Id });
        }
        await _uow.Likes.AddRangeAsync(likes, ct);
        await _uow.SaveChangesAsync(ct);

        // --- 6. Create Comments (3-10 per post = ~250 comments total) ---
        var commentTexts = new[]
        {
            "Great article! Really helped me understand the concept.",
            "Thanks for sharing this, very informative.",
            "I've been looking for something like this. Bookmarked!",
            "Excellent write-up. Would love a follow-up on advanced topics.",
            "This is exactly what I needed for my project at work.",
            "Well explained! The examples are very practical.",
            "Interesting perspective. I hadn't thought about it this way.",
            "Solid content as always. Keep it coming!",
            "Just implemented this in my project. Works perfectly.",
            "Can you elaborate more on the performance aspects?",
            "This should be mandatory reading for all developers.",
            "Love the balanced approach. Not just hype but real analysis.",
            "Finally an article that explains this clearly. Thank you!",
            "Sharing this with my whole team right now.",
            "Been struggling with this for weeks. Problem solved!",
            "Very well structured. Easy to follow even for beginners.",
            "Came here from a Google search and stayed for the quality.",
            "Would love to see a Part 2 covering more advanced scenarios.",
            "Applied this in production yesterday. Zero issues so far.",
            "The code examples really make the difference here.",
        };

        var comments = new List<Comment>();
        foreach (var post in posts)
        {
            var commentCount = random.Next(3, 11);
            for (int c = 0; c < commentCount; c++)
            {
                var commenter = users[random.Next(users.Count)];
                comments.Add(new Comment
                {
                    BlogPostId = post.Id,
                    UserId = commenter.Id,
                    Content = commentTexts[random.Next(commentTexts.Length)],
                    CreatedAt = post.CreatedAt.AddHours(random.Next(1, 120))
                });
            }
        }
        await _uow.Comments.AddRangeAsync(comments, ct);
        await _uow.SaveChangesAsync(ct);

        return $"Seeded {users.Count} users, {posts.Count} posts, {follows.Count} follows, {likes.Count} likes, {comments.Count} comments. All passwords: Test@1234";
    }
}
