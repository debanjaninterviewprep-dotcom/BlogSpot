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
            <div class="user-list">
              <div class="user-row" *ngFor="let user of users">
                <div class="user-main" (click)="toggleEdit(user)">
                  <div class="user-top">
                    <div class="user-identity">
                      <div class="user-avatar">{{ user.userName.charAt(0).toUpperCase() }}</div>
                      <div>
                        <a [routerLink]="['/profile', user.userName]" class="user-link"
                           (click)="$event.stopPropagation()">{{ user.userName }}</a>
                        <div class="user-badges">
                          <span class="role-badge" [class.admin]="user.role === 'Admin'">{{ user.role }}</span>
                          <span class="status-dot" [class.active]="user.isActive"
                                [matTooltip]="user.isActive ? 'Active' : 'Inactive'"></span>
                        </div>
                      </div>
                    </div>
                    <button mat-icon-button class="edit-trigger"
                            [class.open]="editingUserId === user.id"
                            (click)="toggleEdit(user); $event.stopPropagation()">
                      <mat-icon>{{ editingUserId === user.id ? 'close' : 'edit' }}</mat-icon>
                    </button>
                  </div>
                  <div class="user-meta">
                    <span><mat-icon>email</mat-icon> {{ user.email }}</span>
                    <span><mat-icon>article</mat-icon> {{ user.postsCount }} posts</span>
                    <span><mat-icon>comment</mat-icon> {{ user.commentsCount }} comments</span>
                    <span><mat-icon>calendar_today</mat-icon> Joined {{ user.createdAt | date:'mediumDate' }}</span>
                  </div>
                </div>

                <!-- Inline edit panel (accordion: only one open) -->
                <div class="edit-panel" *ngIf="editingUserId === user.id">
                  <div class="edit-field">
                    <label>Role</label>
                    <select [value]="user.role" (change)="onRoleChange(user, $event)">
                      <option value="User">User</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div class="edit-field">
                    <label>Status</label>
                    <button class="status-toggle" [class.active]="user.isActive"
                            (click)="toggleUserStatus(user)">
                      <span class="toggle-track">
                        <span class="toggle-thumb"></span>
                      </span>
                      {{ user.isActive ? 'Active' : 'Inactive' }}
                    </button>
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
    mat-chip { font-size: 12px; }
    .post-link { color: inherit; text-decoration: none; font-weight: 500; }
    .post-link:hover { text-decoration: underline; color: #1d9bf0; }

    /* ---- User List ---- */
    .user-list { display: flex; flex-direction: column; gap: 0; }
    .user-row {
      border-bottom: 1px solid var(--color-border, #eff3f4);
      transition: background 0.15s;
    }
    .user-main {
      padding: 14px 16px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .user-main:hover { background: var(--color-bg-hover, rgba(0,0,0,0.03)); }
    .user-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .user-identity {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .user-avatar {
      width: 40px; height: 40px;
      border-radius: 50%;
      background: #1d9bf0;
      color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 16px;
      flex-shrink: 0;
    }
    .user-link {
      color: var(--color-text-primary, #0f1419);
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
    }
    .user-link:hover { text-decoration: underline; color: #1d9bf0; }
    .user-badges {
      display: flex; align-items: center; gap: 8px; margin-top: 2px;
    }
    .role-badge {
      font-size: 11px; font-weight: 600;
      padding: 1px 8px; border-radius: 12px;
      background: #eff3f4; color: #536471;
    }
    .role-badge.admin { background: rgba(29,155,240,0.15); color: #1d9bf0; }
    .status-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #f4212e;
      display: inline-block;
    }
    .status-dot.active { background: #00ba7c; }
    .user-meta {
      display: flex; flex-wrap: wrap; gap: 16px;
      margin-top: 10px; padding-left: 52px;
      font-size: 13px; color: var(--color-text-secondary, #536471);
    }
    .user-meta span {
      display: flex; align-items: center; gap: 4px;
    }
    .user-meta mat-icon {
      font-size: 15px; width: 15px; height: 15px;
    }
    .edit-trigger {
      color: var(--color-text-secondary, #536471);
      transition: color 0.15s, background 0.15s;
    }
    .edit-trigger:hover { color: #1d9bf0; }
    .edit-trigger.open { color: #1d9bf0; }

    /* ---- Edit Panel ---- */
    .edit-panel {
      display: flex;
      align-items: center;
      gap: 32px;
      padding: 12px 16px 16px 68px;
      background: var(--color-bg-secondary, #f7f9f9);
      border-top: 1px solid var(--color-border, #eff3f4);
      animation: slideDown 0.15s ease;
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .edit-field {
      display: flex; align-items: center; gap: 10px;
    }
    .edit-field label {
      font-size: 13px; font-weight: 600;
      color: var(--color-text-secondary, #536471);
    }
    .edit-field select {
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
    .edit-field select:focus { border-color: #1d9bf0; }

    /* ---- Toggle Switch ---- */
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
      .user-meta { padding-left: 0; gap: 10px; }
      .edit-panel { padding-left: 16px; flex-direction: column; align-items: flex-start; gap: 14px; }
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
