import { Component, OnInit, HostListener } from '@angular/core';
import { FeedService } from '@core/services/feed.service';
import { BlogService } from '@core/services/blog.service';
import { AuthService } from '@core/services/auth.service';
import { UserService } from '@core/services/user.service';
import { BlogPost, ReactionType } from '@core/models/blog.model';
import { UserProfile } from '@core/models/user.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-feed',
  template: `
    <div class="feed-container">
      <div class="feed-main">

        <!-- Filter chips -->
        <div class="filter-bar">
          <button class="filter-chip" *ngIf="authService.isLoggedIn" [class.active]="activeFilter === 'feed'" (click)="setFilter('feed')">
            <mat-icon>home</mat-icon> For You
          </button>
          <button class="filter-chip" [class.active]="activeFilter === 'latest'" (click)="setFilter('latest')">
            <mat-icon>schedule</mat-icon> Latest
          </button>
          <button class="filter-chip" [class.active]="activeFilter === 'trending'" (click)="setFilter('trending')">
            <mat-icon>trending_up</mat-icon> Trending
          </button>
        </div>

        <!-- Skeleton loading -->
        <div *ngIf="loading && posts.length === 0" class="skeleton-list">
          <mat-card *ngFor="let s of [1,2,3]" class="skeleton-card">
            <div class="skeleton-header">
              <div class="skeleton-circle"></div>
              <div class="skeleton-lines">
                <div class="skeleton-line w60"></div>
                <div class="skeleton-line w40"></div>
              </div>
            </div>
            <div class="skeleton-body">
              <div class="skeleton-line w100"></div>
              <div class="skeleton-line w80"></div>
              <div class="skeleton-line w60"></div>
            </div>
          </mat-card>
        </div>

        <!-- Empty state -->
        <div *ngIf="!loading && !loadError && posts.length === 0" class="empty-state">
          <mat-icon class="empty-icon-float">article</mat-icon>
          <h3>No posts yet</h3>
          <p *ngIf="activeFilter === 'feed'">Follow some users or check Trending!</p>
          <p *ngIf="activeFilter !== 'feed'">Be the first to create a post!</p>
        </div>

        <!-- Error state -->
        <app-error-state *ngIf="loadError && posts.length === 0"
                         message="Failed to load posts. Please check your connection and try again."
                         (onRetry)="loadPosts(true)">
        </app-error-state>

        <!-- Posts -->
        <ng-container *ngFor="let post of posts; let i = index">
          <app-post-card class="post-card-enter" [style.animation-delay.ms]="minAnimDelay(i)"
                         [post]="post"
                         (onLike)="toggleLike($event)"
                         (onBookmark)="toggleBookmark($event)"
                         (onReaction)="toggleReaction($event)">
          </app-post-card>
          <!-- Inline suggestions after 3rd post (or after last if < 3) -->
          <ng-container *ngIf="suggestedUsers.length > 0 && authService.isLoggedIn &&
                               ((posts.length >= 3 && i === 2) || (posts.length < 3 && i === posts.length - 1))">
            <ng-container *ngTemplateOutlet="suggestionsScroll"></ng-container>
          </ng-container>
        </ng-container>

        <!-- Empty feed suggestions -->
        <ng-container *ngIf="!loading && posts.length === 0 && suggestedUsers.length > 0 && authService.isLoggedIn">
          <ng-container *ngTemplateOutlet="suggestionsScroll"></ng-container>
        </ng-container>

        <app-loading-spinner [inline]="true" *ngIf="loading && posts.length > 0"></app-loading-spinner>
      </div>

      <!-- Sidebar: Suggested Users (logged in) or Join promo (guests) -->
      <div class="feed-sidebar" *ngIf="(authService.isLoggedIn && suggestedUsers.length > 0) || !authService.isLoggedIn">
        <div class="sidebar-card" *ngIf="authService.isLoggedIn && suggestedUsers.length > 0">
          <h3 class="sidebar-title">Who to Follow</h3>
          <app-user-card *ngFor="let user of (sidebarExpanded ? suggestedUsers : suggestedUsers.slice(0,3))"
                         [user]="user"
                         (onFollow)="toggleFollowSuggested($event)">
          </app-user-card>
          <a *ngIf="!sidebarExpanded && suggestedUsers.length > 3" class="sidebar-show-more" (click)="sidebarExpanded = true">Show more</a>
          <a *ngIf="sidebarExpanded && suggestedUsers.length > 3" class="sidebar-show-more" (click)="sidebarExpanded = false">Show less</a>
        </div>

        <div class="sidebar-card guest-promo" *ngIf="!authService.isLoggedIn">
          <mat-icon class="guest-promo-icon">auto_awesome</mat-icon>
          <h3 class="sidebar-title">New to BlogSpot?</h3>
          <p class="guest-promo-text">Join to follow your favorite writers, react to posts, and get a personalized feed.</p>
          <a routerLink="/auth/register" class="guest-promo-btn">Create account</a>
          <a routerLink="/auth/login" class="guest-promo-link">Sign in</a>
        </div>
      </div>

      <!-- Reusable horizontal scroll suggestions -->
      <ng-template #suggestionsScroll>
        <div class="mobile-suggestions">
          <div class="suggestions-scroll-card">
            <h3 class="suggestions-scroll-title">Suggested for you</h3>
            <div class="suggestions-scroll-track">
              <div class="suggestion-item" *ngFor="let user of suggestedUsers">
                <a [routerLink]="['/profile', user.userName]" class="suggestion-avatar-link">
                  <img [src]="(user.profilePictureUrl | imageUrl) || 'assets/default-avatar.svg'"
                       [alt]="user.userName" class="suggestion-avatar">
                </a>
                <a [routerLink]="['/profile', user.userName]" class="suggestion-name">
                  {{ user.displayName || user.userName }}
                </a>
                <span class="suggestion-handle">{{'@'}}{{ user.userName }}</span>
                <button class="suggestion-follow-btn"
                        [class.following]="user.isFollowedByCurrentUser"
                        (click)="toggleFollowSuggested(user.id)">
                  {{ user.isFollowedByCurrentUser ? 'Following' : 'Follow' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .feed-container {
      width: 100%;
      display: flex;
      gap: 28px;
      padding: 0 16px;
      box-sizing: border-box;
    }
    .feed-main {
      flex: 1;
      min-width: 0;
      min-height: calc(100vh - 56px);
    }
    /* ---- Filter bar ---- */
    .filter-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      position: relative;
      overflow-x: auto;
    }
    .filter-bar::after {
      content: '';
      position: absolute;
      left: 16px; right: 16px; bottom: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--color-border) 15%, var(--color-border) 85%, transparent);
    }
    .filter-bar::-webkit-scrollbar { display: none; }
    .filter-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 16px;
      border-radius: 24px;
      border: 1px solid var(--color-border);
      background: transparent;
      color: var(--color-text-secondary);
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
      font-family: inherit;
    }
    .filter-chip mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .filter-chip:hover { background: var(--color-primary-light); color: var(--color-primary); border-color: var(--color-primary); }
    .filter-chip.active {
      background: var(--gradient-primary);
      color: #fff;
      border-color: transparent;
      font-weight: var(--font-weight-bold);
    }
    /* ---- Sidebar ---- */
    .feed-sidebar {
      width: 320px;
      flex-shrink: 0;
      padding-top: 12px;
      position: sticky;
      top: 68px;
      align-self: flex-start;
    }
    .sidebar-card {
      background: var(--sidebar-bg);
      border-radius: 16px;
      padding: 16px 0;
      overflow-y: auto;
      max-height: calc(100vh - 140px);
    }
    .sidebar-title {
      font-size: 19px;
      font-weight: 800;
      color: var(--color-text-primary);
      margin: 0;
      padding: 0 16px 12px;
      letter-spacing: -0.02em;
    }
    .sidebar-show-more {
      display: block;
      padding: 12px 16px 4px;
      font-size: var(--font-size-base);
      color: var(--color-primary);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      background: none;
      border: none;
      font-family: inherit;
    }
    .sidebar-show-more:hover { text-decoration: underline; }
    /* ---- Guest promo sidebar ---- */
    .guest-promo { padding: 24px 20px; text-align: center; }
    .guest-promo-icon {
      font-size: 32px; width: 32px; height: 32px;
      color: var(--color-primary);
      margin-bottom: 8px;
    }
    .guest-promo .sidebar-title { padding: 0; text-align: center; }
    .guest-promo-text {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      line-height: 1.5;
      margin: 8px 0 16px;
    }
    .guest-promo-btn {
      display: block;
      width: 100%;
      box-sizing: border-box;
      padding: 10px;
      border-radius: 24px;
      background: var(--gradient-primary);
      color: #fff;
      text-decoration: none;
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-base);
      margin-bottom: 10px;
      transition: opacity 0.15s;
    }
    .guest-promo-btn:hover { opacity: 0.85; }
    .guest-promo-link {
      display: block;
      color: var(--color-primary);
      text-decoration: none;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
    }
    .guest-promo-link:hover { text-decoration: underline; }
    /* ---- Mobile suggestions ---- */
    .mobile-suggestions { display: none; }
    .suggestions-scroll-card { border-bottom: 1px solid var(--color-border); padding: 16px 0; }
    .suggestions-scroll-title { font-size: 16px; font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 12px; padding: 0 16px; }
    .suggestions-scroll-track {
      display: flex; gap: 12px; overflow-x: auto; padding: 0 16px 8px;
      scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;
    }
    .suggestions-scroll-track::-webkit-scrollbar { display: none; }
    .suggestion-item {
      display: flex; flex-direction: column; align-items: center;
      min-width: 140px; max-width: 140px; padding: 20px 12px 16px;
      background: var(--sidebar-bg); border-radius: 16px; border: 1px solid var(--color-border);
      scroll-snap-align: start; flex-shrink: 0; gap: 6px;
    }
    .suggestion-avatar-link { flex-shrink: 0; }
    .suggestion-avatar { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; }
    .suggestion-name { font-size: var(--font-size-base); font-weight: var(--font-weight-bold); color: var(--color-text-primary); text-decoration: none; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; }
    .suggestion-name:hover { text-decoration: underline; }
    .suggestion-handle { font-size: var(--font-size-xs); color: var(--color-text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; }
    .suggestion-follow-btn {
      margin-top: 6px; font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); padding: 6px 20px;
      border-radius: 24px; border: none; background: var(--gradient-primary); color: #fff;
      cursor: pointer; transition: opacity 0.15s, background 0.15s, color 0.15s; font-family: inherit; white-space: nowrap;
    }
    .suggestion-follow-btn:hover { opacity: 0.85; }
    .suggestion-follow-btn.following { background: transparent; color: var(--color-text-primary); border: 1px solid var(--color-border); }
    .suggestion-follow-btn.following:hover { border-color: var(--color-danger); color: var(--color-danger); background: rgba(255, 107, 107, 0.08); }
    /* ---- Misc ---- */
    .empty-state { text-align: center; padding: 64px 24px; color: var(--color-text-secondary); }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; color: var(--color-border); margin-bottom: 12px; }
    .empty-icon-float { animation: floatIcon 3s ease-in-out infinite; }
    @keyframes floatIcon {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    .post-card-enter { animation: cardFadeUp 0.4s ease both; }
    @keyframes cardFadeUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .empty-state h3 { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin-bottom: 4px; }
    .empty-state p { font-size: var(--font-size-base); }
    .skeleton-card { padding: 20px; margin-bottom: 0; border-bottom: 1px solid var(--color-border); border-radius: 0 !important; box-shadow: none !important; }
    .skeleton-header { display: flex; gap: 12px; margin-bottom: 16px; }
    .skeleton-circle { width: 44px; height: 44px; border-radius: 50%; background: var(--skeleton-bg); animation: pulse 1.5s infinite; }
    .skeleton-lines { flex: 1; }
    .skeleton-line { height: 12px; border-radius: 6px; background: var(--skeleton-bg); margin-bottom: 8px; animation: pulse 1.5s infinite; }
    .skeleton-body { display: flex; flex-direction: column; gap: 8px; }
    .w40 { width: 40%; } .w60 { width: 60%; } .w80 { width: 80%; } .w100 { width: 100%; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    @media (max-width: 768px) {
      .feed-container { padding: 0; }
      .feed-sidebar { display: none; }
      .mobile-suggestions { display: block; }
    }
  `]
})
export class FeedComponent implements OnInit {
  posts: BlogPost[] = [];
  suggestedUsers: UserProfile[] = [];
  loading = false;
  loadError = false;
  page = 1;
  hasMore = false;
  activeFilter: 'feed' | 'latest' | 'trending' = 'feed';
  sidebarExpanded = false;

