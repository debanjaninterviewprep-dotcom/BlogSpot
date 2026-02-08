import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { CreatorAnalytics, UpdateProfile, UserProfile } from '../models/user.model';
import { PagedResult, PaginationParams } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/user`;

  constructor(private http: HttpClient) {}

  getProfile(userId: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/${userId}`);
  }

  getProfileByUserName(userName: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/username/${userName}`);
  }

  updateProfile(profile: UpdateProfile): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/profile`, profile);
  }

  updateProfilePicture(file: File): Observable<{ profilePictureUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ profilePictureUrl: string }>(`${this.apiUrl}/profile/picture`, formData);
  }

  updateCoverPhoto(file: File): Observable<{ coverPhotoUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ coverPhotoUrl: string }>(`${this.apiUrl}/profile/cover`, formData);
  }

  toggleFollow(userId: string): Observable<{ isFollowing: boolean }> {
    return this.http.post<{ isFollowing: boolean }>(`${this.apiUrl}/${userId}/follow`, {});
  }

  getFollowers(userId: string, pagination: PaginationParams): Observable<PagedResult<UserProfile>> {
    const params = new HttpParams()
      .set('page', pagination.page.toString())
      .set('pageSize', pagination.pageSize.toString());
    return this.http.get<PagedResult<UserProfile>>(`${this.apiUrl}/${userId}/followers`, { params });
  }

  getFollowing(userId: string, pagination: PaginationParams): Observable<PagedResult<UserProfile>> {
    const params = new HttpParams()
      .set('page', pagination.page.toString())
      .set('pageSize', pagination.pageSize.toString());
    return this.http.get<PagedResult<UserProfile>>(`${this.apiUrl}/${userId}/following`, { params });
  }

  getSuggestedUsers(count: number = 5): Observable<UserProfile[]> {
    const params = new HttpParams().set('count', count.toString());
    return this.http.get<UserProfile[]>(`${this.apiUrl}/suggested`, { params });
  }

  getCreatorAnalytics(): Observable<CreatorAnalytics> {
    return this.http.get<CreatorAnalytics>(`${this.apiUrl}/analytics`);
  }
}
