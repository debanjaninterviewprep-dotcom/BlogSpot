import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { BlogService } from './blog.service';
import { UserService } from './user.service';
import { FeedService } from './feed.service';
import { BlogPost } from '../models/blog.model';
import { UserProfile } from '../models/user.model';

export interface SearchResult {
  bloggers: (UserProfile & { highlightedName?: string; highlightedHandle?: string })[];
  blogs: (BlogPost & { highlightedTitle?: string })[];
}

@Injectable({
  providedIn: 'root'
})
export class SearchCacheService {
  private cachedBlogs: BlogPost[] = [];
  private isBlogsCached = false;
  private isLoading = false;

  private cacheState$ = new BehaviorSubject<{ loading: boolean; error?: string }>({ loading: false });

  constructor(
    private blogService: BlogService,
    private userService: UserService,
    private feedService: FeedService
  ) {}

  /** Load posts from feed endpoints into cache */
  initialize(): Observable<void> {
    if (this.isBlogsCached || this.isLoading) {
      return new Observable(subscriber => {
        if (this.isBlogsCached) { subscriber.next(); subscriber.complete(); }
      });
    }

    this.isLoading = true;
    this.cacheState$.next({ loading: true });

    return new Observable(subscriber => {
      // Load latest + trending posts to build a comprehensive cache
      forkJoin([
        this.feedService.getLatest({ page: 1, pageSize: 50 }).pipe(catchError(() => of({ items: [] }))),
        this.feedService.getTrending({ page: 1, pageSize: 50 }).pipe(catchError(() => of({ items: [] }))),
        this.feedService.getLatest({ page: 2, pageSize: 50 }).pipe(catchError(() => of({ items: [] })))
      ]).subscribe({
        next: ([latest, trending, latestPage2]: any[]) => {
          // Merge and deduplicate by id
          const allPosts = [...(latest.items || []), ...(trending.items || []), ...(latestPage2.items || [])];
          const seen = new Set<string>();
          this.cachedBlogs = allPosts.filter(post => {
            if (seen.has(post.id)) return false;
            seen.add(post.id);
            return true;
          });
          this.isBlogsCached = true;
          this.isLoading = false;
          this.cacheState$.next({ loading: false });
          subscriber.next();
          subscriber.complete();
        },
        error: () => {
          this.isLoading = false;
          this.cacheState$.next({ loading: false, error: 'Failed to load posts cache' });
          subscriber.next();
          subscriber.complete();
        }
      });
    });
  }

  /** Search blogs from cache + users via API call */
  searchAll(query: string, limit: number = 5): Observable<SearchResult> {
    if (!query || query.length === 0) {
      return of({ bloggers: [], blogs: [] });
    }

    const lowerQuery = query.toLowerCase();

    // Filter cached blogs locally
    const blogs = this.cachedBlogs
      .filter(blog =>
        (blog.title && blog.title.toLowerCase().includes(lowerQuery)) ||
        (blog.summary && blog.summary.toLowerCase().includes(lowerQuery))
      )
      .slice(0, limit)
      .map(blog => ({
        ...blog,
        highlightedTitle: this.highlightMatch(blog.title || '', lowerQuery)
      }));

    // Search users via API (no cache available for users)
    return this.userService.searchUsers(query, { page: 1, pageSize: limit }).pipe(
      map((res: any) => {
        const users = (res.items || []) as UserProfile[];
        const bloggers = users.map(user => ({
          ...user,
          highlightedName: this.highlightMatch(user.displayName || user.userName || '', lowerQuery),
          highlightedHandle: this.highlightMatch(user.userName || '', lowerQuery)
        }));
        return { bloggers, blogs };
      }),
      catchError(() => of({ bloggers: [], blogs }))
    );
  }

  /** Highlight matching text with <mark> tags */
  highlightMatch(text: string, query: string): string {
    if (!query || !text) return text;
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  getCacheState(): Observable<{ loading: boolean; error?: string }> {
    return this.cacheState$.asObservable();
  }

  isReady(): boolean {
    return this.isBlogsCached;
  }
}
