import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '@core/services/auth.service';
import { BlogService } from '@core/services/blog.service';
import { ReadingListService } from '@core/services/reading-list.service';
import { ReadingListDetail } from '@core/models/reading-list.model';
import { ReactionType } from '@core/models/blog.model';
import { ReadingListFormDialogComponent, ReadingListFormResult } from '@shared/components/reading-list-form-dialog/reading-list-form-dialog.component';
import { ReadingListFollowersDialogComponent } from '@shared/components/reading-list-followers-dialog/reading-list-followers-dialog.component';

@Component({
  selector: 'app-reading-list-detail',
  template: `
    <div class="detail-container" *ngIf="list">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a routerLink="/feed">Feed</a>
        <mat-icon>chevron_right</mat-icon>
        <span class="breadcrumb-current">{{ list.name }}</span>
      </nav>

      <div class="list-header">
        <div class="list-title-row">
          <h1>{{ list.name }}</h1>
          <mat-icon class="visibility-icon" [matTooltip]="list.isPublic ? 'Public' : 'Private'">
            {{ list.isPublic ? 'public' : 'lock' }}
          </mat-icon>
          <button mat-icon-button *ngIf="isOwnList" (click)="editList()" matTooltip="Edit" aria-label="Edit reading list">
            <mat-icon>edit</mat-icon>
          </button>
        </div>
        <p class="list-description" *ngIf="list.description">{{ list.description }}</p>
        <div class="owner-row">
          <a [routerLink]="['/profile', list.userName]" class="owner-link">
            <img [src]="(list.userProfilePictureUrl | imageUrl) || 'assets/default-avatar.svg'" [alt]="list.userName" class="owner-avatar">
            <span>{{ list.userDisplayName || list.userName }}</span>
          </a>
          <span class="stats">
            {{ list.itemCount }} {{ list.itemCount === 1 ? 'post' : 'posts' }}
            <ng-container *ngIf="list.isPublic">
              &middot;
              <button type="button" class="followers-link" [disabled]="list.followerCount === 0" (click)="showFollowers()">
                {{ list.followerCount }} {{ list.followerCount === 1 ? 'follower' : 'followers' }}
              </button>
            </ng-container>
          </span>
        </div>
        <button mat-raised-button *ngIf="!isOwnList && authService.isLoggedIn"
                [color]="list.isFollowedByCurrentUser ? '' : 'primary'"
                (click)="toggleFollow()">
          {{ list.isFollowedByCurrentUser ? 'Following' : 'Follow' }}
        </button>
      </div>

      <mat-divider></mat-divider>

      <div class="posts-section">
        <div class="post-item" *ngFor="let post of list.posts">
          <app-post-card [post]="post"
                         (onLike)="toggleLike($event)"
                         (onBookmark)="toggleBookmark($event)"
                         (onReaction)="toggleReaction($event)"
                         (onRepost)="toggleRepost($event)">
          </app-post-card>
          <button mat-button class="remove-btn" *ngIf="isOwnList" (click)="removePost(post.id)">
            <mat-icon>remove_circle_outline</mat-icon> Remove from list
          </button>
        </div>
        <div class="empty-state" *ngIf="list.posts.length === 0">
          <p>No posts in this list yet.</p>
        </div>
      </div>
    </div>

    <app-loading-spinner *ngIf="loading"></app-loading-spinner>
    <app-error-state *ngIf="loadError"
                     message="Failed to load this reading list. Please try again."
                     (onRetry)="load()">
    </app-error-state>
  `,
  styles: [`
    .detail-container { width: 100%; padding: 0 24px; box-sizing: border-box; min-height: calc(100vh - 56px); }
    .breadcrumb { display: flex; align-items: center; gap: 4px; padding: 12px 4px; font-size: var(--font-size-sm); color: var(--color-text-secondary); }
    .breadcrumb a { color: var(--color-text-secondary); text-decoration: none; }
    .breadcrumb a:hover { color: var(--color-primary); text-decoration: underline; }
    .breadcrumb mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .list-header { padding: 16px 4px 24px; }
    .list-title-row { display: flex; align-items: center; gap: 8px; }
    .list-title-row h1 { margin: 0; font-size: 32px; font-weight: var(--font-weight-bold); color: var(--color-text-primary); }
    .visibility-icon { color: var(--color-text-secondary); }
    .list-description { color: var(--color-text-secondary); font-size: var(--font-size-base); margin: 8px 0; }
    .owner-row { display: flex; align-items: center; gap: 16px; margin: 12px 0; }
    .owner-link { display: flex; align-items: center; gap: 8px; text-decoration: none; color: var(--color-text-primary); font-weight: var(--font-weight-medium); }
    .owner-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
    .stats { display: flex; align-items: center; gap: 4px; font-size: var(--font-size-sm); color: var(--color-text-secondary); }
    .followers-link {
      background: none; border: none; padding: 0;
      font: inherit; color: var(--color-text-secondary); cursor: pointer;
    }
    .followers-link:not(:disabled):hover { color: var(--color-primary); text-decoration: underline; }
    .followers-link:disabled { cursor: default; }
    .posts-section { padding: 8px 0; }
    .post-item { border-bottom: 1px solid var(--color-border); }
    .remove-btn { margin: 0 0 12px 20px; color: var(--color-text-secondary); }
    .empty-state { text-align: center; padding: 48px 24px; color: var(--color-text-secondary); }
  `]
})
export class ReadingListDetailComponent implements OnInit {
  list: ReadingListDetail | null = null;
  loading = true;
  loadError = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private readingListService: ReadingListService,
    private blogService: BlogService,
    public authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  get isOwnList(): boolean {
    return this.list?.userId === this.authService.currentUser?.id;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading = true;
    this.loadError = false;
    this.readingListService.getById(id).subscribe({
      next: (list) => { this.list = list; this.loading = false; },
      error: () => {
        this.loading = false;
        this.loadError = true;
      }
    });
  }

