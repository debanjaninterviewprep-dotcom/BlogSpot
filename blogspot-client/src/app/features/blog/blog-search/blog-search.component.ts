import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BlogService } from '@core/services/blog.service';
import { UserService } from '@core/services/user.service';
import { AuthService } from '@core/services/auth.service';
import { ReadingListService } from '@core/services/reading-list.service';
import { BlogPost } from '@core/models/blog.model';
import { UserProfile } from '@core/models/user.model';
import { ReadingList } from '@core/models/reading-list.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-blog-search',
  template: `
    <div class="search-container">
      <h2>Search Results for "{{ query }}"</h2>

      <mat-tab-group animationDuration="200ms">
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">article</mat-icon>
            <span class="tab-label-text">Posts ({{ totalPostCount }})</span>
          </ng-template>
          <div class="tab-content">
            <app-loading-spinner *ngIf="loadingPosts"></app-loading-spinner>
            <app-error-state *ngIf="postsLoadError && posts.length === 0"
                             message="Failed to load posts. Please try again."
                             (onRetry)="searchPosts()">
            </app-error-state>
            <div *ngIf="!loadingPosts && !postsLoadError && posts.length === 0" class="empty-state">
              <mat-icon>search_off</mat-icon>
              <h3>No posts found</h3>
              <p>Try different keywords</p>
            </div>
            <app-post-card *ngFor="let post of posts"
                           [post]="post"
                           (onLike)="toggleLike($event)">
            </app-post-card>
            <button mat-stroked-button class="full-width mt-2"
                    *ngIf="hasMorePosts" (click)="loadMorePosts()">
              Load More
            </button>
          </div>
        </mat-tab>

        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">group</mat-icon>
            <span class="tab-label-text">People ({{ totalUserCount }})</span>
          </ng-template>
          <div class="tab-content">
            <app-loading-spinner *ngIf="loadingUsers"></app-loading-spinner>
            <app-error-state *ngIf="usersLoadError && users.length === 0"
                             message="Failed to load people. Please try again."
                             (onRetry)="searchUsers()">
            </app-error-state>
            <div *ngIf="!loadingUsers && !usersLoadError && users.length === 0" class="empty-state">
              <mat-icon>person_search</mat-icon>
              <h3>No people found</h3>
              <p>Try a different name or username</p>
            </div>
            <app-user-card *ngFor="let user of users"
                           [user]="user"
                           (onFollow)="toggleFollow($event)">
            </app-user-card>
            <button mat-stroked-button class="full-width mt-2"
                    *ngIf="hasMoreUsers" (click)="loadMoreUsers()">
              Load More
            </button>
          </div>
        </mat-tab>

        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">collections_bookmark</mat-icon>
            <span class="tab-label-text">Reading Lists ({{ totalListCount }})</span>
          </ng-template>
          <div class="tab-content">
            <app-loading-spinner *ngIf="loadingLists"></app-loading-spinner>
            <app-error-state *ngIf="listsLoadError && readingLists.length === 0"
                             message="Failed to load reading lists. Please try again."
                             (onRetry)="searchReadingLists()">
            </app-error-state>
            <div *ngIf="!loadingLists && !listsLoadError && readingLists.length === 0" class="empty-state">
              <mat-icon>collections_bookmark</mat-icon>
              <h3>No reading lists found</h3>
              <p>Try different keywords</p>
            </div>
            <a class="reading-list-item" *ngFor="let list of readingLists" [routerLink]="['/blog/reading-lists', list.id]">
              <div class="reading-list-info">
                <span class="reading-list-name">{{ list.name }}</span>
                <span class="reading-list-desc" *ngIf="list.description">{{ list.description }}</span>
                <span class="reading-list-stats">
                  {{ list.itemCount }} posts &middot; {{ list.followerCount }} followers &middot; by {{ list.userDisplayName || list.userName }}
                </span>
              </div>
              <mat-icon>chevron_right</mat-icon>
            </a>
            <button mat-stroked-button class="full-width mt-2"
                    *ngIf="hasMoreLists" (click)="loadMoreLists()">
              Load More
            </button>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .search-container { width: 100%; padding: 0 24px; box-sizing: border-box; min-height: calc(100vh - 56px); }
    h2 { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin-bottom: 16px; }
    .tab-content { padding: 16px 0; }
    .tab-icon { font-size: 20px; width: 20px; height: 20px; margin-right: 8px; }
    .reading-list-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 4px;
      border-bottom: 1px solid var(--color-border);
      text-decoration: none;
      color: inherit;
    }
    .reading-list-item:hover { background: var(--color-bg-hover); }
    .reading-list-info { display: flex; flex-direction: column; min-width: 0; }
    .reading-list-name { font-weight: var(--font-weight-bold); color: var(--color-text-primary); }
    .reading-list-desc { font-size: var(--font-size-sm); color: var(--color-text-secondary); }
    .reading-list-stats { font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-top: 2px; }
    .empty-state { text-align: center; padding: 48px; color: var(--color-text-secondary); }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; color: var(--color-border); }
    .empty-state h3 { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin-top: 12px; }
    @media (max-width: 600px) {
      .search-container { padding: 0 12px; }
      /* Tabs collapse to icons only so all of them fit without paging arrows */
      .tab-label-text { display: none; }
      .tab-icon { margin-right: 0; }
    }
  `]
})
export class BlogSearchComponent implements OnInit {
  query = '';
  posts: BlogPost[] = [];
  users: UserProfile[] = [];
  readingLists: ReadingList[] = [];
  loadingPosts = false;
  loadingUsers = false;
  loadingLists = false;
  postsLoadError = false;
  usersLoadError = false;
  listsLoadError = false;
  postPage = 1;
  userPage = 1;
  listPage = 1;
  totalPostCount = 0;
  totalUserCount = 0;
  totalListCount = 0;
  hasMorePosts = false;
  hasMoreUsers = false;
  hasMoreLists = false;

