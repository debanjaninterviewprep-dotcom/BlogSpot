import { Component, Input, Output, EventEmitter } from '@angular/core';
import { BlogPost, ReactionType } from '@core/models/blog.model';

@Component({
  selector: 'app-post-card',
  template: `
    <article class="post-card" *ngIf="post">
      <div class="post-header">
        <a [routerLink]="['/profile', post.authorUserName]" class="author-avatar-link">
          <img [src]="(post.authorProfilePictureUrl | imageUrl) || 'assets/default-avatar.svg'"
               [alt]="post.authorUserName" class="author-avatar">
        </a>
        <div class="post-meta">
          <div class="author-line">
            <a [routerLink]="['/profile', post.authorUserName]" class="author-name">
              {{ post.authorDisplayName || post.authorUserName }}
            </a>
            <span class="author-handle">{{'@'}}{{ post.authorUserName }}</span>
          </div>
          <div class="meta-line">
            <span>{{ post.createdAt | date:'MMM d, yyyy' }}</span>
            <span *ngIf="post.readingTimeMinutes">· {{ post.readingTimeMinutes }} min read</span>
          </div>
        </div>
      </div>

      <a [routerLink]="['/blog', post.slug]" class="post-body-link">
        <h3 class="post-title">{{ post.title }}</h3>
        <p class="post-summary">{{ post.summary || (post.content | slice:0:200) + '...' }}</p>
      </a>

      <div class="post-tags" *ngIf="post.tags?.length">
        <span class="tag" *ngFor="let tag of post.tags | slice:0:4">{{ tag }}</span>
      </div>

      <div class="post-images" *ngIf="post.images?.length">
        <img *ngFor="let img of post.images | slice:0:3"
             [src]="img.imageUrl | imageUrl" [alt]="img.altText || post.title"
             class="post-image">
      </div>

      <div class="actions-bar">
        <button class="action-btn like-btn" [class.active]="post.isLikedByCurrentUser"
                (click)="onLike.emit(post.id)">
          <span class="action-icon-wrap">
            <mat-icon>{{ post.isLikedByCurrentUser ? 'favorite' : 'favorite_border' }}</mat-icon>
          </span>
          <span class="action-count" *ngIf="post.likeCount">{{ post.likeCount }}</span>
        </button>

        <button class="action-btn comment-btn" [routerLink]="['/blog', post.slug]">
          <span class="action-icon-wrap">
            <mat-icon>chat_bubble_outline</mat-icon>
          </span>
          <span class="action-count" *ngIf="post.commentCount">{{ post.commentCount }}</span>
        </button>

        <div class="reaction-group">
          <button class="action-btn reaction-btn" *ngFor="let r of reactionTypes"
                  [class.active]="post.currentUserReaction === r.type"
                  (click)="onReaction.emit({postId: post.id, type: r.type})"
                  [matTooltip]="r.type">
            <span class="reaction-emoji">{{ r.emoji }}</span>
          </button>
        </div>

        <span class="spacer"></span>

        <button class="action-btn view-btn">
          <span class="action-icon-wrap">
            <mat-icon>visibility</mat-icon>
          </span>
          <span class="action-count" *ngIf="post.viewCount">{{ post.viewCount }}</span>
        </button>

        <button class="action-btn bookmark-btn" [class.active]="post.isBookmarkedByCurrentUser"
                (click)="onBookmark.emit(post.id)"
                [matTooltip]="post.isBookmarkedByCurrentUser ? 'Remove bookmark' : 'Bookmark'">
          <span class="action-icon-wrap">
            <mat-icon>{{ post.isBookmarkedByCurrentUser ? 'bookmark' : 'bookmark_border' }}</mat-icon>
          </span>
        </button>
      </div>
    </article>
  `,
  styles: [`
    .post-card {
      padding: 16px 20px;
      border-bottom: 1px solid #eff3f4;
      transition: background 0.15s;
      cursor: default;
    }
    .post-card:hover {
      background: rgba(0,0,0,0.015);
    }
    .post-header {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      margin-bottom: 4px;
    }
    .author-avatar-link { flex-shrink: 0; }
    .author-avatar {
      width: 44px; height: 44px;
      border-radius: 50%;
      object-fit: cover;
      transition: opacity 0.15s;
    }
    .author-avatar:hover { opacity: 0.85; }
    .post-meta { flex: 1; min-width: 0; }
    .author-line {
      display: flex;
      align-items: baseline;
      gap: 6px;
      flex-wrap: wrap;
    }
    .author-name {
      font-weight: 700;
      font-size: 15px;
      color: #0f1419;
      text-decoration: none;
      line-height: 1.3;
    }
    .author-name:hover { text-decoration: underline; }
    .author-handle {
      font-size: 13px;
      color: #536471;
      font-weight: 400;
    }
    .meta-line {
      font-size: 13px;
      color: #536471;
      display: flex;
      gap: 4px;
      margin-top: 1px;
    }
    .post-body-link { text-decoration: none; color: inherit; display: block; }
    .post-title {
      font-size: 18px;
      font-weight: 700;
      color: #0f1419;
      margin: 8px 0 4px;
      line-height: 1.35;
      letter-spacing: -0.01em;
    }
    .post-summary {
      font-size: 14px;
      color: #536471;
      line-height: 1.55;
      margin: 0 0 8px;
    }
    .post-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 10px;
    }
    .tag {
      font-size: 12px;
      font-weight: 500;
      color: #1d9bf0;
      background: rgba(29,155,240,0.08);
      padding: 3px 10px;
      border-radius: 16px;
      cursor: default;
    }
    .post-images {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      margin-bottom: 8px;
      border-radius: 12px;
      overflow: hidden;
    }
    .post-image {
      width: 200px;
      height: 140px;
      object-fit: cover;
      border-radius: 12px;
    }
    .actions-bar {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 8px;
    }
    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 50px;
      font-size: 13px;
      color: #536471;
      transition: color 0.15s;
      text-decoration: none;
      font-family: inherit;
    }
    .action-icon-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 34px; height: 34px;
      border-radius: 50%;
      transition: background 0.15s;
    }
    .action-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .action-count { font-size: 13px; padding-right: 4px; }

    /* Like */
    .like-btn:hover { color: #f91880; }
    .like-btn:hover .action-icon-wrap { background: rgba(249,24,128,0.1); }
    .like-btn.active { color: #f91880; }
    .like-btn.active mat-icon { color: #f91880; }

    /* Comment */
    .comment-btn:hover { color: #1d9bf0; }
    .comment-btn:hover .action-icon-wrap { background: rgba(29,155,240,0.1); }

    /* Bookmark */
    .bookmark-btn:hover { color: #1d9bf0; }
    .bookmark-btn:hover .action-icon-wrap { background: rgba(29,155,240,0.1); }
    .bookmark-btn.active { color: #1d9bf0; }

    /* View */
    .view-btn { cursor: default; }

    /* Reactions */
    .reaction-group { display: flex; align-items: center; gap: 2px; }
    .reaction-btn { padding: 4px 6px; border-radius: 50%; }
    .reaction-btn:hover { background: rgba(0,0,0,0.06); }
    .reaction-btn.active { background: rgba(29,155,240,0.1); }
    .reaction-emoji { font-size: 16px; line-height: 1; }
    .spacer { flex: 1; }

    @media (max-width: 599px) {
      .post-card { padding: 12px; }
      .author-avatar { width: 38px; height: 38px; }
      .post-title { font-size: 16px; }
      .post-images { gap: 4px; }
      .post-image { width: 160px; height: 110px; }
      .action-icon-wrap { width: 30px; height: 30px; }
    }
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
