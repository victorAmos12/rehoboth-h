import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Specialite {
  id: number;
  code: string;
  nom: string;
  description?: string;
  code_snomed?: string;
  icone?: string;
  couleur?: string;
  actif: boolean;
  date_creation?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface SpecialitesListResponse {
  success: boolean;
  data: Specialite[];
  pagination?: PaginationInfo;
  message?: string;
  error?: string;
}

export interface SpecialiteResponse {
  success: boolean;
  data?: Specialite;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SpecialitesService {
  private readonly apiUrl = `${environment.apiUrl}/api/specialites`;

  constructor(private readonly http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (token) headers['Authorization'] = `Bearer ${token}`;

    return new HttpHeaders(headers);
  }

  list(page: number = 1, limit: number = 20): Observable<SpecialitesListResponse> {
    const params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    return this.http.get<SpecialitesListResponse>(this.apiUrl, {
      headers: this.getHeaders(),
      params,
    });
  }

  get(id: number): Observable<SpecialiteResponse> {
    return this.http.get<SpecialiteResponse>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  create(payload: any): Observable<SpecialiteResponse> {
    return this.http.post<SpecialiteResponse>(this.apiUrl, payload, {
      headers: this.getHeaders().set('Content-Type', 'application/json'),
    });
  }

  update(id: number, payload: any): Observable<SpecialiteResponse> {
    return this.http.put<SpecialiteResponse>(`${this.apiUrl}/${id}`, payload, {
      headers: this.getHeaders().set('Content-Type', 'application/json'),
    });
  }

  delete(id: number): Observable<SpecialiteResponse> {
    return this.http.delete<SpecialiteResponse>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  search(payload: any): Observable<SpecialitesListResponse> {
    return this.http.post<SpecialitesListResponse>(`${this.apiUrl}/search`, payload, {
      headers: this.getHeaders().set('Content-Type', 'application/json'),
    });
  }

  stats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`, {
      headers: this.getHeaders(),
    });
  }

  getUtilisateurs(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/utilisateurs`, {
      headers: this.getHeaders(),
    });
  }
}
