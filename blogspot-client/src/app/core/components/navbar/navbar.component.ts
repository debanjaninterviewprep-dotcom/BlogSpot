import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { ThemeService } from '../../services/theme.service';
import { SignalRService } from '../../services/signalr.service';
import { User } from '../../models/auth.model';

@Component({
  selector: 'app-navbar',
  template: `
    <mat-toolbar color="primary" class="navbar">
      <div class="navbar-content container">
        <a routerLink="/feed" class="logo">
          <mat-icon>rss_feed</mat-icon>
          <span>BlogSpot</span>
        </a>

        <div class="spacer"></div>

        <div class="search-box" *ngIf="authService.isLoggedIn">
          <mat-form-field appearance="outline" class="search-field">
            <mat-icon matPrefix>search</mat-icon>
            <input matInput placeholder="Search posts..." 
                   (keyup.enter)="onSearch($event)">
          </mat-form-field>
        </div>

        <div class="spacer"></div>

        <div class="nav-actions" *ngIf="authService.isLoggedIn; else loginButtons">
          <button mat-icon-button routerLink="/feed" matTooltip="Home">
            <mat-icon>home</mat-icon>
          </button>
          <button mat-icon-button routerLink="/blog/create" matTooltip="New Post">
            <mat-icon>add_circle</mat-icon>
          </button>

          <!-- Bookmarks -->
          <button mat-icon-button routerLink="/blog/bookmarks" matTooltip="Saved Posts">
            <mat-icon>bookmarks</mat-icon>
          </button>

          <!-- Notifications -->
          <button mat-icon-button [matMenuTriggerFor]="notifMenu" matTooltip="Notifications">
            <mat-icon [matBadge]="unreadCount > 0 ? unreadCount : null" 
                      matBadgeColor="warn" matBadgeSize="small">
              notifications
            </mat-icon>
          </button>
          <mat-menu #notifMenu="matMenu" class="notification-menu">
            <div class="notif-header" (click)="$event.stopPropagation()">
              <span>Notifications</span>
              <button mat-button color="primary" *ngIf="unreadCount > 0"
                      (click)="markAllRead()">Mark all read</button>
            </div>
            <div *ngIf="notifications.length === 0" class="notif-empty" (click)="$event.stopPropagation()">
              No notifications yet
            </div>
            <button mat-menu-item *ngFor="let n of notifications" 
                    [class.unread]="!n.isRead" (click)="onNotifClick(n)">
              <mat-icon>{{ getNotifIcon(n.type) }}</mat-icon>
              <span>{{ n.message }}</span>
            </button>
            <button mat-menu-item routerLink="/notifications" *ngIf="notifications.length > 0">
              <span class="view-all">View all notifications</span>
            </button>
          </mat-menu>

          <!-- Dark Mode -->
          <button mat-icon-button (click)="toggleTheme()" 
                  [matTooltip]="themeService.isDark ? 'Light mode' : 'Dark mode'">
            <mat-icon>{{ themeService.isDark ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>

          <button mat-icon-button *ngIf="authService.isAdmin" routerLink="/admin" matTooltip="Admin">
            <mat-icon>admin_panel_settings</mat-icon>
          </button>
          <button mat-icon-button [matMenuTriggerFor]="userMenu">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #userMenu="matMenu">
            <button mat-menu-item routerLink="/profile/me">
              <mat-icon>person</mat-icon>
              <span>My Profile</span>
            </button>
            <button mat-menu-item routerLink="/blog/drafts">
              <mat-icon>drafts</mat-icon>
              <span>My Drafts</span>
            </button>
            <button mat-menu-item routerLink="/profile/analytics">
              <mat-icon>analytics</mat-icon>
              <span>Analytics</span>
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Logout</span>
            </button>
          </mat-menu>
        </div>

        <ng-template #loginButtons>
          <button mat-icon-button (click)="toggleTheme()" 
                  [matTooltip]="themeService.isDark ? 'Light mode' : 'Dark mode'">
            <mat-icon>{{ themeService.isDark ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>
          <button mat-button routerLink="/auth/login">Login</button>
          <button mat-raised-button color="accent" routerLink="/auth/register">Register</button>
        </ng-template>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .navbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
    }
    .navbar-content {
      display: flex;
      align-items: center;
      width: 100%;
      gap: 16px;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      color: white;
      text-decoration: none;
      font-size: 20px;
      font-weight: 500;
    }
    .search-box {
      flex: 0 1 400px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .search-field {
      width: 100%;
      margin: 0;
    }
    .search-field ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }
    .search-field ::ng-deep .mat-mdc-text-field-wrapper {
      background-color: rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      padding: 0 12px !important;
      height: 36px;
      margin: 0;
    }
    .search-field ::ng-deep .mat-mdc-form-field-flex {
      height: 36px;
      align-items: center;
    }
    .search-field ::ng-deep .mdc-notched-outline__leading,
    .search-field ::ng-deep .mdc-notched-outline__notch,
    .search-field ::ng-deep .mdc-notched-outline__trailing {
      border-color: rgba(255, 255, 255, 0.3) !important;
    }
    .search-field ::ng-deep .mat-mdc-form-field-infix {
      padding: 0 !important;
      min-height: unset;
      border-top: 0;
    }
    .search-field ::ng-deep input.mat-mdc-input-element {
      color: white;
    }
    .search-field ::ng-deep input::placeholder {
      color: rgba(255, 255, 255, 0.7);
    }
    .search-field ::ng-deep .mat-icon {
      color: rgba(255, 255, 255, 0.7);
    }
    .spacer { flex: 1; }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .notif-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      font-weight: 500;
      border-bottom: 1px solid #eee;
    }
    .notif-empty {
      padding: 24px 16px;
      text-align: center;
      color: #888;
    }
    .unread {
      background-color: rgba(63, 81, 181, 0.06);
    }
    .view-all {
      text-align: center;
      width: 100%;
      color: #3f51b5;
      font-weight: 500;
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  notifications: any[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    public authService: AuthService,
    public themeService: ThemeService,
    private notificationService: NotificationService,
    private signalRService: SignalRService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.themeService.init();

    if (this.authService.isLoggedIn) {
      this.loadNotifications();
      this.signalRService.startConnection();

      this.signalRService.notification$
        .pipe(takeUntil(this.destroy$))
        .subscribe(notif => {
          if (notif) {
            this.notifications.unshift(notif);
            if (this.notifications.length > 10) this.notifications.pop();
          }
        });
    }

    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => this.unreadCount = count);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotifications(): void {
    this.notificationService.getNotifications({ page: 1, pageSize: 10 }).subscribe({
      next: result => this.notifications = result.items
    });
    this.notificationService.getUnreadCount().subscribe();
  }

  onSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    if (query.trim()) {
      this.router.navigate(['/blog/search'], { queryParams: { q: query } });
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  markAllRead(): void {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications.forEach(n => n.isRead = true);
    });
  }

  onNotifClick(notif: any): void {
    if (!notif.isRead) {
      this.notificationService.markAsRead(notif.id).subscribe();
      notif.isRead = true;
    }
    if (notif.referenceId) {
      this.router.navigate(['/blog', notif.referenceId]);
    }
  }

  getNotifIcon(type: string): string {
    switch (type) {
      case 'Follow': return 'person_add';
      case 'Reaction': return 'favorite';
      case 'Comment': return 'comment';
      case 'PostPublished': return 'article';
      default: return 'notifications';
    }
  }

  logout(): void {
    this.signalRService.stopConnection();
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
