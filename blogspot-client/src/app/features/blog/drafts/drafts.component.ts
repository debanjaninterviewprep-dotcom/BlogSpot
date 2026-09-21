import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '@core/services/blog.service';
import { DraftBlog } from '@core/models/blog.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-drafts',
  template: `
    <div class="drafts-container">
      <h2>My Drafts</h2>

      <app-loading-spinner *ngIf="loading"></app-loading-spinner>

      <app-error-state *ngIf="loadError && drafts.length === 0"
                       message="Failed to load drafts. Please try again."
                       (onRetry)="loadDrafts()">
      </app-error-state>

      <div *ngIf="!loading && !loadError && drafts.length === 0" class="empty-state">
        <mat-icon>drafts</mat-icon>
        <h3>No drafts</h3>
        <p>Your auto-saved and manually saved drafts will appear here.</p>
      </div>

      <mat-card *ngFor="let draft of drafts" class="draft-card">
        <mat-card-header>
          <mat-card-title>{{ draft.title || 'Untitled' }}</mat-card-title>
          <mat-card-subtitle>
            Last updated: {{ draft.updatedAt | date:'medium' }}
            <span *ngIf="draft.tags?.length"> · Tags: {{ draft.tags.join(', ') }}</span>
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p class="draft-preview">{{ draft.content | slice:0:200 }}{{ draft.content.length > 200 ? '...' : '' }}</p>
        </mat-card-content>
        <mat-card-actions align="end">
          <button mat-button color="warn" (click)="deleteDraft(draft.id)">
            <mat-icon>delete</mat-icon> Delete
          </button>
          <button mat-raised-button color="primary" (click)="editDraft(draft)">
            <mat-icon>edit</mat-icon> Continue Editing
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .drafts-container { width: 100%; padding: 16px 24px; box-sizing: border-box; min-height: calc(100vh - 56px); }
    .drafts-container h2 {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-extrabold);
      margin: 0 0 20px;
      color: var(--color-text-primary, #0f1419);
    }
    .draft-card {
      margin-bottom: 16px;
      border-radius: 16px !important;
      border: 1px solid var(--color-border, #eff3f4) !important;
      background: var(--card-bg, #fff) !important;
      overflow: hidden;
      transition: box-shadow 0.15s;
    }
    .draft-card:hover {
      box-shadow: var(--card-hover-shadow, 0 2px 12px rgba(0,0,0,0.08));
    }
    .draft-card mat-card-header {
      padding: 16px 16px 0;
    }
    .draft-card mat-card-title {
      font-size: var(--font-size-lg) !important;
      font-weight: var(--font-weight-bold) !important;
      color: var(--color-text-primary, #0f1419) !important;
      word-break: break-word;
    }
    .draft-card mat-card-subtitle {
      font-size: var(--font-size-sm) !important;
      color: var(--color-text-secondary, #536471) !important;
      margin-top: 4px !important;
    }
    .draft-card mat-card-content {
      padding: 0 16px;
    }
    .draft-preview {
      color: var(--color-text-secondary, #536471);
      line-height: 1.6;
      font-size: var(--font-size-base);
      word-break: break-word;
      overflow-wrap: break-word;
    }
    .draft-card mat-card-actions {
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
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary, #0f1419);
      margin: 0 0 8px;
    }
    .empty-state p {
      margin: 0;
      font-size: var(--font-size-base);
    }
  `]
})
export class DraftsComponent implements OnInit {
  drafts: DraftBlog[] = [];
  loading = false;
  loadError = false;

  constructor(
    private blogService: BlogService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadDrafts();
  }

  loadDrafts(): void {
    this.loading = true;
    this.loadError = false;
    this.blogService.getDrafts().subscribe({
      next: drafts => {
        this.drafts = drafts;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
      }
    });
  }

  editDraft(draft: DraftBlog): void {
    // Navigate to create page - the create component will load the draft
    this.router.navigate(['/blog/create'], { queryParams: { draftId: draft.id } });
  }

  deleteDraft(id: string): void {
    if (!confirm('Delete this draft?')) return;
    this.blogService.deleteDraft(id).subscribe({
      next: () => {
        this.drafts = this.drafts.filter(d => d.id !== id);
        this.snackBar.open('Draft deleted', 'Close', { duration: 2000 });
      }
    });
  }
}
