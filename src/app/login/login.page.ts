import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Component, computed, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

type ApiViolation = { propertyPath?: string; message?: string };

type LoginResponse = {
  token?: string;
  access_token?: string;
  refresh_token?: string;
  requires_2fa?: boolean;
  user_id?: number;
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
  message?: string;
  success?: boolean;
};

@Component({
  selector: 'app-login-page',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './login.page.html',
})
export class LoginPage {
  private readonly apiUrl = `${environment.apiUrl}/api/auth/login`;

  protected readonly isSubmitting = signal(false);
  protected readonly apiError = signal<string | null>(null);
  protected readonly fieldErrors = signal<Record<string, string[]>>({});
  protected readonly showPassword = signal(false);
  protected readonly requires2FA = signal(false);
  protected readonly twoFAUserId = signal<number | null>(null);
  protected readonly twoFACode = signal('');
  protected readonly verifying2FA = signal(false);

  protected readonly form = new FormGroup({
    login: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
    remember: new FormControl<boolean>(true, { nonNullable: true }),
  });

  // Le bouton ne doit pas rester "bloqué" juste parce qu'un champ n'est pas valide.
  // On laisse l'utilisateur cliquer et on affiche les erreurs (UX plus clair).
  protected readonly canSubmit = computed(() => !this.isSubmitting());

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly authService: AuthService
  ) {}

  protected onSubmit(): void {
    this.apiError.set(null);
    this.fieldErrors.set({});

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.apiError.set('Veuillez vérifier les champs requis.');
      return;
    }

    this.isSubmitting.set(true);

    const payload = {
      login: this.form.controls.login.value,
      password: this.form.controls.password.value,
    };

    // CORS: se configure côté Symfony. Côté front on n'ajoute pas de headers "Access-Control-*".
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    this.http.post<LoginResponse>(this.apiUrl, payload, { headers }).subscribe({
      next: (res) => {
        // Vérifier si 2FA est requise
        if (res.requires_2fa && res.user_id) {
          this.isSubmitting.set(false);
          this.requires2FA.set(true);
          this.twoFAUserId.set(res.user_id);
          this.twoFACode.set('');
          return;
        }

        const token = res?.access_token ?? res?.token;
        if (token) {
          const remember = this.form.controls.remember.value;
          this.authService.setAuthToken(token, remember);

          // Définir l'utilisateur immédiatement depuis la réponse de login (format API: nom/prenom/role)
          if (res.user) {
            this.authService.setCurrentUser({
              id: String(res.user.id),
              login: res.user.login,
              email: res.user.email,
              roles: [String(res.user.role ?? res.user.profil ?? 'Utilisateur')],
              name: [res.user.prenom, res.user.nom].filter(Boolean).join(' ').trim() || undefined,
            });
          }

          // Charger user/menus/capabilities en un seul appel
          this.authService.fetchMe().subscribe({
            next: (me) => {
              // Menus
              if (Array.isArray(me?.menus)) {
                const mapped = this.authService.mapApiMenusToMenuItems(me.menus);
                this.authService.setMenus(mapped);
              }

              // Capabilities
              if (me?.capabilities) {
                const remember = this.form.controls.remember.value;
                this.authService.setCapabilities(me.capabilities, remember);
              }

              // User (si l'API renvoie une structure différente, on garde celui du login)
              if (me?.user?.id && me?.user?.login) {
                this.authService.setCurrentUser({
                  id: String(me.user.id),
                  login: String(me.user.login),
                  email: String(me.user.email ?? ''),
                  roles: [String(me?.role?.code ?? me?.role?.nom ?? 'Utilisateur')],
                  name: [me.user.prenom, me.user.nom].filter(Boolean).join(' ').trim() || undefined,
                });
              }

              this.isSubmitting.set(false);
              this.router.navigate(['/dashboard']);
            },
            error: (err) => {
              // Fallback: si /me échoue, on tente l'ancien endpoint menus.
              console.warn('LoginPage: Erreur /api/auth/me, fallback loadMenus():', err);
              this.authService.loadMenus().subscribe({
                next: (menuRes) => {
                  if (menuRes.menus) {
                    this.authService.setMenus(menuRes.menus);
                  }
                  if (menuRes.user) {
                    this.authService.setCurrentUser(menuRes.user);
                  }
                  this.isSubmitting.set(false);
                  this.router.navigate(['/dashboard']);
                },
                error: (err2) => {
                  console.warn('LoginPage: Erreur lors du fallback loadMenus():', err2);
                  this.isSubmitting.set(false);
                  this.router.navigate(['/dashboard']);
                },
              });
            },
          });
        } else {
          this.isSubmitting.set(false);
          this.apiError.set('Erreur: Aucun token reçu du serveur.');
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);

        // Cas fréquent: serveur down ou CORS bloqué => status 0
        if (err.status === 0) {
          this.apiError.set(
            "Impossible de contacter l'API (serveur indisponible ou CORS). Vérifiez Symfony sur http://localhost:8000 et autorisez l'origine du front (ex: http://localhost:4200) dans la config CORS."
          );
          return;
        }

        const body: any = err.error;

        // Format custom: { errors: { login: [...], password: [...] }, message?: string }
        if (body?.errors && typeof body.errors === 'object') {
          this.fieldErrors.set(body.errors);
          this.apiError.set(body?.message ?? 'Identifiants invalides.');
          return;
        }

        // API Platform: { violations: [{ propertyPath, message }, ...] }
        if (Array.isArray(body?.violations)) {
          const map: Record<string, string[]> = {};
          for (const v of body.violations as ApiViolation[]) {
            const key = String(v?.propertyPath ?? 'form');
            const msg = String(v?.message ?? 'Erreur');
            map[key] = map[key] ? [...map[key], msg] : [msg];
          }
          this.fieldErrors.set(map);
          this.apiError.set(body?.title ?? body?.detail ?? 'Erreur de validation.');
          return;
        }

        if (typeof body?.message === 'string') {
          this.apiError.set(body.message);
          return;
        }

        this.apiError.set(`Connexion impossible (HTTP ${err.status}). Vérifiez vos identifiants.`);
      },
    });
  }

  protected fieldError(name: 'login' | 'password'): string | null {
    const ctrl = this.form.controls[name];
    if (!ctrl.touched && !ctrl.dirty) return null;

    const server = this.fieldErrors()[name];
    if (server?.length) return server[0];

    if (ctrl.hasError('required')) return 'Champ requis.';
    if (name === 'login' && ctrl.hasError('minlength')) return '3 caractères minimum.';
    if (name === 'password' && ctrl.hasError('minlength')) return '6 caractères minimum.';

    return null;
  }

  protected togglePasswordVisibility(): void {
    this.showPassword.update((val) => !val);
  }

  protected onGoogleSignIn(): void {
    this.apiError.set(null);
    this.apiError.set('🚀 Connexion Google en cours de développement. Cette fonctionnalité sera bientôt disponible.');
  }

  protected verify2FA(): void {
    const code = this.twoFACode().trim();
    if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
      this.apiError.set('Veuillez entrer un code à 6 chiffres valide.');
      return;
    }

    const userId = this.twoFAUserId();
    if (!userId) {
      this.apiError.set('Erreur: ID utilisateur manquant.');
      return;
    }

    this.verifying2FA.set(true);
    this.apiError.set(null);

    this.authService.verify2FA(userId, code).subscribe({
      next: (res) => {
        const token = res?.access_token ?? res?.token;
        if (token) {
          const remember = this.form.controls.remember.value;
          this.authService.setAuthToken(token, remember);

          if (res.user) {
            this.authService.setCurrentUser({
              id: String(res.user.id),
              login: res.user.login,
              email: res.user.email,
              roles: [String(res.user.role ?? res.user.profil ?? 'Utilisateur')],
              name: [res.user.prenom, res.user.nom].filter(Boolean).join(' ').trim() || undefined,
            });
          }

          this.authService.fetchMe().subscribe({
            next: (me) => {
              if (Array.isArray(me?.menus)) {
                const mapped = this.authService.mapApiMenusToMenuItems(me.menus);
                this.authService.setMenus(mapped);
              }

              if (me?.capabilities) {
                const remember = this.form.controls.remember.value;
                this.authService.setCapabilities(me.capabilities, remember);
              }

              this.verifying2FA.set(false);
              this.router.navigate(['/dashboard']);
            },
            error: (err) => {
              console.warn('LoginPage: Erreur lors du chargement des menus après 2FA:', err);
              this.verifying2FA.set(false);
              this.router.navigate(['/dashboard']);
            },
          });
        } else {
          this.verifying2FA.set(false);
          this.apiError.set('Erreur: Aucun token reçu du serveur.');
        }
      },
      error: (err: HttpErrorResponse) => {
        this.verifying2FA.set(false);
        const body: any = err.error;
        const msg = body?.message ?? body?.error ?? 'Code 2FA invalide.';
        this.apiError.set(msg);
      },
    });
  }

  protected cancel2FA(): void {
    this.requires2FA.set(false);
    this.twoFAUserId.set(null);
    this.twoFACode.set('');
    this.apiError.set(null);
  }
}
