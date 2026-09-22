import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ReadingList, ReadingListDetail, CreateReadingList, UpdateReadingList } from '../models/reading-list.model';
import { PagedResult, PaginationParams } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class ReadingListService {
  private readonly apiUrl = `${environment.apiUrl}/readinglist`;

  constructor(private http: HttpClient) {}

  private buildPaginationParams(pagination: PaginationParams): HttpParams {
    return new HttpParams()
      .set('page', pagination.page.toString())
      .set('pageSize', pagination.pageSize.toString());
  }

  create(dto: CreateReadingList): Observable<ReadingList> {
    return this.http.post<ReadingList>(this.apiUrl, dto);
  }

  update(id: string, dto: UpdateReadingList): Observable<ReadingList> {
    return this.http.put<ReadingList>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getById(id: string): Observable<ReadingListDetail> {
    return this.http.get<ReadingListDetail>(`${this.apiUrl}/${id}`);
  }

  getByUser(userId: string, pagination: PaginationParams): Observable<PagedResult<ReadingList>> {
    return this.http.get<PagedResult<ReadingList>>(`${this.apiUrl}/user/${userId}`, { params: this.buildPaginationParams(pagination) });
  }

  addPost(listId: string, postId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${listId}/posts/${postId}`, {});
  }

  removePost(listId: string, postId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${listId}/posts/${postId}`);
  }

  toggleFollow(listId: string): Observable<{ following: boolean }> {
    return this.http.post<{ following: boolean }>(`${this.apiUrl}/${listId}/follow`, {});
  }
}
