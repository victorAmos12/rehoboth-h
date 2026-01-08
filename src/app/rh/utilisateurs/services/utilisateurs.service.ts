import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface HopitalRef {
  id: number;
  nom: string;
}

export interface RoleRef {
  id: number;
  code: string;
  nom: string;
}

export interface ProfilRef {
  id: number;
  code: string;
  nom: string;
}

export interface SpecialiteRef {
  id: number;
  nom?: string;
  libelle?: string;
}

export interface ContactUrgence {
  nom: string | null;
  telephone: string | null;
}

export interface Identite {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  login: string;
  telephone: string | null;
  actif: boolean;
  hopital: HopitalRef | null;
  role: RoleRef | null;
  profil: ProfilRef | null;
  specialite: SpecialiteRef | null;
  dateCreation: string;
  numeroLicence: string | null;
  numeroOrdre: string | null;
  dateEmbauche: string;
  photoProfil: string | null;
  signatureNumerique: string | null;
  bio: string | null;
  adresse: string | null;
  ville: string | null;
  codePostal: string | null;
  dateNaissance: string | null;
  sexe: string | null;
  nationalite: string | null;
  numeroIdentite: string | null;
  typeIdentite: string | null;
  telephoneUrgence: string | null;
  contactUrgenceNom: string | null;
  compteVerrouille: boolean;
  nombreTentativesConnexion: number;
  mdpTemporaire: boolean;
  authentification2fa: boolean;
  dateDernierChangementMdp: string | null;
  derniereConnexion: string | null;
  dateModification: string;
}

export interface InformationsPersonnelles {
  adresse: string | null;
  ville: string | null;
  code_postal: string | null;
  telephone: string | null;
  email: string;
  date_naissance: string | null;
  sexe: string | null;
  nationalite: string | null;
  numero_identite: string | null;
  type_identite: string | null;
  contact_urgence: ContactUrgence;
}

export interface InformationsProfessionnelles {
  numero_licence: string | null;
  numero_ordre: string | null;
  date_embauche: string;
  specialite: SpecialiteRef | null;
  bio: string | null;
  photo_profil: string | null;
  signature_numerique: string | null;
}

export interface RoleRef2 extends RoleRef {
  niveau_acces?: number;
}

export interface ProfilRef2 extends ProfilRef {
  type?: string | null;
}

export interface InformationsAdministratives {
  hopital: HopitalRef;
  role: RoleRef2;
  profil: ProfilRef2;
  affectations: any[];
}

export interface Securite {
  actif: boolean;
  compte_verrouille: boolean;
  nombre_tentatives_connexion: number;
  mdp_temporaire: boolean;
  authentification_2fa: boolean;
  date_dernier_changement_mdp: string | null;
  derniere_connexion: string | null;
}

export interface Historique {
  date_creation: string;
  date_modification: string;
}

export interface UtilisateurDetail {
  identite: Identite;
  informations_personnelles: InformationsPersonnelles;
  informations_professionnelles: InformationsProfessionnelles;
  informations_administratives: InformationsAdministratives;
  securite: Securite;
  historique: Historique;
}

export interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  login: string;
  telephone: string | null;
  actif: boolean;
  hopital: HopitalRef | null;
  role: RoleRef | null;
  profil: ProfilRef | null;
  specialite: SpecialiteRef | null;
  dateCreation?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface UtilisateursListResponse {
  success: boolean;
  data: Utilisateur[];
  pagination?: PaginationInfo;
  message?: string;
  error?: string;
}

export interface UtilisateurResponse {
  success: boolean;
  data?: Utilisateur;
  message?: string;
  error?: string;
}

