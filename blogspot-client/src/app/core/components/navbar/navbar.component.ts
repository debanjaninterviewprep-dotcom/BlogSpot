import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { ThemeService } from '../../services/theme.service';
import { SignalRService } from '../../services/signalr.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { User } from '../../models/auth.model';

@Component({
  selector: 'app-navbar',
  template: `
    <nav class="navbar">
      <div class="navbar-content container">
        <a routerLink="/feed" class="logo">
          <mat-icon class="logo-icon">rss_feed</mat-icon>
          <span class="logo-text">BlogSpot</span>
        </a>

        <div class="search-box" *ngIf="authService.isLoggedIn">
          <div class="search-wrapper">
            <mat-icon class="search-icon">search</mat-icon>
            <input type="text" placeholder="Search posts..." class="search-input"
                   (keyup.enter)="onSearch($event)">
          </div>
        </div>

        <div class="spacer"></div>

        <div class="nav-actions" *ngIf="authService.isLoggedIn; else loginButtons">
          <a routerLink="/feed" class="nav-btn" matTooltip="Home" routerLinkActive="active"
             [routerLinkActiveOptions]="{exact: true}">
            <mat-icon>home</mat-icon>
          </a>
          <a routerLink="/blog/create" class="nav-btn" matTooltip="New Post" routerLinkActive="active">
            <mat-icon>edit_square</mat-icon>
          </a>
          <a routerLink="/blog/bookmarks" class="nav-btn hide-sm" matTooltip="Saved Posts" routerLinkActive="active">
            <mat-icon>bookmark</mat-icon>
          </a>

          <!-- Notifications -->
          <button class="nav-btn" [matMenuTriggerFor]="notifMenu" matTooltip="Notifications">
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
          <button class="nav-btn" (click)="toggleTheme()"
                  [matTooltip]="themeService.isDark ? 'Light mode' : 'Dark mode'">
            <mat-icon>{{ themeService.isDark ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>

          <a class="nav-btn hide-sm" *ngIf="authService.isAdmin" routerLink="/admin" matTooltip="Admin" routerLinkActive="active">
            <mat-icon>admin_panel_settings</mat-icon>
          </a>

          <button class="avatar-btn" [matMenuTriggerFor]="userMenu">
            <mat-icon class="avatar-icon">account_circle</mat-icon>
          </button>
          <mat-menu #userMenu="matMenu">
            <button mat-menu-item routerLink="/profile/me">
              <mat-icon>person</mat-icon><span>My Profile</span>
            </button>
            <button mat-menu-item routerLink="/blog/drafts">
              <mat-icon>drafts</mat-icon><span>My Drafts</span>
            </button>
            <button mat-menu-item routerLink="/profile/analytics">
              <mat-icon>analytics</mat-icon><span>Analytics</span>
            </button>
            <button mat-menu-item *ngIf="authService.isAdmin" routerLink="/admin">
              <mat-icon>admin_panel_settings</mat-icon><span>Admin</span>
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon><span>Logout</span>
            </button>
          </mat-menu>
        </div>

        <ng-template #loginButtons>
          <button class="nav-btn" (click)="toggleTheme()"
                  [matTooltip]="themeService.isDark ? 'Light mode' : 'Dark mode'">
            <mat-icon>{{ themeService.isDark ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>
          <a routerLink="/auth/login" class="login-link">Sign in</a>
          <a routerLink="/auth/register" class="register-btn">Create account</a>
        </ng-template>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 1000;
      height: 56px;
      background: #fff;
      border-bottom: 1px solid #eff3f4;
      display: flex;
      align-items: center;
      transition: background 0.2s, border-color 0.2s;
    }
    .navbar-content {
      display: flex;
      align-items: center;
      width: 100%;
      gap: 8px;
      height: 100%;
      overflow: hidden;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: #0f1419;
      white-space: nowrap;
      transition: color 0.2s;
    }
    .logo-icon { color: #1d9bf0; font-size: 28px; width: 28px; height: 28px; }
    .search-box {
      flex: 0 1 400px;
      margin: 0 16px;
    }
    .search-wrapper {
      display: flex;
      align-items: center;
      background: #eff3f4;
      border-radius: 24px;
      padding: 0 16px;
      height: 40px;
      border: 2px solid transparent;
      transition: background 0.2s, border-color 0.2s;
    }
    .search-wrapper:focus-within {
      background: #fff;
      border-color: #1d9bf0;
    }
    .search-wrapper:focus-within .search-icon { color: #1d9bf0; }
    .search-icon { color: #536471; font-size: 20px; width: 20px; height: 20px; margin-right: 8px; }
    .search-input {
      border: none;
      outline: none;
      background: transparent;
      font-size: 14px;
      width: 100%;
      color: #0f1419;
      font-family: inherit;
    }
    .search-input::placeholder { color: #536471; }
    .spacer { flex: 1; }
    .nav-actions { display: flex; align-items: center; gap: 2px; }
    .nav-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px; height: 40px;
      border-radius: 50%;
      border: none;
      background: transparent;
      color: #536471;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      text-decoration: none;
    }
    .nav-btn:hover { background: rgba(29,155,240,0.1); color: #1d9bf0; }
    .nav-btn.active { color: #1d9bf0; }
    .nav-btn mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .avatar-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px; height: 36px;
      border-radius: 50%;
      border: none;
      background: transparent;
      cursor: pointer;
      margin-left: 4px;
      margin-right: 4px;
      transition: opacity 0.15s;
      overflow: hidden;
      flex-shrink: 0;
    }
    .avatar-btn:hover { opacity: 0.8; }
    .avatar-icon { font-size: 32px; width: 32px; height: 32px; color: #536471; }
    .login-link {
      font-size: 14px;
      font-weight: 600;
      color: #0f1419;
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 24px;
      border: 1px solid #cfd9de;
      transition: background 0.15s;
    }
    .login-link:hover { background: rgba(15,20,25,0.05); }
    .register-btn {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      text-decoration: none;
      padding: 8px 20px;
      border-radius: 24px;
      background: #0f1419;
      transition: opacity 0.15s;
    }
    .register-btn:hover { opacity: 0.85; }
    .notif-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 16px; font-weight: 600; border-bottom: 1px solid #eff3f4;
      font-size: 15px;
    }
    .notif-empty { padding: 32px 16px; text-align: center; color: #536471; font-size: 14px; }
    .unread { background-color: rgba(29,155,240,0.06); }
    .view-all { text-align: center; width: 100%; color: #1d9bf0; font-weight: 600; font-size: 14px; }
    @media (max-width: 768px) {
      .search-box { flex: 0 1 240px; margin: 0 8px; }
    }
    @media (max-width: 600px) {
      .navbar { height: 52px; }
      .search-box { display: none; }
      .hide-sm { display: none; }
      .nav-btn { width: 36px; height: 36px; }
      .nav-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
      .logo-text { font-size: 17px; }
    }
    @media (max-width: 400px) {
      .nav-actions { gap: 0; }
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
    private router: Router,
    private snackBar: MatSnackBar
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
            // Real-time toast
            const snackRef = this.snackBar.open(notif.message, 'View', {
              duration: 5000,
              horizontalPosition: 'right',
              verticalPosition: 'top'
            });
            snackRef.onAction().subscribe(() => this.onNotifClick(notif));
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

  toggleTheme(): void { this.themeService.toggleTheme(); }

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
    // Navigate based on notification type
    if (notif.type === 'Follow' && notif.actorUserName) {
      this.router.navigate(['/profile', notif.actorUserName]);
    } else if (notif.referenceId) {
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
