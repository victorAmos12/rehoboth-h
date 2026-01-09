import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Patient {
  id?: number;
  nom: string;
  prenom: string;
  dateNaissance: string;
  sexe: 'M' | 'F';
  email: string;
  telephone: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  pays?: string;
  numeroSecuriteSociale?: string;
  groupeSanguin?: string;
  allergies?: string;
  antecedentsMedicaux?: string;
  hopital_id: number;
  medecin_traitant?: string;
  actif: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PatientResponse {
  success: boolean;
  data?: Patient;
  message?: string;
}

export interface PatientsListResponse {
  success: boolean;
  data: Patient[];
  total: number;
  page?: number;
  limit?: number;
}

/**
 * Certaines APIs Symfony renvoient directement l'entité (sans wrapper {data: ...})
 * ou utilisent des clés différentes (patient, item, result, etc.).
 */
type AnyApi = any;

export interface PatientStatsResponse {
  success: boolean;
  data: {
    totalPatients: number;
    patientsActifs: number;
    patientsInactifs: number;
    patientParHopital: Record<number, number>;
    patientParGroupeSanguin: Record<string, number>;
    allergiesCommunes: string[];
    ageMoyen: number;
    ageMin: number;
    ageMax: number;
  };
}

export interface SearchCriteria {
  nom?: string;
  prenom?: string;
  hopital_id?: number;
  groupeSanguin?: string;
  allergies?: string;
  medecin_traitant?: string;
  dateNaissanceDebut?: string;
  dateNaissanceFin?: string;
  actif?: boolean;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private readonly apiUrl = `${environment.apiUrl}/api/patients`;

  constructor(private readonly http: HttpClient) {}

  private normalizePatient(data: any): Patient {
    if (!data) return data as any;
    
    // Gérer la structure imbriquée retournée par l'API
    // L'API retourne: { identite: {...}, informations_medicales: {...}, informations_personnelles: {...}, etc. }
    
    // Extraire les données de la structure imbriquée
    const identite = data.identite || {};
    const infoMedicales = data.informations_medicales || {};
    const infoPersonnelles = data.informations_personnelles || {};
    const infoAdmin = data.informations_administratives || {};
    const historique = data.historique || {};

    console.log('normalizePatient - identite:', identite);
    console.log('normalizePatient - infoMedicales:', infoMedicales);
    console.log('normalizePatient - infoPersonnelles:', infoPersonnelles);

    // Chercher hopital_id
    let hopital_id = 1;
    if (infoAdmin.hopital) {
      hopital_id = typeof infoAdmin.hopital === 'object' ? infoAdmin.hopital.id || 1 : infoAdmin.hopital;
    } else if (data.hopital_id) {
      hopital_id = typeof data.hopital_id === 'object' ? data.hopital_id.id || 1 : data.hopital_id;
    } else if (data.hopital_id) {
      hopital_id = typeof data.hopital_id === 'object' ? data.hopital_id.id || 1 : data.hopital_id;
    } else if (data.hospital_id) {
      hopital_id = typeof data.hospital_id === 'object' ? data.hospital_id.id || 1 : data.hospital_id;
    }

    const normalized = {
      id: identite.id || data.id || data.ID || undefined,
      nom: identite.nom || data.nom || data.lastName || data.last_name || '',
      prenom: identite.prenom || data.prenom || data.firstName || data.first_name || '',
      dateNaissance: identite.dateNaissance || identite.date_naissance || data.dateNaissance || data.date_naissance || data.birthDate || data.birth_date || '',
      sexe: identite.sexe || data.sexe || data.gender || 'M',
      email: infoPersonnelles.email || data.email || '',
      telephone: infoPersonnelles.telephone || infoPersonnelles.phone || data.telephone || data.phone || data.telephone_number || '',
      adresse: infoPersonnelles.adresse || infoPersonnelles.address || infoPersonnelles.rue || data.adresse || data.address || data.rue || '',
      codePostal: infoPersonnelles.code_postal || infoPersonnelles.codePostal || infoPersonnelles.postalCode || data.codePostal || data.code_postal || data.postalCode || data.postal_code || '',
      ville: infoPersonnelles.ville || infoPersonnelles.city || data.ville || data.city || '',
      pays: infoPersonnelles.pays || infoPersonnelles.country || data.pays || data.country || '',
      numeroSecuriteSociale: infoMedicales.numero_securite_sociale || data.numeroSecuriteSociale || data.social_security_number || data.numero_securite_sociale || '',
      groupeSanguin: infoMedicales.groupe_sanguin || data.groupeSanguin || data.blood_group || data.groupe_sanguin || '',
      allergies: infoMedicales.allergies || data.allergies || data.allergies_list || '',
      antecedentsMedicaux: infoMedicales.antecedents_medicaux || data.antecedentsMedicaux || data.medical_history || data.antecedents_medicaux || '',
      hopital_id,
      medecin_traitant: infoMedicales.medecin_traitant || infoMedicales.treating_doctor || data.medecin_traitant || data.treating_doctor || data.doctor || data.medecin || '',
      actif: data.actif !== undefined ? data.actif : data.active !== undefined ? data.active : data.is_active !== undefined ? data.is_active : true,
      createdAt: historique.date_creation || data.createdAt || data.created_at || data.dateCreation || data.date_creation || '',
      updatedAt: historique.date_modification || data.updatedAt || data.updated_at || data.dateModification || data.date_modification || '',
    };
    // console.log('normalizePatient - result:', normalized);
    return normalized;
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    // Ne pas envoyer Content-Type pour les GET/Blob; il sera fixé sur POST/PUT.
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return new HttpHeaders(headers);
  }

  /** Normalise une réponse "single" vers { success, data } */
  private normalizeSingleResponse(raw: AnyApi): PatientResponse {
    const candidate = raw?.data ?? raw?.patient ?? raw?.item ?? raw?.result ?? raw;
    const data = candidate ? this.normalizePatient(candidate) : undefined;
    const success = raw?.success ?? raw?.status ?? true;
    const message = raw?.message ?? raw?.msg ?? undefined;
    return { success: !!success, data, message };
  }

  /** Normalise une réponse "list" vers { success, data, total } */
  private normalizeListResponse(raw: AnyApi): PatientsListResponse {
    const listCandidate = raw?.data ?? raw?.patients ?? raw?.items ?? raw?.result ?? raw;
    const data = Array.isArray(listCandidate) ? listCandidate.map((p) => this.normalizePatient(p)) : [];
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
   * Créer un nouveau patient
   */
  createPatient(patient: Patient): Observable<PatientResponse> {
    return this.http
      .post<AnyApi>(this.apiUrl, patient, {
        headers: this.getHeaders().set('Content-Type', 'application/json'),
      })
      .pipe(map((raw) => this.normalizeSingleResponse(raw)));
  }

  /**
   * Lister tous les patients
   */
  getPatients(page: number = 1, limit: number = 10): Observable<PatientsListResponse> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    return this.http
      .get<AnyApi>(this.apiUrl, {
        headers: this.getHeaders(),
        params,
      })
      .pipe(map((raw) => this.normalizeListResponse(raw)));
  }

  /**
   * Récupérer un patient par ID
   */
  getPatient(id: number): Observable<PatientResponse> {
    return this.http
      .get<AnyApi>(`${this.apiUrl}/${id}`, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((raw) => {
          // Debug: voir exactement ce que renvoie l'API détail
          console.log('PatientService.getPatient raw:', raw);
          const normalized = this.normalizeSingleResponse(raw);
          console.log('PatientService.getPatient normalized:', normalized);
          return normalized;
        })
      );
  }

  /**
   * Mettre à jour un patient
   */
  updatePatient(id: number, patient: Partial<Patient>): Observable<PatientResponse> {
    return this.http
      .put<AnyApi>(`${this.apiUrl}/${id}`, patient, {
        headers: this.getHeaders().set('Content-Type', 'application/json'),
      })
      .pipe(map((raw) => this.normalizeSingleResponse(raw)));
  }

  /**
   * Supprimer un patient
   */
  deletePatient(id: number): Observable<PatientResponse> {
    return this.http
      .delete<AnyApi>(`${this.apiUrl}/${id}`, {
        headers: this.getHeaders(),
      })
      .pipe(map((raw) => this.normalizeSingleResponse(raw)));
  }

  /**
   * Recherche avancée de patients
   */
  searchPatients(criteria: SearchCriteria): Observable<PatientsListResponse> {
    return this.http
      .post<AnyApi>(`${this.apiUrl}/search`, criteria, {
        headers: this.getHeaders().set('Content-Type', 'application/json'),
      })
      .pipe(map((raw) => this.normalizeListResponse(raw)));
  }

  /**
   * Obtenir les statistiques des patients
   */
  getStats(): Observable<PatientStatsResponse> {
    return this.http.get<PatientStatsResponse>(`${this.apiUrl}/stats`, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Exporter les patients en CSV
   */
  exportCSV(hopital_id?: number, actif?: boolean): Observable<Blob> {
    let params = new HttpParams();
    if (hopital_id !== undefined) {
      params = params.set('hopital_id', hopital_id.toString());
    }
    if (actif !== undefined) {
      params = params.set('actif', actif.toString());
    }

    return this.http.get(`${this.apiUrl}/export/csv`, {
      headers: this.getHeaders().set('Accept', 'text/csv'),
      params,
      responseType: 'blob',
    });
  }

  /**
   * Exporter la fiche patient en PDF
   */
  exportPatientPDF(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/export/pdf`, {
      headers: this.getHeaders().set('Accept', 'application/pdf'),
      responseType: 'blob',
    });
  }

  /**
   * Exporter le dossier médical en PDF
   */
  exportDossierMedical(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/export/dossier-medical`, {
      headers: this.getHeaders().set('Accept', 'application/pdf'),
      responseType: 'blob',
    });
  }

  /**
   * Obtenir les patients par hôpital
   */
  getPatientsByHopital(hopital_id: number, page: number = 1, limit: number = 10): Observable<PatientsListResponse> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    return this.http.get<PatientsListResponse>(`${this.apiUrl}/hopital/${hopital_id}`, {
      headers: this.getHeaders(),
      params,
    });
  }

  /**
   * Obtenir les patients inactifs
   */
  getInactivePatients(page: number = 1, limit: number = 10): Observable<PatientsListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('actif', 'false');

    return this.http.get<PatientsListResponse>(this.apiUrl, {
      headers: this.getHeaders(),
      params,
    });
  }
}
