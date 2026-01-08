import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

// Modèle utilisé par le front (sidebar)
export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path?: string;
  children?: MenuItem[];
  section?: string;
}

// Format brut renvoyé par l'API Symfony
export interface ApiMenuItem {
  id: number;
  code: string;
  nom: string;
  description?: string | null;
  icone?: string | null;
  route?: string | null;
  module?: string | null;
  ordre?: number | null;
  children?: ApiMenuItem[];
}

export interface ApiMenusResponse {
  success?: boolean;
  menus?: ApiMenuItem[];
  user?: any;
}

export interface AuthUser {
  id: string;
  login: string;
  email: string;
  roles: string[];
  name?: string;
}

export interface MenuResponse {
  menus: MenuItem[];
  user?: AuthUser;
}

export type CapabilityAction =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'reset_password'
  | 'lock'
  | 'toggle_2fa'
  | (string & {});

export type Capabilities = Record<string, Record<string, boolean>>;

export interface AuthMeResponse {
  success?: boolean;
  user?: any;
  role?: any;
  permissions?: string[];
  menus?: ApiMenuItem[];
  capabilities?: Capabilities;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  
  private readonly authToken = signal<string | null>(null);
  private readonly currentUser = signal<AuthUser | null>(null);
  private readonly userMenus = signal<MenuItem[]>([]);
  private readonly capabilities = signal<Capabilities>({});

  private readonly userSubject = new BehaviorSubject<AuthUser | null>(null);
  private readonly menusSubject = new BehaviorSubject<MenuItem[]>([]);
  private readonly capabilitiesSubject = new BehaviorSubject<Capabilities>({});

  public user$ = this.userSubject.asObservable();
  public menus$ = this.menusSubject.asObservable();
  public capabilities$ = this.capabilitiesSubject.asObservable();

  constructor(private readonly http: HttpClient) {
    this.loadAuthFromStorage();
  }

  private loadAuthFromStorage(): void {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token) {
      this.authToken.set(token);
    }

    // Restaurer l'utilisateur depuis le storage (si disponible)
    const rawUser = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user');
    if (rawUser) {
      try {
        const user = JSON.parse(rawUser) as AuthUser;
        if (user?.id && user?.login) {
          this.currentUser.set(user);
          this.userSubject.next(user);
        }
      } catch {
        // ignore
      }
    }

