import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Equipement {
  id?: number;
  hopital_id: number;
  service_id?: number;
  code_equipement: string;
  nom_equipement: string;
  type_equipement?: string;
  marque?: string;
  modele?: string;
  numero_serie?: string;
  date_acquisition?: string;
  date_mise_en_service?: string;
  prix_acquisition?: number;
  devise_id?: number;
  duree_vie_utile?: number;
  statut?: string;
  localisation?: string;
  fournisseur_id?: number;
  date_creation?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class EquipementService {
  private readonly apiUrl = `${environment.apiUrl}/api/equipements`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Equipement[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<Equipement[]>>(this.apiUrl, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  getById(id: number): Observable<Equipement> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<Equipement | ApiResponse<Equipement>>(`${this.apiUrl}/${id}`, { headers }).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response;
      })
    );
  }

  create(equipement: Equipement): Observable<Equipement> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' });
    return this.http.post<Equipement | ApiResponse<Equipement>>(this.apiUrl, equipement, { headers }).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response;
      })
    );
  }

  update(id: number, equipement: Equipement): Observable<Equipement> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' });
    return this.http.put<Equipement | ApiResponse<Equipement>>(`${this.apiUrl}/${id}`, equipement, { headers }).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response;
      })
    );
  }

  delete(id: number): Observable<void> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }

  getByService(serviceId: number): Observable<Equipement[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<Equipement[]>>(`${this.apiUrl}/service/${serviceId}`, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  getByHopital(hopitalId: number): Observable<Equipement[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<Equipement[]>>(`${this.apiUrl}/hopital/${hopitalId}`, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  getByType(typeEquipement: string): Observable<Equipement[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<Equipement[]>>(`${this.apiUrl}/type/${typeEquipement}`, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  getByStatut(statut: string): Observable<Equipement[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<Equipement[]>>(`${this.apiUrl}/statut/${statut}`, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }
}
