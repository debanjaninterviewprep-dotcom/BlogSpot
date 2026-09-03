import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '@core/services/blog.service';
import { BlogPost } from '@core/models/blog.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-scheduled-posts',
  template: `
    <div class="scheduled-container">
      <h2>My Scheduled Posts</h2>

      <app-loading-spinner *ngIf="loading"></app-loading-spinner>

      <div *ngIf="!loading && posts.length === 0" class="empty-state">
        <mat-icon>schedule</mat-icon>
        <h3>No scheduled posts</h3>
        <p>Posts you schedule for future publishing will appear here.</p>
      </div>

      <mat-card *ngFor="let post of posts" class="scheduled-card">
        <mat-card-header>
          <mat-card-title>{{ post.title || 'Untitled' }}</mat-card-title>
          <mat-card-subtitle>
            <mat-icon class="clock-icon">schedule</mat-icon>
            Publishes: {{ post.scheduledPublishAt | date:'medium' }}
            <span *ngIf="post.tags?.length"> · Tags: {{ post.tags.join(', ') }}</span>
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p class="scheduled-preview">{{ post.summary || (post.content | slice:0:200) }}</p>
        </mat-card-content>
        <mat-card-actions align="end">
          <button mat-raised-button color="primary" (click)="editPost(post)">
            <mat-icon>edit</mat-icon> Edit / Reschedule
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .scheduled-container { width: 100%; padding: 16px 24px; box-sizing: border-box; min-height: calc(100vh - 56px); }
    .scheduled-container h2 {
      font-size: 22px;
      font-weight: 800;
      margin: 0 0 20px;
      color: var(--color-text-primary, #0f1419);
    }
    .scheduled-card {
      margin-bottom: 16px;
      border-radius: 16px !important;
      border: 1px solid var(--color-border, #eff3f4) !important;
      background: var(--card-bg, #fff) !important;
      overflow: hidden;
      transition: box-shadow 0.15s;
    }
    .scheduled-card:hover {
      box-shadow: var(--card-hover-shadow, 0 2px 12px rgba(0,0,0,0.08));
    }
    .scheduled-card mat-card-header {
      padding: 16px 16px 0;
    }
    .scheduled-card mat-card-title {
      font-size: 17px !important;
      font-weight: 700 !important;
      color: var(--color-text-primary, #0f1419) !important;
      word-break: break-word;
    }
    .scheduled-card mat-card-subtitle {
      font-size: 13px !important;
      color: var(--color-text-secondary, #536471) !important;
      margin-top: 4px !important;
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
    }
    .clock-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #1d9bf0;
    }
    .scheduled-card mat-card-content {
      padding: 0 16px;
    }
    .scheduled-preview {
      color: var(--color-text-secondary, #536471);
      line-height: 1.6;
      font-size: 14px;
      word-break: break-word;
      overflow-wrap: break-word;
    }
    .scheduled-card mat-card-actions {
      padding: 8px 16px 12px !important;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .empty-state {
      text-align: center;
      padding: 64px 24px;
      color: var(--color-text-secondary, #536471);
    }
    .empty-state mat-icon {
      font-size: 56px;
      width: 56px;
      height: 56px;
      color: var(--color-border, #cfd9de);
      margin-bottom: 12px;
    }
    .empty-state h3 {
      font-size: 18px;
      font-weight: 700;
      color: var(--color-text-primary, #0f1419);
      margin: 0 0 8px;
    }
    .empty-state p {
      margin: 0;
      font-size: 14px;
    }
  `]
})
export class ScheduledPostsComponent implements OnInit {
  posts: BlogPost[] = [];
  loading = false;

  constructor(
    private blogService: BlogService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadScheduledPosts();
  }

  loadScheduledPosts(): void {
    this.loading = true;
    this.blogService.getScheduledPosts().subscribe({
      next: posts => {
        this.posts = posts;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load scheduled posts', 'Close', { duration: 3000 });
      }
    });
  }

  editPost(post: BlogPost): void {
    this.router.navigate(['/blog/edit', post.id]);
  }
}