export interface UtilisateurDetailResponse {
  success: boolean;
  data?: UtilisateurDetail;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UtilisateursService {
  private readonly apiUrl = `${environment.apiUrl}/api/utilisateurs`;

  constructor(private readonly http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (token) headers['Authorization'] = `Bearer ${token}`;

    return new HttpHeaders(headers);
  }

  list(page: number = 1, limit: number = 20): Observable<UtilisateursListResponse> {
    const params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    return this.http.get<UtilisateursListResponse>(this.apiUrl, {
      headers: this.getHeaders(),
      params,
    });
  }

  get(id: number): Observable<UtilisateurResponse> {
    return this.http.get<UtilisateurResponse>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  getDetail(id: number): Observable<UtilisateurDetailResponse> {
    return this.http.get<UtilisateurDetailResponse>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  create(payload: any): Observable<UtilisateurResponse> {
    return this.http.post<UtilisateurResponse>(this.apiUrl, payload, {
      headers: this.getHeaders().set('Content-Type', 'application/json'),
    });
  }

  update(id: number, payload: any): Observable<UtilisateurResponse> {
    return this.http.put<UtilisateurResponse>(`${this.apiUrl}/${id}`, payload, {
      headers: this.getHeaders().set('Content-Type', 'application/json'),
    });
  }

  delete(id: number): Observable<UtilisateurResponse> {
    return this.http.delete<UtilisateurResponse>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  search(payload: any): Observable<UtilisateursListResponse> {
    return this.http.post<UtilisateursListResponse>(`${this.apiUrl}/search`, payload, {
      headers: this.getHeaders().set('Content-Type', 'application/json'),
    });
  }

  byHopital(hopitalId: number, page: number = 1, limit: number = 20): Observable<UtilisateursListResponse> {
    const params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    return this.http.get<UtilisateursListResponse>(`${this.apiUrl}/hopital/${hopitalId}`, {
      headers: this.getHeaders(),
      params,
    });
  }

  byRole(roleId: number, page: number = 1, limit: number = 20): Observable<UtilisateursListResponse> {
    const params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    return this.http.get<UtilisateursListResponse>(`${this.apiUrl}/role/${roleId}`, {
      headers: this.getHeaders(),
      params,
    });
  }

  lock(id: number, payload: any = {}): Observable<UtilisateurResponse> {
    return this.http.post<UtilisateurResponse>(`${this.apiUrl}/${id}/lock`, payload, {
      headers: this.getHeaders().set('Content-Type', 'application/json'),
    });
  }

  toggle2fa(id: number, payload: any = {}): Observable<UtilisateurResponse> {
    return this.http.post<UtilisateurResponse>(`${this.apiUrl}/${id}/2fa`, payload, {
      headers: this.getHeaders().set('Content-Type', 'application/json'),
    });
  }

  changePassword(id: number, payload: any): Observable<UtilisateurResponse> {
    return this.http.post<UtilisateurResponse>(`${this.apiUrl}/${id}/change-password`, payload, {
      headers: this.getHeaders().set('Content-Type', 'application/json'),
    });
  }

  resetPassword(id: number, payload: any): Observable<UtilisateurResponse> {
    return this.http.post<UtilisateurResponse>(`${this.apiUrl}/${id}/reset-password`, payload, {
      headers: this.getHeaders().set('Content-Type', 'application/json'),
    });
  }

  stats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`, {
      headers: this.getHeaders(),
    });
  }

  exportCsv(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/csv`, {
      headers: this.getHeaders().set('Accept', 'text/csv'),
      responseType: 'blob',
    });
  }

  exportPDF(hopitalId?: number, roleId?: number, actif?: boolean, format: 'list' | 'detailed' = 'list'): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    if (hopitalId) params = params.set('hopital_id', String(hopitalId));
    if (roleId) params = params.set('role_id', String(roleId));
    if (actif !== undefined) params = params.set('actif', String(actif));

    return this.http.get(`${this.apiUrl}/export/pdf`, {
      headers: this.getHeaders().set('Accept', 'application/pdf'),
      params,
      responseType: 'blob',
    });
  }

  exportUserPDF(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/export/pdf`, {
      headers: this.getHeaders().set('Accept', 'application/pdf'),
      responseType: 'blob',
    });
  }

  enable2FA(id: number, pin: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/${id}/2fa/enable`,
      { pin },
      {
        headers: this.getHeaders().set('Content-Type', 'application/json'),
      }
    );
  }

  disable2FA(id: number, pin: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/${id}/2fa/disable`,
      { pin },
      {
        headers: this.getHeaders().set('Content-Type', 'application/json'),
      }
    );
  }
}
