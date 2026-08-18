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
    .user-card:hover { background: rgba(0,0,0,0.03); }
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
      font-weight: 700;
      font-size: 14px;
      color: #0f1419;
      text-decoration: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.3;
    }
    .display-name:hover { text-decoration: underline; }
    .handle { font-size: 13px; color: #536471; }
    .stats { font-size: 12px; color: #536471; margin-top: 2px; }
    .follow-btn {
      flex-shrink: 0;
      font-size: 13px;
      font-weight: 700;
      padding: 6px 16px;
      border-radius: 24px;
      border: none;
      background: #0f1419;
      color: #fff;
      cursor: pointer;
      transition: opacity 0.15s, background 0.15s, color 0.15s;
      font-family: inherit;
    }
    .follow-btn:hover { opacity: 0.85; }
    .follow-btn.following {
      background: transparent;
      color: #0f1419;
      border: 1px solid #cfd9de;
    }
    .follow-btn.following:hover {
      border-color: #f4212e;
      color: #f4212e;
      background: rgba(244,33,46,0.06);
    }
    .remove-btn {
      flex-shrink: 0;
      font-size: 13px;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 24px;
      border: 1px solid #cfd9de;
      background: transparent;
      color: #f4212e;
      cursor: pointer;
      transition: background 0.15s;
      font-family: inherit;
    }
    .remove-btn:hover { background: rgba(244,33,46,0.06); }
  `]
})
export class UserCardComponent {
  @Input() user!: UserProfile;
  @Input() showRemove = false;
  @Output() onFollow = new EventEmitter<string>();
  @Output() onRemove = new EventEmitter<string>();
}

