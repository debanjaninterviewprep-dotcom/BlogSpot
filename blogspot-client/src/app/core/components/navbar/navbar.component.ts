import { Component, OnInit, OnDestroy, ElementRef, ViewChild, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { ThemeService } from '../../services/theme.service';
import { SignalRService } from '../../services/signalr.service';
import { BlogService } from '../../services/blog.service';
import { UserService } from '../../services/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { User } from '../../models/auth.model';

@Component({
  selector: 'app-navbar',
  template: `
    <nav class="navbar">
      <div class="navbar-content container">
        <a routerLink="/feed" class="logo">
          <img src="favicon.svg" class="logo-img" alt="BlogSpot">
          <span class="logo-text">BlogSpot</span>
        </a>

        <div class="search-box" *ngIf="authService.isLoggedIn" #searchContainer>
          <div class="search-wrapper" [class.focused]="searchActive">
            <mat-icon class="search-icon">search</mat-icon>
            <input type="text" placeholder="Search users & posts..." class="search-input"
                   [(ngModel)]="searchQuery"
                   (input)="onSearchInput($event)"
                   (focus)="searchActive = true"
                   (blur)="onSearchBlur()"
                   (keyup.enter)="onSearch($event)">
            <button *ngIf="searchQuery" class="search-clear" (mousedown)="$event.preventDefault()" (click)="clearSearch()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <!-- Autocomplete dropdown -->
          <div class="search-dropdown" *ngIf="searchActive && searchQuery.length >= 1">
            <!-- Loading -->
            <div class="search-loading" *ngIf="searchLoading">
              <mat-icon>autorenew</mat-icon> Searching...
            </div>
            <!-- No results -->
            <div class="search-empty" *ngIf="!searchLoading && searchQuery.length >= 2 && searchedUsers.length === 0 && searchedPosts.length === 0">
              No results for "{{ searchQuery }}"
            </div>
            <!-- Users -->
            <div class="search-section" *ngIf="searchedUsers.length > 0">
              <div class="search-section-header">People</div>
              <a *ngFor="let user of searchedUsers" class="search-item user-item"
                 [routerLink]="['/profile', user.userName]"
                 (mousedown)="$event.preventDefault()"
                 (click)="clearSearch()">
                <img [src]="user.profilePictureUrl || 'assets/default-avatar.svg'" class="search-avatar">
                <div class="search-item-info">
                  <span class="search-item-name">{{ user.displayName || user.userName }}</span>
                  <span class="search-item-sub">{{'@'}}{{ user.userName }}</span>
                </div>
              </a>
            </div>
            <!-- Posts -->
            <div class="search-section" *ngIf="searchedPosts.length > 0">
              <div class="search-section-header">Posts</div>
              <a *ngFor="let post of searchedPosts" class="search-item post-item"
                 [routerLink]="['/blog', post.slug]"
                 (mousedown)="$event.preventDefault()"
                 (click)="clearSearch()">
                <mat-icon class="search-post-icon">article</mat-icon>
                <div class="search-item-info">
                  <span class="search-item-name">{{ post.title }}</span>
                  <span class="search-item-sub">by {{ post.authorDisplayName || post.authorUserName }}</span>
                </div>
              </a>
            </div>
            <!-- View all -->
            <a class="search-view-all" *ngIf="searchQuery.length >= 2 && (searchedUsers.length > 0 || searchedPosts.length > 0)"
               [routerLink]="['/blog/search']" [queryParams]="{q: searchQuery}" (click)="clearSearch()">
              See all results for "{{ searchQuery }}"
            </a>
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
          <a routerLink="/blog/bookmarks" class="nav-btn" matTooltip="Saved Posts" routerLinkActive="active">
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
    .logo-img { width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; }
    .search-box {
      flex: 0 1 400px;
      margin: 0 16px;
      position: relative;
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
    .search-wrapper.focused {
      background: #fff;
      border-color: #1d9bf0;
    }
    .search-wrapper.focused .search-icon { color: #1d9bf0; }
    .search-clear {
      background: none; border: none; cursor: pointer; padding: 0;
      display: flex; align-items: center;
    }
    .search-clear mat-icon { font-size: 18px; width: 18px; height: 18px; color: #536471; }
    .search-dropdown {
      position: absolute;
      top: 48px;
      left: 0; right: 0;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
      border: 1px solid #eff3f4;
      max-height: 420px;
      overflow-y: auto;
      z-index: 1001;
      animation: dropdownSlide 0.18s ease-out;
      transform-origin: top center;
    }
    @keyframes dropdownSlide {
      from { opacity: 0; transform: translateY(-8px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .search-dropdown::-webkit-scrollbar { width: 4px; }
    .search-dropdown::-webkit-scrollbar-thumb { background: #cfd9de; border-radius: 2px; }
    .search-loading {
      display: flex; align-items: center; justify-content: center;
      padding: 24px; color: #536471; font-size: 13px; gap: 8px;
    }
    .search-loading mat-icon { animation: spin 1s linear infinite; font-size: 16px; width: 16px; height: 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .search-empty {
      padding: 24px; text-align: center; color: #536471; font-size: 14px;
    }
    .search-section-header {
      font-size: 11px;
      font-weight: 700;
      color: #536471;
      padding: 12px 16px 6px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .search-section + .search-section {
      border-top: 1px solid #eff3f4;
    }
    .search-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      text-decoration: none;
      color: inherit;
      transition: background 0.1s;
      cursor: pointer;
    }
    .search-item:hover { background: #f7f9f9; }
    .search-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
    .search-post-icon { color: #536471; font-size: 24px; width: 24px; height: 24px; flex-shrink: 0; margin: 0 6px; }
    .search-item-info { display: flex; flex-direction: column; min-width: 0; }
    .search-item-name { font-size: 14px; font-weight: 600; color: #0f1419; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .search-item-sub { font-size: 12px; color: #536471; }
    .search-view-all {
      display: block;
      text-align: center;
      padding: 12px;
      font-size: 14px;
      font-weight: 600;
      color: #1d9bf0;
      text-decoration: none;
      border-top: 1px solid #eff3f4;
    }
    .search-view-all:hover { background: rgba(29,155,240,0.04); }
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
      .nav-btn { width: 36px; height: 36px; }
      .nav-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
      .logo-text { font-size: 17px; }
      .login-link { font-size: 13px; padding: 6px 12px; white-space: nowrap; }
      .register-btn { font-size: 13px; padding: 6px 12px; white-space: nowrap; }
    }
    @media (max-width: 400px) {
      .nav-actions { gap: 0; }
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  notifications: any[] = [];
  searchQuery = '';
  searchActive = false;
  searchLoading = false;
  searchedUsers: any[] = [];
  searchedPosts: any[] = [];
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();
  @ViewChild('searchContainer') searchContainer!: ElementRef;

  constructor(
    public authService: AuthService,
    public themeService: ThemeService,
    private notificationService: NotificationService,
    private signalRService: SignalRService,
    private blogService: BlogService,
    private userService: UserService,
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

    // Search autocomplete
    this.searchSubject$.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
      switchMap((query: string) => {
        if (!query || query.length < 1) {
          this.searchedUsers = [];
          this.searchedPosts = [];
          this.searchLoading = false;
          return of(null);
        }
        this.searchLoading = true;
        this.userService.searchUsers(query, { page: 1, pageSize: 5 }).subscribe({
          next: (res: any) => this.searchedUsers = res.items || [],
          error: () => this.searchedUsers = []
        });
        this.blogService.searchPosts(query, { page: 1, pageSize: 5 }).subscribe({
          next: (res: any) => { this.searchedPosts = res.items || []; this.searchLoading = false; },
          error: () => { this.searchedPosts = []; this.searchLoading = false; }
        });
        return of(null);
      })
    ).subscribe();
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
      this.clearSearch();
      this.router.navigate(['/blog/search'], { queryParams: { q: query } });
    }
  }

  onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchSubject$.next(val);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchActive = false;
    this.searchedUsers = [];
    this.searchedPosts = [];
  }

  onSearchBlur(): void {
    // Small delay so clicks on dropdown items register before blur closes it
    setTimeout(() => { this.searchActive = false; }, 200);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.searchContainer && !this.searchContainer.nativeElement.contains(event.target)) {
      this.searchActive = false;
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
