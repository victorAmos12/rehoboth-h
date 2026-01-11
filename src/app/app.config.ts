import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideHttpClient,
  withFetch,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { DebugInterceptor } from './interceptors/debug.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    // IMPORTANT:
    // Avec provideHttpClient(), les interceptors déclarés via HTTP_INTERCEPTORS
    // ne sont pris en compte que si on active withInterceptorsFromDi().
    // Sinon, aucun interceptor (dont AuthInterceptor) n'est exécuté => pas de Bearer => 401.
    provideHttpClient(withFetch(), withInterceptorsFromDi()),

    // Enregistrer l'intercepteur HTTP pour ajouter le header Authorization
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    // Intercepteur de debug temporaire pour logger les requêtes vers /api/utilisateurs
    { provide: HTTP_INTERCEPTORS, useClass: DebugInterceptor, multi: true },

    provideRouter(routes),
  ],
};
