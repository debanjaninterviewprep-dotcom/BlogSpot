import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BlogService } from '@core/services/blog.service';
import { AuthService } from '@core/services/auth.service';
import { BlogPost } from '@core/models/blog.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-blog-search',
  template: `
    <div class="search-container">
      <h2>Search Results for "{{ query }}"</h2>
      <p class="result-count" *ngIf="!loading">{{ totalCount }} results found</p>

      <app-loading-spinner *ngIf="loading"></app-loading-spinner>

      <div *ngIf="!loading && posts.length === 0" class="empty-state">
        <mat-icon>search_off</mat-icon>
        <h3>No results found</h3>
        <p>Try different keywords</p>
      </div>

      <app-post-card *ngFor="let post of posts" 
                     [post]="post"
                     (onLike)="toggleLike($event)">
      </app-post-card>

      <button mat-stroked-button class="full-width mt-2" 
              *ngIf="hasMore" (click)="loadMore()">
        Load More
      </button>
    </div>
  `,
  styles: [`
    .search-container { max-width: 720px; margin: 0 auto; }
    .result-count { color: #888; margin-bottom: 16px; }
    .empty-state { text-align: center; padding: 48px; color: #888; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; color: #ccc; }
  `]
})
export class BlogSearchComponent implements OnInit {
  query = '';
  posts: BlogPost[] = [];
  loading = false;
  page = 1;
  totalCount = 0;
  hasMore = false;

  constructor(
    private route: ActivatedRoute,
    private blogService: BlogService,
    public authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.query = params['q'] || '';
      if (this.query) {
        this.posts = [];
        this.page = 1;
        this.search();
      }
    });
  }

  search(): void {
    this.loading = true;
    this.blogService.searchPosts(this.query, { page: this.page, pageSize: 10 }).subscribe({
      next: (result) => {
        this.posts = [...this.posts, ...result.items];
        this.totalCount = result.totalCount;
        this.hasMore = result.hasNextPage;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Search failed', 'Close', { duration: 3000 });
      }
    });
  }

  loadMore(): void {
    this.page++;
    this.search();
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
}
