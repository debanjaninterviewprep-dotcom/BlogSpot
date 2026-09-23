import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '@core/services/auth.service';
import { ReadingListService } from '@core/services/reading-list.service';
import { ReadingList } from '@core/models/reading-list.model';
import { ReadingListFormDialogComponent, ReadingListFormResult } from '@shared/components/reading-list-form-dialog/reading-list-form-dialog.component';
import { ReadingListFollowersDialogComponent } from '@shared/components/reading-list-followers-dialog/reading-list-followers-dialog.component';

@Component({
  selector: 'app-reading-lists',
  template: `
    <div class="reading-lists-container">
      <div class="header-row">
        <h2>My Reading Lists</h2>
        <button mat-raised-button color="primary" (click)="createList()">
          <mat-icon>add</mat-icon> New List
        </button>
      </div>

      <app-loading-spinner *ngIf="loading"></app-loading-spinner>

      <app-error-state *ngIf="loadError && lists.length === 0"
                       message="Failed to load reading lists. Please try again."
                       (onRetry)="loadLists()">
      </app-error-state>

      <div *ngIf="!loading && !loadError && lists.length === 0" class="empty-state">
        <mat-icon>collections_bookmark</mat-icon>
        <h3>No reading lists yet</h3>
        <p>Create a named collection of posts to organize and share your favorite reads.</p>
      </div>

      <mat-card *ngFor="let list of lists" class="list-card">
        <div class="list-main" [routerLink]="['/blog/reading-lists', list.id]">
          <div class="list-title-row">
            <h3>{{ list.name }}</h3>
            <mat-icon class="visibility-icon" [matTooltip]="list.isPublic ? 'Public' : 'Private'">
              {{ list.isPublic ? 'public' : 'lock' }}
            </mat-icon>
          </div>
          <p class="list-description" *ngIf="list.description">{{ list.description }}</p>
          <div class="list-stats">
            <span>{{ list.itemCount }} {{ list.itemCount === 1 ? 'post' : 'posts' }}</span>
            <ng-container *ngIf="list.isPublic">
              <span class="stat-dot">&middot;</span>
              <button type="button" class="followers-link" [disabled]="list.followerCount === 0"
                      (click)="showFollowers(list, $event)">
                {{ list.followerCount }} {{ list.followerCount === 1 ? 'follower' : 'followers' }}
              </button>
            </ng-container>
          </div>
        </div>
        <div class="list-actions">
          <button mat-icon-button (click)="editList(list)" matTooltip="Edit" aria-label="Edit reading list">
            <mat-icon>edit</mat-icon>
          </button>
          <button mat-icon-button color="warn" (click)="deleteList(list)" matTooltip="Delete" aria-label="Delete reading list">
            <mat-icon>delete</mat-icon>
          </button>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .reading-lists-container { width: 100%; max-width: 900px; margin: 0 auto; padding: 16px 24px; box-sizing: border-box; min-height: calc(100vh - 56px); }
    .header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .header-row h2 { margin: 0; font-size: var(--font-size-2xl); font-weight: var(--font-weight-extrabold); color: var(--color-text-primary); }
    .list-card {
      display: flex !important;
      flex-direction: row !important;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
      border-radius: 16px !important;
      border: 1px solid var(--color-border) !important;
      background: var(--card-bg) !important;
      padding: 16px 20px !important;
      transition: border-color 0.2s ease;
    }
    .list-card:hover { border-color: var(--color-primary) !important; }
    .list-main { flex: 1; min-width: 0; cursor: pointer; }
    .list-title-row { display: flex; align-items: center; gap: 8px; }
    .list-title-row h3 { margin: 0; font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--color-text-primary); }
    .visibility-icon { font-size: 16px; width: 16px; height: 16px; color: var(--color-text-secondary); }
    .list-description { margin: 4px 0; color: var(--color-text-secondary); font-size: var(--font-size-base); }
    .list-stats { display: flex; align-items: center; gap: 6px; font-size: var(--font-size-sm); color: var(--color-text-secondary); }
    .followers-link {
      background: none; border: none; padding: 0;
      font: inherit; color: var(--color-text-secondary); cursor: pointer;
    }
    .followers-link:not(:disabled):hover { color: var(--color-primary); text-decoration: underline; }
    .followers-link:disabled { cursor: default; }
    .list-actions { display: flex; gap: 4px; flex-shrink: 0; }
    .empty-state { text-align: center; padding: 64px 24px; color: var(--color-text-secondary); }
    .empty-state mat-icon { font-size: 56px; width: 56px; height: 56px; color: var(--color-border); margin-bottom: 12px; }
    .empty-state h3 { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0 0 8px; }
    .empty-state p { margin: 0; font-size: var(--font-size-base); }
  `]
})
export class ReadingListsComponent implements OnInit {
  lists: ReadingList[] = [];
  loading = false;
  loadError = false;

  constructor(
    private readingListService: ReadingListService,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadLists();
  }

  loadLists(): void {
    const userId = this.authService.currentUser?.id;
    if (!userId) return;
    this.loading = true;
    this.loadError = false;
    this.readingListService.getByUser(userId, { page: 1, pageSize: 50 }).subscribe({
      next: (result) => { this.lists = result.items; this.loading = false; },
      error: () => { this.loading = false; this.loadError = true; }
    });
  }

  createList(): void {
    const ref = this.dialog.open(ReadingListFormDialogComponent, { data: {}, width: '480px' });
    ref.afterClosed().subscribe((result: ReadingListFormResult | undefined) => {
      if (!result) return;
      this.readingListService.create(result).subscribe(list => {
        this.lists = [list, ...this.lists];
      });
    });
  }

  editList(list: ReadingList): void {
    const ref = this.dialog.open(ReadingListFormDialogComponent, { data: { list }, width: '480px' });
    ref.afterClosed().subscribe((result: ReadingListFormResult | undefined) => {
      if (!result) return;
      this.readingListService.update(list.id, result).subscribe(updated => {
        const index = this.lists.findIndex(l => l.id === list.id);
        if (index > -1) this.lists[index] = { ...this.lists[index], ...updated };
      });
    });
  }

  deleteList(list: ReadingList): void {
    if (!confirm(`Delete "${list.name}"? This cannot be undone.`)) return;
    this.readingListService.delete(list.id).subscribe({
      next: () => {
        this.lists = this.lists.filter(l => l.id !== list.id);
        this.snackBar.open('Reading list deleted', 'Close', { duration: 2000 });
      }
    });
  }

  showFollowers(list: ReadingList, event: Event): void {
    event.stopPropagation();
    if (list.followerCount === 0) return;
    this.dialog.open(ReadingListFollowersDialogComponent, {
      data: { listId: list.id, listName: list.name },
      width: '420px'
    });
  }
}
