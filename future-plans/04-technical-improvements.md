# Technical Improvements & Quick Wins

## Technical Improvements

### 1. Rate Limiting
OTP and auth endpoints have no rate limiting — security risk. Add rate limiting middleware (e.g., `AspNetCoreRateLimit`).

### 2. HTML Sanitization
Posts use a rich text editor but there's no server-side sanitization — XSS vulnerability. Add HtmlSanitizer on post creation/update.

### 3. Image Optimization Pipeline
Auto-generate thumbnails and WebP variants on upload. Serve responsive images based on viewport for faster page loads.

### 4. API Versioning
Add `/api/v1/` prefix now before it becomes painful. 60+ endpoints means breaking changes will happen.

### 5. Soft Delete Consistency
`IsDeleted` flags exist but some operations hard-delete. Make soft delete consistent and add an "undo" grace period.

---

## Quick Wins (Low Effort, High Value)

| Feature | Why |
|---------|-----|
| Estimated reading time in feed cards | Users decide faster what to click |
| "X min read" progress bar while reading | Reduces abandonment |
| Notification preferences (mute types) | Reduces notification fatigue |
| Dark mode toggle | Table-stakes UX |
| Post excerpt/subtitle field | Better feed previews & SEO |
| Keyboard shortcuts (Ctrl+Enter to publish) | Power user experience |
