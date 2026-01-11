import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Interface pour les utilisateurs
 */
export interface Utilisateur {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  login: string;
  telephone?: string;
  actif?: boolean;
  date_creation?: string;
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
 * Service pour la gestion des utilisateurs
 */
@Injectable({
  providedIn: 'root',
})
export class UtilisateursService {
  private readonly utilisateursUrl = `${environment.apiUrl}/api/utilisateurs`;

  constructor(private readonly http: HttpClient) {}

  /**
   * Recherche avancée d'utilisateurs
   */
  searchUtilisateurs(query: string): Observable<Utilisateur[]> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' });
    return this.http.post<ApiResponse<Utilisateur[]>>(`${this.utilisateursUrl}/search`, { query }, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  /**
   * Récupère tous les utilisateurs
   */
  getAll(): Observable<Utilisateur[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<Utilisateur[]>>(this.utilisateursUrl, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  /**
   * Récupère un utilisateur par ID
   */
  getById(id: number): Observable<Utilisateur> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<Utilisateur | ApiResponse<Utilisateur>>(`${this.utilisateursUrl}/${id}`, { headers }).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response;
      })
    );
  }

  /**
   * Crée un nouvel utilisateur
   */
  create(utilisateur: Utilisateur): Observable<Utilisateur> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' });
    return this.http.post<Utilisateur | ApiResponse<Utilisateur>>(this.utilisateursUrl, utilisateur, { headers }).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response;
      })
    );
  }

  /**
   * Met à jour un utilisateur
   */
  update(id: number, utilisateur: Utilisateur): Observable<Utilisateur> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' });
    return this.http.put<Utilisateur | ApiResponse<Utilisateur>>(`${this.utilisateursUrl}/${id}`, utilisateur, { headers }).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response;
      })
    );
  }

  /**
   * Supprime un utilisateur
   */
  delete(id: number): Observable<void> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.delete<void>(`${this.utilisateursUrl}/${id}`, { headers });
  }
}
