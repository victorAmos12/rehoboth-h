import { Component, OnInit, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService, MenuItem, AuthUser } from '../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './layout.page.html',
  styleUrls: ['./layout.page.css'],
})
export class LayoutPage implements OnInit {
  protected readonly menus = signal<MenuItem[]>([]);
  protected readonly currentUser = signal<AuthUser | null>(null);
  protected readonly expandedMenus = signal<Set<string>>(new Set());
  protected readonly sidebarOpen = signal<boolean>(true);
  protected readonly darkMode = signal<boolean>(false);

  readonly pageTitle = input<string>('');
  readonly pageSubtitle = input<string>('');

  constructor(private readonly authService: AuthService) {
    this.loadDarkModePreference();
  }

  ngOnInit(): void {
    console.log('LayoutPage: Initialisation');

    // Charger l'utilisateur actuel
    const user = this.authService.getCurrentUser();
    this.currentUser.set(user);

    // S'abonner aux changements de menus
    this.authService.menus$.subscribe((menus) => {
      console.log('LayoutPage: Menus mis à jour via observable:', menus?.length ?? 0, 'menus');
      this.menus.set(menus);
    });

    // S'abonner aux changements d'utilisateur
    this.authService.user$.subscribe((user) => {
      console.log('LayoutPage: Utilisateur mis à jour via observable:', user?.login ?? 'anonyme');
      this.currentUser.set(user);
    });

    // IMPORTANT: Attendre un tick pour que l'interceptor soit prêt et le token chargé du storage.
    // Sinon, la requête part sans Authorization => 401.
    // Utiliser setTimeout avec 0 ou microtask pour laisser Angular finir son bootstrap.
    Promise.resolve().then(() => {
      console.log('LayoutPage: Chargement des menus après bootstrap');
      this.loadMenusWithRetry();
    });
  }

  private loadMenusWithRetry(): void {
    const token = this.authService.getAuthToken();
    console.log('LayoutPage: Token disponible?', token ? 'OUI' : 'NON');

    if (!token) {
      console.warn('LayoutPage: Pas de token, impossible de charger les menus');
      return;
    }

    // Charger les menus avec gestion d'erreur améliorée
    this.authService.loadMenus().subscribe({
      next: (response) => {
        console.log('LayoutPage: Menus chargés avec succès:', response.menus?.length ?? 0, 'menus');

        if (response.menus && Array.isArray(response.menus)) {
          this.authService.setMenus(response.menus);
          this.menus.set(response.menus);
        }

        if (response.user) {
          this.authService.setCurrentUser(response.user);
          this.currentUser.set(response.user);
        }
      },
      error: (error) => {
        console.error('LayoutPage: Erreur lors du chargement des menus:', error);
        console.warn('LayoutPage: Utilisation des menus en cache');

        // Utiliser les menus en cache en cas d'erreur
        const cachedMenus = this.authService.getMenus();
        this.menus.set(cachedMenus);

        // Afficher un message d'avertissement si le serveur est indisponible
        if (error?.status === 0) {
          console.warn(
            'LayoutPage: Le serveur API est indisponible (HTTP 0). Vérifiez que Symfony est en cours d\'exécution sur http://localhost:8000'
          );
        } else if (error?.status === 401) {
          console.error('LayoutPage: 401 Unauthorized. Vérifiez que le token est valide et que l\'interceptor ajoute bien Authorization.');
        }
      },
    });
  }

  protected toggleMenu(menuId: string): void {
    const expanded = new Set(this.expandedMenus());
    if (expanded.has(menuId)) {
      expanded.delete(menuId);
    } else {
      expanded.add(menuId);
    }
    this.expandedMenus.set(expanded);
  }

  protected isMenuExpanded(menuId: string): boolean {
    return this.expandedMenus().has(menuId);
  }

  protected logout(): void {
    this.authService.logout();
    window.location.href = '/login';
  }

  protected toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  protected toggleDarkMode(): void {
    this.darkMode.set(!this.darkMode());
    this.saveDarkModePreference();

    if (this.darkMode()) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  private loadDarkModePreference(): void {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      const isDark = saved === 'true';
      this.darkMode.set(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      }
    }
  }

  private saveDarkModePreference(): void {
    localStorage.setItem('darkMode', this.darkMode().toString());
  }
}
