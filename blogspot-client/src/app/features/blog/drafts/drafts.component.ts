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

      <div *ngIf="!loading && drafts.length === 0" class="empty-state">
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
    .drafts-container { max-width: 720px; margin: 0 auto; }
    .draft-card { margin-bottom: 16px; }
    .draft-preview { color: #666; line-height: 1.5; }
    .empty-state { text-align: center; padding: 48px; color: #888; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; color: #ccc; }
  `]
})
export class DraftsComponent implements OnInit {
  drafts: DraftBlog[] = [];
  loading = false;

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
    this.blogService.getDrafts().subscribe({
      next: drafts => {
        this.drafts = drafts;
        this.loading = false;
      },
      error: () => this.loading = false
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
