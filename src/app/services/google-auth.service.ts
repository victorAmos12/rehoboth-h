import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

declare global {
  interface Window {
    google: any;
  }
}

export interface GoogleAuthResponse {
  success?: boolean;
  message?: string;
  token?: string;
  access_token?: string;
  user?: {
    id: number;
    email: string;
    login: string;
    nom?: string | null;
    prenom?: string | null;
    telephone?: string | null;
    role?: string | null;
    profil?: string | null;
    specialite?: string | null;
    hopital?: string | null;
    photo?: string | null;
  };
}

@Injectable({
  providedIn: 'root',
})
export class GoogleAuthService {
  private readonly apiUrl = `${environment.apiUrl}/api/auth/google/login`;
  private readonly googleClientId = environment.googleClientId || '';
  private readonly isGoogleLoaded = signal(false);

  constructor(private readonly http: HttpClient) {
    this.loadGoogleScript();
  }

  private loadGoogleScript(): void {
    if (window.google) {
      this.isGoogleLoaded.set(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      this.isGoogleLoaded.set(true);
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: this.googleClientId,
          callback: this.handleCredentialResponse.bind(this),
        });
      }
    };
    document.head.appendChild(script);
  }

  private handleCredentialResponse(response: any): void {
    // Cette méthode sera appelée par Google après l'authentification
    // Elle sera utilisée si on utilise le bouton Google natif
  }

  /**
   * Initialise le bouton Google Sign-In
   */
  initializeGoogleButton(elementId: string): void {
    if (!window.google) {
      console.warn('Google API not loaded yet');
      return;
    }

    try {
      window.google.accounts.id.renderButton(
        document.getElementById(elementId),
        {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'signin_with',
        }
      );
    } catch (error) {
      console.error('Error rendering Google button:', error);
    }
  }

  /**
   * Déclenche le flux de connexion Google
   */
  triggerGoogleSignIn(): void {
    if (!window.google) {
      console.warn('Google API not loaded yet');
      return;
    }

    try {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Si le prompt n'est pas affiché, on peut déclencher manuellement
          this.openGoogleSignInPopup();
        }
      });
    } catch (error) {
      console.error('Error triggering Google sign-in:', error);
      this.openGoogleSignInPopup();
    }
  }

  /**
   * Ouvre le popup de connexion Google
   */
  private openGoogleSignInPopup(): void {
    if (!window.google) {
      console.warn('Google API not loaded yet');
      return;
    }

    try {
      window.google.accounts.id.renderButton(
        document.createElement('div'),
        { prompt: 'select_account' }
      );
    } catch (error) {
      console.error('Error opening Google sign-in popup:', error);
    }
  }

  /**
   * Envoie le token Google au backend pour authentification
   */
  loginWithGoogle(googleToken: string): Observable<GoogleAuthResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http.post<GoogleAuthResponse>(
      this.apiUrl,
      { token: googleToken },
      { headers }
    );
  }

  /**
   * Vérifie si Google API est chargée
   */
  isGoogleReady(): boolean {
    return this.isGoogleLoaded();
  }

  /**
   * Obtient le client ID Google
   */
  getGoogleClientId(): string {
    return this.googleClientId;
  }
}
