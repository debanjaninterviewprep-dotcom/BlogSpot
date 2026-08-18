import { Component, OnInit } from '@angular/core';
import { UserService } from '@core/services/user.service';
import { CreatorAnalytics } from '@core/models/user.model';

@Component({
  selector: 'app-analytics',
  template: `
    <div class="analytics-container">
      <h2>Creator Analytics</h2>

      <app-loading-spinner *ngIf="loading"></app-loading-spinner>

      <div *ngIf="analytics" class="analytics-content">
        <!-- Stats Overview -->
        <div class="stats-grid">
          <mat-card class="stat-card">
            <mat-icon>visibility</mat-icon>
            <div class="stat-value">{{ analytics.totalViews | number }}</div>
            <div class="stat-label">Total Views</div>
          </mat-card>
          <mat-card class="stat-card">
            <mat-icon>favorite</mat-icon>
            <div class="stat-value">{{ analytics.totalReactions | number }}</div>
            <div class="stat-label">Total Reactions</div>
          </mat-card>
          <mat-card class="stat-card">
            <mat-icon>comment</mat-icon>
            <div class="stat-value">{{ analytics.totalComments | number }}</div>
            <div class="stat-label">Total Comments</div>
          </mat-card>
          <mat-card class="stat-card">
            <mat-icon>people</mat-icon>
            <div class="stat-value">{{ analytics.totalFollowers | number }}</div>
            <div class="stat-label">Followers</div>
            <div class="stat-growth" *ngIf="analytics.followersGrowth30d > 0">
              +{{ analytics.followersGrowth30d }} this month
            </div>
          </mat-card>
        </div>

        <!-- Top Posts -->
        <mat-card class="mt-3" *ngIf="analytics.topPosts?.length">
          <mat-card-header>
            <mat-card-title>Top Performing Posts</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-list>
              <mat-list-item *ngFor="let post of analytics.topPosts; let i = index">
                <div class="top-post">
                  <span class="rank">#{{ i + 1 }}</span>
                  <div class="post-info">
                    <a [routerLink]="['/blog', post.slug]" class="post-title">{{ post.title }}</a>
                    <div class="post-stats">
                      <span><mat-icon inline>visibility</mat-icon> {{ post.viewCount }}</span>
                      <span><mat-icon inline>favorite</mat-icon> {{ post.reactionCount }}</span>
                      <span><mat-icon inline>comment</mat-icon> {{ post.commentCount }}</span>
                    </div>
                  </div>
                </div>
              </mat-list-item>
            </mat-list>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .analytics-container { max-width: 900px; margin: 0 auto; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }
    .stat-card {
      padding: 24px;
      text-align: center;
    }
    .stat-card mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #3f51b5;
    }
    .stat-value {
      font-size: 36px;
      font-weight: 700;
      margin: 8px 0;
    }
    .stat-label { color: #888; font-size: 14px; }
    .stat-growth { color: #4caf50; font-size: 12px; margin-top: 4px; }
    .top-post {
      display: flex;
      align-items: center;
      gap: 16px;
      width: 100%;
      padding: 8px 0;
    }
    .rank { font-size: 18px; font-weight: 700; color: #888; min-width: 30px; }
    .post-info { flex: 1; }
    .post-title { text-decoration: none; color: #333; font-weight: 500; }
    .post-title:hover { text-decoration: underline; }
    .post-stats {
      display: flex;
      gap: 16px;
      font-size: 13px;
      color: #888;
      margin-top: 4px;
    }
    .post-stats span { display: flex; align-items: center; gap: 4px; }
  `]
})
export class AnalyticsComponent implements OnInit {
  analytics: CreatorAnalytics | null = null;
  loading = false;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loading = true;
    this.userService.getCreatorAnalytics().subscribe({
      next: data => {
        this.analytics = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }
}
