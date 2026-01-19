import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Sauvegarde {
  id?: number;
  backupId?: string;
  numeroSauvegarde?: string;
  typeBackup?: string;
  statut?: string;
  localisationBackup?: string;
  localisationSecondaire?: string;
  tailleBytes?: number;
  tailleGb?: number;
  dureeSecondes?: number;
  nombreFichiers?: number;
  nombreTables?: number;
  checksumSha256?: string;
  compression?: string;
  dateDebut?: string;
  dateFin?: string;
  dateExpiration?: string;
  utilisateur?: {
    id: number;
    nom: string;
    prenom: string;
    username: string;
    email: string;
  };
  hopital?: {
    id: number;
    nom: string;
  };
  hopitalId?: number;
  messageErreur?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface SauvegardesListResponse {
  success: boolean;
  data: Sauvegarde[];
  total?: number;
  page?: number;
  limit?: number;
  pagination?: PaginationInfo;
  message?: string;
  error?: string;
}

export interface SauvegardeResponse {
  success: boolean;
  data?: Sauvegarde;
  id?: number;
  backupId?: string;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SauvegardesService {
  private readonly apiUrl = `${environment.apiUrl}/api/administrations/sauvegardes`;

  constructor(private readonly http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (token) headers['Authorization'] = `Bearer ${token}`;

    return new HttpHeaders(headers);
  }

  list(page: number = 1, limit: number = 50, filters?: any): Observable<SauvegardesListResponse> {
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));

    if (filters) {
      if (filters.hopitalId) params = params.set('hopitalId', String(filters.hopitalId));
      if (filters.typeBackup) params = params.set('typeBackup', filters.typeBackup);
      if (filters.statut) params = params.set('statut', filters.statut);
      if (filters.numero) params = params.set('numero', filters.numero);
      if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
    }

    return this.http.get<SauvegardesListResponse>(this.apiUrl, {
      headers: this.getHeaders(),
      params,
    });
  }

  get(id: number): Observable<SauvegardeResponse> {
    return this.http.get<SauvegardeResponse>(`${this.apiUrl}/${id}/show`, {
      headers: this.getHeaders(),
    });
  }

  show(id: number): Observable<SauvegardeResponse> {
    return this.get(id);
  }

  create(payload: any): Observable<SauvegardeResponse> {
    return this.http.post<SauvegardeResponse>(this.apiUrl, payload, {
      headers: this.getHeaders().set('Content-Type', 'application/json'),
    });
  }

  updateStatus(id: number, payload: any): Observable<SauvegardeResponse> {
    return this.http.patch<SauvegardeResponse>(`${this.apiUrl}/${id}/status`, payload, {
      headers: this.getHeaders().set('Content-Type', 'application/json'),
    });
  }

  verify(id: number): Observable<SauvegardeResponse> {
    return this.http.post<SauvegardeResponse>(`${this.apiUrl}/${id}/verify`, {}, {
      headers: this.getHeaders().set('Content-Type', 'application/json'),
    });
  }

  download(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, {
      headers: this.getHeaders(),
      responseType: 'blob',
    });
  }

  restore(id: number): Observable<SauvegardeResponse> {
    return this.http.post<SauvegardeResponse>(`${this.apiUrl}/${id}/restore`, {}, {
      headers: this.getHeaders().set('Content-Type', 'application/json'),
    });
  }

  getRestoreChain(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/chain`, {
      headers: this.getHeaders(),
    });
  }

  getStats(hopitalId: number = 1): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/hopital/${hopitalId}/stats`, {
      headers: this.getHeaders(),
    });
  }

  getKpis(hopitalId?: number, days: number = 30): Observable<any> {
    let params = new HttpParams().set('days', String(days));
    if (hopitalId) params = params.set('hopitalId', String(hopitalId));
    
    return this.http.get<any>(`${this.apiUrl}/dashboard/kpis`, {
      headers: this.getHeaders(),
      params,
    });
  }

  getLastSuccessful(hopitalId: number): Observable<SauvegardeResponse> {
    return this.http.get<SauvegardeResponse>(`${this.apiUrl}/hopital/${hopitalId}/last-successful`, {
      headers: this.getHeaders(),
    });
  }

  getChain(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/chain`, {
      headers: this.getHeaders(),
    });
  }

  export(id: number, format: 'json' | 'csv' = 'json'): Observable<any> {
    const params = new HttpParams().set('format', format);
    return this.http.get<any>(`${this.apiUrl}/${id}/export`, {
      headers: this.getHeaders(),
      params,
    });
  }

  generateReport(hopitalId: number, dateFrom: string, dateTo: string, format: 'json' | 'csv' = 'json'): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reports/generate`, {
      hopitalId,
      dateFrom,
      dateTo,
      format,
    }, {
      headers: this.getHeaders().set('Content-Type', 'application/json'),
    });
  }


// Accepter un objet complet (payload) au lieu d'arguments séparés
  scheduleBackup(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/schedule/create`, payload, {
      headers: this.getHeaders().set('Content-Type', 'application/json'),
    });
  }
  
  getRecommendations(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/recommendations`, {
      headers: this.getHeaders(),
    });
  }

  getRetentionStats(hopitalId?: number): Observable<any> {
    let params = new HttpParams();
    if (hopitalId) params = params.set('hopitalId', String(hopitalId));
    
    return this.http.get<any>(`${this.apiUrl}/retention/stats`, {
      headers: this.getHeaders(),
      params,
    });
  }

  getScheduledBackups(hopitalId: number = 1, actif?: boolean): Observable<any> {
    let params = new HttpParams().set('hopitalId', String(hopitalId));
    if (actif !== undefined) params = params.set('actif', String(actif));
    
    return this.http.get<any>(`${this.apiUrl}/schedule/list`, {
      headers: this.getHeaders(),
      params,
    });
  }

  getSchedule(scheduleId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/schedule/${scheduleId}`, {
      headers: this.getHeaders(),
    });
  }

  deleteSchedule(scheduleId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/schedule/${scheduleId}`, {
      headers: this.getHeaders(),
    });
  }

  updateSchedule(scheduleId: number, payload: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/schedule/${scheduleId}`, payload, {
      headers: this.getHeaders().set('Content-Type', 'application/json'),
    });
  }
}
