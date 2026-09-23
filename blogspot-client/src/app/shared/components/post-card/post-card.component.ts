import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BlogPost, ReactionType } from '@core/models/blog.model';
import { RepostDialogComponent, RepostDialogResult } from '../repost-dialog/repost-dialog.component';

@Component({
  selector: 'app-post-card',
  template: `
    <article class="post-card" *ngIf="post">
      <div class="repost-banner" *ngIf="post.feedRepost">
        <mat-icon>repeat</mat-icon>
        <a [routerLink]="['/profile', post.feedRepost.userName]" class="repost-banner-name">
          {{ post.feedRepost.displayName || post.feedRepost.userName }}
        </a>
        <span>reposted</span>
      </div>
      <p class="repost-banner-quote" *ngIf="post.feedRepost?.quote">{{ post.feedRepost?.quote }}</p>

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
        <p class="post-summary">{{ post.summary || stripHtml(post.content).slice(0, 200) + '...' }}</p>
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
                [attr.aria-label]="post.isLikedByCurrentUser ? 'Unlike post' : 'Like post'"
                (click)="like()">
          <span class="action-icon-wrap" [class.burst]="justLiked">
            <mat-icon>{{ post.isLikedByCurrentUser ? 'favorite' : 'favorite_border' }}</mat-icon>
            <span class="burst-ring" *ngIf="justLiked"></span>
          </span>
          <span class="action-count" *ngIf="post.likeCount">{{ post.likeCount }}</span>
        </button>

        <button class="action-btn comment-btn" aria-label="View comments" [routerLink]="['/blog', post.slug]">
          <span class="action-icon-wrap">
            <mat-icon>chat_bubble_outline</mat-icon>
          </span>
          <span class="action-count" *ngIf="post.commentCount">{{ post.commentCount }}</span>
        </button>

        <button class="action-btn repost-btn" [class.active]="post.isRepostedByCurrentUser"
                [matMenuTriggerFor]="repostMenu"
                [attr.aria-label]="post.isRepostedByCurrentUser ? 'Undo repost' : 'Repost'"
                [matTooltip]="post.isRepostedByCurrentUser ? 'Reposted — click for options' : 'Repost'">
          <span class="action-icon-wrap">
            <mat-icon>repeat</mat-icon>
          </span>
          <span class="action-count" *ngIf="post.repostCount">{{ post.repostCount }}</span>
        </button>
        <mat-menu #repostMenu="matMenu">
          <button mat-menu-item *ngIf="!post.isRepostedByCurrentUser" (click)="toggleRepost()">
            <mat-icon>repeat</mat-icon><span>Repost</span>
          </button>
          <button mat-menu-item *ngIf="!post.isRepostedByCurrentUser" (click)="openQuoteRepost()">
            <mat-icon>format_quote</mat-icon><span>Quote Repost</span>
          </button>
          <button mat-menu-item *ngIf="post.isRepostedByCurrentUser" (click)="toggleRepost()">
            <mat-icon>close</mat-icon><span>Remove Repost</span>
          </button>
        </mat-menu>

        <div class="reaction-group">
          <button class="action-btn reaction-btn" *ngFor="let r of reactionTypes"
                  [class.active]="post.currentUserReaction === r.type"
                  (click)="onReaction.emit({postId: post.id, type: r.type})"
                  [attr.aria-label]="r.type + ' reaction'"
                  [matTooltip]="r.type + (post.reactionCounts[r.type] ? ' (' + post.reactionCounts[r.type] + ')' : '')">
            <span class="reaction-emoji">{{ r.emoji }}</span>
            <span class="clap-count-badge" *ngIf="r.type === 'Clap' && post.currentUserReaction === 'Clap' && (post.currentUserReactionCount || 0) > 1">{{ post.currentUserReactionCount }}</span>
          </button>
        </div>

        <!-- Narrow screens get one trigger instead of a row of emoji buttons -->
        <button class="action-btn reaction-btn reaction-menu-btn"
                [class.active]="!!post.currentUserReaction"
                [matMenuTriggerFor]="reactionMenu"
                aria-label="React to this post">
          <span class="reaction-emoji" *ngIf="currentReactionEmoji">{{ currentReactionEmoji }}</span>
          <mat-icon *ngIf="!currentReactionEmoji">add_reaction</mat-icon>
          <span class="clap-count-badge" *ngIf="post.currentUserReaction === 'Clap' && (post.currentUserReactionCount || 0) > 1">{{ post.currentUserReactionCount }}</span>
        </button>
        <mat-menu #reactionMenu="matMenu">
          <button mat-menu-item *ngFor="let r of reactionTypes"
                  (click)="onReaction.emit({postId: post.id, type: r.type})">
            <span class="reaction-emoji menu-emoji">{{ r.emoji }}</span>
            <span>{{ r.type }}{{ post.reactionCounts[r.type] ? ' (' + post.reactionCounts[r.type] + ')' : '' }}</span>
          </button>
        </mat-menu>

        <span class="spacer"></span>

        <button class="action-btn view-btn" aria-label="View count">
          <span class="action-icon-wrap">
            <mat-icon>visibility</mat-icon>
          </span>
          <span class="action-count" *ngIf="post.viewCount">{{ post.viewCount }}</span>
        </button>

        <button class="action-btn bookmark-btn" [class.active]="post.isBookmarkedByCurrentUser"
                (click)="onBookmark.emit(post.id)"
                [attr.aria-label]="post.isBookmarkedByCurrentUser ? 'Remove bookmark' : 'Bookmark'"
                [matTooltip]="post.isBookmarkedByCurrentUser ? 'Remove bookmark' : 'Bookmark'">
          <span class="action-icon-wrap">
            <mat-icon>{{ post.isBookmarkedByCurrentUser ? 'bookmark' : 'bookmark_border' }}</mat-icon>
          </span>
        </button>
      </div>
    </article>
  `,
  styles: [`
    :host { display: block; }
    .post-card {
      padding: 16px 20px;
      position: relative;
      transition: background 0.15s, transform 0.2s ease, box-shadow 0.2s ease;
      cursor: default;
    }
    .post-card::after {
      content: '';
      position: absolute;
      left: 20px; right: 20px; bottom: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--color-border) 15%, var(--color-border) 85%, transparent);
    }
    .post-card:hover {
      background: var(--color-bg-hover);
      transform: translateY(-3px);
      box-shadow: var(--card-hover-shadow);
      position: relative;
      z-index: 1;
    }
    .repost-banner {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
      font-weight: var(--font-weight-medium);
      margin-bottom: 8px;
    }
    .repost-banner mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--color-success); }
    .repost-banner-name { color: var(--color-text-secondary); font-weight: var(--font-weight-bold); text-decoration: none; }
    .repost-banner-name:hover { text-decoration: underline; }
    .repost-banner-quote {
      font-size: var(--font-size-sm);
      color: var(--color-text-primary);
      margin: 0 0 8px;
      font-style: italic;
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
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-md);
      color: var(--color-text-primary);
      text-decoration: none;
      line-height: 1.3;
    }
    .author-name:hover { text-decoration: underline; }
    .author-handle {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      font-weight: var(--font-weight-normal);
    }
    .meta-line {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      display: flex;
      gap: 4px;
      margin-top: 1px;
    }
    .post-body-link { text-decoration: none; color: inherit; display: block; }
    .post-title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      margin: 8px 0 4px;
      line-height: 1.35;
      letter-spacing: -0.01em;
    }
    .post-summary {
      font-size: var(--font-size-base);
      color: var(--color-text-secondary);
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
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-primary);
      background: var(--color-primary-light);
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
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
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
      position: relative;
    }
    .action-icon-wrap.burst mat-icon {
      animation: likePop 0.4s ease;
    }
    .burst-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 2px solid var(--color-like);
      animation: burstRing 0.5s ease-out forwards;
      pointer-events: none;
    }
    @keyframes likePop {
      0% { transform: scale(1); }
      30% { transform: scale(1.5); }
      55% { transform: scale(0.9); }
      100% { transform: scale(1); }
    }
    @keyframes burstRing {
      0% { transform: scale(0.6); opacity: 0.6; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    .action-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .action-count { font-size: var(--font-size-sm); padding-right: 4px; }

    /* Like */
    .like-btn:hover { color: var(--color-like); }
    .like-btn:hover .action-icon-wrap { background: rgba(255, 107, 129, 0.1); }
    .like-btn.active { color: var(--color-like); }
    .like-btn.active mat-icon { color: var(--color-like); }

    /* Comment */
    .comment-btn:hover { color: var(--color-primary); }
    .comment-btn:hover .action-icon-wrap { background: var(--color-primary-light); }

    /* Bookmark */
    .bookmark-btn:hover { color: var(--color-primary); }
    .bookmark-btn:hover .action-icon-wrap { background: var(--color-primary-light); }
    .bookmark-btn.active { color: var(--color-primary); }

    /* Repost */
    .repost-btn:hover { color: var(--color-success); }
    .repost-btn:hover .action-icon-wrap { background: rgba(0, 184, 148, 0.1); }
    .repost-btn.active { color: var(--color-success); }

    /* View */
    .view-btn { cursor: default; }

    /* Reactions */
    .reaction-group { display: flex; align-items: center; gap: 2px; }
    .reaction-btn { padding: 4px 6px; border-radius: 50%; position: relative; }
    .reaction-btn:hover { background: var(--color-bg-hover); }
    .reaction-btn.active { background: var(--color-primary-light); }
    .reaction-emoji { font-size: 16px; line-height: 1; }
    .reaction-menu-btn { display: none; }
    .menu-emoji { margin-right: 10px; font-size: 18px; line-height: 1; }
    .clap-count-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      background: var(--color-primary);
      color: #fff;
      font-size: 9px;
      font-weight: var(--font-weight-bold);
      line-height: 1;
      padding: 2px 4px;
      border-radius: 8px;
      min-width: 14px;
      text-align: center;
    }
    .spacer { flex: 1; }

    @media (max-width: 600px) {
      .post-card { padding: 12px; }
      .author-avatar { width: 38px; height: 38px; }
      .post-title { font-size: var(--font-size-md); }
      .post-images { gap: 4px; }
      .post-image { width: 160px; height: 110px; }
      .action-icon-wrap { width: 30px; height: 30px; }
      /* One reaction trigger instead of three, so every action still fits on one row */
      .reaction-group { display: none; }
      .reaction-menu-btn { display: inline-flex; }
      .actions-bar { gap: 0; }
      .action-count { padding-right: 2px; }
    }
  `]
})
export class PostCardComponent {
  @Input() post!: BlogPost;
  @Output() onLike = new EventEmitter<string>();
  @Output() onBookmark = new EventEmitter<string>();
  @Output() onReaction = new EventEmitter<{ postId: string; type: ReactionType }>();
  @Output() onRepost = new EventEmitter<{ postId: string; quote?: string }>();

  constructor(private dialog: MatDialog) {}

  reactionTypes = [
    { type: 'Love' as ReactionType, emoji: '❤️' },
    { type: 'Fire' as ReactionType, emoji: '🔥' },
    { type: 'Clap' as ReactionType, emoji: '👏' },
  ];

  get currentReactionEmoji(): string | null {
    return this.reactionTypes.find(r => r.type === this.post?.currentUserReaction)?.emoji ?? null;
  }

  stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  justLiked = false;

  like(): void {
    this.onLike.emit(this.post.id);
    if (this.post.isLikedByCurrentUser) return; // only burst when going from unliked -> liked
    this.justLiked = true;
    setTimeout(() => this.justLiked = false, 500);
  }

  toggleRepost(): void {
    this.onRepost.emit({ postId: this.post.id });
  }

  openQuoteRepost(): void {
    const ref = this.dialog.open(RepostDialogComponent, { data: { post: this.post }, width: '480px' });
    ref.afterClosed().subscribe((result: RepostDialogResult | undefined) => {
      if (!result) return;
      this.onRepost.emit({ postId: this.post.id, quote: result.quote || undefined });
    });
  }
}
