import { Component, OnInit, OnDestroy } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AdminService, AdminUser, AdminPost, AdminComment, EmailQueueItem } from '@core/services/admin.service';
import { AuthService } from '@core/services/auth.service';
import { ExportService } from '@core/services/export.service';

@Component({
  selector: 'app-admin-dashboard',
  template: `
    <div class="admin-container">
      <div class="admin-header">
        <h1><mat-icon>admin_panel_settings</mat-icon> Admin Dashboard</h1>
      </div>

      <div class="admin-layout">
        <nav class="admin-sidebar">
          <div class="sidebar-section">
            <h3 class="sidebar-heading">Data Management</h3>
            <button class="sidebar-link" [class.active]="activeSection === 'users'" (click)="setSection('users')">
              <mat-icon>group</mat-icon> Users
            </button>
            <button class="sidebar-link" [class.active]="activeSection === 'posts'" (click)="setSection('posts')">
              <mat-icon>article</mat-icon> Posts
            </button>
            <button class="sidebar-link" [class.active]="activeSection === 'comments'" (click)="setSection('comments')">
              <mat-icon>comment</mat-icon> Comments
            </button>
            <button class="sidebar-link" [class.active]="activeSection === 'emails'" (click)="setSection('emails')">
              <mat-icon>email</mat-icon> Emails
            </button>
          </div>

          <div class="sidebar-section">
            <h3 class="sidebar-heading">Data Tools</h3>
            <button class="sidebar-link" [class.active]="activeSection === 'data-tools'" (click)="setSection('data-tools')">
              <mat-icon>build</mat-icon> Data Tools
            </button>
          </div>

          <div class="sidebar-section">
            <h3 class="sidebar-heading">Job Runner</h3>
            <button class="sidebar-link" [class.active]="activeSection === 'jobs'" (click)="setSection('jobs')">
              <mat-icon>play_circle</mat-icon> Job Runner
            </button>
          </div>
        </nav>

        <div class="admin-content">
        <div class="tab-content" *ngIf="activeSection === 'users'">
            <div class="tab-toolbar">
              <span class="tab-count">{{ usersTotalCount }} users</span>
              <div class="tab-search">
                <mat-icon>search</mat-icon>
                <input type="text" placeholder="Filter by username or email..." [(ngModel)]="usersFilter" (input)="onUsersFilterChange()">
              </div>
              <button mat-stroked-button [matMenuTriggerFor]="usersExportMenu" class="export-btn">
                <mat-icon>download</mat-icon> Export Report
              </button>
              <mat-menu #usersExportMenu="matMenu">
                <button mat-menu-item (click)="exportUsers()">
                  <mat-icon>table_chart</mat-icon> Download Excel
                </button>
                <button mat-menu-item (click)="exportViaEmail('users')">
                  <mat-icon>email</mat-icon> Send via Email
                </button>
              </mat-menu>
            </div>
            <table mat-table [dataSource]="users" class="full-width responsive-table" multiTemplateDataRows>
              <ng-container matColumnDef="userName">
                <th mat-header-cell *matHeaderCellDef>Username</th>
                <td mat-cell *matCellDef="let user" data-label="Username">
                  <a [routerLink]="['/profile', user.userName]" class="user-link">{{ user.userName }}</a>
                </td>
              </ng-container>
              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef>Email</th>
                <td mat-cell *matCellDef="let user" data-label="Email">{{ user.email }}</td>
              </ng-container>
              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef>Role</th>
                <td mat-cell *matCellDef="let user" data-label="Role">
                  <mat-chip [class.admin-chip]="user.role === 'Admin'">{{ user.role }}</mat-chip>
                </td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let user" data-label="Status">
                  <mat-chip [class.active-chip]="user.isActive" [class.inactive-chip]="!user.isActive">
                    {{ user.isActive ? 'Active' : 'Inactive' }}
                  </mat-chip>
                </td>
              </ng-container>
              <ng-container matColumnDef="posts">
                <th mat-header-cell *matHeaderCellDef>Posts</th>
                <td mat-cell *matCellDef="let user" data-label="Posts">{{ user.postsCount }}</td>
              </ng-container>
              <ng-container matColumnDef="comments">
                <th mat-header-cell *matHeaderCellDef>Comments</th>
                <td mat-cell *matCellDef="let user" data-label="Comments">{{ user.commentsCount }}</td>
              </ng-container>
              <ng-container matColumnDef="joined">
                <th mat-header-cell *matHeaderCellDef>Joined</th>
                <td mat-cell *matCellDef="let user" data-label="Joined">{{ user.createdAt | date:'mediumDate' }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let user" data-label="Actions">
                  <button mat-icon-button (click)="toggleEdit(user)"
                          [attr.aria-label]="editingUserId === user.id ? 'Close' : 'Manage user'"
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

        <div class="tab-content" *ngIf="activeSection === 'posts'">
            <div class="tab-toolbar">
              <span class="tab-count">{{ postsTotalCount }} posts</span>
              <div class="tab-search">
                <mat-icon>search</mat-icon>
                <input type="text" placeholder="Filter by title or author..." [(ngModel)]="postsFilter" (input)="onPostsFilterChange()">
              </div>
              <button mat-stroked-button [matMenuTriggerFor]="postsExportMenu" class="export-btn">
                <mat-icon>download</mat-icon> Export Report
              </button>
              <mat-menu #postsExportMenu="matMenu">
                <button mat-menu-item (click)="exportPosts()">
                  <mat-icon>table_chart</mat-icon> Download Excel
                </button>
                <button mat-menu-item (click)="exportViaEmail('posts')">
                  <mat-icon>email</mat-icon> Send via Email
                </button>
              </mat-menu>
            </div>
            <table mat-table [dataSource]="posts" class="full-width responsive-table">
              <ng-container matColumnDef="title">
                <th mat-header-cell *matHeaderCellDef>Title</th>
                <td mat-cell *matCellDef="let post" data-label="Title">
                  <a [routerLink]="['/blog', post.slug]" class="post-link">{{ post.title | slice:0:50 }}</a>
                </td>
              </ng-container>
              <ng-container matColumnDef="author">
                <th mat-header-cell *matHeaderCellDef>Author</th>
                <td mat-cell *matCellDef="let post" data-label="Author">{{ post.authorUserName }}</td>
              </ng-container>
              <ng-container matColumnDef="likes">
                <th mat-header-cell *matHeaderCellDef>Likes</th>
                <td mat-cell *matCellDef="let post" data-label="Likes">{{ post.likeCount }}</td>
              </ng-container>
              <ng-container matColumnDef="comments">
                <th mat-header-cell *matHeaderCellDef>Comments</th>
                <td mat-cell *matCellDef="let post" data-label="Comments">{{ post.commentCount }}</td>
              </ng-container>
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let post" data-label="Date">{{ post.createdAt | date:'shortDate' }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let post" data-label="Actions">
                  <button mat-icon-button color="warn" (click)="deletePost(post)" matTooltip="Delete Post" aria-label="Delete post">
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

        <div class="tab-content" *ngIf="activeSection === 'comments'">
            <div class="tab-toolbar">
              <span class="tab-count">{{ commentsTotalCount }} comments</span>
              <div class="tab-search">
                <mat-icon>search</mat-icon>
                <input type="text" placeholder="Filter by content or user..." [(ngModel)]="commentsFilter" (input)="onCommentsFilterChange()">
              </div>
              <button mat-stroked-button [matMenuTriggerFor]="commentsExportMenu" class="export-btn">
                <mat-icon>download</mat-icon> Export Report
              </button>
              <mat-menu #commentsExportMenu="matMenu">
                <button mat-menu-item (click)="exportComments()">
                  <mat-icon>table_chart</mat-icon> Download Excel
                </button>
                <button mat-menu-item (click)="exportViaEmail('comments')">
                  <mat-icon>email</mat-icon> Send via Email
                </button>
              </mat-menu>
            </div>
            <table mat-table [dataSource]="comments" class="full-width responsive-table">
              <ng-container matColumnDef="content">
                <th mat-header-cell *matHeaderCellDef>Comment</th>
                <td mat-cell *matCellDef="let c" data-label="Comment">{{ c.content | slice:0:80 }}</td>
              </ng-container>
              <ng-container matColumnDef="user">
                <th mat-header-cell *matHeaderCellDef>User</th>
                <td mat-cell *matCellDef="let c" data-label="User">{{ c.userName }}</td>
              </ng-container>
              <ng-container matColumnDef="post">
                <th mat-header-cell *matHeaderCellDef>Post</th>
                <td mat-cell *matCellDef="let c" data-label="Post">{{ c.postTitle | slice:0:30 }}</td>
              </ng-container>
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let c" data-label="Date">{{ c.createdAt | date:'shortDate' }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let c" data-label="Actions">
                  <button mat-icon-button color="warn" (click)="deleteComment(c)" matTooltip="Delete Comment" aria-label="Delete comment">
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

        <div class="tab-content" *ngIf="activeSection === 'emails'">
            <div class="tab-toolbar">
              <span class="tab-count">{{ emailsTotalCount }} emails</span>
            </div>
            <table mat-table [dataSource]="emails" class="full-width responsive-table">
              <ng-container matColumnDef="toEmail">
                <th mat-header-cell *matHeaderCellDef>To</th>
                <td mat-cell *matCellDef="let e" data-label="To">{{ e.toEmail }}</td>
              </ng-container>
              <ng-container matColumnDef="subject">
                <th mat-header-cell *matHeaderCellDef>Subject</th>
                <td mat-cell *matCellDef="let e" data-label="Subject">{{ e.subject | slice:0:50 }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let e" data-label="Status">
                  <mat-chip [class.sent-chip]="e.status === 'Sent'"
                            [class.queued-chip]="e.status === 'Queued'"
                            [class.failed-chip]="e.status === 'Failed'">
                    {{ e.status }}
                  </mat-chip>
                </td>
              </ng-container>
              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef>Queued</th>
                <td mat-cell *matCellDef="let e" data-label="Queued">{{ e.createdAt | date:'short' }}</td>
              </ng-container>
              <ng-container matColumnDef="sentAt">
                <th mat-header-cell *matHeaderCellDef>Sent</th>
                <td mat-cell *matCellDef="let e" data-label="Sent">{{ e.sentAt ? (e.sentAt | date:'short') : '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="error">
                <th mat-header-cell *matHeaderCellDef>Error</th>
                <td mat-cell *matCellDef="let e" class="error-cell" data-label="Error">{{ e.error || '—' }}</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="emailColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: emailColumns;"></tr>
            </table>
            <mat-paginator [length]="emailsTotalCount" [pageSize]="15"
                           (page)="onEmailsPageChange($event)">
            </mat-paginator>
          </div>

          <!-- Data Tools Section -->
          <div class="tab-content data-tools-content" *ngIf="activeSection === 'data-tools'">
            <h2 class="section-title">Data Tools</h2>
            <p class="section-subtitle">Run a one-off data maintenance action.</p>
            <div class="data-tools-form">
              <div class="form-field">
                <label>Action</label>
                <select [(ngModel)]="selectedDataTool">
                  <option value="format-posts">Format All Posts</option>
                  <option value="seed-data">Seed Dummy Data</option>
                </select>
              </div>
              <button mat-raised-button color="primary" (click)="runDataTool()" [disabled]="isSeeding || isFormatting">
                <mat-icon>{{ (isSeeding || isFormatting) ? 'hourglass_empty' : 'play_arrow' }}</mat-icon>
                {{ (isSeeding || isFormatting) ? 'Running...' : 'Submit' }}
              </button>
            </div>
          </div>

          <!-- Job Runner Section -->
          <div class="tab-content jobs-content" *ngIf="activeSection === 'jobs'">
            <h2 class="section-title">Job Runner</h2>
            <p class="section-subtitle">Manually trigger a background job instead of waiting for its schedule.</p>
            <div class="job-cards">
              <div class="job-card">
                <div class="job-card-info">
                  <mat-icon>mail</mat-icon>
                  <div>
                    <h4>Email Sending</h4>
                    <p>Process the queued email batch right now.</p>
                  </div>
                </div>
                <button mat-stroked-button color="primary" (click)="runJob('email-queue')" [disabled]="runningJob === 'email-queue'">
                  {{ runningJob === 'email-queue' ? 'Running...' : 'Run Now' }}
                </button>
              </div>
              <div class="job-card">
                <div class="job-card-info">
                  <mat-icon>schedule_send</mat-icon>
                  <div>
                    <h4>Post Scheduling</h4>
                    <p>Publish any scheduled posts that are already due.</p>
                  </div>
                </div>
                <button mat-stroked-button color="primary" (click)="runJob('post-scheduler')" [disabled]="runningJob === 'post-scheduler'">
                  {{ runningJob === 'post-scheduler' ? 'Running...' : 'Run Now' }}
                </button>
              </div>
              <div class="job-card">
                <div class="job-card-info">
                  <mat-icon>monitor_heart</mat-icon>
                  <div>
                    <h4>Health Check</h4>
                    <p>Verify the API and database are reachable.</p>
                  </div>
                </div>
                <button mat-stroked-button color="primary" (click)="runJob('health-check')" [disabled]="runningJob === 'health-check'">
                  {{ runningJob === 'health-check' ? 'Running...' : 'Run Now' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-container { width: 100%; padding: 16px 24px 0; box-sizing: border-box; min-height: calc(100vh - 56px); }
    .admin-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 8px; }
    h1 { display: flex; align-items: center; gap: 8px; margin: 0; }

    .admin-layout { display: flex; gap: 24px; align-items: flex-start; }
    .admin-sidebar {
      width: 220px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 20px;
      position: sticky;
      top: 72px;
    }
    .sidebar-section { display: flex; flex-direction: column; gap: 2px; }
    .sidebar-heading {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--color-text-secondary, #536471);
      margin: 0 0 6px 10px;
    }
    .sidebar-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border: none;
      background: none;
      border-radius: 10px;
      font-family: inherit;
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
      cursor: pointer;
      text-align: left;
      transition: background 0.15s;
    }
    .sidebar-link:hover { background: var(--color-bg-secondary, #f7f9f9); }
    .sidebar-link.active { background: var(--color-primary-light); color: var(--color-primary); }
    .sidebar-link mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .admin-content { flex: 1; min-width: 0; }

    .section-title { margin: 4px 0 4px; font-size: var(--font-size-xl); }
    .section-subtitle { margin: 0 0 20px; color: var(--color-text-secondary, #536471); font-size: var(--font-size-base); }

    .data-tools-form {
      display: flex;
      align-items: flex-end;
      gap: 16px;
      flex-wrap: wrap;
      background: var(--color-bg-secondary, #f7f9f9);
      padding: 20px;
      border-radius: 12px;
      max-width: 480px;
    }
    .form-field { display: flex; flex-direction: column; gap: 6px; }
    .form-field label { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--color-text-secondary, #536471); }
    .form-field select {
      padding: 8px 30px 8px 12px;
      border: 1px solid var(--color-border, #eff3f4);
      border-radius: 8px;
      background: var(--color-bg, #fff);
      color: var(--color-text-primary, #0f1419);
      font-size: var(--font-size-base);
      font-family: inherit;
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%23536471' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
      outline: none;
      min-width: 220px;
    }
    .form-field select:focus { border-color: var(--color-primary); }

    .job-cards { display: flex; flex-direction: column; gap: 12px; max-width: 640px; }
    .job-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 16px 20px;
      border: 1px solid var(--color-border, #eff3f4);
      border-radius: 12px;
      background: var(--color-bg-secondary, #f7f9f9);
    }
    .job-card-info { display: flex; align-items: center; gap: 14px; }
    .job-card-info mat-icon { font-size: 26px; width: 26px; height: 26px; color: var(--color-primary); }
    .job-card-info h4 { margin: 0 0 2px; font-size: var(--font-size-md); }
    .job-card-info p { margin: 0; font-size: var(--font-size-sm); color: var(--color-text-secondary, #536471); }

    .tab-content { padding: 16px 0; overflow-x: auto; }
    .tab-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    .tab-search {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
      max-width: 280px;
      padding: 0 10px;
      height: 34px;
      border: 1px solid var(--color-border);
      border-radius: 20px;
      background: var(--color-bg-secondary);
    }
    .tab-search:focus-within { border-color: var(--color-primary); }
    .tab-search mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-text-secondary); }
    .tab-search input {
      border: none;
      outline: none;
      background: transparent;
      font-size: var(--font-size-sm);
      width: 100%;
      color: var(--color-text-primary);
      font-family: inherit;
    }
    .tab-search input::placeholder { color: var(--color-text-secondary); }
    .tab-count {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-secondary, #536471);
    }
    .export-btn {
      font-size: var(--font-size-sm) !important;
      border-radius: 20px !important;
      padding: 0 14px !important;
      height: 34px !important;
    }
    .export-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 4px;
    }
    table { width: 100%; }
    mat-chip { font-size: var(--font-size-xs); }
    .admin-chip { background-color: var(--color-primary-light) !important; color: var(--color-primary) !important; }
    .active-chip { background-color: rgba(0, 184, 148, 0.12) !important; color: var(--color-success) !important; }
    .inactive-chip { background-color: rgba(255, 107, 107, 0.1) !important; color: var(--color-danger) !important; }
    .sent-chip { background-color: rgba(0, 184, 148, 0.12) !important; color: var(--color-success) !important; }
    .queued-chip { background-color: var(--color-primary-light) !important; color: var(--color-primary) !important; }
    .failed-chip { background-color: rgba(255, 107, 107, 0.1) !important; color: var(--color-danger) !important; }
    .error-cell { font-size: var(--font-size-xs); color: var(--color-danger); max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
    .user-link { color: inherit; text-decoration: none; font-weight: var(--font-weight-medium); }
    .user-link:hover { text-decoration: underline; color: var(--color-primary); }
    .post-link { color: inherit; text-decoration: none; font-weight: var(--font-weight-medium); }
    .post-link:hover { text-decoration: underline; color: var(--color-primary); }
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
      font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold);
      color: var(--color-text-secondary, #536471);
    }
    .edit-field select {
      padding: 6px 28px 6px 10px;
      border: 1px solid var(--color-border, #eff3f4);
      border-radius: 8px;
      background: var(--color-bg, #fff);
      color: var(--color-text-primary, #0f1419);
      font-size: var(--font-size-sm);
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
    .edit-field select:focus { border-color: var(--color-primary); }

    /* Toggle Switch */
    .status-toggle {
      display: flex; align-items: center; gap: 8px;
      background: none; border: none;
      font-family: inherit; font-size: var(--font-size-sm); font-weight: var(--font-weight-medium);
      color: var(--color-text-secondary, #536471);
      cursor: pointer; padding: 0;
    }
    .toggle-track {
      width: 36px; height: 20px;
      background: var(--color-border);
      border-radius: 10px;
      position: relative;
      transition: background 0.2s;
    }
    .status-toggle.active .toggle-track { background: var(--color-success); }
    .toggle-thumb {
      width: 16px; height: 16px;
      background: #fff;
      border-radius: 50%;
      position: absolute;
      top: 2px; left: 2px;
      transition: transform 0.2s;
    }
    .status-toggle.active .toggle-thumb { transform: translateX(16px); }

    @media (max-width: 1024px) {
      .admin-layout { flex-direction: column; }
      .admin-sidebar {
        width: 100%;
        flex-direction: row;
        flex-wrap: wrap;
        position: static;
        gap: 8px;
      }
      .sidebar-section { flex-direction: row; flex-wrap: wrap; align-items: center; gap: 4px; }
      .sidebar-heading { display: none; }
    }

    @media (max-width: 768px) {
      h1 { font-size: var(--font-size-xl); }
      .sidebar-link { padding: 8px 10px; font-size: var(--font-size-sm); gap: 6px; }
      .sidebar-link mat-icon { font-size: 18px; width: 18px; height: 18px; }

      .tab-toolbar { flex-direction: column; align-items: stretch; gap: 10px; }
      .tab-search { max-width: none; }
      .export-btn { width: 100%; }

      /* Tables become stacked cards: each row is a card, each cell a label/value line */
      .responsive-table,
      .responsive-table tbody,
      .responsive-table tr,
      .responsive-table td { display: block; width: 100%; box-sizing: border-box; }
      /* styles.scss forces .mat-mdc-table { min-width: 500px } below 600px — undo it here */
      .responsive-table { min-width: 0; }
      .responsive-table thead { display: none; }
      .responsive-table tr {
        border: 1px solid var(--color-border);
        border-radius: 12px;
        margin-bottom: 12px;
        padding: 4px 14px;
        background: var(--card-bg);
      }
      .responsive-table td {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        text-align: right;
        word-break: break-word;
        min-height: 0 !important;
        padding: 9px 0 !important;
        border-bottom: 1px solid var(--color-border) !important;
      }
      .responsive-table td:last-child { border-bottom: none !important; }
      .responsive-table td::before {
        content: attr(data-label);
        flex-shrink: 0;
        text-align: left;
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        text-transform: uppercase;
        letter-spacing: 0.03em;
        color: var(--color-text-secondary);
      }
      .error-cell { max-width: none; }

      /* The Users table's expandable edit row joins the card above it */
      .responsive-table tr.expanded-row {
        margin-bottom: 0;
        border-bottom: none;
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
      }
      .responsive-table tr.edit-row { border: none; padding: 0; margin: 0; background: transparent; }
      .responsive-table tr.edit-row td { display: block; text-align: left; padding: 0 !important; border-bottom: none !important; }
      .responsive-table tr.edit-row td::before { content: none; }
      .edit-panel {
        border: 1px solid var(--color-border);
        border-top: 1px dashed var(--color-border);
        border-radius: 0 0 12px 12px;
        margin-bottom: 12px;
      }

      .job-card { flex-direction: column; align-items: stretch; gap: 14px; }
      .job-card button { width: 100%; }
    }

    @media (max-width: 600px) {
      .edit-panel { flex-direction: column; align-items: flex-start; gap: 14px; }
      .data-tools-form { flex-direction: column; align-items: stretch; }
      .form-field select { min-width: 0; width: 100%; }
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
export class AdminDashboardComponent implements OnInit, OnDestroy {
  // Users
  users: AdminUser[] = [];
  usersTotalCount = 0;
  usersFilter = '';
  editingUserId: string | null = null;
  userColumns = ['userName', 'email', 'role', 'status', 'posts', 'comments', 'joined', 'actions'];

  // Posts
  posts: AdminPost[] = [];
  postsTotalCount = 0;
  postsFilter = '';
  postColumns = ['title', 'author', 'likes', 'comments', 'date', 'actions'];

  // Comments
  comments: AdminComment[] = [];
  commentsTotalCount = 0;
  commentsFilter = '';
  commentColumns = ['content', 'user', 'post', 'date', 'actions'];

  // Emails
  emails: EmailQueueItem[] = [];
  emailsTotalCount = 0;
  emailColumns = ['toEmail', 'subject', 'status', 'createdAt', 'sentAt', 'error'];

  isSeeding = false;
  isFormatting = false;

  activeSection: 'users' | 'posts' | 'comments' | 'emails' | 'data-tools' | 'jobs' = 'users';
  selectedDataTool: 'format-posts' | 'seed-data' = 'format-posts';
  runningJob: string | null = null;

  private destroy$ = new Subject<void>();
  private usersSearch$ = new Subject<void>();
  private postsSearch$ = new Subject<void>();
  private commentsSearch$ = new Subject<void>();

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private exportService: ExportService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUsers(1);
    this.loadPosts(1);
    this.loadComments(1);
    this.loadEmails(1);

    this.usersSearch$.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe(() => this.loadUsers(1));
    this.postsSearch$.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe(() => this.loadPosts(1));
    this.commentsSearch$.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe(() => this.loadComments(1));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onUsersFilterChange(): void {
    this.usersSearch$.next();
  }

  onPostsFilterChange(): void {
    this.postsSearch$.next();
  }

  onCommentsFilterChange(): void {
    this.commentsSearch$.next();
  }

  setSection(section: 'users' | 'posts' | 'comments' | 'emails' | 'data-tools' | 'jobs'): void {
    this.activeSection = section;
  }

  loadUsers(page: number): void {
    this.adminService.getUsers({ page, pageSize: 12, search: this.usersFilter.trim() || undefined }).subscribe({
      next: (result) => {
        this.users = result.items;
        this.usersTotalCount = result.totalCount;
      }
    });
  }

  loadPosts(page: number): void {
    this.adminService.getPosts({ page, pageSize: 10, search: this.postsFilter.trim() || undefined }).subscribe({
      next: (result) => {
        this.posts = result.items;
        this.postsTotalCount = result.totalCount;
      }
    });
  }

  loadComments(page: number): void {
    this.adminService.getComments({ page, pageSize: 10, search: this.commentsFilter.trim() || undefined }).subscribe({
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

  loadEmails(page: number): void {
    this.adminService.getEmails({ page, pageSize: 15 }).subscribe({
      next: (result) => {
        this.emails = result.items;
        this.emailsTotalCount = result.totalCount;
      }
    });
  }

  onEmailsPageChange(event: PageEvent): void {
    this.loadEmails(event.pageIndex + 1);
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

  formatPosts(): void {
    if (!confirm('This will convert all plain-text blog posts to formatted HTML. Proceed?')) return;
    this.isFormatting = true;
    this.adminService.formatExistingPosts().subscribe({
      next: (res: { message: string }) => {
        this.isFormatting = false;
        this.snackBar.open(res.message, 'Close', { duration: 8000 });
      },
      error: (err: any) => {
        this.isFormatting = false;
        this.snackBar.open(err.error?.message || 'Formatting failed', 'Close', { duration: 5000 });
      }
    });
  }

  runDataTool(): void {
    if (this.selectedDataTool === 'format-posts') {
      this.formatPosts();
    } else {
      this.seedData();
    }
  }

  runJob(job: 'email-queue' | 'post-scheduler' | 'health-check'): void {
    this.runningJob = job;
    this.adminService.runJob(job).subscribe({
      next: (res: { message: string }) => {
        this.runningJob = null;
        this.snackBar.open(res.message, 'Close', { duration: 6000 });
      },
      error: (err: any) => {
        this.runningJob = null;
        this.snackBar.open(err.error?.message || 'Job failed to run', 'Close', { duration: 5000 });
      }
    });
  }

  // --- Export ---

  exportUsers(): void {
    // Fetch all users for export
    this.adminService.getUsers({ page: 1, pageSize: 1000 }).subscribe({
      next: (result) => {
        const data = result.items.map(u => ({
          Username: u.userName,
          Email: u.email,
          Role: u.role,
          Status: u.isActive ? 'Active' : 'Inactive',
          Posts: u.postsCount,
          Comments: u.commentsCount,
          'Joined Date': new Date(u.createdAt).toLocaleDateString()
        }));
        this.exportService.exportToExcel(data, 'BlogSpot_Users', 'Users');
        this.snackBar.open('Users report downloaded', 'Close', { duration: 2000 });
      }
    });
  }

  exportPosts(): void {
    this.adminService.getPosts({ page: 1, pageSize: 1000 }).subscribe({
      next: (result) => {
        const data = result.items.map(p => ({
          Title: p.title,
          Author: p.authorUserName,
          Likes: p.likeCount,
          Comments: p.commentCount,
          Published: p.isPublished ? 'Yes' : 'No',
          'Created Date': new Date(p.createdAt).toLocaleDateString()
        }));
        this.exportService.exportToExcel(data, 'BlogSpot_Posts', 'Posts');
        this.snackBar.open('Posts report downloaded', 'Close', { duration: 2000 });
      }
    });
  }

  exportComments(): void {
    this.adminService.getComments({ page: 1, pageSize: 1000 }).subscribe({
      next: (result) => {
        const data = result.items.map(c => ({
          Comment: c.content,
          User: c.userName,
          'Post Title': c.postTitle,
          'Created Date': new Date(c.createdAt).toLocaleDateString()
        }));
        this.exportService.exportToExcel(data, 'BlogSpot_Comments', 'Comments');
        this.snackBar.open('Comments report downloaded', 'Close', { duration: 2000 });
      }
    });
  }

  exportViaEmail(type: string): void {
    const adminEmail = this.authService.currentUser?.email;
    if (!adminEmail) {
      this.snackBar.open('Admin email not found', 'Close', { duration: 3000 });
      return;
    }

    const buildHtml = (data: any[]) => {
      if (!data.length) return '<p>No data available.</p>';
      const headers = '<tr>' + Object.keys(data[0]).map(k => `<th style="padding:8px 12px;border:1px solid #ddd;background:#f7f9f9;text-align:left">${k}</th>`).join('') + '</tr>';
      const rows = data.map(row => '<tr>' + Object.values(row).map(v => `<td style="padding:6px 12px;border:1px solid #ddd">${v}</td>`).join('') + '</tr>').join('');
      return `<div style="font-family:sans-serif"><h2 style="color:#1d9bf0">BlogSpot ${type.charAt(0).toUpperCase() + type.slice(1)} Report</h2><table style="border-collapse:collapse;width:100%">${headers}${rows}</table></div>`;
    };

    if (type === 'users') {
      this.adminService.getUsers({ page: 1, pageSize: 10000 }).subscribe({
        next: (result) => {
          const data = result.items.map(u => ({ Username: u.userName, Email: u.email, Role: u.role, Status: u.isActive ? 'Active' : 'Inactive', Posts: u.postsCount, Comments: u.commentsCount, Joined: new Date(u.createdAt).toLocaleDateString() }));
          this.adminService.sendReportEmail(adminEmail, 'Users', buildHtml(data)).subscribe({
            next: () => this.snackBar.open('Report emailed to ' + adminEmail, 'Close', { duration: 3000 }),
            error: () => this.snackBar.open('Failed to queue email', 'Close', { duration: 3000 })
          });
        }
      });
    } else if (type === 'posts') {
      this.adminService.getPosts({ page: 1, pageSize: 10000 }).subscribe({
        next: (result) => {
          const data = result.items.map(p => ({ Title: p.title, Author: p.authorUserName, Likes: p.likeCount, Comments: p.commentCount, Published: p.isPublished ? 'Yes' : 'No', Date: new Date(p.createdAt).toLocaleDateString() }));
          this.adminService.sendReportEmail(adminEmail, 'Posts', buildHtml(data)).subscribe({
            next: () => this.snackBar.open('Report emailed to ' + adminEmail, 'Close', { duration: 3000 }),
            error: () => this.snackBar.open('Failed to queue email', 'Close', { duration: 3000 })
          });
        }
      });
    } else if (type === 'comments') {
      this.adminService.getComments({ page: 1, pageSize: 10000 }).subscribe({
        next: (result) => {
          const data = result.items.map(c => ({ Comment: c.content, User: c.userName, Post: c.postTitle, Date: new Date(c.createdAt).toLocaleDateString() }));
          this.adminService.sendReportEmail(adminEmail, 'Comments', buildHtml(data)).subscribe({
            next: () => this.snackBar.open('Report emailed to ' + adminEmail, 'Close', { duration: 3000 }),
            error: () => this.snackBar.open('Failed to queue email', 'Close', { duration: 3000 })
          });
        }
      });
    }
  }
}
