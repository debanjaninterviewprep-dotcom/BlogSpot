import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { trigger, state, style, transition, animate } from '@angular/animations';
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
            <table mat-table [dataSource]="users" class="full-width" multiTemplateDataRows>
              <ng-container matColumnDef="userName">
                <th mat-header-cell *matHeaderCellDef>Username</th>
                <td mat-cell *matCellDef="let user">
                  <a [routerLink]="['/profile', user.userName]" class="user-link">{{ user.userName }}</a>
                </td>
              </ng-container>
              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef>Email</th>
                <td mat-cell *matCellDef="let user">{{ user.email }}</td>
              </ng-container>
              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef>Role</th>
                <td mat-cell *matCellDef="let user">
                  <mat-chip [class.admin-chip]="user.role === 'Admin'">{{ user.role }}</mat-chip>
                </td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let user">
                  <mat-chip [class.active-chip]="user.isActive" [class.inactive-chip]="!user.isActive">
                    {{ user.isActive ? 'Active' : 'Inactive' }}
                  </mat-chip>
                </td>
              </ng-container>
              <ng-container matColumnDef="posts">
                <th mat-header-cell *matHeaderCellDef>Posts</th>
                <td mat-cell *matCellDef="let user">{{ user.postsCount }}</td>
              </ng-container>
              <ng-container matColumnDef="comments">
                <th mat-header-cell *matHeaderCellDef>Comments</th>
                <td mat-cell *matCellDef="let user">{{ user.commentsCount }}</td>
              </ng-container>
              <ng-container matColumnDef="joined">
                <th mat-header-cell *matHeaderCellDef>Joined</th>
                <td mat-cell *matCellDef="let user">{{ user.createdAt | date:'mediumDate' }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let user">
                  <button mat-icon-button (click)="toggleEdit(user)"
                          [matTooltip]="editingUserId === user.id ? 'Close' : 'Manage'">
                    <mat-icon>{{ editingUserId === user.id ? 'close' : 'tune' }}</mat-icon>
                  </button>
                </td>
              </ng-container>

              <!-- Expandable edit row -->
              <ng-container matColumnDef="editPanel">
                <td mat-cell *matCellDef="let user" [attr.colspan]="userColumns.length">
                  <div class="edit-panel" *ngIf="editingUserId === user.id" @slideDown>
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
                        <span class="toggle-track"><span class="toggle-thumb"></span></span>
                        {{ user.isActive ? 'Active' : 'Inactive' }}
                      </button>
                    </div>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="userColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: userColumns;"
                  [class.expanded-row]="editingUserId === row.id"></tr>
              <tr mat-row *matRowDef="let row; columns: ['editPanel']"
                  class="edit-row"></tr>
            </table>
            <mat-paginator [length]="usersTotalCount" [pageSize]="12"
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
    .admin-chip { background-color: rgba(29,155,240,0.12) !important; color: #1d9bf0 !important; }
    .active-chip { background-color: rgba(0,186,124,0.12) !important; color: #00ba7c !important; }
    .inactive-chip { background-color: rgba(244,33,46,0.1) !important; color: #f4212e !important; }
    .user-link { color: inherit; text-decoration: none; font-weight: 500; }
    .user-link:hover { text-decoration: underline; color: #1d9bf0; }
    .post-link { color: inherit; text-decoration: none; font-weight: 500; }
    .post-link:hover { text-decoration: underline; color: #1d9bf0; }
    .expanded-row { border-bottom: none !important; }
    .edit-row td { padding: 0 !important; border-bottom-color: var(--color-border, #eff3f4) !important; }

    /* Edit Panel */
    .edit-panel {
      display: flex;
      align-items: center;
      gap: 32px;
      padding: 12px 16px 16px 16px;
      background: var(--color-bg-secondary, #f7f9f9);
      border-top: 1px dashed var(--color-border, #eff3f4);
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
      .edit-panel { flex-direction: column; align-items: flex-start; gap: 14px; }
    }
  `],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ height: '0', opacity: 0, overflow: 'hidden' }),
        animate('150ms ease', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease', style({ height: '0', opacity: 0, overflow: 'hidden' }))
      ])
    ])
  ]
})
export class AdminDashboardComponent implements OnInit {
  // Users
  users: AdminUser[] = [];
  usersTotalCount = 0;
  editingUserId: string | null = null;
  userColumns = ['userName', 'email', 'role', 'status', 'posts', 'comments', 'joined', 'actions'];

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
    this.adminService.getUsers({ page, pageSize: 12 }).subscribe({
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
