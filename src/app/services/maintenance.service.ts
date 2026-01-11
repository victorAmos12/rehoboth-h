import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Maintenance {
  id?: number;
  equipement_id: number;
  hopital_id: number;
  numero_intervention: string;
  date_intervention: string;
  type_intervention?: string;
  technicien_id: number;
  description_intervention?: string;
  pieces_remplacees?: string;
  duree_intervention?: number;
  cout_intervention?: number;
  devise_id?: number;
  statut?: string;
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
export class MaintenanceService {
  private readonly apiUrl = `${environment.apiUrl}/api/maintenances`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Maintenance[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<Maintenance[]>>(this.apiUrl, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  getById(id: number): Observable<Maintenance> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<Maintenance | ApiResponse<Maintenance>>(`${this.apiUrl}/${id}`, { headers }).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response;
      })
    );
  }

  create(maintenance: Maintenance): Observable<Maintenance> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' });
    return this.http.post<Maintenance | ApiResponse<Maintenance>>(this.apiUrl, maintenance, { headers }).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response;
      })
    );
  }

  update(id: number, maintenance: Maintenance): Observable<Maintenance> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' });
    return this.http.put<Maintenance | ApiResponse<Maintenance>>(`${this.apiUrl}/${id}`, maintenance, { headers }).pipe(
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

  getByEquipement(equipementId: number): Observable<Maintenance[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<Maintenance[]>>(`${this.apiUrl}/equipement/${equipementId}`, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  getByHopital(hopitalId: number): Observable<Maintenance[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<Maintenance[]>>(`${this.apiUrl}/hopital/${hopitalId}`, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  getByTechnicien(technicienId: number): Observable<Maintenance[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<Maintenance[]>>(`${this.apiUrl}/technicien/${technicienId}`, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  getByStatut(statut: string): Observable<Maintenance[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<Maintenance[]>>(`${this.apiUrl}/statut/${statut}`, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  getByType(typeIntervention: string): Observable<Maintenance[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<Maintenance[]>>(`${this.apiUrl}/type/${typeIntervention}`, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }
}
