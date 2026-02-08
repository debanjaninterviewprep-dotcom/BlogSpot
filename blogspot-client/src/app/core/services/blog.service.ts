import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  BlogPost, Comment, CreateBlogPost, CreateComment, PostImage, UpdateBlogPost,
  ReactionDto, ReactionSummaryDto, DraftBlog, SaveDraft, SearchResult
} from '../models/blog.model';
import { PagedResult, PaginationParams } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private readonly apiUrl = `${environment.apiUrl}/blog`;

  constructor(private http: HttpClient) {}

  createPost(post: CreateBlogPost): Observable<BlogPost> {
    return this.http.post<BlogPost>(this.apiUrl, post);
  }

  updatePost(id: string, post: UpdateBlogPost): Observable<BlogPost> {
    return this.http.put<BlogPost>(`${this.apiUrl}/${id}`, post);
  }

  deletePost(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getPostById(id: string): Observable<BlogPost> {
    return this.http.get<BlogPost>(`${this.apiUrl}/${id}`);
  }

  getPostBySlug(slug: string): Observable<BlogPost> {
    return this.http.get<BlogPost>(`${this.apiUrl}/slug/${slug}`);
  }

  getPostsByUser(userId: string, pagination: PaginationParams): Observable<PagedResult<BlogPost>> {
    const params = this.buildPaginationParams(pagination);
    return this.http.get<PagedResult<BlogPost>>(`${this.apiUrl}/user/${userId}`, { params });
  }

  searchPosts(query: string, pagination: PaginationParams): Observable<PagedResult<BlogPost>> {
    let params = this.buildPaginationParams(pagination);
    params = params.set('q', query);
    return this.http.get<PagedResult<BlogPost>>(`${this.apiUrl}/search`, { params });
  }

  fullTextSearch(query: string, pagination: PaginationParams): Observable<SearchResult> {
    let params = this.buildPaginationParams(pagination);
    params = params.set('q', query);
    return this.http.get<SearchResult>(`${this.apiUrl}/fullsearch`, { params });
  }

  // --- Likes ---

  toggleLike(postId: string): Observable<{ liked: boolean }> {
    return this.http.post<{ liked: boolean }>(`${this.apiUrl}/${postId}/like`, {});
  }

  // --- Reactions ---

  toggleReaction(postId: string, reaction: ReactionDto): Observable<ReactionSummaryDto> {
    return this.http.post<ReactionSummaryDto>(`${this.apiUrl}/${postId}/reactions`, reaction);
  }

  getReactions(postId: string): Observable<ReactionSummaryDto> {
    return this.http.get<ReactionSummaryDto>(`${this.apiUrl}/${postId}/reactions`);
  }

  // --- Bookmarks ---

  toggleBookmark(postId: string): Observable<{ bookmarked: boolean }> {
    return this.http.post<{ bookmarked: boolean }>(`${this.apiUrl}/${postId}/bookmark`, {});
  }

  getBookmarkedPosts(pagination: PaginationParams): Observable<PagedResult<BlogPost>> {
    const params = this.buildPaginationParams(pagination);
    return this.http.get<PagedResult<BlogPost>>(`${this.apiUrl}/bookmarks`, { params });
  }

  // --- Drafts ---

  saveDraft(draft: SaveDraft): Observable<DraftBlog> {
    return this.http.post<DraftBlog>(`${this.apiUrl}/drafts`, draft);
  }

  getDrafts(): Observable<DraftBlog[]> {
    return this.http.get<DraftBlog[]>(`${this.apiUrl}/drafts`);
  }

  getDraftById(id: string): Observable<DraftBlog> {
    return this.http.get<DraftBlog>(`${this.apiUrl}/drafts/${id}`);
  }

  deleteDraft(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/drafts/${id}`);
  }

  // --- Comments ---

  addComment(postId: string, comment: CreateComment): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/${postId}/comments`, comment);
  }

  getComments(postId: string, pagination: PaginationParams): Observable<PagedResult<Comment>> {
    const params = this.buildPaginationParams(pagination);
    return this.http.get<PagedResult<Comment>>(`${this.apiUrl}/${postId}/comments`, { params });
  }

  deleteComment(commentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/comments/${commentId}`);
  }

  // --- Images ---

  uploadImage(postId: string, file: File, altText?: string): Observable<PostImage> {
    const formData = new FormData();
    formData.append('file', file);
    if (altText) formData.append('altText', altText);
    return this.http.post<PostImage>(`${this.apiUrl}/${postId}/images`, formData);
  }

  removeImage(postId: string, imageId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${postId}/images/${imageId}`);
  }

  private buildPaginationParams(pagination: PaginationParams): HttpParams {
    return new HttpParams()
      .set('page', pagination.page.toString())
      .set('pageSize', pagination.pageSize.toString());
  }
}
