import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

/**
 * Interface pour les informations du patient dans la réponse
 */
export interface PatientInfo {
  id: number;
  nom: string;
  prenom: string;
  numeroDossier: string;
}

/**
 * Interface pour la pagination
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/**
 * Interface pour un dossier médical
 */
export interface MedicalFile {
  id?: number;
  patientId?: number;
  hopitalId?: number;
  numeroDossier?: string;
  dateCreation?: string;
  dateModification?: string;
  statut?: string;
  actif?: boolean;
  [key: string]: any;
}

/**
 * Interface pour les antécédents familiaux
 */
export interface FamilyHistory {
  id?: number;
  dossierMedicalId?: number;
  relation?: string;
  maladie?: string;
  description?: string;
  dateCreation?: string;
  [key: string]: any;
}

/**
 * Interface pour les vaccinations
 */
export interface Vaccination {
  id?: number;
  dossierMedicalId?: number;
  nom?: string;
  dateVaccination?: string;
  dateProchainRappel?: string;
  medecin?: string;
  notes?: string;
  [key: string]: any;
}

/**
 * Interface pour les informations critiques
 */
export interface CriticalInfo {
  id?: number;
  dossierMedicalId?: number;
  type?: string;
  description?: string;
  severite?: string;
  dateCreation?: string;
  [key: string]: any;
}

/**
 * Interface pour les informations supplémentaires
 */
export interface SupplementaryInfo {
  id?: number;
  dossierMedicalId?: number;
  cle?: string;
  valeur?: string;
  [key: string]: any;
}

/**
 * Réponse pour la liste des dossiers médicaux
 */
export interface MedicalFilesResponse {
  success: boolean;
  data: MedicalFile[];
  patient?: PatientInfo;
  pagination?: PaginationInfo;
  message?: string;
}

/**
 * Réponse pour un dossier médical unique
 */
export interface MedicalFileResponse {
  success: boolean;
  data?: MedicalFile;
  message?: string;
}

/**
 * Réponse pour les antécédents familiaux
 */
export interface FamilyHistoryResponse {
  success: boolean;
  data?: FamilyHistory | FamilyHistory[];
  message?: string;
}

/**
 * Réponse pour les vaccinations
 */
export interface VaccinationResponse {
  success: boolean;
  data?: Vaccination | Vaccination[];
  message?: string;
}

/**
 * Réponse pour les informations critiques
 */
export interface CriticalInfoResponse {
  success: boolean;
  data?: CriticalInfo | CriticalInfo[];
  message?: string;
}

/**
 * Réponse pour les informations supplémentaires
 */
export interface SupplementaryInfoResponse {
  success: boolean;
  data?: SupplementaryInfo | SupplementaryInfo[];
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MedicalFileService {
  private readonly apiUrl = `${environment.apiUrl}/api/dossiers-medicaux`;

  constructor(private readonly http: HttpClient) {}

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

  /**
   * Récupère tous les dossiers médicaux (liste globale)
   * GET /api/dossiers-medicaux
   *
   * NOTE: cet endpoint doit exister côté backend. Sinon la page affichera un message d'erreur clair.
   */
  getAllMedicalFiles(page: number = 1, limit: number = 20): Observable<MedicalFilesResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<MedicalFilesResponse>(this.apiUrl, {
      headers: this.getHeaders(),
      params,
    });
  }

