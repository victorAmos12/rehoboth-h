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
  traceId?: string;
  requestId?: string;
  alerte?: boolean;
  typeAlerte?: string;
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

export interface PageStats {
  avgResponseTime: number;
  errorCount: number;
  alertCount: number;
}

export interface LogsStats {
  period: {
    from: string;
    to: string;
  };
  totals: {
    logCount: number;
    auditCount: number;
  };
  byLevel: Record<string, number>;
  byCategory: Record<string, number>;
  errors: {
    count: number;
    byCategory: Record<string, number>;
  };
  alerts: {
    count: number;
    bySeverity: Record<string, number>;
  };
  performance: {
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    maxResponseTime: number;
    slowRequests: number;
  };
  uptime: {
    availability: number;
    successRate: number;
  };
}

export interface PerformanceStats {
  endpointPerformance: Array<{
    endpoint: string;
    avgResponseTime: number;
    maxResponseTime: number;
    requestCount: number;
  }>;
  categoryPerformance: Array<{
    categorie: string;
    avgResponseTime: number;
    requestCount: number;
  }>;
  timeSeriesData: Array<{
    timestamp: string;
    avgResponseTime: number;
    requestCount: number;
  }>;
  slowestRequests: Array<{
    id: number;
    endpoint: string;
    responseTime: number;
    dateCreation: string;
  }>;
}

export interface Anomaly {
  id?: number;
  severity: string;
  value?: number;
  threshold?: number;
  date?: string;
  endpoint?: string;
  errorCount?: number;
  lastError?: string;
  type?: string;
  ip?: string;
  alerte?: boolean;
}

export interface Trace {
  id?: number;
  traceId: string;
  spanCount: number;
  totalDuration: number;
  spans: LogAudit[];
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
  pageStats?: PageStats;
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

export interface StatsResponse {
  success: boolean;
  data: LogsStats;
}

export interface PerformanceResponse {
  success: boolean;
  data: PerformanceStats;
}

export interface AnomaliesResponse {
  success: boolean;
  data: {
    spike: Anomaly[];
    degradation: Anomaly[];
    failure: Anomaly[];
    security: Anomaly[];
  };
}

export interface TraceResponse {
  success: boolean;
  traceId: string;
  spanCount: number;
  totalDuration: number;
  spans: LogAudit[];
  relatedLogs?: LogAudit[];
}

@Injectable({
  providedIn: 'root',
})
export class LogsAuditService {
  private readonly apiUrl = `${environment.apiUrl}/api/logs`;

  constructor(private readonly http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (token) headers['Authorization'] = `Bearer ${token}`;

    return new HttpHeaders(headers);
  }

  /**
   * GET /api/logs
   * Liste les logs avec filtres avancés et télémétrie
   */
  list(page: number = 1, limit: number = 100, filters?: any): Observable<LogsAuditListResponse> {
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));

    if (filters) {
      if (filters.type) params = params.set('type', filters.type);
      if (filters.actionType) params = params.set('actionType', filters.actionType);
      if (filters.niveau) params = params.set('niveau', filters.niveau);
      if (filters.categorie) params = params.set('categorie', filters.categorie);
      if (filters.entiteType) params = params.set('entiteType', filters.entiteType);
      if (filters.statut) params = params.set('statut', filters.statut);
      if (filters.minResponseTime) params = params.set('minResponseTime', String(filters.minResponseTime));
      if (filters.maxResponseTime) params = params.set('maxResponseTime', String(filters.maxResponseTime));
      if (filters.hasAlert !== undefined) params = params.set('hasAlert', String(filters.hasAlert));
      if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
      if (filters.search) params = params.set('search', filters.search);
      if (filters.orderBy) params = params.set('orderBy', filters.orderBy);
      if (filters.order) params = params.set('order', filters.order);
    }

