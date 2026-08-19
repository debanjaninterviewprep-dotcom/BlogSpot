import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin } from 'rxjs';
import { BlogService } from './blog.service';
import { UserService } from './user.service';
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
  private allUsers: UserProfile[] = [];
  private allBlogs: BlogPost[] = [];
  private isInitialized = false;
  private isLoading = false;

  private cacheState$ = new BehaviorSubject<{ loading: boolean; error?: string }>({ loading: false });

  constructor(
    private blogService: BlogService,
    private userService: UserService
  ) {}

  /**
   * Initialize the cache by loading all users and blogs
   */
  initialize(): Observable<void> {
    if (this.isInitialized || this.isLoading) {
      return new Observable(subscriber => {
        if (this.isInitialized) subscriber.complete();
      });
    }

    this.isLoading = true;
    this.cacheState$.next({ loading: true });

    // Load users and blogs with pagination (load up to 100 of each for search purposes)
    return new Observable(subscriber => {
      forkJoin([
        this.loadAllUsers(),
        this.loadAllBlogs()
      ]).subscribe({
        next: ([users, blogs]) => {
          this.allUsers = users;
          this.allBlogs = blogs;
          this.isInitialized = true;
          this.isLoading = false;
          this.cacheState$.next({ loading: false });
          subscriber.next();
          subscriber.complete();
        },
        error: (err) => {
          this.isLoading = false;
          this.cacheState$.next({ loading: false, error: 'Failed to initialize search cache' });
          subscriber.error(err);
        }
      });
    });
  }

  /**
   * Load all users with pagination
   */
  private loadAllUsers(): Observable<UserProfile[]> {
    return new Observable(subscriber => {
      const users: UserProfile[] = [];
      let page = 1;
      const pageSize = 50;

      const loadPage = () => {
        this.userService.searchUsers('', { page, pageSize }).subscribe({
          next: (result: any) => {
            if (result.items && result.items.length > 0) {
              users.push(...result.items);
              if (result.items.length === pageSize) {
                page++;
                loadPage(); // Load next page
              } else {
                subscriber.next(users);
                subscriber.complete();
              }
            } else {
              subscriber.next(users);
              subscriber.complete();
            }
          },
          error: (err) => {
            // If search fails, return what we have so far
            subscriber.next(users);
            subscriber.complete();
          }
        });
      };

      loadPage();
    });
  }

  /**
   * Load all blogs with pagination
   */
  private loadAllBlogs(): Observable<BlogPost[]> {
    return new Observable(subscriber => {
      const blogs: BlogPost[] = [];
      let page = 1;
      const pageSize = 50;

      const loadPage = () => {
        this.blogService.searchPosts('', { page, pageSize }).subscribe({
          next: (result: any) => {
            if (result.items && result.items.length > 0) {
              blogs.push(...result.items);
              if (result.items.length === pageSize) {
                page++;
                loadPage(); // Load next page
              } else {
                subscriber.next(blogs);
                subscriber.complete();
              }
            } else {
              subscriber.next(blogs);
              subscriber.complete();
            }
          },
          error: (err) => {
            // If search fails, return what we have so far
            subscriber.next(blogs);
            subscriber.complete();
          }
        });
      };

      loadPage();
    });
  }

  /**
   * Search cached data for users and blogs
   */
  search(query: string, limit: number = 5): SearchResult {
    if (!query || query.length === 0) {
      return { bloggers: [], blogs: [] };
    }

    const lowerQuery = query.toLowerCase();

    // Search and filter users
    const bloggers = this.allUsers
      .filter(user =>
        (user.displayName && user.displayName.toLowerCase().includes(lowerQuery)) ||
        (user.userName && user.userName.toLowerCase().includes(lowerQuery))
      )
      .slice(0, limit)
      .map(user => ({
        ...user,
        highlightedName: this.highlightMatch(user.displayName || '', lowerQuery),
        highlightedHandle: this.highlightMatch(user.userName || '', lowerQuery)
      }));

    // Search and filter blogs
    const blogs = this.allBlogs
      .filter(blog =>
        (blog.title && blog.title.toLowerCase().includes(lowerQuery)) ||
        (blog.description && blog.description.toLowerCase().includes(lowerQuery))
      )
      .slice(0, limit)
      .map(blog => ({
        ...blog,
        highlightedTitle: this.highlightMatch(blog.title || '', lowerQuery)
      }));

    return { bloggers, blogs };
  }

  /**
   * Highlight matching text in a string
   * Returns HTML string with matched text wrapped in <mark> tags
   */
  private highlightMatch(text: string, query: string): string {
    if (!query) return text;

    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Escape special characters in regex
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Get cache state observable
   */
  getCacheState(): Observable<{ loading: boolean; error?: string }> {
    return this.cacheState$.asObservable();
  }

  /**
   * Check if cache is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.allUsers = [];
    this.allBlogs = [];
    this.isInitialized = false;
    this.cacheState$.next({ loading: false });
  }

  /**
   * Get all cached users (useful for other operations)
   */
  getAllCachedUsers(): UserProfile[] {
    return [...this.allUsers];
  }

  /**
   * Get all cached blogs (useful for other operations)
   */
  getAllCachedBlogs(): BlogPost[] {
    return [...this.allBlogs];
  }
}
