# UI/UX Improvement Plan

Based on a full review of `blogspot-client` (global styles, navbar, feed, blog detail, profile, editor, and auth pages), the design system is solid in places (dark mode CSS variables, skeleton loaders, read progress bar, grammar-check editor) but inconsistently applied. Most issues stem from components using hardcoded hex colors in their own `styles: []` blocks instead of the CSS variables already defined in `styles.scss`.

## 🔴 High Priority

### 1. Eliminate Hardcoded Colors, Use CSS Variables Everywhere
`styles.scss` already defines a full dark-mode-aware variable system (`--color-text-primary`, `--color-border`, `--gradient-primary`, etc.), but components like navbar, feed, post-card, profile-view, login/register, and admin-dashboard hardcode colors directly (`#0f1419`, `#eff3f4`, `#1d9bf0`, `#536471`, `#00ba7c`, `#f4212e`). This is the root cause of dark mode breaking inconsistently — `styles.scss` has to fight these with `!important` overrides. Audit every component and replace hardcoded values with the existing tokens.

### 2. Fix Dark Mode Properly
Dark mode is implemented via `body.dark-theme` overrides in `styles.scss`, but component-scoped inline styles win on specificity in many places (navbar search bar, auth cards, profile cover gradient, skeleton loaders, empty-state icons). Once (1) is done, dark mode should mostly self-correct; a follow-up pass should manually toggle dark mode on every page to catch remaining leaks (especially skeleton loader background `#e0e0e0` and the full-page spinner's white ring).

### 3. Accessibility: aria-labels on Icon-Only Buttons
Icon-only buttons (notification bell, dark mode toggle, search clear, reaction emojis, delete/admin action buttons) rely only on `matTooltip` with no `aria-label`, so screen readers announce nothing. Add `aria-label` to every icon button across navbar, post-card, blog-detail (reactions/comments), and admin tables.

### 4. Accessibility: Visible Focus States
Only two `:focus` rules exist in the whole app (admin-dashboard and profile-view select fields). Add `:focus-visible` outlines to buttons, links, and custom interactive elements (chips, reaction buttons, tags) so keyboard users can see where they are.

### 5. Standardize Responsive Breakpoints
Breakpoints are scattered and inconsistent: 768px, 600px, 599px, 480px, 400px used across different components (e.g., post-card uses 599px while navbar/feed use 600px). Consolidate to a single scale — e.g., 1024px (tablet), 768px (small tablet), 600px (mobile), 400px (small mobile) — and apply it uniformly.

## 🟡 Medium Priority

### 6. Skeleton Loaders for More Than the Feed
Only the feed page has skeleton loaders; comments, followers/following lists, and notifications fall back to a full-page/inline spinner instead. Extend the skeleton pattern already built for the feed to these lists for a more polished loading experience.

### 7. Error States for Failed Requests
There's no visible "failed to load" / "network error" / retry UI anywhere — a failed API call currently has no distinct empty/error state from a genuinely empty list. Add a shared error-state component (icon + message + retry button) and use it wherever feed/profile/comments/notifications fetch data.

### 8. Alt Text Audit on Images
Most dynamic images already set `alt` correctly (avatars, post images), but a few spots (comment avatars, some decorative images) are inconsistent or missing. Do a full pass to guarantee every `<img>` has meaningful (or explicitly empty, for decorative) alt text.

### 9. Centralize Typography Scale
Font sizes (22px, 18px, 15px, 14px, 13px, 12px) are repeated ad hoc across components with no shared scale. Add `--font-size-xs/sm/base/lg/xl` (and weight equivalents) to `styles.scss` and migrate components to use them, so text sizing stays consistent as new pages are added.

### 10. Mobile Navigation
There's no hamburger/drawer menu — on small screens the navbar just squeezes icons together and hides search. Consider collapsing secondary nav items (admin link, notifications, profile menu) into a slide-out drawer below ~600px for a cleaner mobile header.

### 11. Route Transitions
Navigating between feed → post → profile is instant with no transition, which can feel abrupt. A subtle fade/slide route transition (Angular animations) would make navigation feel more polished.

## 🟢 Low Priority (Polish)

### 12. Micro-interactions on Engagement Actions
Likes/reactions currently just toggle state with no animation. A small "pop" or heart-burst animation on like, and a smooth expand for the reply form (instead of appearing instantly), would add a lot of perceived quality for very little effort.

### 13. Comment Load-In Animation
Comments currently appear all at once with no stagger; a subtle fade/slide-in as each comment renders (similar to the existing `dropdownSlide` keyframe used in the navbar search) would feel more dynamic.

### 14. Empty-State Illustrations
Empty states (no posts, no bookmarks, no drafts, no notifications) currently use a single gray Material icon. Simple SVG illustrations per context would make these moments feel more intentional rather than "broken."

### 15. Breadcrumbs on Detail Pages
Blog detail and profile pages have no breadcrumb/back trail beyond browser back — a lightweight "Feed / Post title" breadcrumb would help orientation, especially after following a search result or notification deep link.

### 16. Admin Table Search/Filter
Admin's Users/Posts/Comments tables have no client-side search or column filter, making them hard to use once data grows past a page or two.

---

## Quick Wins (Low Effort, High Value)

| Improvement | Why |
|---|---|
| Replace hardcoded colors with existing CSS variables | Fixes dark mode everywhere at once |
| Add `aria-label` to icon-only buttons | Immediate accessibility win, minimal code |
| Add `:focus-visible` outline globally in `styles.scss` | One CSS rule improves keyboard nav app-wide |
| Unify breakpoints to one scale | Removes redundant/conflicting media queries |
| Dark-mode-aware skeleton loader color | Currently hardcoded `#e0e0e0`, breaks in dark mode |
