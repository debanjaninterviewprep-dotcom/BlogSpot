import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { BlogPost } from '../models/blog.model';
import { PagedResult, PaginationParams } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class FeedService {
  private readonly apiUrl = `${environment.apiUrl}/feed`;

  constructor(private http: HttpClient) {}

  getHomeFeed(pagination: PaginationParams): Observable<PagedResult<BlogPost>> {
    const params = this.buildPaginationParams(pagination);
    return this.http.get<PagedResult<BlogPost>>(`${this.apiUrl}/home`, { params });
  }

  getTrending(pagination: PaginationParams): Observable<PagedResult<BlogPost>> {
    const params = this.buildPaginationParams(pagination);
    return this.http.get<PagedResult<BlogPost>>(`${this.apiUrl}/trending`, { params });
  }

  getLatest(pagination: PaginationParams): Observable<PagedResult<BlogPost>> {
    const params = this.buildPaginationParams(pagination);
    return this.http.get<PagedResult<BlogPost>>(`${this.apiUrl}/latest`, { params });
  }

  private buildPaginationParams(pagination: PaginationParams): HttpParams {
    return new HttpParams()
      .set('page', pagination.page.toString())
      .set('pageSize', pagination.pageSize.toString());
  }
}