    // Restaurer les capabilities
    const rawCaps = localStorage.getItem('auth_capabilities') || sessionStorage.getItem('auth_capabilities');
    if (rawCaps) {
      try {
        const caps = JSON.parse(rawCaps) as Capabilities;
        if (caps && typeof caps === 'object') {
          this.capabilities.set(caps);
          this.capabilitiesSubject.next(caps);
        }
      } catch {
        // ignore
      }
    }
  }

  setAuthToken(token: string, remember: boolean = true): void {
    this.authToken.set(token);
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('auth_token', token);
  }

  getAuthToken(): string | null {
    // Source de vérité: signal, mais si l'app a été rechargée / timing bootstrap,
    // on retombe sur le storage pour éviter d'envoyer un header vide => 401.
    const fromSignal = this.authToken();
    if (fromSignal) return fromSignal;

    const fromStorage = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (fromStorage) {
      this.authToken.set(fromStorage);
      return fromStorage;
    }

    return null;
  }

  isAuthenticated(): boolean {
    return !!this.authToken();
  }

  public mapApiMenuItemToMenuItem(api: ApiMenuItem): MenuItem {
    // Mapper les icones Google Material Icons vers FontAwesome
    const materialToFontAwesome: Record<string, string> = {
      // Dashboard & Général
      'dashboard': 'fa-gauge-high',
      'bar_chart': 'fa-chart-bar',
      'trending_up': 'fa-chart-line',
      'assessment': 'fa-chart-pie',
      'info': 'fa-info-circle',
      'help': 'fa-question-circle',

      // Patients & Dossiers
      'people': 'fa-users',
      'person': 'fa-user',
      'group': 'fa-people-group',
      'person_add': 'fa-user-plus',
      'folder_open': 'fa-folder-open',
      'folder_medical': 'fa-folder',
      'description': 'fa-file-alt',
      'description_alt': 'fa-file-alt',

      // Listes & Actions
      'list': 'fa-list',
      'list_alt': 'fa-list',
      'table_chart': 'fa-table',
      'add': 'fa-plus',
      'add_circle': 'fa-plus-circle',
      'edit': 'fa-edit',
      'delete': 'fa-trash',
      'download': 'fa-download',
      'upload': 'fa-upload',
      'print': 'fa-print',
      'search': 'fa-search',
      'filter_list': 'fa-filter',
      'sort': 'fa-sort',
      'refresh': 'fa-sync',

      // Médical
      'medical_services': 'fa-stethoscope',
      'local_hospital': 'fa-hospital',
      'local_pharmacy': 'fa-pills',
      'science': 'fa-flask',
      'bloodtype': 'fa-droplet',
      'health_and_safety': 'fa-shield-heart',
      'request_page': 'fa-file-contract',
      'report_problem': 'fa-exclamation-triangle',
      'warning': 'fa-exclamation-triangle',
      'error': 'fa-times-circle',
      'check_circle': 'fa-check-circle',
      'priority_high': 'fa-exclamation-circle',

      // Calendrier & Dates
      'event': 'fa-calendar',
      'calendar_today': 'fa-calendar-day',
      'calendar_month': 'fa-calendar',
      'schedule': 'fa-clock',
      'access_time': 'fa-hourglass-half',
      'date_range': 'fa-calendar-alt',

      // Gestion & Administration
      'admin_panel_settings': 'fa-cog',
      'settings': 'fa-sliders-h',
      'security': 'fa-lock',
      'history': 'fa-history',
      'backup': 'fa-database',
      'archive': 'fa-box-archive',
      'build': 'fa-hammer',
      'devices': 'fa-microchip',
      'bed': 'fa-bed',
      'business': 'fa-building',
      'domain': 'fa-project-diagram',

      // Logistique & Stocks
      'inventory': 'fa-boxes',
      'local_shipping': 'fa-truck',
      'shopping_cart': 'fa-shopping-cart',
      'receipt': 'fa-receipt',
      'payment': 'fa-credit-card',
      'attach_money': 'fa-money-bill',

      // Communication & Notifications
      'mail': 'fa-envelope',
      'notifications': 'fa-bell',
      'message': 'fa-comments',
      'chat': 'fa-comments',

      // Autres
      'school': 'fa-graduation-cap',
      'beach_access': 'fa-umbrella-beach',
      'emergency': 'fa-ambulance',
      'exit_to_app': 'fa-sign-out-alt',
      'compare_arrows': 'fa-exchange-alt',
      'image': 'fa-image',
      'image_search': 'fa-search-plus',
      'prescription': 'fa-prescription-bottle',
      'medication': 'fa-pills',
    };

    const label = api.nom ?? api.code ?? '';
    
    // Préférer l'icone fournie par l'API (convertie de Material à FontAwesome)
    let icon = 'fa-circle';
    
    if (api.icone) {
      const iconStr = api.icone.toLowerCase().trim();
      // Si c'est déjà au format fa-xxx
      if (iconStr.startsWith('fa-')) {
        icon = iconStr;
      } else if (materialToFontAwesome[iconStr]) {
        // Si c'est une icone Material, la convertir
        icon = materialToFontAwesome[iconStr];
      } else {
        // Sinon, chercher basé sur le code
        const code = (api.code ?? '').toLowerCase();
        for (const [key, value] of Object.entries(materialToFontAwesome)) {
          if (code.includes(key)) {
            icon = value;
            break;
          }
        }
      }
    } else {
      // Si pas d'icone fournie, utiliser le code
      const code = (api.code ?? '').toLowerCase();
      for (const [key, value] of Object.entries(materialToFontAwesome)) {
        if (code.includes(key)) {
          icon = value;
          break;
        }
      }
    }

    return {
      id: String(api.id),
      label,
      icon,
      path: api.route ?? undefined,
      children: Array.isArray(api.children) ? api.children.map((c) => this.mapApiMenuItemToMenuItem(c)) : [],
    };
  }

  mapApiMenusToMenuItems(apiMenus: ApiMenuItem[]): MenuItem[] {
    const safe = Array.isArray(apiMenus) ? apiMenus : [];
    return safe.map((m) => this.mapApiMenuItemToMenuItem(m));
  }

  fetchMe(): Observable<AuthMeResponse> {
    const token = this.getAuthToken();

    if (!token) {
      return new Observable<AuthMeResponse>((subscriber) => {
        subscriber.next({ success: false });
        subscriber.complete();
      });
    }

    // Même logique CORS que loadMenus(): on évite les headers inutiles.
    // L'interceptor ajoute Authorization.
    const headers = new HttpHeaders({
      Accept: 'application/json',
    });

    const url = `${this.apiUrl}/api/auth/me`;
    return this.http.get<AuthMeResponse>(url, { headers });
  }

  setCapabilities(caps: Capabilities, remember?: boolean): void {
    const safeCaps = caps && typeof caps === 'object' ? caps : {};

    this.capabilities.set(safeCaps);
    this.capabilitiesSubject.next(safeCaps);

    const storage =
      remember === undefined
        ? localStorage.getItem('auth_token')
          ? localStorage
          : sessionStorage
        : remember
          ? localStorage
          : sessionStorage;

    try {
      storage.setItem('auth_capabilities', JSON.stringify(safeCaps));
    } catch {
      // ignore
    }
  }

  getCapabilities(): Capabilities {
    return this.capabilities();
  }

  can(module: string, action: CapabilityAction): boolean {
    const caps = this.capabilities();
    const mod = caps?.[module];
    if (!mod) return false;
    return !!mod[action];
  }

  loadMenus(): Observable<MenuResponse> {
    const token = this.authToken();
    console.log('AuthService: loadMenus() appelé avec token:', token ? 'présent' : 'absent');

    // Si pas de token, retourner une réponse vide
    if (!token) {
      console.warn('AuthService: Pas de token disponible, retour de menus vides');
      return new Observable<MenuResponse>((subscriber) => {
        subscriber.next({ menus: [] });
        subscriber.complete();
      });
    }

    // IMPORTANT (CORS):
    // - Ne pas mettre Content-Type sur un GET (inutile et peut déclencher un preflight).
    // - Ne pas mettre Authorization ici: l'interceptor s'en charge.
    // => On ne garde que Accept, qui est un header "simple".
    const headers = new HttpHeaders({
      Accept: 'application/json',
    });

    const url = `${this.apiUrl}/api/administrations/menus`;
    console.log('AuthService: Requête GET vers:', url);

    // L'API renvoie: { success: true, menus: [...], user?: ... }
    return this.http.get<ApiMenusResponse>(url, { headers }).pipe(
      // Normaliser la réponse côté front
      (source) =>
        new Observable<MenuResponse>((subscriber) => {
          const sub = source.subscribe({
            next: (raw) => {
              const apiMenus = Array.isArray(raw?.menus) ? raw!.menus! : [];
              const menus = apiMenus.map((m) => this.mapApiMenuItemToMenuItem(m));

              // Si l'API ne renvoie pas user ici, l'utilisateur restera celui déjà chargé ailleurs.
              const user = raw?.user as AuthUser | undefined;

              subscriber.next({ menus, user });
              subscriber.complete();
            },
            error: (e) => {
              console.error('AuthService: Erreur lors du chargement des menus:', e);
              // En cas d'erreur, retourner une réponse vide plutôt que de propager l'erreur
              subscriber.next({ menus: [] });
              subscriber.complete();
            },
          });
          return () => sub.unsubscribe();
        })
    );
  }

  setMenus(menus: MenuItem[]): void {
    this.userMenus.set(menus);
    this.menusSubject.next(menus);
  }

  getMenus(): MenuItem[] {
    return this.userMenus();
  }

  setCurrentUser(user: AuthUser): void {
    this.currentUser.set(user);
    this.userSubject.next(user);

    // Persister l'utilisateur (même logique remember que le token)
    // Si le token est en sessionStorage, on met l'utilisateur aussi en sessionStorage.
    const storage = localStorage.getItem('auth_token') ? localStorage : sessionStorage;
    try {
      storage.setItem('auth_user', JSON.stringify(user));
    } catch {
      // ignore
    }
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser();
  }

  verify2FA(userId: number, code: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http.post<any>(
      `${this.apiUrl}/api/auth/verify-2fa`,
      { user_id: userId, code },
      { headers }
    );
  }

  logout(): void {
    this.authToken.set(null);
    this.currentUser.set(null);
    this.userMenus.set([]);
    this.capabilities.set({});

    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    sessionStorage.removeItem('auth_user');
    localStorage.removeItem('auth_capabilities');
    sessionStorage.removeItem('auth_capabilities');

    this.userSubject.next(null);
    this.menusSubject.next([]);
    this.capabilitiesSubject.next({});
  }
}
