import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SpecialitesService, Specialite } from '../../services/specialites.service';
import { ToastService } from '../../services/toast.service';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-specialites-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './specialites-list.page.html',
  styleUrls: ['./specialites-list.page.css'],
})
export class SpecialitesListPage implements OnInit {
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly deleting = signal<number | null>(null);

  protected readonly specialites = signal<Specialite[]>([]);
  protected readonly page = signal(1);
  protected readonly limit = signal(20);
  protected readonly total = signal(0);
  protected readonly pages = signal(1);

  protected q: string = '';
  protected actif: '' | boolean = '';

  private searchTimer: any;

  constructor(
    private readonly service: SpecialitesService,
    private readonly toast: ToastService,
    private readonly modal: ModalService,
    private readonly router: Router
  ) {}

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
        payload.code = q;
      }
      if (actif !== '') payload.actif = actif;

      this.service.search(payload).subscribe({
        next: (res) => {
          this.specialites.set(res.data ?? []);
          const p = res.pagination;
          this.total.set(p?.total ?? res.data?.length ?? 0);
          this.pages.set(p?.pages ?? 1);
          this.loading.set(false);
        },
        error: (e) => {
          const msg = e?.error?.error || e?.error?.message || e?.message || 'Erreur lors du chargement des spécialités.';
          this.error.set(msg);
          this.loading.set(false);
        },
      });
      return;
    }

    // Sinon GET /api/specialites
    this.service.list(page, limit).subscribe({
      next: (res) => {
        this.specialites.set(res.data ?? []);
        const p = res.pagination;
        this.total.set(p?.total ?? res.data?.length ?? 0);
        this.pages.set(p?.pages ?? 1);
        this.loading.set(false);
      },
      error: (e) => {
        const msg = e?.error?.error || e?.error?.message || e?.message || 'Erreur lors du chargement des spécialités.';
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

  protected edit(id: number): void {
    this.router.navigate(['/administration/specialites', id, 'edit']);
  }

  protected delete(id: number, nom: string): void {
    this.modal.confirm({
      title: 'Supprimer la spécialité',
      message: `Êtes-vous sûr de vouloir supprimer la spécialité "${nom}" ?`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      confirmClass: 'danger',
      icon: 'fa-trash',
    }).then((confirmed) => {
      if (!confirmed) return;

      this.deleting.set(id);
      this.service.delete(id).subscribe({
        next: () => {
          this.toast.success('Spécialité supprimée avec succès');
          this.deleting.set(null);
          this.load();
        },
        error: (e) => {
          const msg = e?.error?.error || e?.error?.message || 'Erreur lors de la suppression';
          this.toast.error(msg);
          this.deleting.set(null);
        },
      });
    });
  }
}
