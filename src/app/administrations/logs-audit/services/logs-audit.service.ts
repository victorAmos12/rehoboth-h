import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface LogAudit {
  id?: number;
  typeLog?: string;
  actionType?: string;
  entiteType?: string;
  entiteId?: number;
  description?: string;
  niveau?: string;
  categorie?: string;
  message?: string;
  statut?: string;
  messageErreur?: string;
  endpoint?: string;
  methodeHttp?: string;
  codeHttp?: number;
  tempsReponseMs?: number;
  adresseIp?: string;
  dateCreation?: string;
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
  ancienneValeur?: any;
  nouvelleValeur?: any;
  contexte?: string;
  stackTrace?: string;
  userAgent?: string;
  signature?: string;
  createdAt?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface LogsAuditListResponse {
  success: boolean;
  data: LogAudit[];
  total?: number;
  page?: number;
  limit?: number;
  pagination?: PaginationInfo;
  message?: string;
  error?: string;
}

export interface LogAuditResponse {
  success: boolean;
  data?: LogAudit;
  id?: number;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class LogsAuditService {
  private readonly apiUrl = `${environment.apiUrl}/api/administrations/logs-audit`;

  constructor(private readonly http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (token) headers['Authorization'] = `Bearer ${token}`;

    return new HttpHeaders(headers);
  }

  list(page: number = 1, limit: number = 100, filters?: any): Observable<LogsAuditListResponse> {
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));

    if (filters) {
      if (filters.hopitalId) params = params.set('hopitalId', String(filters.hopitalId));
      if (filters.typeLog) params = params.set('typeLog', filters.typeLog);
      if (filters.actionType) params = params.set('actionType', filters.actionType);
      if (filters.entiteType) params = params.set('entiteType', filters.entiteType);
      if (filters.entiteId) params = params.set('entiteId', String(filters.entiteId));
      if (filters.utilisateurId) params = params.set('utilisateurId', String(filters.utilisateurId));
      if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
    }

    return this.http.get<LogsAuditListResponse>(this.apiUrl, {
      headers: this.getHeaders(),
      params,
    });
  }

  get(id: number): Observable<LogAuditResponse> {
    return this.http.get<LogAuditResponse>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  create(payload: any): Observable<LogAuditResponse> {
    return this.http.post<LogAuditResponse>(this.apiUrl, payload, {
      headers: this.getHeaders().set('Content-Type', 'application/json'),
    });
  }

  getEntityHistory(entiteType: string, entiteId: number, limit: number = 50): Observable<LogsAuditListResponse> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<LogsAuditListResponse>(`${this.apiUrl}/entite/${entiteType}/${entiteId}`, {
      headers: this.getHeaders(),
      params,
    });
  }

  getUserHistory(utilisateurId: number, limit: number = 50): Observable<LogsAuditListResponse> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<LogsAuditListResponse>(`${this.apiUrl}/utilisateur/${utilisateurId}`, {
      headers: this.getHeaders(),
      params,
    });
  }

  getStats(filters?: any): Observable<any> {
    let params = new HttpParams();

    if (filters) {
      if (filters.hopitalId) params = params.set('hopitalId', String(filters.hopitalId));
      if (filters.typeLog) params = params.set('typeLog', filters.typeLog);
      if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    }

    return this.http.get<any>(`${this.apiUrl}/stats/summary`, {
      headers: this.getHeaders(),
      params,
    });
  }
}
