import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BlogService } from '@core/services/blog.service';
import { AuthService } from '@core/services/auth.service';
import { BlogPost, Comment, ReactionType, ReactionSummaryDto } from '@core/models/blog.model';

@Component({
  selector: 'app-blog-detail',
  template: `
    <div class="detail-container" *ngIf="post">
      <mat-card class="post-detail">
        <div class="post-header">
          <div class="author-info">
            <img [src]="post.authorProfilePictureUrl || 'assets/default-avatar.svg'" 
                 class="author-avatar" [alt]="post.authorUserName">
            <div>
              <a [routerLink]="['/profile', post.authorUserName]" class="author-name">
                {{ post.authorDisplayName || post.authorUserName }}
              </a>
              <p class="post-date">
                {{ post.createdAt | date:'fullDate' }} · {{ post.viewCount }} views
                <span *ngIf="post.readingTimeMinutes"> · {{ post.readingTimeMinutes }} min read</span>
              </p>
            </div>
          </div>
          <div class="post-actions" *ngIf="isAuthor">
            <button mat-icon-button [routerLink]="['/blog/edit', post.id]" matTooltip="Edit">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn" (click)="deletePost()" matTooltip="Delete">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </div>

        <h1 class="post-title">{{ post.title }}</h1>

        <!-- Tags -->
        <div class="post-tags" *ngIf="post.tags?.length">
          <mat-chip-set>
            <mat-chip *ngFor="let tag of post.tags">{{ tag }}</mat-chip>
          </mat-chip-set>
        </div>

        <!-- Category -->
        <div class="post-category" *ngIf="post.category">
          <mat-chip color="primary" selected>{{ post.category }}</mat-chip>
        </div>

        <div class="post-images" *ngIf="post.images?.length">
          <img *ngFor="let img of post.images" [src]="img.imageUrl" 
               [alt]="img.altText || post.title" class="post-image">
        </div>

        <div class="post-content" [innerHTML]="post.content"></div>

        <mat-divider></mat-divider>

        <!-- Engagement: Reactions + Bookmark -->
        <div class="post-engagement">
          <div class="reaction-bar">
            <button mat-button (click)="toggleLike()"
                    [color]="post.isLikedByCurrentUser ? 'warn' : ''">
              <mat-icon>{{ post.isLikedByCurrentUser ? 'favorite' : 'favorite_border' }}</mat-icon>
              {{ post.likeCount }}
            </button>

            <div class="emoji-reactions">
              <button mat-icon-button *ngFor="let r of reactionTypes"
                      class="reaction-btn"
                      [class.active]="post.currentUserReaction === r.type"
                      (click)="toggleReaction(r.type)"
                      [matTooltip]="r.type + (reactionSummary?.counts?.[r.type] ? ' (' + reactionSummary!.counts![r.type] + ')' : '')">
                <span class="reaction-emoji">{{ r.emoji }}</span>
              </button>
            </div>

            <span class="comment-count">
              <mat-icon>comment</mat-icon>
              {{ post.commentCount }} Comments
            </span>
          </div>

          <button mat-icon-button (click)="toggleBookmark()"
                  [matTooltip]="post.isBookmarkedByCurrentUser ? 'Remove bookmark' : 'Save post'">
            <mat-icon>{{ post.isBookmarkedByCurrentUser ? 'bookmark' : 'bookmark_border' }}</mat-icon>
          </button>
        </div>

        <mat-divider></mat-divider>

        <!-- Comment Section -->
        <div class="comments-section">
          <h3>Comments</h3>

          <form [formGroup]="commentForm" (ngSubmit)="addComment()" 
                *ngIf="authService.isLoggedIn" class="comment-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Write a comment...</mat-label>
              <textarea matInput formControlName="content" rows="3"></textarea>
            </mat-form-field>
            <button mat-raised-button color="primary" type="submit" 
                    [disabled]="commentForm.invalid">
              Post Comment
            </button>
          </form>

          <app-loading-spinner *ngIf="loadingComments"></app-loading-spinner>

          <div *ngFor="let comment of comments" class="comment">
            <div class="comment-header">
              <img [src]="comment.userProfilePictureUrl || 'assets/default-avatar.svg'" 
                   class="comment-avatar">
              <div>
                <a [routerLink]="['/profile', comment.userName]" class="comment-author">
                  {{ comment.userDisplayName || comment.userName }}
                </a>
                <span class="comment-date">{{ comment.createdAt | date:'medium' }}</span>
              </div>
              <button mat-icon-button *ngIf="comment.userId === authService.currentUser?.id"
                      (click)="deleteComment(comment.id)">
                <mat-icon>delete_outline</mat-icon>
              </button>
            </div>
            <p class="comment-content">{{ comment.content }}</p>

            <!-- Reply action -->
            <button mat-button class="reply-btn" *ngIf="authService.isLoggedIn"
                    (click)="replyingTo = replyingTo === comment.id ? null : comment.id">
              <mat-icon>reply</mat-icon> Reply
            </button>

            <!-- Reply form -->
            <div *ngIf="replyingTo === comment.id" class="reply-form">
              <mat-form-field appearance="outline" class="full-width">
                <input matInput placeholder="Write a reply..." [(ngModel)]="replyContent">
              </mat-form-field>
              <button mat-raised-button color="primary" (click)="addReply(comment.id)"
                      [disabled]="!replyContent?.trim()">Reply</button>
            </div>

            <!-- Replies -->
            <div *ngFor="let reply of comment.replies" class="reply">
              <div class="comment-header">
                <img [src]="reply.userProfilePictureUrl || 'assets/default-avatar.svg'" 
                     class="comment-avatar small">
                <a [routerLink]="['/profile', reply.userName]" class="comment-author">
                  {{ reply.userDisplayName || reply.userName }}
                </a>
                <span class="comment-date">{{ reply.createdAt | date:'medium' }}</span>
              </div>
              <p class="comment-content">{{ reply.content }}</p>
            </div>
          </div>

          <button mat-stroked-button class="full-width mt-2" 
                  *ngIf="commentsHasMore" (click)="loadMoreComments()">
            Load More Comments
          </button>
        </div>
      </mat-card>
    </div>

    <app-loading-spinner *ngIf="loading"></app-loading-spinner>
  `,
  styles: [`
    .detail-container { max-width: 800px; margin: 0 auto; }
    .post-detail { padding: 32px; }
    .post-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .author-info { display: flex; align-items: center; gap: 12px; }
    .author-avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; }
    .author-name { text-decoration: none; font-weight: 500; color: #333; }
    .author-name:hover { text-decoration: underline; }
    .post-date { font-size: 13px; color: #888; margin: 0; }
    .post-title { font-size: 32px; font-weight: 700; margin: 0 0 16px 0; line-height: 1.3; }
    .post-tags { margin-bottom: 12px; }
    .post-category { margin-bottom: 16px; }
    .post-images { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; }
    .post-image { max-width: 100%; max-height: 400px; border-radius: 8px; object-fit: cover; }
    .post-content { line-height: 1.8; font-size: 16px; margin-bottom: 24px; }
    .post-engagement { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; }
    .reaction-bar { display: flex; align-items: center; gap: 12px; }
    .emoji-reactions { display: flex; gap: 4px; }
    .reaction-btn { width: 36px; height: 36px; }
    .reaction-btn.active { background: rgba(63,81,181,0.12); border-radius: 50%; }
    .reaction-emoji { font-size: 18px; }
    .comment-count { display: flex; align-items: center; gap: 4px; color: #666; }
    .comments-section { margin-top: 24px; }
    .comment-form { margin-bottom: 24px; }
    .comment { padding: 12px 0; border-bottom: 1px solid #eee; }
    .comment-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .comment-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
    .comment-avatar.small { width: 24px; height: 24px; }
    .comment-author { text-decoration: none; font-weight: 500; color: #333; font-size: 14px; }
    .comment-date { font-size: 12px; color: #999; }
    .comment-content { margin: 0; line-height: 1.5; }
    .reply { margin-left: 40px; padding: 8px 0; }
    .reply-btn { font-size: 12px; margin-top: 4px; }
    .reply-form { margin-left: 40px; display: flex; gap: 8px; align-items: center; margin-top: 8px; }
  `]
})
export class BlogDetailComponent implements OnInit {
  post: BlogPost | null = null;
  comments: Comment[] = [];
  commentForm: FormGroup;
  loading = true;
  loadingComments = false;
  commentPage = 1;
  commentsHasMore = false;
  reactionSummary: ReactionSummaryDto | null = null;
  replyingTo: string | null = null;
  replyContent = '';

