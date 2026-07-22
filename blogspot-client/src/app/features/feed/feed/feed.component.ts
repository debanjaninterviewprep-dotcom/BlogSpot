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
        <mat-tab-group (selectedTabChange)="onTabChange($event)" animationDuration="200ms">
          <mat-tab label="My Feed" *ngIf="authService.isLoggedIn">
            <div class="tab-content">
              <!-- Skeleton loading -->
              <div *ngIf="loadingFeed && feedPosts.length === 0" class="skeleton-list">
                <mat-card *ngFor="let s of [1,2,3]" class="skeleton-card">
                  <div class="skeleton-header"><div class="skeleton-circle"></div><div class="skeleton-lines"><div class="skeleton-line w60"></div><div class="skeleton-line w40"></div></div></div>
                  <div class="skeleton-body"><div class="skeleton-line w100"></div><div class="skeleton-line w80"></div><div class="skeleton-line w60"></div></div>
                </mat-card>
              </div>
              <div *ngIf="!loadingFeed && feedPosts.length === 0" class="empty-state">
                <mat-icon>article</mat-icon>
                <h3>Your feed is empty</h3>
                <p>Follow some users to see their posts here!</p>
              </div>
              <ng-container *ngFor="let post of feedPosts; let i = index">
                <app-post-card [post]="post"
                               (onLike)="toggleLike($event, 'feed')"
                               (onBookmark)="toggleBookmark($event, 'feed')"
                               (onReaction)="toggleReaction($event, 'feed')">
                </app-post-card>
                <!-- Mobile inline suggestions after 3rd post -->
                <mat-card class="mobile-suggestions" *ngIf="i === 2 && suggestedUsers.length > 0">
                  <mat-card-header><mat-card-title>Who to Follow</mat-card-title></mat-card-header>
                  <mat-card-content>
                    <app-user-card *ngFor="let user of suggestedUsers.slice(0,3)" [user]="user"
                                   (onFollow)="toggleFollowSuggested($event)">
                    </app-user-card>
                  </mat-card-content>
                </mat-card>
              </ng-container>
              <app-loading-spinner [inline]="true" *ngIf="loadingFeed && feedPosts.length > 0"></app-loading-spinner>
            </div>
          </mat-tab>
          <mat-tab label="Trending">
            <div class="tab-content">
              <div *ngIf="loadingTrending && trendingPosts.length === 0" class="skeleton-list">
                <mat-card *ngFor="let s of [1,2,3]" class="skeleton-card">
                  <div class="skeleton-header"><div class="skeleton-circle"></div><div class="skeleton-lines"><div class="skeleton-line w60"></div><div class="skeleton-line w40"></div></div></div>
                  <div class="skeleton-body"><div class="skeleton-line w100"></div><div class="skeleton-line w80"></div><div class="skeleton-line w60"></div></div>
                </mat-card>
              </div>
              <div *ngIf="!loadingTrending && trendingPosts.length === 0" class="empty-state">
                <mat-icon>trending_up</mat-icon>
                <h3>No trending posts yet</h3>
                <p>Be the first to create a post!</p>
              </div>
              <app-post-card *ngFor="let post of trendingPosts" 
                             [post]="post"
                             (onLike)="toggleLike($event, 'trending')"
                             (onBookmark)="toggleBookmark($event, 'trending')"
                             (onReaction)="toggleReaction($event, 'trending')">
              </app-post-card>
              <app-loading-spinner [inline]="true" *ngIf="loadingTrending && trendingPosts.length > 0"></app-loading-spinner>
            </div>
          </mat-tab>
          <mat-tab label="Latest">
            <div class="tab-content">
              <div *ngIf="loadingLatest && latestPosts.length === 0" class="skeleton-list">
                <mat-card *ngFor="let s of [1,2,3]" class="skeleton-card">
                  <div class="skeleton-header"><div class="skeleton-circle"></div><div class="skeleton-lines"><div class="skeleton-line w60"></div><div class="skeleton-line w40"></div></div></div>
                  <div class="skeleton-body"><div class="skeleton-line w100"></div><div class="skeleton-line w80"></div><div class="skeleton-line w60"></div></div>
                </mat-card>
              </div>
              <div *ngIf="!loadingLatest && latestPosts.length === 0" class="empty-state">
                <mat-icon>new_releases</mat-icon>
                <h3>No posts yet</h3>
                <p>Be the first to create a post!</p>
              </div>
              <app-post-card *ngFor="let post of latestPosts" 
                             [post]="post"
                             (onLike)="toggleLike($event, 'latest')"
                             (onBookmark)="toggleBookmark($event, 'latest')"
                             (onReaction)="toggleReaction($event, 'latest')">
              </app-post-card>
              <app-loading-spinner [inline]="true" *ngIf="loadingLatest && latestPosts.length > 0"></app-loading-spinner>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>

      <!-- Sidebar: Suggested Users -->
      <div class="feed-sidebar" *ngIf="authService.isLoggedIn && suggestedUsers.length > 0">
        <div class="sidebar-card">
          <h3 class="sidebar-title">Who to Follow</h3>
          <app-user-card *ngFor="let user of suggestedUsers" 
                         [user]="user"
                         (onFollow)="toggleFollowSuggested($event)">
          </app-user-card>
          <a routerLink="/feed" class="sidebar-show-more">Show more</a>
        </div>
      </div>
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
      margin: 0 0 4px;
      padding: 0 16px 12px;
      letter-spacing: -0.02em;
    }
    .sidebar-show-more {
      display: block;
      padding: 12px 16px 4px;
      font-size: 14px;
      color: #1d9bf0;
      text-decoration: none;
      font-weight: 500;
      transition: background 0.15s;
    }
    .sidebar-show-more:hover { text-decoration: underline; }
    .mobile-suggestions { display: none; margin-bottom: 16px; }
    .tab-content {
      padding: 0;
    }
    .empty-state {
      text-align: center;
      padding: 64px 24px;
      color: #536471;
    }
    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #cfd9de;
      margin-bottom: 12px;
    }
    .empty-state h3 {
      font-size: 18px;
      font-weight: 700;
      color: #0f1419;
      margin-bottom: 4px;
    }
    .empty-state p { font-size: 14px; }
    /* Skeleton loading */
    .skeleton-card { padding: 20px; margin-bottom: 0; border-bottom: 1px solid #eff3f4; border-radius: 0 !important; box-shadow: none !important; }
    .skeleton-header { display: flex; gap: 12px; margin-bottom: 16px; }
    .skeleton-circle { width: 44px; height: 44px; border-radius: 50%; background: #e0e0e0; animation: pulse 1.5s infinite; }
    .skeleton-lines { flex: 1; }
    .skeleton-line { height: 12px; border-radius: 6px; background: #e0e0e0; margin-bottom: 8px; animation: pulse 1.5s infinite; }
    .skeleton-body { display: flex; flex-direction: column; gap: 8px; }
    .w40 { width: 40%; }
    .w60 { width: 60%; }
    .w80 { width: 80%; }
    .w100 { width: 100%; }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    @media (max-width: 768px) {
      .feed-container { padding: 0; }
      .feed-sidebar { display: none; }
      .mobile-suggestions { display: block; }
      .feed-main { border-left: none; border-right: none; }
    }
  `]
})
export class FeedComponent implements OnInit {
  feedPosts: BlogPost[] = [];
  trendingPosts: BlogPost[] = [];
  latestPosts: BlogPost[] = [];
  suggestedUsers: UserProfile[] = [];
  loadingFeed = false;
  loadingTrending = false;
  loadingLatest = false;
  feedPage = 1;
  trendingPage = 1;
  latestPage = 1;
  feedHasMore = false;
  trendingHasMore = false;
  latestHasMore = false;
  activeTab = 0;

  constructor(
    private feedService: FeedService,
    private blogService: BlogService,
    private userService: UserService,
    public authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn) {
      this.loadFeed();
      this.loadSuggestedUsers();
    }
    this.loadTrending();
  }

  // Infinite scroll
  @HostListener('window:scroll')
  onScroll(): void {
    const threshold = 300;
    const position = window.innerHeight + window.scrollY;
    const height = document.documentElement.scrollHeight;

    if (position >= height - threshold) {
      if (this.activeTab === 0 && this.feedHasMore && !this.loadingFeed) {
        this.loadMoreFeed();
      } else if (this.activeTab === 1 && this.trendingHasMore && !this.loadingTrending) {
        this.loadMoreTrending();
      } else if (this.activeTab === 2 && this.latestHasMore && !this.loadingLatest) {
        this.loadMoreLatest();
      }
    }
  }

  onTabChange(event: any): void {
    this.activeTab = event.index;
    // Adjust index if user is not logged in (no "My Feed" tab)
    if (!this.authService.isLoggedIn) {
      this.activeTab = event.index + 1;
    }

    if (this.activeTab === 2 && this.latestPosts.length === 0) {
      this.loadLatest();
    }
  }

  loadFeed(): void {
    this.loadingFeed = true;
    this.feedService.getHomeFeed({ page: this.feedPage, pageSize: 10 }).subscribe({
      next: (result) => {
        this.feedPosts = [...this.feedPosts, ...result.items];
        this.feedHasMore = result.hasNextPage;
        this.loadingFeed = false;
      },
      error: () => {
        this.loadingFeed = false;
        this.snackBar.open('Failed to load feed', 'Close', { duration: 3000 });
      }
    });
  }

  loadTrending(): void {
    this.loadingTrending = true;
    this.feedService.getTrending({ page: this.trendingPage, pageSize: 10 }).subscribe({
      next: (result) => {
        this.trendingPosts = [...this.trendingPosts, ...result.items];
        this.trendingHasMore = result.hasNextPage;
        this.loadingTrending = false;
      },
      error: () => {
        this.loadingTrending = false;
        this.snackBar.open('Failed to load trending', 'Close', { duration: 3000 });
      }
    });
  }

  loadLatest(): void {
    this.loadingLatest = true;
    this.feedService.getLatest({ page: this.latestPage, pageSize: 10 }).subscribe({
      next: (result) => {
        this.latestPosts = [...this.latestPosts, ...result.items];
        this.latestHasMore = result.hasNextPage;
        this.loadingLatest = false;
      },
      error: () => {
        this.loadingLatest = false;
        this.snackBar.open('Failed to load latest', 'Close', { duration: 3000 });
      }
    });
  }

  loadSuggestedUsers(): void {
    this.userService.getSuggestedUsers(5).subscribe({
      next: users => this.suggestedUsers = users
    });
  }

  loadMoreFeed(): void { this.feedPage++; this.loadFeed(); }
  loadMoreTrending(): void { this.trendingPage++; this.loadTrending(); }
  loadMoreLatest(): void { this.latestPage++; this.loadLatest(); }

  toggleLike(postId: string, list: string): void {
    if (!this.authService.isLoggedIn) {
      this.snackBar.open('Please login to like posts', 'Login', { duration: 3000 });
      return;
    }
    this.blogService.toggleLike(postId).subscribe({
      next: (result) => {
        this.updatePostInLists(postId, post => {
          post.isLikedByCurrentUser = result.liked;
          post.likeCount += result.liked ? 1 : -1;
        });
      }
    });
  }

  toggleBookmark(postId: string, list: string): void {
    if (!this.authService.isLoggedIn) return;
    this.blogService.toggleBookmark(postId).subscribe({
      next: (result) => {
        this.updatePostInLists(postId, post => {
          post.isBookmarkedByCurrentUser = result.bookmarked;
        });
        this.snackBar.open(result.bookmarked ? 'Post saved' : 'Bookmark removed', 'Close', { duration: 2000 });
      }
    });
  }

  toggleReaction(event: { postId: string; type: ReactionType }, list: string): void {
    if (!this.authService.isLoggedIn) return;
    this.blogService.toggleReaction(event.postId, { type: event.type }).subscribe({
      next: (result) => {
        this.updatePostInLists(event.postId, post => {
          post.reactionCounts = result.counts;
          post.currentUserReaction = result.currentUserReaction;
        });
      }
    });
  }

  toggleFollowSuggested(userId: string): void {
    this.userService.toggleFollow(userId).subscribe({
      next: (result) => {
        const user = this.suggestedUsers.find(u => u.id === userId);
        if (user) user.isFollowedByCurrentUser = result.isFollowing;
      }
    });
  }

  private updatePostInLists(postId: string, updater: (post: BlogPost) => void): void {
    [this.feedPosts, this.trendingPosts, this.latestPosts].forEach(list => {
      const post = list.find(p => p.id === postId);
      if (post) updater(post);
    });
  }
}
