import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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

export interface LogAuditResponse {
  success: boolean;
  data?: LogAudit;
  message?: string;
}

export interface LogsAuditListResponse {
  success: boolean;
  data: LogAudit[];
  total: number;
  page?: number;
  limit?: number;
}

export interface LogsAuditFilters {
  hopitalId?: number;
  typeLog?: string;
  actionType?: string;
  entiteType?: string;
  entiteId?: number;
  utilisateurId?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

type AnyApi = any;

@Injectable({
  providedIn: 'root',
})
export class LogsAuditService {
  private readonly apiUrl = `${environment.apiUrl}/api/administrations/logs-audit`;

  constructor(private readonly http: HttpClient) {}

  private normalizeLogAudit(data: any): LogAudit {
    if (!data) return data as any;

    return {
      id: data.id || data.ID || undefined,
      typeLog: data.typeLog || data.type_log || '',
      actionType: data.actionType || data.action_type || '',
      entiteType: data.entiteType || data.entite_type || '',
      entiteId: data.entiteId || data.entite_id || undefined,
      description: data.description || '',
      niveau: data.niveau || '',
      categorie: data.categorie || '',
      message: data.message || '',
      statut: data.statut || data.status || '',
      messageErreur: data.messageErreur || data.message_erreur || '',
      endpoint: data.endpoint || '',
      methodeHttp: data.methodeHttp || data.methode_http || '',
      codeHttp: data.codeHttp || data.code_http || undefined,
      tempsReponseMs: data.tempsReponseMs || data.temps_reponse_ms || undefined,
      adresseIp: data.adresseIp || data.adresse_ip || '',
      dateCreation: data.dateCreation || data.date_creation || data.createdAt || data.created_at || '',
      utilisateur: data.utilisateur || undefined,
      hopital: data.hopital || undefined,
      hopitalId: data.hopitalId || data.hopital_id || undefined,
      ancienneValeur: data.ancienneValeur || data.ancienne_valeur || undefined,
      nouvelleValeur: data.nouvelleValeur || data.nouvelle_valeur || undefined,
      contexte: data.contexte || data.context || '',
      stackTrace: data.stackTrace || data.stack_trace || '',
      userAgent: data.userAgent || data.user_agent || '',
      signature: data.signature || '',
    };
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return new HttpHeaders(headers);
  }

  private normalizeSingleResponse(raw: AnyApi): LogAuditResponse {
    const candidate = raw?.data ?? raw?.log ?? raw?.item ?? raw?.result ?? raw;
    const data = candidate ? this.normalizeLogAudit(candidate) : undefined;
    const success = raw?.success ?? raw?.status ?? true;
    const message = raw?.message ?? raw?.msg ?? undefined;
    return { success: !!success, data, message };
  }

  private normalizeListResponse(raw: AnyApi): LogsAuditListResponse {
    const listCandidate = raw?.data ?? raw?.logs ?? raw?.items ?? raw?.result ?? raw;
    const data = Array.isArray(listCandidate) ? listCandidate.map((l) => this.normalizeLogAudit(l)) : [];
    const total =
      raw?.total ??
      raw?.count ??
      raw?.pagination?.total ??
      raw?.meta?.total ??
      (Array.isArray(listCandidate) ? listCandidate.length : 0);
    const success = raw?.success ?? raw?.status ?? true;
    const page = raw?.page ?? raw?.pagination?.page;
    const limit = raw?.limit ?? raw?.pagination?.limit;
    return { success: !!success, data, total, page, limit };
  }

  /**
   * Lister tous les logs d'audit avec filtres et pagination
   */
  getLogsAudit(filters: LogsAuditFilters = {}): Observable<LogsAuditListResponse> {
    let params = new HttpParams();

    if (filters.page !== undefined) {
      params = params.set('page', filters.page.toString());
    }
    if (filters.limit !== undefined) {
      params = params.set('limit', filters.limit.toString());
    }
    if (filters.hopitalId !== undefined) {
      params = params.set('hopitalId', filters.hopitalId.toString());
    }
    if (filters.typeLog) {
      params = params.set('typeLog', filters.typeLog);
    }
    if (filters.actionType) {
      params = params.set('actionType', filters.actionType);
    }
    if (filters.entiteType) {
      params = params.set('entiteType', filters.entiteType);
    }
    if (filters.entiteId !== undefined) {
      params = params.set('entiteId', filters.entiteId.toString());
    }
    if (filters.utilisateurId !== undefined) {
      params = params.set('utilisateurId', filters.utilisateurId.toString());
    }
    if (filters.dateFrom) {
      params = params.set('dateFrom', filters.dateFrom);
    }
    if (filters.dateTo) {
      params = params.set('dateTo', filters.dateTo);
    }

    return this.http
      .get<AnyApi>(this.apiUrl, {
        headers: this.getHeaders(),
        params,
      })
      .pipe(map((raw) => this.normalizeListResponse(raw)));
  }

  /**
   * Récupérer un log d'audit par ID
   */
  getLogAudit(id: number): Observable<LogAuditResponse> {
    return this.http
      .get<AnyApi>(`${this.apiUrl}/${id}`, {
        headers: this.getHeaders(),
      })
      .pipe(map((raw) => this.normalizeSingleResponse(raw)));
  }

  /**
   * Créer un nouveau log d'audit
   */
  createLogAudit(log: Partial<LogAudit>): Observable<LogAuditResponse> {
    return this.http
      .post<AnyApi>(this.apiUrl, log, {
        headers: this.getHeaders().set('Content-Type', 'application/json'),
      })
      .pipe(map((raw) => this.normalizeSingleResponse(raw)));
  }
}
