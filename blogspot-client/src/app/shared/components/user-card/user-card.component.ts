import { Component, Input, Output, EventEmitter } from '@angular/core';
import { UserProfile } from '@core/models/user.model';

@Component({
  selector: 'app-user-card',
  template: `
    <mat-card class="user-card" *ngIf="user">
      <div class="user-info">
        <img [src]="user.profilePictureUrl || 'assets/default-avatar.svg'" 
             [alt]="user.userName" class="avatar">
        <div class="details">
          <a [routerLink]="['/profile', user.userName]" class="username">
            {{ user.displayName || user.userName }}
          </a>
          <span class="handle">{{'@'}}{{ user.userName }}</span>
          <span class="stats">
            {{ user.followersCount }} followers · {{ user.postsCount }} posts
          </span>
        </div>
        <button mat-raised-button 
                [color]="user.isFollowedByCurrentUser ? '' : 'primary'"
                (click)="onFollow.emit(user.id)">
          {{ user.isFollowedByCurrentUser ? 'Unfollow' : 'Follow' }}
        </button>
      </div>
    </mat-card>
  `,
  styles: [`
    .user-card {
      margin-bottom: 12px;
      padding: 16px;
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
    }
    .details {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .username {
      font-weight: 500;
      text-decoration: none;
      color: inherit;
    }
    .username:hover { text-decoration: underline; }
    .handle { font-size: 12px; color: #888; }
    .stats { font-size: 12px; color: #666; margin-top: 4px; }
  `]
})
export class UserCardComponent {
  @Input() user!: UserProfile;
  @Output() onFollow = new EventEmitter<string>();
}

