import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MedicalFileService } from './services/medical-file.service';

@Component({
  selector: 'app-dossiers-medicaux-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-semibold text-[var(--color-text-primary)]">Dossiers médicaux</h1>
          <p class="text-sm text-[var(--color-text-muted)]">Liste des dossiers médicaux</p>
        </div>

        <a
          routerLink="/dossiers-medicaux/create"
          class="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition"
        >
          Nouveau dossier
        </a>
      </div>

      @if (loading()) {
        <div class="text-[var(--color-text-muted)]">Chargement…</div>
      } @else if (error()) {
        <div class="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
          {{ error() }}
        </div>
      } @else {
        @if (dossiers().length === 0) {
          <div class="p-6 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-surface)]">
            <div class="text-[var(--color-text-secondary)] font-medium">Aucun dossier médical</div>
            <div class="text-sm text-[var(--color-text-muted)] mt-1">
              Créez un dossier médical pour commencer.
            </div>
          </div>
        } @else {
          <div class="overflow-x-auto rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-surface)]">
            <table class="min-w-full">
              <thead class="bg-[var(--color-bg-hover)]">
                <tr>
                  <th class="text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-4 py-3">ID</th>
                  <th class="text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-4 py-3">Patient</th>
                  <th class="text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-4 py-3">Statut</th>
                  <th class="text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (d of dossiers(); track d.id) {
                  <tr class="border-t border-[var(--color-border-default)] hover:bg-[var(--color-bg-hover)]">
                    <td class="px-4 py-3 text-sm text-[var(--color-text-secondary)]">{{ d.id }}</td>
                    <td class="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                      {{ formatPatient(d) }}
                    </td>
                    <td class="px-4 py-3 text-sm">
                      <span
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs"
                        [class.bg-green-100]="isActif(d)"
                        [class.text-green-700]="isActif(d)"
                        [class.bg-gray-100]="!isActif(d)"
                        [class.text-gray-700]="!isActif(d)"
                      >
                        {{ isActif(d) ? 'Actif' : 'Inactif' }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <button
                        class="text-sm text-[var(--color-primary)] hover:underline"
                        (click)="open(d)"
                      >
                        Ouvrir
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    </div>
  `,
})
export class DossiersMedicauxListPage implements OnInit {
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly dossiers = signal<any[]>([]);

  constructor(
    private readonly medicalFileService: MedicalFileService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);

    // NOTE: côté API il existe plusieurs endpoints. Ici on tente un "GET /api/dossiers-medicaux".
    // Si ton backend n'a pas cet endpoint, on affichera un message clair.
    this.medicalFileService.getAllMedicalFiles().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : Array.isArray(res?.items) ? res.items : [];
        this.dossiers.set(list);
        this.loading.set(false);
      },
      error: (e: any) => {
        const msg =
          e?.error?.message ||
          e?.message ||
          'Impossible de charger la liste des dossiers médicaux. Vérifiez l’endpoint API.';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  protected open(d: any): void {
    // On n'a pas encore de page détail dossier dédiée.
    // On essaye de basculer vers la page dossier médical du patient si possible.
    const patientId = d?.patientId ?? d?.patient?.id;
    if (patientId) {
      this.router.navigate(['/patients', patientId, 'dossier-medical']);
      return;
    }
  }

  protected isActif(d: any): boolean {
    return !!(d?.actif ?? d?.isActif ?? d?.active);
  }

  protected formatPatient(d: any): string {
    const p = d?.patient;
    if (!p) return '-';
    const nom = p?.nom ?? p?.lastName ?? '';
    const prenom = p?.prenom ?? p?.firstName ?? '';
    const full = `${prenom} ${nom}`.trim();
    return full || String(p?.id ?? '-');
  }
}
