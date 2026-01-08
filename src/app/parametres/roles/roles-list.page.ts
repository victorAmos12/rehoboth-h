import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RolesService, Role } from './services/roles.service';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './roles-list.page.html',
})
export class RolesListPage implements OnInit {
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly roles = signal<Role[]>([]);
  protected readonly page = signal(1);
  protected readonly limit = signal(20);
  protected readonly total = signal(0);
  protected readonly pages = signal(1);

  constructor(private readonly service: RolesService) {}

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.list(this.page(), this.limit()).subscribe({
      next: (res) => {
        this.roles.set(res.data ?? []);
        const p = res.pagination;
        this.total.set(p?.total ?? res.data?.length ?? 0);
        this.pages.set(p?.pages ?? 1);
        this.loading.set(false);
      },
      error: (e) => {
        const msg = e?.error?.error || e?.error?.message || e?.message || 'Erreur lors du chargement des rôles.';
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
}
