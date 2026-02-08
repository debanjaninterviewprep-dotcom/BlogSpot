import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { PagedResult, PaginationParams } from '../models/pagination.model';

export interface AdminUser {
  id: string;
  userName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  postsCount: number;
  commentsCount: number;
}

export interface AdminPost {
  id: string;
  title: string;
  authorUserName: string;
  isPublished: boolean;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

export interface AdminComment {
  id: string;
  content: string;
  userName: string;
  postTitle: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getUsers(pagination: PaginationParams): Observable<PagedResult<AdminUser>> {
    const params = this.buildParams(pagination);
    return this.http.get<PagedResult<AdminUser>>(`${this.apiUrl}/users`, { params });
  }

  toggleUserStatus(userId: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/users/${userId}/toggle-status`, {});
  }

  changeUserRole(userId: string, role: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/users/${userId}/role`, { role });
  }

  getPosts(pagination: PaginationParams): Observable<PagedResult<AdminPost>> {
    const params = this.buildParams(pagination);
    return this.http.get<PagedResult<AdminPost>>(`${this.apiUrl}/posts`, { params });
  }

  deletePost(postId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/posts/${postId}`);
  }

  getComments(pagination: PaginationParams): Observable<PagedResult<AdminComment>> {
    const params = this.buildParams(pagination);
    return this.http.get<PagedResult<AdminComment>>(`${this.apiUrl}/comments`, { params });
  }

  deleteComment(commentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/comments/${commentId}`);
  }

  private buildParams(pagination: PaginationParams): HttpParams {
    return new HttpParams()
      .set('page', pagination.page.toString())
      .set('pageSize', pagination.pageSize.toString());
  }
}
