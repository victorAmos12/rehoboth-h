import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Interface pour les types de services
 */
export interface TypeService {
  id?: number;
  code: string;
  nom: string;
  description?: string;
  actif?: boolean;
}

/**
 * Interface pour les types de pôles
 */
export interface TypePole {
  id?: number;
  code: string;
  nom: string;
  description?: string;
  actif?: boolean;
}

/**
 * Interface pour les affectations d'utilisateurs aux services
 */
export interface Affectation {
  id?: number;
  utilisateur_id: number;
  service_id: number;
  date_debut: string;
  date_fin?: string;
  poste?: string;
  statut?: string;
  actif?: boolean;
}

/**
 * Interface pour les affectations avec détails complets
 */
export interface AffectationDetail extends Affectation {
  utilisateur?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    login: string;
  };
  service?: {
    id: number;
    nom: string;
    code: string;
  };
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
 * Service pour la gestion des types de services, types de pôles et affectations
 */
@Injectable({
  providedIn: 'root',
})
export class TypesAndAffectationsService {
  private readonly typesServicesUrl = `${environment.apiUrl}/api/types-services`;
  private readonly typesPolesUrl = `${environment.apiUrl}/api/types-poles`;
  private readonly affectationsUrl = `${environment.apiUrl}/api/affectations`;

  constructor(private readonly http: HttpClient) {}

  // ==================== TYPES DE SERVICES ====================

  /**
   * Récupère tous les types de services
   */
  getAllTypeServices(): Observable<TypeService[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<TypeService[]>>(this.typesServicesUrl, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  /**
   * Récupère un type de service par ID
   */
  getTypeServiceById(id: number): Observable<TypeService> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<TypeService | ApiResponse<TypeService>>(`${this.typesServicesUrl}/${id}`, { headers }).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response;
      })
    );
  }

  /**
   * Crée un nouveau type de service
   */
  createTypeService(typeService: TypeService): Observable<TypeService> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' });
    return this.http.post<TypeService | ApiResponse<TypeService>>(this.typesServicesUrl, typeService, { headers }).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response;
      })
    );
  }

  /**
   * Met à jour un type de service
   */
  updateTypeService(id: number, typeService: TypeService): Observable<TypeService> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' });
    return this.http.put<TypeService | ApiResponse<TypeService>>(`${this.typesServicesUrl}/${id}`, typeService, { headers }).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response;
      })
    );
  }

  /**
   * Supprime un type de service
   */
  deleteTypeService(id: number): Observable<void> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.delete<void>(`${this.typesServicesUrl}/${id}`, { headers });
  }

  // ==================== TYPES DE PÔLES ====================

  /**
   * Récupère tous les types de pôles
   */
  getAllTypePoles(): Observable<TypePole[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<TypePole[]>>(this.typesPolesUrl, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  /**
   * Récupère un type de pôle par ID
   */
  getTypePoleById(id: number): Observable<TypePole> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<TypePole | ApiResponse<TypePole>>(`${this.typesPolesUrl}/${id}`, { headers }).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response;
      })
    );
  }

  /**
   * Crée un nouveau type de pôle
   */
  createTypePole(typePole: TypePole): Observable<TypePole> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' });
    return this.http.post<TypePole | ApiResponse<TypePole>>(this.typesPolesUrl, typePole, { headers }).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response;
      })
    );
  }

  /**
   * Met à jour un type de pôle
   */
  updateTypePole(id: number, typePole: TypePole): Observable<TypePole> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' });
    return this.http.put<TypePole | ApiResponse<TypePole>>(`${this.typesPolesUrl}/${id}`, typePole, { headers }).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response;
      })
    );
  }

  /**
   * Supprime un type de pôle
   */
  deleteTypePole(id: number): Observable<void> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.delete<void>(`${this.typesPolesUrl}/${id}`, { headers });
  }

  // ==================== AFFECTATIONS ====================

  /**
   * Récupère toutes les affectations
   */
  getAllAffectations(params?: { page?: number; limit?: number }): Observable<Affectation[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    let httpParams = new HttpParams();

    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<ApiResponse<Affectation[]>>(this.affectationsUrl, { headers, params: httpParams }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  /**
   * Récupère une affectation par ID
   */
  getAffectationById(id: number): Observable<Affectation> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<Affectation | ApiResponse<Affectation>>(`${this.affectationsUrl}/${id}`, { headers }).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response;
      })
    );
  }

  /**
   * Crée une nouvelle affectation
   */
  createAffectation(affectation: Affectation): Observable<Affectation> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' });
    return this.http.post<Affectation | ApiResponse<Affectation>>(this.affectationsUrl, affectation, { headers }).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response;
      })
    );
  }

  /**
   * Met à jour une affectation
   */
  updateAffectation(id: number, affectation: Affectation): Observable<Affectation> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' });
    return this.http.put<Affectation | ApiResponse<Affectation>>(`${this.affectationsUrl}/${id}`, affectation, { headers }).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response;
      })
    );
  }

  /**
   * Supprime une affectation
   */
  deleteAffectation(id: number): Observable<void> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.delete<void>(`${this.affectationsUrl}/${id}`, { headers });
  }

  /**
   * Récupère les affectations d'un utilisateur
   */
  getAffectationsByUtilisateur(utilisateurId: number): Observable<Affectation[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<Affectation[]>>(`${this.affectationsUrl}/utilisateur/${utilisateurId}`, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  /**
   * Récupère les affectations d'un service
   */
  getAffectationsByService(serviceId: number): Observable<Affectation[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<Affectation[]>>(`${this.affectationsUrl}/service/${serviceId}`, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  /**
   * Récupère les affectations actuelles
   */
  getCurrentAffectations(): Observable<Affectation[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<Affectation[]>>(`${this.affectationsUrl}/actuelles`, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  /**
   * Récupère les statistiques des affectations
   */
  getAffectationStats(): Observable<any> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<any>>(`${this.affectationsUrl}/stats`, { headers }).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response as any;
      })
    );
  }

  /**
   * Récupère les pôles d'un utilisateur via ses services
   */
  getPolesOfUtilisateur(utilisateurId: number): Observable<any[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<any[]>>(`${this.affectationsUrl}/utilisateur/${utilisateurId}/poles`, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }
}
