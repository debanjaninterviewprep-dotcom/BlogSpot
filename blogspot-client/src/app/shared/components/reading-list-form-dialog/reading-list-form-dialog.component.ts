import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReadingList } from '@core/models/reading-list.model';

export interface ReadingListFormDialogData {
  list?: ReadingList;
}

export interface ReadingListFormResult {
  name: string;
  description?: string;
  isPublic: boolean;
}

@Component({
  selector: 'app-reading-list-form-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.list ? 'Edit Reading List' : 'New Reading List' }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Name</mat-label>
        <input matInput [(ngModel)]="name" maxlength="100" placeholder="e.g. My favorite DevOps articles">
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Description (optional)</mat-label>
        <textarea matInput [(ngModel)]="description" rows="3" maxlength="500"></textarea>
      </mat-form-field>

      <div class="visibility-row">
        <mat-slide-toggle [(ngModel)]="isPublic" color="primary">Public</mat-slide-toggle>
        <span class="visibility-hint">{{ isPublic ? 'Anyone can view and follow this list' : 'Only you can see this list' }}</span>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="!name.trim()" (click)="submit()">Save</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; }
    .visibility-row { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
    .visibility-hint { font-size: var(--font-size-sm); color: var(--color-text-secondary); }
  `]
})
export class ReadingListFormDialogComponent {
  name: string;
  description: string;
  isPublic: boolean;

  constructor(
    public dialogRef: MatDialogRef<ReadingListFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReadingListFormDialogData
  ) {
    this.name = data.list?.name || '';
    this.description = data.list?.description || '';
    this.isPublic = data.list ? data.list.isPublic : true;
  }

  submit(): void {
    if (!this.name.trim()) return;
    const result: ReadingListFormResult = {
      name: this.name.trim(),
      description: this.description.trim() || undefined,
      isPublic: this.isPublic
    };
    this.dialogRef.close(result);
  }
}