  reactionTypes = [
    { type: 'Love' as ReactionType, emoji: '❤️' },
    { type: 'Fire' as ReactionType, emoji: '🔥' },
    { type: 'Clap' as ReactionType, emoji: '👏' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private blogService: BlogService,
    public authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.commentForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  get isAuthor(): boolean {
    return this.post?.authorId === this.authService.currentUser?.id;
  }

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.blogService.getPostBySlug(slug).subscribe({
      next: (post) => {
        this.post = post;
        this.loading = false;
        this.loadComments();
        this.loadReactions();
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Post not found', 'Close', { duration: 3000 });
        this.router.navigate(['/feed']);
      }
    });
  }

  loadComments(): void {
    if (!this.post) return;
    this.loadingComments = true;
    this.blogService.getComments(this.post.id, { page: this.commentPage, pageSize: 10 }).subscribe({
      next: (result) => {
        this.comments = [...this.comments, ...result.items];
        this.commentsHasMore = result.hasNextPage;
        this.loadingComments = false;
      },
      error: () => this.loadingComments = false
    });
  }

  loadReactions(): void {
    if (!this.post) return;
    this.blogService.getReactions(this.post.id).subscribe({
      next: summary => this.reactionSummary = summary
    });
  }

  loadMoreComments(): void {
    this.commentPage++;
    this.loadComments();
  }

  toggleLike(): void {
    if (!this.post || !this.authService.isLoggedIn) return;
    this.blogService.toggleLike(this.post.id).subscribe({
      next: (result) => {
        if (this.post) {
          this.post.isLikedByCurrentUser = result.liked;
          this.post.likeCount += result.liked ? 1 : -1;
        }
      }
    });
  }

  toggleReaction(type: ReactionType): void {
    if (!this.post || !this.authService.isLoggedIn) return;
    this.blogService.toggleReaction(this.post.id, { type }).subscribe({
      next: (summary) => {
        this.reactionSummary = summary;
        if (this.post) {
          this.post.currentUserReaction = summary.currentUserReaction;
          this.post.reactionCounts = summary.counts;
        }
      }
    });
  }

  toggleBookmark(): void {
    if (!this.post || !this.authService.isLoggedIn) return;
    this.blogService.toggleBookmark(this.post.id).subscribe({
      next: (result) => {
        if (this.post) {
          this.post.isBookmarkedByCurrentUser = result.bookmarked;
          this.snackBar.open(result.bookmarked ? 'Post saved!' : 'Bookmark removed', 'Close', { duration: 2000 });
        }
      }
    });
  }

  addComment(): void {
    if (!this.post || this.commentForm.invalid) return;
    this.blogService.addComment(this.post.id, this.commentForm.value).subscribe({
      next: (comment) => {
        this.comments.unshift(comment);
        this.commentForm.reset();
        if (this.post) this.post.commentCount++;
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to add comment', 'Close', { duration: 3000 });
      }
    });
  }

  addReply(parentCommentId: string): void {
    if (!this.post || !this.replyContent?.trim()) return;
    this.blogService.addComment(this.post.id, {
      content: this.replyContent,
      parentCommentId
    }).subscribe({
      next: (reply) => {
        const parent = this.comments.find(c => c.id === parentCommentId);
        if (parent) {
          if (!parent.replies) parent.replies = [];
          parent.replies.push(reply);
        }
        this.replyContent = '';
        this.replyingTo = null;
        if (this.post) this.post.commentCount++;
      }
    });
  }

  deleteComment(commentId: string): void {
    this.blogService.deleteComment(commentId).subscribe({
      next: () => {
        this.comments = this.comments.filter(c => c.id !== commentId);
        if (this.post) this.post.commentCount--;
      }
    });
  }

  deletePost(): void {
    if (!this.post || !confirm('Are you sure you want to delete this post?')) return;
    this.blogService.deletePost(this.post.id).subscribe({
      next: () => {
        this.snackBar.open('Post deleted', 'Close', { duration: 3000 });
        this.router.navigate(['/feed']);
      }
    });
  }
}
