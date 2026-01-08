import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RolesService, Role } from './services/roles.service';

@Component({
  selector: 'app-role-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './role-detail.page.html',
})
export class RoleDetailPage implements OnInit {
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly role = signal<Role | null>(null);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: RolesService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || Number.isNaN(id)) {
      this.error.set('Identifiant rôle invalide');
      return;
    }
    this.load(id);
  }

  private load(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.get(id).subscribe({
      next: (res) => {
        if (res.data) this.role.set(res.data);
        this.loading.set(false);
      },
      error: (e) => {
        const msg = e?.error?.error || e?.error?.message || e?.message || 'Erreur lors du chargement du rôle.';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  protected goBack(): void {
    this.router.navigate(['/parametres/roles']);
  }
}
