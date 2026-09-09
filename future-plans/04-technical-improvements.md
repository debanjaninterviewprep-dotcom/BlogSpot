# Technical Improvements & Quick Wins

## Technical Improvements

### 1. Image Optimization Pipeline
Auto-generate thumbnails and WebP variants on upload. Serve responsive images based on viewport for faster page loads.

### 2. Soft Delete Consistency
`IsDeleted` flags exist but some operations hard-delete. Make soft delete consistent and add an "undo" grace period.

---

## Quick Wins (Low Effort, High Value)

| Feature | Why |
|---------|-----|
| Keyboard shortcuts (Ctrl+Enter to publish) | Power user experience |
