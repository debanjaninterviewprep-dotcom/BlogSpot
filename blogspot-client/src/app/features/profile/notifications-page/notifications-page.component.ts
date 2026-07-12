import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationService } from '@core/services/notification.service';
import { Notification } from '@core/models/notification.model';

@Component({
  selector: 'app-notifications-page',
  template: `
    <div class="notifications-container">
      <div class="notifications-header">
        <h2>Notifications</h2>
        <button mat-button color="primary" *ngIf="hasUnread" (click)="markAllRead()">
          <mat-icon>done_all</mat-icon> Mark all as read
        </button>
      </div>

      <app-loading-spinner *ngIf="loading && notifications.length === 0"></app-loading-spinner>

      <div *ngIf="!loading && notifications.length === 0" class="empty-state">
        <mat-icon>notifications_none</mat-icon>
        <p>No notifications yet</p>
      </div>

      <mat-card *ngFor="let n of notifications"
                class="notif-card" [class.unread]="!n.isRead"
                (click)="onNotifClick(n)">
        <div class="notif-row">
          <div class="notif-icon" [ngClass]="'type-' + n.type.toLowerCase()">
            <mat-icon>{{ getIcon(n.type) }}</mat-icon>
          </div>
          <div class="notif-body">
            <p class="notif-message">{{ n.message }}</p>
            <span class="notif-time">{{ n.createdAt | date:'medium' }}</span>
          </div>
          <div class="unread-dot" *ngIf="!n.isRead"></div>
        </div>
      </mat-card>

      <div class="load-more" *ngIf="hasMore && !loading">
        <button mat-stroked-button (click)="loadMore()">Load more</button>
      </div>
      <app-loading-spinner *ngIf="loading && notifications.length > 0" [inline]="true"></app-loading-spinner>
    </div>
  `,
  styles: [`
    .notifications-container {
      max-width: 640px;
      margin: 0 auto;
      padding: 16px;
    }
    .notifications-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .notifications-header h2 { margin: 0; }
    .notif-card {
      margin-bottom: 8px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .notif-card:hover { background: rgba(63,81,181,0.05); }
    .notif-card.unread { border-left: 3px solid #3f51b5; }
    .notif-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 16px;
    }
    .notif-icon {
      width: 40px; height: 40px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: rgba(63,81,181,0.12);
      flex-shrink: 0;
    }
    .notif-icon.type-follow { background: rgba(76,175,80,0.15); color: #4caf50; }
    .notif-icon.type-reaction { background: rgba(244,67,54,0.12); color: #f44336; }
    .notif-icon.type-comment { background: rgba(33,150,243,0.12); color: #2196f3; }
    .notif-icon mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .notif-body { flex: 1; }
    .notif-message { margin: 0 0 4px; font-size: 14px; line-height: 1.4; }
    .notif-time { font-size: 12px; color: #888; }
    .unread-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #3f51b5; flex-shrink: 0;
    }
    .empty-state {
      text-align: center; padding: 64px 16px; color: #888;
    }
    .empty-state mat-icon {
      font-size: 72px; width: 72px; height: 72px;
      display: block; margin: 0 auto 16px; opacity: 0.4;
    }
    .load-more { text-align: center; margin-top: 16px; }
  `]
})
export class NotificationsPageComponent implements OnInit {
  notifications: Notification[] = [];
  loading = true;
  page = 1;
  hasMore = false;

  get hasUnread(): boolean {
    return this.notifications.some(n => !n.isRead);
  }

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.notificationService.getNotifications({ page: this.page, pageSize: 20 }).subscribe({
      next: result => {
        this.notifications = [...this.notifications, ...result.items];
        this.hasMore = result.hasNextPage;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load notifications', 'Close', { duration: 3000 });
      }
    });
  }

  loadMore(): void {
    this.page++;
    this.load();
  }

  markAllRead(): void {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications.forEach(n => n.isRead = true);
    });
  }

  onNotifClick(notif: Notification): void {
    if (!notif.isRead) {
      this.notificationService.markAsRead(notif.id).subscribe();
      notif.isRead = true;
    }
    if (notif.type === 'Follow' && notif.actorUserName) {
      this.router.navigate(['/profile', notif.actorUserName]);
    } else if (notif.referenceId) {
      this.router.navigate(['/blog', notif.referenceId]);
    }
  }

  getIcon(type: string): string {
    switch (type) {
      case 'Follow': return 'person_add';
      case 'Reaction': return 'favorite';
      case 'Comment': return 'comment';
      case 'PostPublished': return 'article';
      default: return 'notifications';
    }
  }
}
