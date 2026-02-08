import { Component, OnInit } from '@angular/core';
import { BlogService } from '@core/services/blog.service';
import { AuthService } from '@core/services/auth.service';
import { BlogPost, ReactionType } from '@core/models/blog.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-bookmarks',
  template: `
    <div class="bookmarks-container">
      <h2>Saved Posts</h2>

      <app-loading-spinner *ngIf="loading"></app-loading-spinner>

      <div *ngIf="!loading && posts.length === 0" class="empty-state">
        <mat-icon>bookmark_border</mat-icon>
        <h3>No saved posts</h3>
        <p>Bookmark posts to read them later!</p>
      </div>

      <app-post-card *ngFor="let post of posts"
                     [post]="post"
                     (onLike)="toggleLike($event)"
                     (onBookmark)="toggleBookmark($event)"
                     (onReaction)="toggleReaction($event)">
      </app-post-card>

      <button mat-stroked-button class="full-width mt-2"
              *ngIf="hasMore" (click)="loadMore()">
        Load More
      </button>
    </div>
  `,
  styles: [`
    .bookmarks-container { max-width: 720px; margin: 0 auto; }
    .empty-state { text-align: center; padding: 48px; color: #888; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; color: #ccc; }
  `]
})
export class BookmarksComponent implements OnInit {
  posts: BlogPost[] = [];
  loading = false;
  page = 1;
  hasMore = false;

  constructor(
    private blogService: BlogService,
    public authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadBookmarks();
  }

  loadBookmarks(): void {
    this.loading = true;
    this.blogService.getBookmarkedPosts({ page: this.page, pageSize: 10 }).subscribe({
      next: result => {
        this.posts = [...this.posts, ...result.items];
        this.hasMore = result.hasNextPage;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadMore(): void {
    this.page++;
    this.loadBookmarks();
  }

  toggleLike(postId: string): void {
    this.blogService.toggleLike(postId).subscribe({
      next: result => {
        const post = this.posts.find(p => p.id === postId);
        if (post) {
          post.isLikedByCurrentUser = result.liked;
          post.likeCount += result.liked ? 1 : -1;
        }
      }
    });
  }

  toggleBookmark(postId: string): void {
    this.blogService.toggleBookmark(postId).subscribe({
      next: result => {
        if (!result.bookmarked) {
          this.posts = this.posts.filter(p => p.id !== postId);
          this.snackBar.open('Bookmark removed', 'Close', { duration: 2000 });
        }
      }
    });
  }

  toggleReaction(event: { postId: string; type: ReactionType }): void {
    this.blogService.toggleReaction(event.postId, { type: event.type }).subscribe({
      next: result => {
        const post = this.posts.find(p => p.id === event.postId);
        if (post) {
          post.reactionCounts = result.counts;
          post.currentUserReaction = result.currentUserReaction;
        }
      }
    });
  }
}
