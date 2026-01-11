import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Lit {
  id?: number;
  numero_lit: string;
  type_lit?: string;
  etage?: number;
  statut?: string;
  date_derniere_maintenance?: string;
  date_creation?: string;
  service_id?: number;
  hopital_id?: number;
  chambre_id: number;
  chambre_numero?: string;
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
export class LitService {
  private readonly apiUrl = `${environment.apiUrl}/api/lits`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Lit[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<Lit[]>>(this.apiUrl, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  getById(id: number): Observable<Lit> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<Lit | ApiResponse<Lit>>(`${this.apiUrl}/${id}`, { headers }).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response;
      })
    );
  }

  create(lit: Lit): Observable<Lit> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' });
    return this.http.post<Lit | ApiResponse<Lit>>(this.apiUrl, lit, { headers }).pipe(
      map(response => {
        if ('data' in response) {
          return response.data;
        }
        return response;
      })
    );
  }

  update(id: number, lit: Lit): Observable<Lit> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' });
    return this.http.put<Lit | ApiResponse<Lit>>(`${this.apiUrl}/${id}`, lit, { headers }).pipe(
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

  getByService(serviceId: number): Observable<Lit[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<Lit[]>>(`${this.apiUrl}/service/${serviceId}`, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  getByHopital(hopitalId: number): Observable<Lit[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<Lit[]>>(`${this.apiUrl}/hopital/${hopitalId}`, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  getByStatut(statut: string): Observable<Lit[]> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<ApiResponse<Lit[]>>(`${this.apiUrl}/statut/${statut}`, { headers }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  // --- Ticket endpoints (PDF blobs) ---
  downloadTicket(id: number): Observable<Blob> {
    const headers = new HttpHeaders({ Accept: 'application/pdf' });
    return this.http.get(`${this.apiUrl}/${id}/ticket/download`, { headers, responseType: 'blob' });
  }

  printTicket(id: number): Observable<Blob> {
    const headers = new HttpHeaders({ Accept: 'application/pdf' });
    return this.http.get(`${this.apiUrl}/${id}/ticket/print`, { headers, responseType: 'blob' });
  }

  downloadMultipleTickets(litIds: number[]): Observable<Blob> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'application/pdf' });
    return this.http.post(`${this.apiUrl}/tickets/download-multiple`, { lit_ids: litIds }, { headers, responseType: 'blob' });
  }

  printMultipleTickets(litIds: number[]): Observable<Blob> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'application/pdf' });
    return this.http.post(`${this.apiUrl}/tickets/print-multiple`, { lit_ids: litIds }, { headers, responseType: 'blob' });
  }

  downloadTicketsByService(serviceId: number): Observable<Blob> {
    const headers = new HttpHeaders({ Accept: 'application/pdf' });
    return this.http.get(`${this.apiUrl}/service/${serviceId}/tickets/download`, { headers, responseType: 'blob' });
  }
}
