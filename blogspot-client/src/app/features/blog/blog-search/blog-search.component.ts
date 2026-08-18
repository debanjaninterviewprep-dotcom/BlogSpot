import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BlogService } from '@core/services/blog.service';
import { UserService } from '@core/services/user.service';
import { AuthService } from '@core/services/auth.service';
import { BlogPost } from '@core/models/blog.model';
import { UserProfile } from '@core/models/user.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-blog-search',
  template: `
    <div class="search-container">
      <h2>Search Results for "{{ query }}"</h2>

      <mat-tab-group animationDuration="200ms">
        <mat-tab [label]="'Posts (' + totalPostCount + ')'">
          <div class="tab-content">
            <app-loading-spinner *ngIf="loadingPosts"></app-loading-spinner>
            <div *ngIf="!loadingPosts && posts.length === 0" class="empty-state">
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

        <mat-tab [label]="'People (' + totalUserCount + ')'">
          <div class="tab-content">
            <app-loading-spinner *ngIf="loadingUsers"></app-loading-spinner>
            <div *ngIf="!loadingUsers && users.length === 0" class="empty-state">
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
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .search-container { max-width: 720px; margin: 0 auto; padding: 0 16px; }
    h2 { font-size: 20px; font-weight: 700; color: #0f1419; margin-bottom: 16px; }
    .tab-content { padding: 16px 0; }
    .empty-state { text-align: center; padding: 48px; color: #536471; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; color: #cfd9de; }
    .empty-state h3 { font-size: 18px; font-weight: 700; color: #0f1419; margin-top: 12px; }
  `]
})
export class BlogSearchComponent implements OnInit {
  query = '';
  posts: BlogPost[] = [];
  users: UserProfile[] = [];
  loadingPosts = false;
  loadingUsers = false;
  postPage = 1;
  userPage = 1;
  totalPostCount = 0;
  totalUserCount = 0;
  hasMorePosts = false;
  hasMoreUsers = false;

  constructor(
    private route: ActivatedRoute,
    private blogService: BlogService,
    private userService: UserService,
    public authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.query = params['q'] || '';
      if (this.query) {
        this.posts = [];
        this.users = [];
        this.postPage = 1;
        this.userPage = 1;
        this.searchPosts();
        this.searchUsers();
      }
    });
  }

  searchPosts(): void {
    this.loadingPosts = true;
    this.blogService.searchPosts(this.query, { page: this.postPage, pageSize: 10 }).subscribe({
      next: (result) => {
        this.posts = [...this.posts, ...result.items];
        this.totalPostCount = result.totalCount;
        this.hasMorePosts = result.hasNextPage;
        this.loadingPosts = false;
      },
      error: () => {
        this.loadingPosts = false;
        this.snackBar.open('Search failed', 'Close', { duration: 3000 });
      }
    });
  }

  searchUsers(): void {
    this.loadingUsers = true;
    this.userService.searchUsers(this.query, { page: this.userPage, pageSize: 10 }).subscribe({
      next: (result) => {
        this.users = [...this.users, ...result.items];
        this.totalUserCount = result.totalCount;
        this.hasMoreUsers = result.hasNextPage;
        this.loadingUsers = false;
      },
      error: () => {
        this.loadingUsers = false;
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
