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
          <button class="filter-chip" [class.active]="activeFilter === 'feed'" (click)="setFilter('feed')">
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
        <div *ngIf="!loading && posts.length === 0" class="empty-state">
          <mat-icon>article</mat-icon>
          <h3>No posts yet</h3>
          <p *ngIf="activeFilter === 'feed'">Follow some users or check Trending!</p>
          <p *ngIf="activeFilter !== 'feed'">Be the first to create a post!</p>
        </div>

        <!-- Posts -->
        <ng-container *ngFor="let post of posts; let i = index">
          <app-post-card [post]="post"
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

      <!-- Sidebar: Suggested Users -->
      <div class="feed-sidebar" *ngIf="authService.isLoggedIn && suggestedUsers.length > 0">
        <div class="sidebar-card">
          <h3 class="sidebar-title">Who to Follow</h3>
          <app-user-card *ngFor="let user of (sidebarExpanded ? suggestedUsers : suggestedUsers.slice(0,3))"
                         [user]="user"
                         (onFollow)="toggleFollowSuggested($event)">
          </app-user-card>
          <a *ngIf="!sidebarExpanded && suggestedUsers.length > 3" class="sidebar-show-more" (click)="sidebarExpanded = true">Show more</a>
          <a *ngIf="sidebarExpanded && suggestedUsers.length > 3" class="sidebar-show-more" (click)="sidebarExpanded = false">Show less</a>
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
      max-width: 1000px;
      margin: 0 auto;
      display: flex;
      gap: 28px;
    }
    .feed-main {
      flex: 1;
      min-width: 0;
      border-left: 1px solid #eff3f4;
      border-right: 1px solid #eff3f4;
    }
    /* ---- Filter bar ---- */
    .filter-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border-bottom: 1px solid #eff3f4;
      overflow-x: auto;
    }
    .filter-bar::-webkit-scrollbar { display: none; }
    .filter-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 16px;
      border-radius: 24px;
      border: 1px solid #cfd9de;
      background: transparent;
      color: #536471;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
      font-family: inherit;
    }
    .filter-chip mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .filter-chip:hover { background: rgba(29,155,240,0.06); color: #1d9bf0; border-color: #1d9bf0; }
    .filter-chip.active {
      background: #0f1419;
      color: #fff;
      border-color: #0f1419;
      font-weight: 700;
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
      background: #f7f9f9;
      border-radius: 16px;
      padding: 16px 0;
      overflow: hidden;
    }
    .sidebar-title {
      font-size: 19px;
      font-weight: 800;
      color: #0f1419;
      margin: 0;
      padding: 0 16px 12px;
      letter-spacing: -0.02em;
    }
    .sidebar-show-more {
      display: block;
      padding: 12px 16px 4px;
      font-size: 14px;
      color: #1d9bf0;
      font-weight: 500;
      cursor: pointer;
      background: none;
      border: none;
      font-family: inherit;
    }
    .sidebar-show-more:hover { text-decoration: underline; }
    /* ---- Mobile suggestions ---- */
    .mobile-suggestions { display: none; }
    .suggestions-scroll-card { border-bottom: 1px solid #eff3f4; padding: 16px 0; }
    .suggestions-scroll-title { font-size: 16px; font-weight: 700; color: #0f1419; margin: 0 0 12px; padding: 0 16px; }
    .suggestions-scroll-track {
      display: flex; gap: 12px; overflow-x: auto; padding: 0 16px 8px;
      scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;
    }
    .suggestions-scroll-track::-webkit-scrollbar { display: none; }
    .suggestion-item {
      display: flex; flex-direction: column; align-items: center;
      min-width: 140px; max-width: 140px; padding: 20px 12px 16px;
      background: #f7f9f9; border-radius: 16px; border: 1px solid #eff3f4;
      scroll-snap-align: start; flex-shrink: 0; gap: 6px;
    }
    .suggestion-avatar-link { flex-shrink: 0; }
    .suggestion-avatar { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; }
    .suggestion-name { font-size: 14px; font-weight: 700; color: #0f1419; text-decoration: none; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; }
    .suggestion-name:hover { text-decoration: underline; }
    .suggestion-handle { font-size: 12px; color: #536471; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; }
    .suggestion-follow-btn {
      margin-top: 6px; font-size: 13px; font-weight: 700; padding: 6px 20px;
      border-radius: 24px; border: none; background: #0f1419; color: #fff;
      cursor: pointer; transition: opacity 0.15s, background 0.15s, color 0.15s; font-family: inherit; white-space: nowrap;
    }
    .suggestion-follow-btn:hover { opacity: 0.85; }
    .suggestion-follow-btn.following { background: transparent; color: #0f1419; border: 1px solid #cfd9de; }
    .suggestion-follow-btn.following:hover { border-color: #f4212e; color: #f4212e; background: rgba(244,33,46,0.06); }
    /* ---- Misc ---- */
    .empty-state { text-align: center; padding: 64px 24px; color: #536471; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; color: #cfd9de; margin-bottom: 12px; }
    .empty-state h3 { font-size: 18px; font-weight: 700; color: #0f1419; margin-bottom: 4px; }
    .empty-state p { font-size: 14px; }
    .skeleton-card { padding: 20px; margin-bottom: 0; border-bottom: 1px solid #eff3f4; border-radius: 0 !important; box-shadow: none !important; }
    .skeleton-header { display: flex; gap: 12px; margin-bottom: 16px; }
    .skeleton-circle { width: 44px; height: 44px; border-radius: 50%; background: #e0e0e0; animation: pulse 1.5s infinite; }
    .skeleton-lines { flex: 1; }
    .skeleton-line { height: 12px; border-radius: 6px; background: #e0e0e0; margin-bottom: 8px; animation: pulse 1.5s infinite; }
    .skeleton-body { display: flex; flex-direction: column; gap: 8px; }
    .w40 { width: 40%; } .w60 { width: 60%; } .w80 { width: 80%; } .w100 { width: 100%; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    @media (max-width: 768px) {
      .feed-container { padding: 0; }
      .feed-sidebar { display: none; }
      .mobile-suggestions { display: block; }
      .feed-main { border-left: none; border-right: none; }
      .filter-bar { top: 52px; }
    }
  `]
})
export class FeedComponent implements OnInit {
  posts: BlogPost[] = [];
  suggestedUsers: UserProfile[] = [];
  loading = false;
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

  loadPosts(reset = false): void {
    if (reset) { this.posts = []; this.page = 1; this.hasMore = false; }
    this.loading = true;
    const pagination = { page: this.page, pageSize: 10 };

    if (this.activeFilter === 'feed' && this.authService.isLoggedIn) {
      this.feedService.getHomeFeed(pagination).subscribe({
        next: (result: any) => { this.posts = [...this.posts, ...result.items]; this.hasMore = result.hasNextPage; this.loading = false; },
        error: () => { this.loading = false; this.snackBar.open('Failed to load feed', 'Close', { duration: 3000 }); }
      });
    } else if (this.activeFilter === 'trending' || (this.activeFilter === 'feed' && !this.authService.isLoggedIn)) {
      this.feedService.getTrending(pagination).subscribe({
        next: (result: any) => { this.posts = [...this.posts, ...result.items]; this.hasMore = result.hasNextPage; this.loading = false; },
        error: () => { this.loading = false; }
      });
    } else {
      this.feedService.getLatest(pagination).subscribe({
        next: (result: any) => { this.posts = [...this.posts, ...result.items]; this.hasMore = result.hasNextPage; this.loading = false; },
        error: () => { this.loading = false; }
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