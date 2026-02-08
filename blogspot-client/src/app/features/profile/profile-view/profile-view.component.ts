import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '@core/services/user.service';
import { BlogService } from '@core/services/blog.service';
import { AuthService } from '@core/services/auth.service';
import { UserProfile } from '@core/models/user.model';
import { BlogPost, ReactionType } from '@core/models/blog.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-profile-view',
  template: `
    <div class="profile-container" *ngIf="profile">
      <!-- Cover Photo -->
      <div class="cover-photo" [style.backgroundImage]="profile.coverPhotoUrl ? 'url(' + (profile.coverPhotoUrl | imageUrl) + ')' : ''">
        <div class="cover-overlay"></div>
      </div>

      <mat-card class="profile-header">
        <div class="profile-top">
          <img [src]="(profile.profilePictureUrl | imageUrl) || 'assets/default-avatar.svg'" 
               class="profile-avatar" [alt]="profile.userName">
          <div class="profile-info">
            <h1>{{ profile.displayName || profile.userName }}</h1>
            <p class="handle">{{'@'}}{{ profile.userName }}</p>
            <p class="bio" *ngIf="profile.bio">{{ profile.bio }}</p>

            <!-- Skills -->
            <div class="skills" *ngIf="profile.skills?.length">
              <mat-chip-set>
                <mat-chip *ngFor="let skill of profile.skills" highlighted>
                  {{ skill }}
                </mat-chip>
              </mat-chip-set>
            </div>

            <div class="meta">
              <span *ngIf="profile.location">
                <mat-icon inline>location_on</mat-icon> {{ profile.location }}
              </span>
              <span *ngIf="profile.website">
                <mat-icon inline>link</mat-icon>
                <a [href]="profile.website" target="_blank">{{ profile.website }}</a>
              </span>
              <span>
                <mat-icon inline>calendar_today</mat-icon>
                Joined {{ profile.joinedAt | date:'MMMM yyyy' }}
              </span>
            </div>

            <!-- Social Links -->
            <div class="social-links" *ngIf="profile.socialLinks">
              <a *ngIf="profile.socialLinks.github" [href]="profile.socialLinks.github"
                 target="_blank" mat-icon-button matTooltip="GitHub">
                <mat-icon>code</mat-icon>
              </a>
              <a *ngIf="profile.socialLinks.twitter" [href]="profile.socialLinks.twitter"
                 target="_blank" mat-icon-button matTooltip="Twitter">
                <mat-icon>tag</mat-icon>
              </a>
              <a *ngIf="profile.socialLinks.linkedin" [href]="profile.socialLinks.linkedin"
                 target="_blank" mat-icon-button matTooltip="LinkedIn">
                <mat-icon>work</mat-icon>
              </a>
            </div>

            <div class="stats">
              <span><strong>{{ profile.postsCount }}</strong> Posts</span>
              <span><strong>{{ profile.followersCount }}</strong> Followers</span>
              <span><strong>{{ profile.followingCount }}</strong> Following</span>
            </div>
          </div>
          <div class="profile-actions">
            <button mat-raised-button color="primary" *ngIf="isOwnProfile" 
                    routerLink="/profile/edit">
              <mat-icon>edit</mat-icon> Edit Profile
            </button>
            <button mat-stroked-button *ngIf="isOwnProfile"
                    routerLink="/profile/analytics">
              <mat-icon>analytics</mat-icon> Analytics
            </button>
            <button mat-raised-button *ngIf="!isOwnProfile && authService.isLoggedIn"
                    [color]="profile.isFollowedByCurrentUser ? '' : 'primary'"
                    (click)="toggleFollow()">
              {{ profile.isFollowedByCurrentUser ? 'Unfollow' : 'Follow' }}
            </button>
          </div>
        </div>
      </mat-card>

      <mat-tab-group class="mt-2">
        <mat-tab label="Posts">
          <div class="tab-content">
            <app-loading-spinner *ngIf="loadingPosts"></app-loading-spinner>
            <app-post-card *ngFor="let post of posts" [post]="post"
                           (onLike)="toggleLike($event)"
                           (onBookmark)="toggleBookmark($event)"
                           (onReaction)="toggleReaction($event)">
            </app-post-card>
            <div *ngIf="!loadingPosts && posts.length === 0" class="empty-state">
              <p>No posts yet</p>
            </div>
          </div>
        </mat-tab>
        <mat-tab [label]="'Followers (' + profile.followersCount + ')'">
          <div class="tab-content">
            <app-user-card *ngFor="let user of followers" [user]="user"
                           (onFollow)="toggleFollowUser($event)">
            </app-user-card>
          </div>
        </mat-tab>
        <mat-tab [label]="'Following (' + profile.followingCount + ')'">
          <div class="tab-content">
            <app-user-card *ngFor="let user of following" [user]="user"
                           (onFollow)="toggleFollowUser($event)">
            </app-user-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>

    <app-loading-spinner *ngIf="loading"></app-loading-spinner>
  `,
  styles: [`
    .profile-container { max-width: 800px; margin: 0 auto; }
    .cover-photo {
      height: 200px;
      background: linear-gradient(135deg, #3f51b5, #7986cb);
      background-size: cover;
      background-position: center;
      border-radius: 8px 8px 0 0;
      position: relative;
    }
    .cover-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(transparent 50%, rgba(0,0,0,0.3));
      border-radius: 8px 8px 0 0;
    }
    .profile-header { padding: 32px; margin-top: -40px; position: relative; z-index: 1; }
    .profile-top { display: flex; gap: 24px; align-items: flex-start; }
    .profile-avatar {
      width: 120px; height: 120px; border-radius: 50%; object-fit: cover;
      border: 4px solid white; margin-top: -60px; background: white;
    }
    .profile-info { flex: 1; }
    .profile-info h1 { margin: 0; }
    .handle { color: #888; margin: 4px 0 12px; }
    .bio { margin-bottom: 12px; line-height: 1.5; }
    .skills { margin-bottom: 12px; }
    .social-links { display: flex; gap: 4px; margin-bottom: 8px; }
    .social-links a { color: #666; }
    .social-links a:hover { color: #3f51b5; }
    .meta { display: flex; flex-wrap: wrap; gap: 16px; color: #666; font-size: 14px; margin-bottom: 12px; }
    .meta span { display: flex; align-items: center; gap: 4px; }
    .meta a { color: #3f51b5; text-decoration: none; }
    .stats { display: flex; gap: 24px; }
    .stats span { cursor: pointer; }
    .profile-actions { display: flex; flex-direction: column; gap: 8px; }
    .tab-content { padding: 16px 0; }
    .empty-state { text-align: center; padding: 32px; color: #888; }
  `]
})
export class ProfileViewComponent implements OnInit {
  profile: UserProfile | null = null;
  posts: BlogPost[] = [];
  followers: UserProfile[] = [];
  following: UserProfile[] = [];
  loading = true;
  loadingPosts = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private blogService: BlogService,
    public authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  get isOwnProfile(): boolean {
    return this.profile?.id === this.authService.currentUser?.id;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const username = params.get('username');
      if (username) {
        this.loadByUsername(username);
      } else if (this.authService.currentUser) {
        this.loadByUsername(this.authService.currentUser.userName);
      }
    });
  }

  loadByUsername(username: string): void {
    this.loading = true;
    this.userService.getProfileByUserName(username).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.loading = false;
        this.loadUserPosts();
        this.loadFollowers();
        this.loadFollowing();
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Profile not found', 'Close', { duration: 3000 });
        this.router.navigate(['/feed']);
      }
    });
  }

  loadUserPosts(): void {
    if (!this.profile) return;
    this.loadingPosts = true;
    this.blogService.getPostsByUser(this.profile.id, { page: 1, pageSize: 20 }).subscribe({
      next: (result) => { this.posts = result.items; this.loadingPosts = false; },
      error: () => this.loadingPosts = false
    });
  }

  loadFollowers(): void {
    if (!this.profile) return;
    this.userService.getFollowers(this.profile.id, { page: 1, pageSize: 20 }).subscribe({
      next: (result) => this.followers = result.items
    });
  }

  loadFollowing(): void {
    if (!this.profile) return;
    this.userService.getFollowing(this.profile.id, { page: 1, pageSize: 20 }).subscribe({
      next: (result) => this.following = result.items
    });
  }

  toggleFollow(): void {
    if (!this.profile) return;
    this.userService.toggleFollow(this.profile.id).subscribe({
      next: (result) => {
        if (this.profile) {
          this.profile.isFollowedByCurrentUser = result.isFollowing;
          this.profile.followersCount += result.isFollowing ? 1 : -1;
        }
      }
    });
  }

  toggleFollowUser(userId: string): void {
    this.userService.toggleFollow(userId).subscribe({
      next: (result) => {
        const updateUser = (users: UserProfile[]) => {
          const user = users.find(u => u.id === userId);
          if (user) user.isFollowedByCurrentUser = result.isFollowing;
        };
        updateUser(this.followers);
        updateUser(this.following);
      }
    });
  }

  toggleLike(postId: string): void {
    if (!this.authService.isLoggedIn) return;
    this.blogService.toggleLike(postId).subscribe({
      next: (result) => {
        const post = this.posts.find(p => p.id === postId);
        if (post) {
          post.isLikedByCurrentUser = result.liked;
          post.likeCount += result.liked ? 1 : -1;
        }
      }
    });
  }

  toggleBookmark(postId: string): void {
    this.blogService.toggleBookmark(postId).subscribe({
      next: (result) => {
        const post = this.posts.find(p => p.id === postId);
        if (post) post.isBookmarkedByCurrentUser = result.bookmarked;
      }
    });
  }

  toggleReaction(event: { postId: string; type: ReactionType }): void {
    this.blogService.toggleReaction(event.postId, { type: event.type }).subscribe({
      next: (result) => {
        const post = this.posts.find(p => p.id === event.postId);
        if (post) {
          post.reactionCounts = result.counts;
          post.currentUserReaction = result.currentUserReaction;
        }
      }
    });
  }
}
