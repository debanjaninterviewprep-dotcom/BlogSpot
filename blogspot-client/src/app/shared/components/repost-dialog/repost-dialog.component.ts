import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BlogPost } from '@core/models/blog.model';

export interface RepostDialogData {
  post: BlogPost;
}

/** Object (not a bare string) so an empty quote is still distinguishable from a cancel. */
export interface RepostDialogResult {
  quote: string;
}

@Component({
  selector: 'app-repost-dialog',
  template: `
    <h2 mat-dialog-title>Quote Repost</h2>
    <mat-dialog-content>
      <div class="original-post">
        <img [src]="(data.post.authorProfilePictureUrl | imageUrl) || 'assets/default-avatar.svg'"
             [alt]="data.post.authorUserName" class="original-avatar">
        <div class="original-info">
          <span class="original-author">{{ data.post.authorDisplayName || data.post.authorUserName }}</span>
          <span class="original-title">{{ data.post.title }}</span>
        </div>
      </div>

      <mat-form-field appearance="outline" class="full-width">
        <textarea matInput placeholder="Add a comment (optional)" rows="3"
                  maxlength="280" [(ngModel)]="quote"></textarea>
        <mat-hint align="end">{{ quote.length }}/280</mat-hint>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-raised-button color="primary" (click)="submit()">Repost</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .original-post {
      display: flex;
      gap: 10px;
      align-items: center;
      padding: 10px 12px;
      border: 1px solid var(--color-border);
      border-radius: 12px;
      margin-bottom: 16px;
    }
    .original-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
    .original-info { min-width: 0; display: flex; flex-direction: column; }
    .original-author { font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); color: var(--color-text-primary); }
    .original-title {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .full-width { width: 100%; }
  `]
})
export class RepostDialogComponent {
  quote = '';

  constructor(
    public dialogRef: MatDialogRef<RepostDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RepostDialogData
  ) {}

  submit(): void {
    this.dialogRef.close({ quote: this.quote.trim() });
  }
}
