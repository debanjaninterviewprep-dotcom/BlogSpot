import { Component, Input, Output, EventEmitter } from '@angular/core';
import { BlogPost, ReactionType } from '@core/models/blog.model';

@Component({
  selector: 'app-post-card',
  template: `
    <mat-card class="post-card" *ngIf="post">
      <mat-card-header>
        <img mat-card-avatar 
             [src]="(post.authorProfilePictureUrl | imageUrl) || 'assets/default-avatar.svg'" 
             [alt]="post.authorUserName">
        <mat-card-title>
          <a [routerLink]="['/blog', post.slug]">{{ post.title }}</a>
        </mat-card-title>
        <mat-card-subtitle>
          <a [routerLink]="['/profile', post.authorUserName]">
            {{ post.authorDisplayName || post.authorUserName }}
          </a>
          · {{ post.createdAt | date:'mediumDate' }}
          <span class="reading-time" *ngIf="post.readingTimeMinutes">
            · {{ post.readingTimeMinutes }} min read
          </span>
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <div class="post-tags" *ngIf="post.tags?.length">
          <mat-chip-set>
            <mat-chip *ngFor="let tag of post.tags | slice:0:4" class="tag-chip">
              {{ tag }}
            </mat-chip>
          </mat-chip-set>
        </div>

        <p class="post-summary">{{ post.summary || (post.content | slice:0:200) + '...' }}</p>

        <div class="post-images" *ngIf="post.images?.length">
          <img *ngFor="let img of post.images | slice:0:3" 
               [src]="img.imageUrl | imageUrl" [alt]="img.altText || post.title" 
               class="post-image">
        </div>
      </mat-card-content>

      <mat-card-actions>
        <div class="reactions-bar">
          <button mat-button (click)="onLike.emit(post.id)" 
                  [color]="post.isLikedByCurrentUser ? 'warn' : ''">
            <mat-icon>{{ post.isLikedByCurrentUser ? 'favorite' : 'favorite_border' }}</mat-icon>
            {{ post.likeCount }}
          </button>

          <!-- Reaction buttons -->
          <div class="reaction-group">
            <button mat-icon-button class="reaction-btn" *ngFor="let r of reactionTypes"
                    [class.active]="post.currentUserReaction === r.type"
                    (click)="onReaction.emit({postId: post.id, type: r.type})" 
                    [matTooltip]="r.type">
              <span class="reaction-emoji">{{ r.emoji }}</span>
            </button>
          </div>

          <button mat-button [routerLink]="['/blog', post.slug]">
            <mat-icon>comment</mat-icon>
            {{ post.commentCount }}
          </button>

          <span class="spacer"></span>

          <button mat-icon-button (click)="onBookmark.emit(post.id)"
                  [matTooltip]="post.isBookmarkedByCurrentUser ? 'Remove bookmark' : 'Bookmark'">
            <mat-icon>{{ post.isBookmarkedByCurrentUser ? 'bookmark' : 'bookmark_border' }}</mat-icon>
          </button>

          <button mat-button>
            <mat-icon>visibility</mat-icon>
            {{ post.viewCount }}
          </button>
        </div>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .post-card {
      margin-bottom: 16px;
      cursor: pointer;
      transition: box-shadow 0.2s;
    }
    .post-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .post-summary {
      margin: 12px 0;
      color: #555;
      line-height: 1.6;
    }
    .post-images {
      display: flex;
      gap: 8px;
      overflow-x: auto;
    }
    .post-image {
      width: 200px;
      height: 140px;
      object-fit: cover;
      border-radius: 8px;
    }
    .post-tags {
      margin: 8px 0 4px;
    }
    .tag-chip {
      font-size: 12px;
    }
    .reading-time {
      color: #888;
    }
    mat-card-title a {
      text-decoration: none;
      color: inherit;
    }
    mat-card-title a:hover {
      color: #3f51b5;
    }
    mat-card-subtitle a {
      text-decoration: none;
      color: inherit;
    }
    mat-card-subtitle a:hover {
      text-decoration: underline;
    }
    .reactions-bar {
      display: flex;
      align-items: center;
      width: 100%;
    }
    .reaction-group {
      display: flex;
      align-items: center;
      margin: 0 4px;
    }
    .reaction-btn {
      width: 32px;
      height: 32px;
      padding: 0;
    }
    .reaction-btn.active {
      background-color: rgba(63, 81, 181, 0.12);
      border-radius: 50%;
    }
    .reaction-emoji {
      font-size: 16px;
    }
    .spacer { flex: 1; }
  `]
})
export class PostCardComponent {
  @Input() post!: BlogPost;
  @Output() onLike = new EventEmitter<string>();
  @Output() onBookmark = new EventEmitter<string>();
  @Output() onReaction = new EventEmitter<{ postId: string; type: ReactionType }>();

  reactionTypes = [
    { type: 'Love' as ReactionType, emoji: '❤️' },
    { type: 'Fire' as ReactionType, emoji: '🔥' },
    { type: 'Clap' as ReactionType, emoji: '👏' },
  ];
}
