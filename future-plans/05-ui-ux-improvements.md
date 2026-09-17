# UI/UX Improvement Plan

Based on a full review of `blogspot-client` (global styles, navbar, feed, blog detail, profile, editor, and auth pages). All high-priority issues (hardcoded colors, dark mode leaks, accessibility aria-labels/focus states, inconsistent breakpoints) have been resolved. Remaining items below are medium/low priority polish.

## 🟡 Medium Priority

### 1. Skeleton Loaders for More Than the Feed
Only the feed page has skeleton loaders; comments, followers/following lists, and notifications fall back to a full-page/inline spinner instead. Extend the skeleton pattern already built for the feed to these lists for a more polished loading experience.

### 2. Error States for Failed Requests
There's no visible "failed to load" / "network error" / retry UI anywhere — a failed API call currently has no distinct empty/error state from a genuinely empty list. Add a shared error-state component (icon + message + retry button) and use it wherever feed/profile/comments/notifications fetch data.

### 3. Alt Text Audit on Images
Most dynamic images already set `alt` correctly (avatars, post images), but a few spots (comment avatars, some decorative images) are inconsistent or missing. Do a full pass to guarantee every `<img>` has meaningful (or explicitly empty, for decorative) alt text.

### 4. Centralize Typography Scale
Font sizes (22px, 18px, 15px, 14px, 13px, 12px) are repeated ad hoc across components with no shared scale. Add `--font-size-xs/sm/base/lg/xl` (and weight equivalents) to `styles.scss` and migrate components to use them, so text sizing stays consistent as new pages are added.

### 5. Mobile Navigation
There's no hamburger/drawer menu — on small screens the navbar just squeezes icons together and hides search. Consider collapsing secondary nav items (admin link, notifications, profile menu) into a slide-out drawer below ~600px for a cleaner mobile header.

### 6. Route Transitions
Navigating between feed → post → profile is instant with no transition, which can feel abrupt. A subtle fade/slide route transition (Angular animations) would make navigation feel more polished.

## 🟢 Low Priority (Polish)

### 7. Micro-interactions on Engagement Actions
Likes/reactions currently just toggle state with no animation. A small "pop" or heart-burst animation on like, and a smooth expand for the reply form (instead of appearing instantly), would add a lot of perceived quality for very little effort.

### 8. Comment Load-In Animation
Comments currently appear all at once with no stagger; a subtle fade/slide-in as each comment renders (similar to the existing `dropdownSlide` keyframe used in the navbar search) would feel more dynamic.

### 9. Empty-State Illustrations
Empty states (no posts, no bookmarks, no drafts, no notifications) currently use a single gray Material icon. Simple SVG illustrations per context would make these moments feel more intentional rather than "broken."

### 10. Breadcrumbs on Detail Pages
Blog detail and profile pages have no breadcrumb/back trail beyond browser back — a lightweight "Feed / Post title" breadcrumb would help orientation, especially after following a search result or notification deep link.
