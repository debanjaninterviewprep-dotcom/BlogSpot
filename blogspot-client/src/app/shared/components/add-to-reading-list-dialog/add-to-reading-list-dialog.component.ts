import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '@core/services/auth.service';
import { ReadingListService } from '@core/services/reading-list.service';
import { ReadingList } from '@core/models/reading-list.model';
import { ReadingListFormDialogComponent, ReadingListFormResult } from '../reading-list-form-dialog/reading-list-form-dialog.component';

export interface AddToReadingListDialogData {
  postId: string;
}

@Component({
  selector: 'app-add-to-reading-list-dialog',
  template: `
    <h2 mat-dialog-title>Save to Reading List</h2>
    <mat-dialog-content>
      <app-loading-spinner [inline]="true" *ngIf="loading"></app-loading-spinner>

      <div class="list-row" *ngFor="let list of lists">
        <div class="list-info">
          <span class="list-name">{{ list.name }}</span>
          <span class="list-meta">{{ list.itemCount }} posts &middot; {{ list.isPublic ? 'Public' : 'Private' }}</span>
        </div>
        <span class="added-label" *ngIf="addedIds.has(list.id)">
          <mat-icon>check_circle</mat-icon> Added
        </span>
        <button mat-stroked-button *ngIf="!addedIds.has(list.id)" (click)="add(list)">Add</button>
      </div>

      <div class="empty-state" *ngIf="!loading && lists.length === 0">
        <p>You don't have any reading lists yet.</p>
      </div>

      <button mat-button class="new-list-btn" (click)="createNewList()">
        <mat-icon>add</mat-icon> New Reading List
      </button>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Done</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .list-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid var(--color-border);
    }
    .list-info { display: flex; flex-direction: column; min-width: 0; }
    .list-name { font-weight: var(--font-weight-bold); color: var(--color-text-primary); }
    .list-meta { font-size: var(--font-size-xs); color: var(--color-text-secondary); }
    .added-label {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-success);
    }
    .added-label mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .empty-state { padding: 24px 0; text-align: center; color: var(--color-text-secondary); }
    .new-list-btn { width: 100%; margin-top: 12px; }
  `]
})
export class AddToReadingListDialogComponent implements OnInit {
  lists: ReadingList[] = [];
  loading = false;
  addedIds = new Set<string>();

  constructor(
    public dialogRef: MatDialogRef<AddToReadingListDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddToReadingListDialogData,
    private readingListService: ReadingListService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadLists();
  }

  loadLists(): void {
    const userId = this.authService.currentUser?.id;
    if (!userId) return;
    this.loading = true;
    this.readingListService.getByUser(userId, { page: 1, pageSize: 50 }).subscribe({
      next: (result) => { this.lists = result.items; this.loading = false; },
      error: () => this.loading = false
    });
  }

  add(list: ReadingList): void {
    this.readingListService.addPost(list.id, this.data.postId).subscribe({
      next: () => this.addedIds.add(list.id)
    });
  }

  createNewList(): void {
    const ref = this.dialog.open(ReadingListFormDialogComponent, { data: {}, width: '480px' });
    ref.afterClosed().subscribe((result: ReadingListFormResult | undefined) => {
      if (!result) return;
      this.readingListService.create(result).subscribe(list => {
        this.lists = [list, ...this.lists];
        this.add(list);
      });
    });
  }
}