  toggleFollow(): void {
    if (!this.list) return;
    this.readingListService.toggleFollow(this.list.id).subscribe({
      next: (result) => {
        if (this.list) {
          this.list.isFollowedByCurrentUser = result.following;
          this.list.followerCount += result.following ? 1 : -1;
        }
      }
    });
  }

  editList(): void {
    if (!this.list) return;
    const ref = this.dialog.open(ReadingListFormDialogComponent, { data: { list: this.list }, width: '480px' });
    ref.afterClosed().subscribe((result: ReadingListFormResult | undefined) => {
      if (!result || !this.list) return;
      this.readingListService.update(this.list.id, result).subscribe(updated => {
        if (this.list) this.list = { ...this.list, ...updated };
        this.snackBar.open('Reading list updated', 'Close', { duration: 2000 });
      });
    });
  }

  showFollowers(): void {
    if (!this.list || this.list.followerCount === 0) return;
    this.dialog.open(ReadingListFollowersDialogComponent, {
      data: { listId: this.list.id, listName: this.list.name },
      width: '420px'
    });
  }

  removePost(postId: string): void {
    if (!this.list) return;
    this.readingListService.removePost(this.list.id, postId).subscribe({
      next: () => {
        if (this.list) {
          this.list.posts = this.list.posts.filter(p => p.id !== postId);
          this.list.itemCount--;
        }
        this.snackBar.open('Removed from list', 'Close', { duration: 2000 });
      }
    });
  }

  toggleLike(postId: string): void {
    this.blogService.toggleLike(postId).subscribe({
      next: result => {
        const post = this.list?.posts.find(p => p.id === postId);
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
        const post = this.list?.posts.find(p => p.id === postId);
        if (post) post.isBookmarkedByCurrentUser = result.bookmarked;
      }
    });
  }

  toggleReaction(event: { postId: string; type: ReactionType }): void {
    this.blogService.toggleReaction(event.postId, { type: event.type }).subscribe({
      next: (result) => {
        const post = this.list?.posts.find(p => p.id === event.postId);
        if (post) {
          post.reactionCounts = result.counts;
          post.currentUserReaction = result.currentUserReaction;
          post.currentUserReactionCount = result.currentUserReactionCount;
        }
      }
    });
  }

  toggleRepost(event: { postId: string; quote?: string }): void {
    this.blogService.toggleRepost(event.postId, event.quote).subscribe({
      next: (result) => {
        const post = this.list?.posts.find(p => p.id === event.postId);
        if (post) {
          post.repostCount = result.repostCount;
          post.isRepostedByCurrentUser = result.isRepostedByCurrentUser;
          post.currentUserRepostQuote = result.currentUserQuote;
        }
      }
    });
  }
}
