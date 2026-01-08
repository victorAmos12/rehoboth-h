import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Role {
  id: number;
  code: string;
  nom: string;
  description?: string | null;
  niveau_acces?: number | null;
  actif: boolean;
  date_creation?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface RolesListResponse {
  success: boolean;
  data: Role[];
  pagination?: PaginationInfo;
  message?: string;
  error?: string;
}

export interface RoleResponse {
  success: boolean;
  data?: Role;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class RolesService {
  private readonly apiUrl = `${environment.apiUrl}/api/roles-profils/roles`;

  constructor(private readonly http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (token) headers['Authorization'] = `Bearer ${token}`;

    return new HttpHeaders(headers);
  }

  list(page: number = 1, limit: number = 20): Observable<RolesListResponse> {
    const params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    return this.http.get<RolesListResponse>(this.apiUrl, {
      headers: this.getHeaders(),
      params,
    });
  }

  get(id: number): Observable<RoleResponse> {
    return this.http.get<RoleResponse>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  create(payload: any): Observable<RoleResponse> {
    return this.http.post<RoleResponse>(this.apiUrl, payload, {
      headers: this.getHeaders().set('Content-Type', 'application/json'),
    });
  }

  update(id: number, payload: any): Observable<RoleResponse> {
    return this.http.put<RoleResponse>(`${this.apiUrl}/${id}`, payload, {
      headers: this.getHeaders().set('Content-Type', 'application/json'),
    });
  }

  delete(id: number): Observable<RoleResponse> {
    return this.http.delete<RoleResponse>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }
}
