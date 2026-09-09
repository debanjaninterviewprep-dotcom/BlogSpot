import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NavigationStart, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { BlogService } from '@core/services/blog.service';
import { UserService } from '@core/services/user.service';
import { UserProfile } from '@core/models/user.model';

export interface PostLikersDialogData {
  postId: string;
}

@Component({
  selector: 'app-post-likers-dialog',
  template: `
    <h2 mat-dialog-title>Likes</h2>
    <mat-dialog-content class="likers-content">
      <app-loading-spinner [inline]="true" *ngIf="loading && users.length === 0"></app-loading-spinner>

      <app-user-card *ngFor="let user of users" [user]="user" (onFollow)="toggleFollow($event)"></app-user-card>

      <div class="empty-state" *ngIf="!loading && users.length === 0">
        <p>No likes yet</p>
      </div>

      <button mat-button class="load-more-btn" *ngIf="hasMore" (click)="loadMore()" [disabled]="loading">
        {{ loading ? 'Loading...' : 'Load more' }}
      </button>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .likers-content {
      min-width: 320px;
      max-width: 420px;
      max-height: 60vh;
      padding: 0 !important;
    }
    .empty-state {
      padding: 32px 16px;
      text-align: center;
      color: var(--color-text-secondary);
    }
    .load-more-btn { width: 100%; }
  `]
})
export class PostLikersDialogComponent implements OnInit, OnDestroy {
  users: UserProfile[] = [];
  loading = false;
  page = 1;
  pageSize = 20;
  hasMore = false;

  private navSub: Subscription;

  constructor(
    public dialogRef: MatDialogRef<PostLikersDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PostLikersDialogData,
    private blogService: BlogService,
    private userService: UserService,
    router: Router
  ) {
    // Close the dialog when the user navigates away, e.g. after tapping a liker's profile link.
    this.navSub = router.events.subscribe(event => {
      if (event instanceof NavigationStart) this.dialogRef.close();
    });
  }

  ngOnInit(): void {
    this.loadLikers();
  }

  ngOnDestroy(): void {
    this.navSub.unsubscribe();
  }

  loadLikers(): void {
    this.loading = true;
    this.blogService.getPostLikers(this.data.postId, { page: this.page, pageSize: this.pageSize }).subscribe({
      next: (result) => {
        this.users = [...this.users, ...result.items];
        this.hasMore = result.hasNextPage;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadMore(): void {
    this.page++;
    this.loadLikers();
  }

  toggleFollow(userId: string): void {
    this.userService.toggleFollow(userId).subscribe(result => {
      const user = this.users.find(u => u.id === userId);
      if (user) user.isFollowedByCurrentUser = result.isFollowing;
    });
  }
}
