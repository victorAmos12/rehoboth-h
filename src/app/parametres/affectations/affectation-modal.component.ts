import { Component, OnInit, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TypesAndAffectationsService, Affectation } from '../../services/types-and-affectations.service';

@Component({
  selector: 'app-affectation-modal',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto" [style]="'background-color: var(--color-bg-surface);'">
          <div class="p-6 border-b" [style]="'border-color: var(--color-border-default);'">
            <div class="flex justify-between items-center">
              <h2 class="text-2xl font-bold" [style]="'color: var(--color-text-primary);'">
                {{ serviceId() ? 'Affectations du Service' : 'Affectations de l\'Utilisateur' }}
              </h2>
              <button (click)="close()" class="text-2xl" [style]="'color: var(--color-text-muted);'">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
          <div class="p-6">
            @if (affectations().length === 0) {
              <p [style]="'color: var(--color-text-muted);'">Aucune affectation trouvée</p>
            } @else {
              <div class="space-y-3">
                @for (affectation of affectations(); track affectation.id) {
                  <div class="p-4 rounded-lg" [style]="'background-color: var(--color-bg-hover); border: 1px solid var(--color-border-default);'">
                    <div class="flex justify-between items-start">
                      <div>
                        <p class="font-semibold" [style]="'color: var(--color-text-primary);'">
                          {{ affectation.poste || 'Affectation' }}
                        </p>
                        <p class="text-sm" [style]="'color: var(--color-text-muted);'">
                          Du {{ affectation.date_debut | date:'dd/MM/yyyy' }}
                          @if (affectation.date_fin) {
                            au {{ affectation.date_fin | date:'dd/MM/yyyy' }}
                          }
                        </p>
                        <p class="text-sm mt-2" [style]="'color: var(--color-text-secondary);'">
                          <span class="inline-block px-2 py-1 rounded text-xs font-semibold"
                            [style]="affectation.actif ? {'background-color': 'rgba(34, 197, 94, 0.1)', 'color': 'var(--color-success)'} : {'background-color': 'rgba(107, 114, 128, 0.1)', 'color': 'var(--color-text-secondary)'}">
                            {{ affectation.actif ? 'Actif' : 'Inactif' }}
                          </span>
                        </p>
                      </div>
                      <button (click)="deleteAffectation(affectation.id)" class="inline-flex items-center justify-center w-10 h-10 rounded-lg transition-colors" [style]="'background-color: rgba(220, 38, 38, 0.1); color: var(--color-error);'" title="Supprimer">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class AffectationModalComponent implements OnInit {
  @Input() isOpen = signal(false);
  @Input() serviceId = signal<number | null>(null);
  @Input() utilisateurId = signal<number | null>(null);

  protected readonly affectations = signal<Affectation[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor(private readonly affectationsService: TypesAndAffectationsService) {}

  ngOnInit(): void {
    // Charger les affectations quand le modal s'ouvre
  }

  open(serviceId?: number, utilisateurId?: number): void {
    if (serviceId) {
      this.serviceId.set(serviceId);
      this.loadAffectationsByService(serviceId);
    } else if (utilisateurId) {
      this.utilisateurId.set(utilisateurId);
      this.loadAffectationsByUtilisateur(utilisateurId);
    }
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.affectations.set([]);
  }

  private loadAffectationsByService(serviceId: number): void {
    this.loading.set(true);
    this.affectationsService.getAffectationsByService(serviceId).subscribe({
      next: (data) => {
        this.affectations.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.error.set('Erreur lors du chargement des affectations');
        this.loading.set(false);
      },
    });
  }

  private loadAffectationsByUtilisateur(utilisateurId: number): void {
    this.loading.set(true);
    this.affectationsService.getAffectationsByUtilisateur(utilisateurId).subscribe({
      next: (data) => {
        this.affectations.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.error.set('Erreur lors du chargement des affectations');
        this.loading.set(false);
      },
    });
  }

  deleteAffectation(id: number | undefined): void {
    if (!id) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette affectation?')) return;

    this.affectationsService.deleteAffectation(id).subscribe({
      next: () => {
        this.affectations.update(aff => aff.filter(a => a.id !== id));
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.error.set('Erreur lors de la suppression');
      },
    });
  }
}
