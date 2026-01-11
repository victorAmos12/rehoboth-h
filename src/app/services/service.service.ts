import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Interface complète pour la gestion avancée des services hospitaliers
 * Inclut: gestion opérationnelle, ressources, budget, personnel, accréditation
 */
export interface Service {
  id?: number;
  hopital_id: number;
  code: string;
  nom: string;
  description?: string;
  type_service?: string;
  chef_service_id?: number;
  nombre_lits?: number;
  localisation?: string;
  telephone?: string;
  email?: string;
  logo_service?: string;
  couleur_service?: string;
  actif?: boolean;
  date_creation?: string;
  // Gestion des ressources
  budget_annuel?: number | string;
  nombre_personnel?: number;
  // Gestion opérationnelle
  horaires_ouverture?: string;
  niveau_accreditation?: string;
  // Gestion organisationnelle
  pole_id?: number;
  pole_nom?: string;
  pole_code?: string;
}

/**
 * Interface pour les détails complets d'un service
 */
export interface ServiceDetails extends Service {
  budget_moyen_par_personnel?: number;
  total_chambres?: number;
  total_lits_disponibles?: number;
  taux_occupation?: number;
}

/**
 * Interface pour les statistiques d'un service
 */
export interface ServiceStatistics {
  service_id: number;
  service_nom: string;
  total_chambres: number;
  total_lits: number;
  lits_disponibles: number;
  lits_occupes: number;
  taux_occupation: number;
  total_personnel: number;
  budget_total: number;
  budget_par_lit: number;
  budget_par_personnel: number;
}

/**
 * Interface pour les paramètres de pagination et filtrage
 */
export interface ServiceQueryParams {
  page?: number;
  limit?: number;
  hopital_id?: number;
  type_service?: string;
  pole_id?: number;
  actif?: boolean;
}

/**
 * Interface générique pour les réponses API
 */
interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  message?: string;
}

/**
 * Service pour la gestion complète et avancée des services hospitaliers
 * 
 * Fonctionnalités:
 * - CRUD complet des services
 * - Gestion des pôles d'activité
 * - Gestion des ressources (budget, personnel)
 * - Gestion opérationnelle (horaires, accréditation)
 * - Détails et statistiques
 * - Filtrage et pagination avancés
 */
@Injectable({
  providedIn: 'root',
})
export class ServiceService {
  private readonly apiUrl = `${environment.apiUrl}/api/services`;
  private readonly polesUrl = `${environment.apiUrl}/api/poles`;

  constructor(private readonly http: HttpClient) {}