  /**
   * Récupère tous les dossiers médicaux d'un patient
   * GET /api/dossiers-medicaux/patient/{patientId}
   */
  getPatientMedicalFiles(
    patientId: number,
    page: number = 1,
    limit: number = 20
  ): Observable<MedicalFilesResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<MedicalFilesResponse>(
      `${this.apiUrl}/patient/${patientId}`,
      {
        headers: this.getHeaders(),
        params,
      }
    );
  }

  /**
   * Récupère le dossier médical actif d'un patient
   * GET /api/dossiers-medicaux/patient/{patientId}/actif
   */
  getActiveMedicalFile(patientId: number): Observable<MedicalFileResponse> {
    return this.http.get<MedicalFileResponse>(
      `${this.apiUrl}/patient/${patientId}/actif`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  /**
   * Récupère les dossiers médicaux d'un hôpital
   * GET /api/dossiers-medicaux/hopital/{hopitalId}
   */
  getHopitalMedicalFiles(
    hopitalId: number,
    page: number = 1,
    limit: number = 20
  ): Observable<MedicalFilesResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<MedicalFilesResponse>(
      `${this.apiUrl}/hopital/${hopitalId}`,
      {
        headers: this.getHeaders(),
        params,
      }
    );
  }

  /**
   * Récupère un dossier médical par ID
   * GET /api/dossiers-medicaux/{id}
   */
  getMedicalFile(id: number): Observable<MedicalFileResponse> {
    return this.http.get<MedicalFileResponse>(
      `${this.apiUrl}/${id}`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  /**
   * Crée un nouveau dossier médical
   * POST /api/dossiers-medicaux
   */
  createMedicalFile(data: Partial<MedicalFile>): Observable<MedicalFileResponse> {
    return this.http.post<MedicalFileResponse>(
      this.apiUrl,
      data,
      {
        headers: this.getHeaders().set('Content-Type', 'application/json'),
      }
    );
  }

  /**
   * Met à jour un dossier médical
   * PUT /api/dossiers-medicaux/{id}
   */
  updateMedicalFile(id: number, data: Partial<MedicalFile>): Observable<MedicalFileResponse> {
    return this.http.put<MedicalFileResponse>(
      `${this.apiUrl}/${id}`,
      data,
      {
        headers: this.getHeaders().set('Content-Type', 'application/json'),
      }
    );
  }

  /**
   * Supprime un dossier médical
   * DELETE /api/dossiers-medicaux/{id}
   */
  deleteMedicalFile(id: number): Observable<MedicalFileResponse> {
    return this.http.delete<MedicalFileResponse>(
      `${this.apiUrl}/${id}`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  /**
   * Ajoute des antécédents familiaux
   * POST /api/dossiers-medicaux/{id}/antecedents-familiaux
   */
  addFamilyHistory(
    dossierMedicalId: number,
    data: Partial<FamilyHistory>
  ): Observable<FamilyHistoryResponse> {
    return this.http.post<FamilyHistoryResponse>(
      `${this.apiUrl}/${dossierMedicalId}/antecedents-familiaux`,
      data,
      {
        headers: this.getHeaders().set('Content-Type', 'application/json'),
      }
    );
  }

  /**
   * Récupère les antécédents familiaux
   * GET /api/dossiers-medicaux/{id}/antecedents-familiaux
   */
  getFamilyHistory(dossierMedicalId: number): Observable<FamilyHistoryResponse> {
    return this.http.get<FamilyHistoryResponse>(
      `${this.apiUrl}/${dossierMedicalId}/antecedents-familiaux`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  /**
   * Met à jour un antécédent familial
   * PUT /api/dossiers-medicaux/{id}/antecedents-familiaux/{familyHistoryId}
   */
  updateFamilyHistory(
    dossierMedicalId: number,
    familyHistoryId: number,
    data: Partial<FamilyHistory>
  ): Observable<FamilyHistoryResponse> {
    return this.http.put<FamilyHistoryResponse>(
      `${this.apiUrl}/${dossierMedicalId}/antecedents-familiaux/${familyHistoryId}`,
      data,
      {
        headers: this.getHeaders().set('Content-Type', 'application/json'),
      }
    );
  }

  /**
   * Supprime un antécédent familial
   * DELETE /api/dossiers-medicaux/{id}/antecedents-familiaux/{familyHistoryId}
   */
  deleteFamilyHistory(
    dossierMedicalId: number,
    familyHistoryId: number
  ): Observable<FamilyHistoryResponse> {
    return this.http.delete<FamilyHistoryResponse>(
      `${this.apiUrl}/${dossierMedicalId}/antecedents-familiaux/${familyHistoryId}`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  /**
   * Ajoute une vaccination
   * POST /api/dossiers-medicaux/{id}/vaccinations
   */
  addVaccination(
    dossierMedicalId: number,
    data: Partial<Vaccination>
  ): Observable<VaccinationResponse> {
    return this.http.post<VaccinationResponse>(
      `${this.apiUrl}/${dossierMedicalId}/vaccinations`,
      data,
      {
        headers: this.getHeaders().set('Content-Type', 'application/json'),
      }
    );
  }

  /**
   * Récupère les vaccinations
   * GET /api/dossiers-medicaux/{id}/vaccinations
   */
  getVaccinations(dossierMedicalId: number): Observable<VaccinationResponse> {
    return this.http.get<VaccinationResponse>(
      `${this.apiUrl}/${dossierMedicalId}/vaccinations`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  /**
   * Met à jour une vaccination
   * PUT /api/dossiers-medicaux/{id}/vaccinations/{vaccinationId}
   */
  updateVaccination(
    dossierMedicalId: number,
    vaccinationId: number,
    data: Partial<Vaccination>
  ): Observable<VaccinationResponse> {
    return this.http.put<VaccinationResponse>(
      `${this.apiUrl}/${dossierMedicalId}/vaccinations/${vaccinationId}`,
      data,
      {
        headers: this.getHeaders().set('Content-Type', 'application/json'),
      }
    );
  }

  /**
   * Supprime une vaccination
   * DELETE /api/dossiers-medicaux/{id}/vaccinations/{vaccinationId}
   */
  deleteVaccination(
    dossierMedicalId: number,
    vaccinationId: number
  ): Observable<VaccinationResponse> {
    return this.http.delete<VaccinationResponse>(
      `${this.apiUrl}/${dossierMedicalId}/vaccinations/${vaccinationId}`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  /**
   * Ajoute des informations critiques
   * POST /api/dossiers-medicaux/{id}/informations-critiques
   */
  addCriticalInfo(
    dossierMedicalId: number,
    data: Partial<CriticalInfo>
  ): Observable<CriticalInfoResponse> {
    return this.http.post<CriticalInfoResponse>(
      `${this.apiUrl}/${dossierMedicalId}/informations-critiques`,
      data,
      {
        headers: this.getHeaders().set('Content-Type', 'application/json'),
      }
    );
  }

  /**
   * Récupère les informations critiques
   * GET /api/dossiers-medicaux/{id}/informations-critiques
   */
  getCriticalInfo(dossierMedicalId: number): Observable<CriticalInfoResponse> {
    return this.http.get<CriticalInfoResponse>(
      `${this.apiUrl}/${dossierMedicalId}/informations-critiques`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  /**
   * Met à jour une information critique
   * PUT /api/dossiers-medicaux/{id}/informations-critiques/{criticalInfoId}
   */
  updateCriticalInfo(
    dossierMedicalId: number,
    criticalInfoId: number,
    data: Partial<CriticalInfo>
  ): Observable<CriticalInfoResponse> {
    return this.http.put<CriticalInfoResponse>(
      `${this.apiUrl}/${dossierMedicalId}/informations-critiques/${criticalInfoId}`,
      data,
      {
        headers: this.getHeaders().set('Content-Type', 'application/json'),
      }
    );
  }

  /**
   * Supprime une information critique
   * DELETE /api/dossiers-medicaux/{id}/informations-critiques/{criticalInfoId}
   */
  deleteCriticalInfo(
    dossierMedicalId: number,
    criticalInfoId: number
  ): Observable<CriticalInfoResponse> {
    return this.http.delete<CriticalInfoResponse>(
      `${this.apiUrl}/${dossierMedicalId}/informations-critiques/${criticalInfoId}`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  /**
   * Récupère les informations supplémentaires
   * GET /api/dossiers-medicaux/{id}/informations-supplementaires
   */
  getSupplementaryInfo(dossierMedicalId: number): Observable<SupplementaryInfoResponse> {
    return this.http.get<SupplementaryInfoResponse>(
      `${this.apiUrl}/${dossierMedicalId}/informations-supplementaires`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  /**
   * Ajoute une information supplémentaire
   * POST /api/dossiers-medicaux/{id}/informations-supplementaires
   */
  addSupplementaryInfo(
    dossierMedicalId: number,
    data: Partial<SupplementaryInfo>
  ): Observable<SupplementaryInfoResponse> {
    return this.http.post<SupplementaryInfoResponse>(
      `${this.apiUrl}/${dossierMedicalId}/informations-supplementaires`,
      data,
      {
        headers: this.getHeaders().set('Content-Type', 'application/json'),
      }
    );
  }

  /**
   * Met à jour une information supplémentaire
   * PUT /api/dossiers-medicaux/{id}/informations-supplementaires/{supplementaryInfoId}
   */
  updateSupplementaryInfo(
    dossierMedicalId: number,
    supplementaryInfoId: number,
    data: Partial<SupplementaryInfo>
  ): Observable<SupplementaryInfoResponse> {
    return this.http.put<SupplementaryInfoResponse>(
      `${this.apiUrl}/${dossierMedicalId}/informations-supplementaires/${supplementaryInfoId}`,
      data,
      {
        headers: this.getHeaders().set('Content-Type', 'application/json'),
      }
    );
  }

  /**
   * Supprime une information supplémentaire
   * DELETE /api/dossiers-medicaux/{id}/informations-supplementaires/{supplementaryInfoId}
   */
  deleteSupplementaryInfo(
    dossierMedicalId: number,
    supplementaryInfoId: number
  ): Observable<SupplementaryInfoResponse> {
    return this.http.delete<SupplementaryInfoResponse>(
      `${this.apiUrl}/${dossierMedicalId}/informations-supplementaires/${supplementaryInfoId}`,
      {
        headers: this.getHeaders(),
      }
    );
  }
}