  constructor(
    private route: ActivatedRoute,
    private blogService: BlogService,
    private userService: UserService,
    private readingListService: ReadingListService,
    public authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.query = params['q'] || '';
      if (this.query) {
        this.posts = [];
        this.users = [];
        this.readingLists = [];
        this.postPage = 1;
        this.userPage = 1;
        this.listPage = 1;
        this.searchPosts();
        this.searchUsers();
        this.searchReadingLists();
      }
    });
  }

  searchPosts(): void {
    this.loadingPosts = true;
    this.postsLoadError = false;
    this.blogService.searchPosts(this.query, { page: this.postPage, pageSize: 10 }).subscribe({
      next: (result) => {
        this.posts = [...this.posts, ...result.items];
        this.totalPostCount = result.totalCount;
        this.hasMorePosts = result.hasNextPage;
        this.loadingPosts = false;
      },
      error: () => {
        this.loadingPosts = false;
        this.postsLoadError = true;
        this.snackBar.open('Search failed', 'Close', { duration: 3000 });
      }
    });
  }

  searchUsers(): void {
    this.loadingUsers = true;
    this.usersLoadError = false;
    this.userService.searchUsers(this.query, { page: this.userPage, pageSize: 10 }).subscribe({
      next: (result) => {
        this.users = [...this.users, ...result.items];
        this.totalUserCount = result.totalCount;
        this.hasMoreUsers = result.hasNextPage;
        this.loadingUsers = false;
      },
      error: () => {
        this.loadingUsers = false;
        this.usersLoadError = true;
      }
    });
  }

  loadMorePosts(): void {
    this.postPage++;
    this.searchPosts();
  }

  loadMoreUsers(): void {
    this.userPage++;
    this.searchUsers();
  }

  searchReadingLists(): void {
    this.loadingLists = true;
    this.listsLoadError = false;
    this.readingListService.search(this.query, { page: this.listPage, pageSize: 10 }).subscribe({
      next: (result) => {
        this.readingLists = [...this.readingLists, ...result.items];
        this.totalListCount = result.totalCount;
        this.hasMoreLists = result.hasNextPage;
        this.loadingLists = false;
      },
      error: () => {
        this.loadingLists = false;
        this.listsLoadError = true;
      }
    });
  }

  loadMoreLists(): void {
    this.listPage++;
    this.searchReadingLists();
  }

  toggleLike(postId: string): void {
    if (!this.authService.isLoggedIn) return;
    this.blogService.toggleLike(postId).subscribe({
      next: (result) => {
        const post = this.posts.find(p => p.id === postId);
        if (post) {
          post.isLikedByCurrentUser = result.liked;
          post.likeCount += result.liked ? 1 : -1;
        }
      }
    });
  }

  toggleFollow(userId: string): void {
    if (!this.authService.isLoggedIn) return;
    this.userService.toggleFollow(userId).subscribe({
      next: (result) => {
        const user = this.users.find(u => u.id === userId);
        if (user) user.isFollowedByCurrentUser = result.isFollowing;
      }
    });
  }
}
