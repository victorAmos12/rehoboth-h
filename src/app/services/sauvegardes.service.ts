import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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
  createdAt?: string;
  updatedAt?: string;
}

export interface SauvegardeResponse {
  success: boolean;
  data?: Sauvegarde;
  message?: string;
}

export interface SauvegardesListResponse {
  success: boolean;
  data: Sauvegarde[];
  total: number;
  page?: number;
  limit?: number;
}

export interface SauvegardesFilters {
  hopitalId?: number;
  typeBackup?: string;
  statut?: string;
  numero?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

type AnyApi = any;

@Injectable({
  providedIn: 'root',
})
export class SauvegardesService {
  private readonly apiUrl = `${environment.apiUrl}/api/administrations/sauvegardes`;

  constructor(private readonly http: HttpClient) {}

  private normalizeSauvegarde(data: any): Sauvegarde {
    if (!data) return data as any;

    return {
      id: data.id || data.ID || undefined,
      backupId: data.backupId || data.backup_id || '',
      numeroSauvegarde: data.numeroSauvegarde || data.numero_sauvegarde || data.backupId || '',
      typeBackup: data.typeBackup || data.type_backup || '',
      statut: data.statut || data.status || '',
      localisationBackup: data.localisationBackup || data.localisation_backup || '',
      localisationSecondaire: data.localisationSecondaire || data.localisation_secondaire || '',
      tailleBytes: data.tailleBytes || data.taille_bytes || undefined,
      tailleGb: data.tailleGb || data.taille_gb || undefined,
      dureeSecondes: data.dureeSecondes || data.duree_secondes || undefined,
      nombreFichiers: data.nombreFichiers || data.nombre_fichiers || undefined,
      nombreTables: data.nombreTables || data.nombre_tables || undefined,
      checksumSha256: data.checksumSha256 || data.checksum_sha256 || '',
      compression: data.compression || '',
      dateDebut: data.dateDebut || data.date_debut || '',
      dateFin: data.dateFin || data.date_fin || '',
      dateExpiration: data.dateExpiration || data.date_expiration || '',
      utilisateur: data.utilisateur || undefined,
      hopital: data.hopital || undefined,
      hopitalId: data.hopitalId || data.hopital_id || data.hospital_id || undefined,
      messageErreur: data.messageErreur || data.message_erreur || '',
      createdAt: data.createdAt || data.created_at || '',
      updatedAt: data.updatedAt || data.updated_at || '',
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

  private normalizeSingleResponse(raw: AnyApi): SauvegardeResponse {
    const candidate = raw?.data ?? raw?.sauvegarde ?? raw?.backup ?? raw?.item ?? raw?.result ?? raw;
    const data = candidate ? this.normalizeSauvegarde(candidate) : undefined;
    const success = raw?.success ?? raw?.status ?? true;
    const message = raw?.message ?? raw?.msg ?? undefined;
    return { success: !!success, data, message };
  }

  private normalizeListResponse(raw: AnyApi): SauvegardesListResponse {
    const listCandidate = raw?.data ?? raw?.sauvegardes ?? raw?.backups ?? raw?.items ?? raw?.result ?? raw;
    const data = Array.isArray(listCandidate) ? listCandidate.map((s) => this.normalizeSauvegarde(s)) : [];
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
   * Lister toutes les sauvegardes avec filtres et pagination
   */
  getSauvegardes(filters: SauvegardesFilters = {}): Observable<SauvegardesListResponse> {
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
    if (filters.typeBackup) {
      params = params.set('typeBackup', filters.typeBackup);
    }
    if (filters.statut) {
      params = params.set('statut', filters.statut);
    }
    if (filters.numero) {
      params = params.set('numero', filters.numero);
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
   * Récupérer une sauvegarde par ID
   */
  getSauvegarde(id: number): Observable<SauvegardeResponse> {
    return this.http
      .get<AnyApi>(`${this.apiUrl}/${id}`, {
        headers: this.getHeaders(),
      })
      .pipe(map((raw) => this.normalizeSingleResponse(raw)));
  }

  /**
   * Créer une nouvelle sauvegarde
   */
  createSauvegarde(sauvegarde: Partial<Sauvegarde>): Observable<SauvegardeResponse> {
    return this.http
      .post<AnyApi>(this.apiUrl, sauvegarde, {
        headers: this.getHeaders().set('Content-Type', 'application/json'),
      })
      .pipe(map((raw) => this.normalizeSingleResponse(raw)));
  }
}
