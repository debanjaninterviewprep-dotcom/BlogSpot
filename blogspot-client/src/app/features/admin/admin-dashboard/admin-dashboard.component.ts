import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService, AdminUser, AdminPost, AdminComment } from '@core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  template: `
    <div class="admin-container">
      <div class="admin-header">
        <h1><mat-icon>admin_panel_settings</mat-icon> Admin Dashboard</h1>
        <button mat-raised-button color="accent" (click)="seedData()" [disabled]="isSeeding">
          <mat-icon>{{ isSeeding ? 'hourglass_empty' : 'data_array' }}</mat-icon>
          {{ isSeeding ? 'Seeding...' : 'Seed Dummy Data' }}
        </button>
      </div>

      <mat-tab-group>
        <!-- Users Tab -->
        <mat-tab label="Users">
          <div class="tab-content">
            <div class="user-grid">
              <div class="user-card" *ngFor="let user of users"
                   [class.editing]="editingUserId === user.id">
                <!-- Card Header -->
                <div class="uc-header">
                  <div class="uc-avatar">{{ user.userName.charAt(0).toUpperCase() }}</div>
                  <div class="uc-identity">
                    <a [routerLink]="['/profile', user.userName]" class="uc-name">{{ user.userName }}</a>
                    <span class="uc-email">{{ user.email }}</span>
                  </div>
                  <span class="uc-status" [class.active]="user.isActive">
                    {{ user.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>

                <!-- Stats Row -->
                <div class="uc-stats">
                  <div class="uc-stat">
                    <span class="uc-stat-val">{{ user.postsCount }}</span>
                    <span class="uc-stat-label">Posts</span>
                  </div>
                  <div class="uc-stat">
                    <span class="uc-stat-val">{{ user.commentsCount }}</span>
                    <span class="uc-stat-label">Comments</span>
                  </div>
                  <div class="uc-stat">
                    <span class="uc-stat-val uc-role" [class.admin]="user.role === 'Admin'">{{ user.role }}</span>
                    <span class="uc-stat-label">Role</span>
                  </div>
                  <div class="uc-stat">
                    <span class="uc-stat-val">{{ user.createdAt | date:'MMM d, y' }}</span>
                    <span class="uc-stat-label">Joined</span>
                  </div>
                </div>

                <!-- Edit Button -->
                <button class="uc-edit-btn" (click)="toggleEdit(user)">
                  <mat-icon>{{ editingUserId === user.id ? 'close' : 'tune' }}</mat-icon>
                  {{ editingUserId === user.id ? 'Close' : 'Manage' }}
                </button>

                <!-- Inline Edit Panel -->
                <div class="uc-edit-panel" *ngIf="editingUserId === user.id">
                  <div class="uc-edit-row">
                    <div class="uc-edit-field">
                      <label>Role</label>
                      <select [value]="user.role" (change)="onRoleChange(user, $event)">
                        <option value="User">User</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                    <div class="uc-edit-field">
                      <label>Status</label>
                      <button class="status-toggle" [class.active]="user.isActive"
                              (click)="toggleUserStatus(user)">
                        <span class="toggle-track"><span class="toggle-thumb"></span></span>
                        {{ user.isActive ? 'Active' : 'Inactive' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <mat-paginator [length]="usersTotalCount" [pageSize]="10"
                           (page)="onUsersPageChange($event)">
            </mat-paginator>
          </div>
        </mat-tab>

        <!-- Posts Tab -->
        <mat-tab label="Posts">
          <div class="tab-content">
            <table mat-table [dataSource]="posts" class="full-width">
              <ng-container matColumnDef="title">
                <th mat-header-cell *matHeaderCellDef>Title</th>
                <td mat-cell *matCellDef="let post">
                  <a [routerLink]="['/blog', post.slug]" class="post-link">{{ post.title | slice:0:50 }}</a>
                </td>
              </ng-container>
              <ng-container matColumnDef="author">
                <th mat-header-cell *matHeaderCellDef>Author</th>
                <td mat-cell *matCellDef="let post">{{ post.authorUserName }}</td>
              </ng-container>
              <ng-container matColumnDef="likes">
                <th mat-header-cell *matHeaderCellDef>Likes</th>
                <td mat-cell *matCellDef="let post">{{ post.likeCount }}</td>
              </ng-container>
              <ng-container matColumnDef="comments">
                <th mat-header-cell *matHeaderCellDef>Comments</th>
                <td mat-cell *matCellDef="let post">{{ post.commentCount }}</td>
              </ng-container>
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let post">{{ post.createdAt | date:'shortDate' }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let post">
                  <button mat-icon-button color="warn" (click)="deletePost(post)" matTooltip="Delete Post">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="postColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: postColumns;"></tr>
            </table>
            <mat-paginator [length]="postsTotalCount" [pageSize]="10"
                           (page)="onPostsPageChange($event)">
            </mat-paginator>
          </div>
        </mat-tab>

        <!-- Comments Tab -->
        <mat-tab label="Comments">
          <div class="tab-content">
            <table mat-table [dataSource]="comments" class="full-width">
              <ng-container matColumnDef="content">
                <th mat-header-cell *matHeaderCellDef>Comment</th>
                <td mat-cell *matCellDef="let c">{{ c.content | slice:0:80 }}</td>
              </ng-container>
              <ng-container matColumnDef="user">
                <th mat-header-cell *matHeaderCellDef>User</th>
                <td mat-cell *matCellDef="let c">{{ c.userName }}</td>
              </ng-container>
              <ng-container matColumnDef="post">
                <th mat-header-cell *matHeaderCellDef>Post</th>
                <td mat-cell *matCellDef="let c">{{ c.postTitle | slice:0:30 }}</td>
              </ng-container>
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let c">{{ c.createdAt | date:'shortDate' }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let c">
                  <button mat-icon-button color="warn" (click)="deleteComment(c)" matTooltip="Delete Comment">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="commentColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: commentColumns;"></tr>
            </table>
            <mat-paginator [length]="commentsTotalCount" [pageSize]="10"
                           (page)="onCommentsPageChange($event)">
            </mat-paginator>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .admin-container { max-width: 1100px; margin: 0 auto; padding-top: 16px; }
    .admin-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 8px; }
    h1 { display: flex; align-items: center; gap: 8px; margin: 0; }
    .tab-content { padding: 16px 0; overflow-x: auto; }
    table { width: 100%; }
    .post-link { color: inherit; text-decoration: none; font-weight: 500; }
    .post-link:hover { text-decoration: underline; color: #1d9bf0; }

    /* ---- User Card Grid ---- */
    .user-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 16px;
    }
    .user-card {
      border: 1px solid var(--color-border, #eff3f4);
      border-radius: 16px;
      background: var(--card-bg, #fff);
      overflow: hidden;
      transition: box-shadow 0.2s, border-color 0.2s;
    }
    .user-card:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,0.06);
    }
    .user-card.editing {
      border-color: var(--color-primary, #1d9bf0);
      box-shadow: 0 0 0 1px var(--color-primary, #1d9bf0);
    }

    /* Card Header */
    .uc-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 16px 12px;
    }
    .uc-avatar {
      width: 44px; height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1d9bf0, #1a6dd4);
      color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 18px;
      flex-shrink: 0;
    }
    .uc-identity {
      flex: 1;
      min-width: 0;
    }
    .uc-name {
      display: block;
      font-weight: 700;
      font-size: 15px;
      color: var(--color-text-primary, #0f1419);
      text-decoration: none;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .uc-name:hover { color: #1d9bf0; text-decoration: underline; }
    .uc-email {
      display: block;
      font-size: 13px;
      color: var(--color-text-secondary, #536471);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-top: 1px;
    }
    .uc-status {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 3px 10px;
      border-radius: 20px;
      background: rgba(244,33,46,0.1);
      color: #f4212e;
      flex-shrink: 0;
    }
    .uc-status.active {
      background: rgba(0,186,124,0.1);
      color: #00ba7c;
    }

    /* Stats Row */
    .uc-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      border-top: 1px solid var(--color-border, #eff3f4);
      border-bottom: 1px solid var(--color-border, #eff3f4);
    }
    .uc-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px 4px;
    }
    .uc-stat + .uc-stat {
      border-left: 1px solid var(--color-border, #eff3f4);
    }
    .uc-stat-val {
      font-size: 15px;
      font-weight: 700;
      color: var(--color-text-primary, #0f1419);
    }
    .uc-stat-label {
      font-size: 11px;
      color: var(--color-text-secondary, #536471);
      margin-top: 2px;
    }
    .uc-role {
      font-size: 12px;
      padding: 1px 8px;
      border-radius: 10px;
      background: #eff3f4;
      color: #536471;
    }
    .uc-role.admin {
      background: rgba(29,155,240,0.12);
      color: #1d9bf0;
    }

    /* Edit Button */
    .uc-edit-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      padding: 10px;
      border: none;
      background: none;
      color: var(--color-text-secondary, #536471);
      font-size: 13px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .uc-edit-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .uc-edit-btn:hover {
      background: var(--color-bg-hover, rgba(0,0,0,0.03));
      color: var(--color-primary, #1d9bf0);
    }

    /* Inline Edit Panel */
    .uc-edit-panel {
      padding: 14px 16px;
      background: var(--color-bg-secondary, #f7f9f9);
      border-top: 1px solid var(--color-border, #eff3f4);
      animation: slideDown 0.15s ease;
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .uc-edit-row {
      display: flex;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
    }
    .uc-edit-field {
      display: flex; align-items: center; gap: 10px;
    }
    .uc-edit-field label {
      font-size: 13px; font-weight: 600;
      color: var(--color-text-secondary, #536471);
    }
    .uc-edit-field select {
      padding: 6px 28px 6px 10px;
      border: 1px solid var(--color-border, #eff3f4);
      border-radius: 8px;
      background: var(--color-bg, #fff);
      color: var(--color-text-primary, #0f1419);
      font-size: 13px;
      font-family: inherit;
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%23536471' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 8px center;
      outline: none;
      transition: border-color 0.15s;
    }
    .uc-edit-field select:focus { border-color: #1d9bf0; }

    /* Toggle Switch */
    .status-toggle {
      display: flex; align-items: center; gap: 8px;
      background: none; border: none;
      font-family: inherit; font-size: 13px; font-weight: 500;
      color: var(--color-text-secondary, #536471);
      cursor: pointer; padding: 0;
    }
    .toggle-track {
      width: 36px; height: 20px;
      background: #cfd9de;
      border-radius: 10px;
      position: relative;
      transition: background 0.2s;
    }
    .status-toggle.active .toggle-track { background: #00ba7c; }
    .toggle-thumb {
      width: 16px; height: 16px;
      background: #fff;
      border-radius: 50%;
      position: absolute;
      top: 2px; left: 2px;
      transition: transform 0.2s;
    }
    .status-toggle.active .toggle-thumb { transform: translateX(16px); }

    @media (max-width: 599px) {
      .user-grid { grid-template-columns: 1fr; gap: 12px; }
      .uc-stats { grid-template-columns: repeat(2, 1fr); }
      .uc-stat:nth-child(3) { border-left: none; }
      .uc-edit-row { flex-direction: column; align-items: flex-start; gap: 14px; }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  // Users
  users: AdminUser[] = [];
  usersTotalCount = 0;
  editingUserId: string | null = null;

  // Posts
  posts: AdminPost[] = [];
  postsTotalCount = 0;
  postColumns = ['title', 'author', 'likes', 'comments', 'date', 'actions'];

  // Comments
  comments: AdminComment[] = [];
  commentsTotalCount = 0;
  commentColumns = ['content', 'user', 'post', 'date', 'actions'];

  isSeeding = false;

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUsers(1);
    this.loadPosts(1);
    this.loadComments(1);
  }

  loadUsers(page: number): void {
    this.adminService.getUsers({ page, pageSize: 10 }).subscribe({
      next: (result) => {
        this.users = result.items;
        this.usersTotalCount = result.totalCount;
      }
    });
  }

  loadPosts(page: number): void {
    this.adminService.getPosts({ page, pageSize: 10 }).subscribe({
      next: (result) => {
        this.posts = result.items;
        this.postsTotalCount = result.totalCount;
      }
    });
  }

  loadComments(page: number): void {
    this.adminService.getComments({ page, pageSize: 10 }).subscribe({
      next: (result) => {
        this.comments = result.items;
        this.commentsTotalCount = result.totalCount;
      }
    });
  }

  onUsersPageChange(event: PageEvent): void {
    this.loadUsers(event.pageIndex + 1);
  }

  onPostsPageChange(event: PageEvent): void {
    this.loadPosts(event.pageIndex + 1);
  }

  onCommentsPageChange(event: PageEvent): void {
    this.loadComments(event.pageIndex + 1);
  }

  toggleEdit(user: AdminUser): void {
    this.editingUserId = this.editingUserId === user.id ? null : user.id;
  }

  toggleUserStatus(user: AdminUser): void {
    this.adminService.toggleUserStatus(user.id).subscribe({
      next: () => {
        user.isActive = !user.isActive;
        this.snackBar.open(`User ${user.isActive ? 'activated' : 'deactivated'}`, 'Close', { duration: 3000 });
      }
    });
  }

  onRoleChange(user: AdminUser, event: Event): void {
    const newRole = (event.target as HTMLSelectElement).value;
    if (newRole === user.role) return;
    this.adminService.changeUserRole(user.id, newRole).subscribe({
      next: () => {
        user.role = newRole;
        this.snackBar.open(`Role changed to ${newRole}`, 'Close', { duration: 3000 });
      },
      error: () => {
        (event.target as HTMLSelectElement).value = user.role;
        this.snackBar.open('Failed to change role', 'Close', { duration: 3000 });
      }
    });
  }

  deletePost(post: AdminPost): void {
    if (!confirm(`Delete post "${post.title}"?`)) return;
    this.adminService.deletePost(post.id).subscribe({
      next: () => {
        this.posts = this.posts.filter(p => p.id !== post.id);
        this.postsTotalCount--;
        this.snackBar.open('Post deleted', 'Close', { duration: 3000 });
      }
    });
  }

  deleteComment(comment: AdminComment): void {
    if (!confirm('Delete this comment?')) return;
    this.adminService.deleteComment(comment.id).subscribe({
      next: () => {
        this.comments = this.comments.filter(c => c.id !== comment.id);
        this.commentsTotalCount--;
        this.snackBar.open('Comment deleted', 'Close', { duration: 3000 });
      }
    });
  }

  seedData(): void {
    if (!confirm('This will seed 30 users, 40 posts, and thousands of interactions. Proceed?')) return;
    this.isSeeding = true;
    this.adminService.seedData().subscribe({
      next: (res: { message: string }) => {
        this.isSeeding = false;
        this.snackBar.open(res.message, 'Close', { duration: 8000 });
        this.loadUsers(1);
        this.loadPosts(1);
        this.loadComments(1);
      },
      error: (err: any) => {
        this.isSeeding = false;
        this.snackBar.open(err.error?.message || 'Seeding failed', 'Close', { duration: 5000 });
      }
    });
  }
}
