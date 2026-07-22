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
            <table mat-table [dataSource]="users" class="full-width">
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
                  <mat-chip [color]="user.role === 'Admin' ? 'primary' : ''">
                    {{ user.role }}
                  </mat-chip>
                </td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let user">
                  <mat-chip [color]="user.isActive ? 'accent' : 'warn'">
                    {{ user.isActive ? 'Active' : 'Inactive' }}
                  </mat-chip>
                </td>
              </ng-container>
              <ng-container matColumnDef="posts">
                <th mat-header-cell *matHeaderCellDef>Posts</th>
                <td mat-cell *matCellDef="let user">{{ user.postsCount }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let user">
                  <button mat-icon-button (click)="toggleUserStatus(user)" matTooltip="Toggle Status">
                    <mat-icon>{{ user.isActive ? 'block' : 'check_circle' }}</mat-icon>
                  </button>
                  <button mat-icon-button (click)="changeRole(user)" matTooltip="Change Role">
                    <mat-icon>swap_horiz</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="userColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: userColumns;"></tr>
            </table>
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
    .user-link { color: inherit; text-decoration: none; font-weight: 500; }
    .user-link:hover { text-decoration: underline; color: #1d9bf0; }
    .post-link { color: inherit; text-decoration: none; font-weight: 500; }
    .post-link:hover { text-decoration: underline; color: #1d9bf0; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  // Users
  users: AdminUser[] = [];
  usersTotalCount = 0;
  userColumns = ['userName', 'email', 'role', 'status', 'posts', 'actions'];

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

  toggleUserStatus(user: AdminUser): void {
    this.adminService.toggleUserStatus(user.id).subscribe({
      next: () => {
        user.isActive = !user.isActive;
        this.snackBar.open(`User ${user.isActive ? 'activated' : 'deactivated'}`, 'Close', { duration: 3000 });
      }
    });
  }

  changeRole(user: AdminUser): void {
    const newRole = user.role === 'Admin' ? 'User' : 'Admin';
    this.adminService.changeUserRole(user.id, newRole).subscribe({
      next: () => {
        user.role = newRole;
        this.snackBar.open(`Role changed to ${newRole}`, 'Close', { duration: 3000 });
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
