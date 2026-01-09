import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getAuthToken();

    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Token expiré ou invalide
          // Vérifier si on n'est pas déjà en train de se déconnecter
          if (this.authService.isAuthenticated()) {
            this.authService.logout();
            
            // Afficher un message d'expiration
            this.toastService.error(
              'Votre session a expiré. Veuillez vous reconnecter.',
              7000
            );
            
            // Rediriger vers login avec un paramètre pour afficher le message
            this.router.navigate(['/login'], {
              queryParams: { expired: true },
            });
          }
        } else if (error.status === 403) {
          // Accès refusé
          this.toastService.error(
            'Accès refusé. Vous n\'avez pas les permissions nécessaires.',
            7000
          );
        }
        
        return throwError(() => error);
      })
    );
  }
}