  /**
   * Récupère tous les services avec pagination et filtrage
   * @param params Paramètres de requête (page, limit, filtres)
   */
  getAll(params?: ServiceQueryParams): Observable<Service[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    let httpParams = new HttpParams();

    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.hopital_id) httpParams = httpParams.set('hopital_id', params.hopital_id.toString());
      if (params.type_service) httpParams = httpParams.set('type_service', params.type_service);
      if (params.pole_id) httpParams = httpParams.set('pole_id', params.pole_id.toString());
      if (params.actif !== undefined) httpParams = httpParams.set('actif', params.actif.toString());
    }

    return this.http.get<ApiResponse<Service[]>>(this.apiUrl, { headers, params: httpParams }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  /**
   * Récupère un service par son ID
   * @param id ID du service
   */
  getById(id: number): Observable<Service> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<Service | ApiResponse<Service>>(`${this.apiUrl}/${id}`, { headers }).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response;
      })
    );
  }

  /**
   * Récupère les détails complets d'un service
   * Inclut: informations complètes, ressources, opérations, statistiques
   * @param id ID du service
   */
  getDetails(id: number): Observable<ServiceDetails> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<ServiceDetails>>(`${this.apiUrl}/${id}/details`, { headers }).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response as ServiceDetails;
      })
    );
  }

  /**
   * Récupère les statistiques d'un service
   * @param id ID du service
   */
  getStatistics(id: number): Observable<ServiceStatistics> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<ServiceStatistics>>(`${this.apiUrl}/${id}/statistiques`, { headers }).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response as ServiceStatistics;
      })
    );
  }

  /**
   * Crée un nouveau service avec gestion complète
   * @param service Données du service à créer
   */
  create(service: Service): Observable<Service> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' });
    return this.http.post<Service | ApiResponse<Service>>(this.apiUrl, service, { headers }).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response;
      })
    );
  }

  /**
   * Met à jour un service existant
   * @param id ID du service
   * @param service Données mises à jour
   */
  update(id: number, service: Service): Observable<Service> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' });
    return this.http.put<Service | ApiResponse<Service>>(`${this.apiUrl}/${id}`, service, { headers }).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response;
      })
    );
  }

  /**
   * Supprime un service
   * @param id ID du service
   */
  delete(id: number): Observable<void> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }

  /**
   * Récupère tous les services d'un hôpital
   * @param hopitalId ID de l'hôpital
   */
  getByHopital(hopitalId: number): Observable<Service[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<Service[]>>(`${this.apiUrl}/hopital/${hopitalId}`, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  /**
   * Récupère les services par type
   * @param typeService Type de service (Spécialité médicale, Diagnostic, Support, etc.)
   */
  getByType(typeService: string): Observable<Service[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<Service[]>>(`${this.apiUrl}/type/${typeService}`, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  /**
   * Récupère les services d'un pôle d'activité
   * @param poleId ID du pôle
   */
  getByPole(poleId: number): Observable<Service[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<Service[]>>(`${this.apiUrl}/pole/${poleId}`, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  /**
   * Assigne un service à un pôle d'activité
   * @param serviceId ID du service
   * @param poleId ID du pôle
   */
  assignToPole(serviceId: number, poleId: number): Observable<Service> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' });
    return this.http.post<ApiResponse<Service>>(
      `${this.apiUrl}/${serviceId}/assigner-pole`,
      { pole_id: poleId },
      { headers }
    ).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response as Service;
      })
    );
  }

  /**
   * Récupère tous les pôles d'activité
   * @param params Paramètres de requête (page, limit, filtres)
   */
  getAllPoles(params?: { page?: number; limit?: number; hopital_id?: number; actif?: boolean }): Observable<any[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    let httpParams = new HttpParams();

    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.hopital_id) httpParams = httpParams.set('hopital_id', params.hopital_id.toString());
      if (params.actif !== undefined) httpParams = httpParams.set('actif', params.actif.toString());
    }

    return this.http.get<ApiResponse<any[]>>(this.polesUrl, { headers, params: httpParams }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  /**
   * Récupère un pôle par son ID
   * @param id ID du pôle
   */
  getPoleById(id: number): Observable<any> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<any | ApiResponse<any>>(`${this.polesUrl}/${id}`, { headers }).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response;
      })
    );
  }

  /**
   * Crée un nouveau pôle d'activité
   * @param pole Données du pôle
   */
  createPole(pole: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' });
    return this.http.post<any | ApiResponse<any>>(this.polesUrl, pole, { headers }).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response;
      })
    );
  }

  /**
   * Met à jour un pôle d'activité
   * @param id ID du pôle
   * @param pole Données mises à jour
   */
  updatePole(id: number, pole: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' });
    return this.http.put<any | ApiResponse<any>>(`${this.polesUrl}/${id}`, pole, { headers }).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response;
      })
    );
  }

  /**
   * Supprime un pôle d'activité
   * @param id ID du pôle
   */
  deletePole(id: number): Observable<void> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.delete<void>(`${this.polesUrl}/${id}`, { headers });
  }

  /**
   * Récupère les pôles d'un hôpital
   * @param hopitalId ID de l'hôpital
   */
  getPolesByHopital(hopitalId: number): Observable<any[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<any[]>>(`${this.polesUrl}/hopital/${hopitalId}`, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  /**
   * Assigne un responsable à un pôle
   * @param poleId ID du pôle
   * @param responsableId ID du responsable
   */
  assignResponsibleToPole(poleId: number, responsableId: number): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' });
    return this.http.post<ApiResponse<any>>(
      `${this.polesUrl}/${poleId}/assigner-responsable`,
      { responsable_id: responsableId },
      { headers }
    ).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response as any;
      })
    );
  }

  /**
   * Récupère les services d'un pôle
   * @param poleId ID du pôle
   */
  getServicesOfPole(poleId: number): Observable<Service[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<Service[]>>(`${this.polesUrl}/${poleId}/services`, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  /**
   * Récupère les statistiques d'un pôle
   * @param poleId ID du pôle
   */
  getPoleStatistics(poleId: number): Observable<any> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<any>>(`${this.polesUrl}/${poleId}/statistiques`, { headers }).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response as any;
      })
    );
  }
}
