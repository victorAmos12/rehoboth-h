import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService, MenuItem, AuthUser } from '../services/auth.service';

@Component({
  selector: 'app-dashboard-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.css'],
})
export class DashboardPage implements OnInit {
  protected readonly menus = signal<MenuItem[]>([]);
  protected readonly currentUser = signal<AuthUser | null>(null);
  protected readonly expandedMenus = signal<Set<string>>(new Set());
  protected readonly sidebarOpen = signal<boolean>(true);
  protected readonly darkMode = signal<boolean>(false);

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.loadDarkModePreference();
  }

  ngOnInit(): void {
    console.log('DashboardPage: Initialisation');
    
    // Charger les menus depuis l'API
    this.authService.loadMenus().subscribe({
      next: (response) => {
        // console.log('DashboardPage: Menus reçus de l\'API:', response);
        
        if (response.menus && Array.isArray(response.menus)) {
          this.authService.setMenus(response.menus);
          this.menus.set(response.menus);
          // console.log('DashboardPage: Menus définis:', response.menus);
        } else {
          console.warn('DashboardPage: Réponse invalide - pas de menus:');
        }
        
        if (response.user) {
          this.authService.setCurrentUser(response.user);
          this.currentUser.set(response.user);
          // console.log('DashboardPage: Utilisateur défini:', response.user);
        }
      },
      error: (error) => {
        console.error('DashboardPage: Erreur lors du chargement des menus:');
        // Charger les menus en cache en cas d'erreur
        const cachedMenus = this.authService.getMenus();
        this.menus.set(cachedMenus);
        // console.log('DashboardPage: Menus en cache utilisés:', cachedMenus);
      }
    });

    // Charger l'utilisateur courant
    const user = this.authService.getCurrentUser();
    this.currentUser.set(user);
    console.log('DashboardPage: Utilisateur courant:', user);

    // S'abonner aux changements
    this.authService.menus$.subscribe((menus) => {
      console.log('DashboardPage: Menus mis à jour via observable:', menus);
      this.menus.set(menus);
    });

    this.authService.user$.subscribe((user) => {
      console.log('DashboardPage: Utilisateur mis à jour via observable:', user);
      this.currentUser.set(user);
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
    // Sauvegarder la préférence et naviguer vers login (le composant LoginPage forcera le dark mode)
    this.saveDarkModePreference();
    console.log('[Dashboard-Logout] Redirection vers /login');
    // Utiliser window.location.href pour forcer un hard refresh complet
    setTimeout(() => {
      window.location.href = '/login';
    }, 50);
  }

  protected toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  protected toggleDarkMode(): void {
    this.darkMode.set(!this.darkMode());
    this.saveDarkModePreference();
    // Appliquer la classe au document pour les styles globaux
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
      } else {
        // Important: supprimer la classe dark en light mode
        document.documentElement.classList.remove('dark');
      }
    }
  }

  private saveDarkModePreference(): void {
    localStorage.setItem('darkMode', this.darkMode().toString());
  }
}
