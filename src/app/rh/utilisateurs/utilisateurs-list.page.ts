import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UtilisateursService, Utilisateur } from './services/utilisateurs.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-utilisateurs-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './utilisateurs-list.page.html',
})
export class UtilisateursListPage implements OnInit {
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly exporting = signal(false);

  protected readonly users = signal<Utilisateur[]>([]);
  protected readonly page = signal(1);
  protected readonly limit = signal(20);
  protected readonly total = signal(0);
  protected readonly pages = signal(1);

  protected q: string = '';
  protected actif: '' | boolean = '';

  private searchTimer: any;

  constructor(
    private readonly service: UtilisateursService,
    private readonly authService: AuthService,
    private readonly toast: ToastService
  ) {}

  protected canManageUsers(): boolean {
    const user = this.authService.getCurrentUser();
    const roles = user?.roles ?? [];
    return roles.includes('ROLE_ADMIN') || roles.includes('ROLE_RH');
  }

  ngOnInit(): void {
    this.load();
  }

  protected onSearchChange(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.page.set(1);
      this.load();
    }, 250);
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);

    const page = this.page();
    const limit = this.limit();

    const q = this.q.trim();
    const actif = this.actif;

    // Si recherche/filtre, on utilise POST /search
    if (q || actif !== '') {
      const payload: any = {
        page,
        limit,
      };
      if (q) {
        payload.nom = q;
        payload.prenom = q;
        payload.email = q;
        payload.login = q;
      }
      if (actif !== '') payload.actif = actif;

      this.service.search(payload).subscribe({
        next: (res) => {
          this.users.set(res.data ?? []);
          const p = res.pagination;
          this.total.set(p?.total ?? res.data?.length ?? 0);
          this.pages.set(p?.pages ?? 1);
          this.loading.set(false);
        },
        error: (e) => {
          const msg = e?.error?.error || e?.error?.message || e?.message || 'Erreur lors du chargement des utilisateurs.';
          this.error.set(msg);
          this.loading.set(false);
        },
      });
      return;
    }

    // Sinon GET /api/utilisateurs
    this.service.list(page, limit).subscribe({
      next: (res) => {
        this.users.set(res.data ?? []);
        const p = res.pagination;
        this.total.set(p?.total ?? res.data?.length ?? 0);
        this.pages.set(p?.pages ?? 1);
        this.loading.set(false);
      },
      error: (e) => {
        const msg = e?.error?.error || e?.error?.message || e?.message || 'Erreur lors du chargement des utilisateurs.';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  protected next(): void {
    if (this.page() < this.pages()) {
      this.page.set(this.page() + 1);
      this.load();
    }
  }

  protected prev(): void {
    if (this.page() > 1) {
      this.page.set(this.page() - 1);
      this.load();
    }
  }

  protected exportPDF(format: 'list' | 'detailed' = 'list'): void {
    this.exporting.set(true);
    this.service.exportPDF(undefined, undefined, undefined, format).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `utilisateurs_${format}_${new Date().toISOString().split('T')[0]}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.toast.success('PDF téléchargé avec succès');
        this.exporting.set(false);
      },
      error: (e) => {
        const msg = e?.error?.error || e?.error?.message || 'Erreur lors de l\'export PDF';
        this.toast.error(msg);
        this.exporting.set(false);
      },
    });
  }

  protected exportCSV(): void {
    this.exporting.set(true);
    this.service.exportCsv().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.toast.success('CSV téléchargé avec succès');
        this.exporting.set(false);
      },
      error: (e) => {
        const msg = e?.error?.error || e?.error?.message || 'Erreur lors de l\'export CSV';
        this.toast.error(msg);
        this.exporting.set(false);
      },
    });
  }
}
