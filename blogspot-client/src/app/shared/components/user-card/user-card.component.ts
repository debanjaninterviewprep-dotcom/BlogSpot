import { Component, Input, Output, EventEmitter } from '@angular/core';
import { UserProfile } from '@core/models/user.model';

@Component({
  selector: 'app-user-card',
  template: `
    <div class="user-card" *ngIf="user">
      <a [routerLink]="['/profile', user.userName]" class="avatar-link">
        <img [src]="(user.profilePictureUrl | imageUrl) || 'assets/default-avatar.svg'"
             [alt]="user.userName" class="avatar">
      </a>
      <div class="details">
        <a [routerLink]="['/profile', user.userName]" class="display-name">
          {{ user.displayName || user.userName }}
        </a>
        <span class="handle">{{'@'}}{{ user.userName }}</span>
        <span class="stats">
          {{ user.followersCount }} followers · {{ user.postsCount }} posts
        </span>
      </div>
      <button class="remove-btn" *ngIf="showRemove"
              (click)="onRemove.emit(user.id)">
        Remove
      </button>
      <button class="follow-btn" *ngIf="!showRemove"
              [class.following]="user.isFollowedByCurrentUser"
              (click)="onFollow.emit(user.id)">
        {{ user.isFollowedByCurrentUser ? 'Following' : 'Follow' }}
      </button>
    </div>
  `,
  styles: [`
    .user-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      transition: background 0.15s;
      cursor: default;
    }
    .user-card:hover { background: var(--color-bg-hover); }
    .avatar-link { flex-shrink: 0; }
    .avatar {
      width: 44px; height: 44px;
      border-radius: 50%;
      object-fit: cover;
      transition: opacity 0.15s;
    }
    .avatar:hover { opacity: 0.85; }
    .details {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      gap: 1px;
    }
    .display-name {
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
      text-decoration: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.3;
    }
    .display-name:hover { text-decoration: underline; }
    .handle { font-size: var(--font-size-sm); color: var(--color-text-secondary); }
    .stats { font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-top: 2px; }
    .follow-btn {
      flex-shrink: 0;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      padding: 6px 16px;
      border-radius: 24px;
      border: none;
      background: var(--gradient-primary);
      color: #fff;
      cursor: pointer;
      transition: opacity 0.15s, background 0.15s, color 0.15s;
      font-family: inherit;
    }
    .follow-btn:hover { opacity: 0.85; }
    .follow-btn.following {
      background: transparent;
      color: var(--color-text-primary);
      border: 1px solid var(--color-border);
    }
    .follow-btn.following:hover {
      border-color: var(--color-danger);
      color: var(--color-danger);
      background: rgba(255, 107, 107, 0.08);
    }
    .remove-btn {
      flex-shrink: 0;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      padding: 6px 14px;
      border-radius: 24px;
      border: 1px solid var(--color-border);
      background: transparent;
      color: var(--color-danger);
      cursor: pointer;
      transition: background 0.15s;
      font-family: inherit;
    }
    .remove-btn:hover { background: rgba(255, 107, 107, 0.08); }
  `]
})
export class UserCardComponent {
  @Input() user!: UserProfile;
  @Input() showRemove = false;
  @Output() onFollow = new EventEmitter<string>();
  @Output() onRemove = new EventEmitter<string>();
}