  constructor(
    private feedService: FeedService,
    private blogService: BlogService,
    private userService: UserService,
    public authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn) {
      this.activeFilter = 'trending';
    }
    if (this.authService.isLoggedIn) {
      this.loadSuggestedUsers();
    }
    this.loadPosts(true);
  }

  setFilter(filter: 'feed' | 'latest' | 'trending'): void {
    if (this.activeFilter === filter) return;
    this.activeFilter = filter;
    this.loadPosts(true);
  }

  // Cap the stagger so cards further down the list don't wait too long to appear
  minAnimDelay(index: number): number {
    return Math.min(index, 8) * 40;
  }

  loadPosts(reset = false): void {
    if (reset) { this.posts = []; this.page = 1; this.hasMore = false; }
    this.loading = true;
    this.loadError = false;
    const pagination = { page: this.page, pageSize: 10 };

    if (this.activeFilter === 'feed' && this.authService.isLoggedIn) {
      this.feedService.getHomeFeed(pagination).subscribe({
        next: (result: any) => { this.posts = [...this.posts, ...result.items]; this.hasMore = result.hasNextPage; this.loading = false; },
        error: () => { this.loading = false; this.loadError = true; this.snackBar.open('Failed to load feed', 'Close', { duration: 3000 }); }
      });
    } else if (this.activeFilter === 'trending' || (this.activeFilter === 'feed' && !this.authService.isLoggedIn)) {
      this.feedService.getTrending(pagination).subscribe({
        next: (result: any) => { this.posts = [...this.posts, ...result.items]; this.hasMore = result.hasNextPage; this.loading = false; },
        error: () => { this.loading = false; this.loadError = true; }
      });
    } else {
      this.feedService.getLatest(pagination).subscribe({
        next: (result: any) => { this.posts = [...this.posts, ...result.items]; this.hasMore = result.hasNextPage; this.loading = false; },
        error: () => { this.loading = false; this.loadError = true; }
      });
    }
  }

  loadSuggestedUsers(): void {
    this.userService.getSuggestedUsers(15).subscribe({ next: (users: any) => this.suggestedUsers = users });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    const pos = window.innerHeight + window.scrollY;
    const height = document.documentElement.scrollHeight;
    if (pos >= height - 300 && this.hasMore && !this.loading) { this.page++; this.loadPosts(); }
  }

  toggleLike(postId: string): void {
    if (!this.authService.isLoggedIn) { this.snackBar.open('Please login to like posts', 'Login', { duration: 3000 }); return; }
    this.blogService.toggleLike(postId).subscribe({
      next: (result: any) => {
        const post = this.posts.find(p => p.id === postId);
        if (post) { post.isLikedByCurrentUser = result.liked; post.likeCount += result.liked ? 1 : -1; }
      }
    });
  }

  toggleBookmark(postId: string): void {
    if (!this.authService.isLoggedIn) return;
    this.blogService.toggleBookmark(postId).subscribe({
      next: (result: any) => {
        const post = this.posts.find(p => p.id === postId);
        if (post) post.isBookmarkedByCurrentUser = result.bookmarked;
        this.snackBar.open(result.bookmarked ? 'Post saved' : 'Bookmark removed', 'Close', { duration: 2000 });
      }
    });
  }

  toggleReaction(event: { postId: string; type: ReactionType }): void {
    if (!this.authService.isLoggedIn) return;
    this.blogService.toggleReaction(event.postId, { type: event.type }).subscribe({
      next: (result: any) => {
        const post = this.posts.find(p => p.id === event.postId);
        if (post) { post.reactionCounts = result.counts; post.currentUserReaction = result.currentUserReaction; }
      }
    });
  }

  toggleFollowSuggested(userId: string): void {
    this.userService.toggleFollow(userId).subscribe({
      next: (result: any) => {
        const user = this.suggestedUsers.find(u => u.id === userId);
        if (user) user.isFollowedByCurrentUser = result.isFollowing;
      }
    });
  }
}