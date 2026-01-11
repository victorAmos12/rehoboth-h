import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Chambre {
  id?: number;
  numero_chambre: string;
  etage?: number;
  nombre_lits?: number;
  type_chambre?: string;
  statut?: string;
  description?: string;
  localisation?: string;
  climatisee?: boolean;
  sanitaires_prives?: boolean;
  television?: boolean;
  telephone?: boolean;
  date_creation?: string;
  service_id: number;
  hopital_id: number;
  nombre_lits_occupes?: number;
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
export class ChambreService {
  private readonly apiUrl = `${environment.apiUrl}/api/chambres`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Chambre[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<Chambre[]>>(this.apiUrl, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  getById(id: number): Observable<Chambre> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<Chambre | ApiResponse<Chambre>>(`${this.apiUrl}/${id}`, { headers }).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response;
      })
    );
  }

  create(chambre: Chambre): Observable<Chambre> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' });
    return this.http.post<Chambre | ApiResponse<Chambre>>(this.apiUrl, chambre, { headers }).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response;
      })
    );
  }

  update(id: number, chambre: Chambre): Observable<Chambre> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' });
    return this.http.put<Chambre | ApiResponse<Chambre>>(`${this.apiUrl}/${id}`, chambre, { headers }).pipe(
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

  getByService(serviceId: number): Observable<Chambre[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<Chambre[]>>(`${this.apiUrl}/service/${serviceId}`, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  getByHopital(hopitalId: number): Observable<Chambre[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<Chambre[]>>(`${this.apiUrl}/hopital/${hopitalId}`, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  getByType(typeChambre: string): Observable<Chambre[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<Chambre[]>>(`${this.apiUrl}/type/${typeChambre}`, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  getByStatut(statut: string): Observable<Chambre[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<Chambre[]>>(`${this.apiUrl}/statut/${statut}`, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }
}