    return this.http.get<LogsAuditListResponse>(this.apiUrl, {
      headers: this.getHeaders(),
      params,
    });
  }

  /**
   * GET /api/logs/{id}
   * Afficher les détails d'un log avec contexte complet
   */
  get(id: number): Observable<LogAuditResponse> {
    return this.http.get<LogAuditResponse>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  /**
   * GET /api/logs/audit/list
   * Liste les audits avec historique complet
   */
  auditList(page: number = 1, limit: number = 100): Observable<LogsAuditListResponse> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));

    return this.http.get<LogsAuditListResponse>(`${this.apiUrl}/audit/list`, {
      headers: this.getHeaders(),
      params,
    });
  }

  /**
   * GET /api/logs/entite/{entiteType}/{entiteId}
   * Historique complet d'une entité (audit trail immuable)
   */
  getEntityHistory(entiteType: string, entiteId: number, limit: number = 50): Observable<LogsAuditListResponse> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<LogsAuditListResponse>(`${this.apiUrl}/entite/${entiteType}/${entiteId}`, {
      headers: this.getHeaders(),
      params,
    });
  }

  /**
   * GET /api/logs/utilisateur/{utilisateurId}
   * Historique de toutes les actions d'un utilisateur
   */
  getUserHistory(utilisateurId: number, limit: number = 100): Observable<LogsAuditListResponse> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<LogsAuditListResponse>(`${this.apiUrl}/utilisateur/${utilisateurId}`, {
      headers: this.getHeaders(),
      params,
    });
  }

  /**
   * GET /api/logs/stats/summary
   * Statistiques et KPIs complètes avec télémétrie
   */
  getStats(hopitalId?: number, dateFrom?: string, dateTo?: string): Observable<StatsResponse> {
    let params = new HttpParams();
    if (hopitalId) params = params.set('hopitalId', String(hopitalId));
    if (dateFrom) params = params.set('dateFrom', dateFrom);
    if (dateTo) params = params.set('dateTo', dateTo);

    return this.http.get<StatsResponse>(`${this.apiUrl}/stats/summary`, {
      headers: this.getHeaders(),
      params,
    });
  }

  /**
   * GET /api/logs/stats/performance
   * Analyse détaillée de la performance par endpoint et catégorie
   */
  getPerformanceStats(): Observable<PerformanceResponse> {
    return this.http.get<PerformanceResponse>(`${this.apiUrl}/stats/performance`, {
      headers: this.getHeaders(),
    });
  }

  /**
   * GET /api/logs/stats/anomalies
   * Détection automatique d'anomalies et patterns anormaux
   */
  getAnomalies(): Observable<AnomaliesResponse> {
    return this.http.get<AnomaliesResponse>(`${this.apiUrl}/stats/anomalies`, {
      headers: this.getHeaders(),
    });
  }

  /**
   * GET /api/logs/trace/{traceId}
   * Récupérer une trace distribuée complète avec tous les spans
   */
  getTrace(traceId: string): Observable<TraceResponse> {
    return this.http.get<TraceResponse>(`${this.apiUrl}/trace/${traceId}`, {
      headers: this.getHeaders(),
    });
  }

  /**
   * GET /api/logs/export
   * Exporter les logs en CSV ou JSON
   */
  export(format: 'json' | 'csv' = 'json', type?: string, dateFrom?: string, dateTo?: string): Observable<any> {
    let params = new HttpParams().set('format', format);
    if (type) params = params.set('type', type);
    if (dateFrom) params = params.set('dateFrom', dateFrom);
    if (dateTo) params = params.set('dateTo', dateTo);

    return this.http.get<any>(`${this.apiUrl}/export`, {
      headers: this.getHeaders(),
      params,
    });
  }

  /**
   * POST /api/logs
   * Créer un log audit ou technique
   */
  create(payload: any): Observable<LogAuditResponse> {
    return this.http.post<LogAuditResponse>(this.apiUrl, payload, {
      headers: this.getHeaders().set('Content-Type', 'application/json'),
    });
  }
}
