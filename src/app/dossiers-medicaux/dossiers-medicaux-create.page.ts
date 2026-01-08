import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MedicalFileService } from './services/medical-file.service';
import { PatientService, Patient } from '../services/patient.service';

let searchTimer: any;

@Component({
  selector: 'app-dossiers-medicaux-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 max-w-3xl">
      <div class="mb-6">
        <h1 class="text-2xl font-semibold text-[var(--color-text-primary)]">Nouveau dossier médical</h1>
        <p class="text-sm text-[var(--color-text-muted)]">
          Recherchez un patient (nom, prénom, téléphone, email…) puis créez son dossier.
        </p>
      </div>

      <div class="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Patient</label>

            <div class="relative">
              <input
                class="w-full px-3 py-2 rounded-lg border border-[var(--color-border-default)] bg-transparent"
                [ngModel]="query"
                (ngModelChange)="onQueryChange($event)"
                placeholder="Tapez un nom, prénom, téléphone, email…"
                autocomplete="off"
              />

              @if (searching()) {
                <div class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-sm">
                  Recherche…
                </div>
              }

              @if (selectedPatient()) {
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                  (click)="clearSelection()"
                  title="Changer de patient"
                >
                  Modifier
                </button>
              }

              @if (!selectedPatient() && suggestions().length > 0) {
                <div class="absolute z-20 mt-2 w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] shadow-lg max-h-72 overflow-auto">
                  @for (p of suggestions(); track p.id) {
                    <button
                      type="button"
                      class="w-full text-left px-4 py-3 hover:bg-[var(--color-bg-hover)] transition"
                      (click)="selectPatient(p)"
                    >
                      <div class="flex items-center justify-between">
                        <div class="text-sm font-semibold text-[var(--color-text-primary)]">
                          {{ p.prenom }} {{ p.nom }}
                        </div>
                        <div class="text-xs text-[var(--color-text-muted)]">ID: {{ p.id }}</div>
                      </div>
                      <div class="text-xs text-[var(--color-text-muted)] mt-1">
                        {{ patientSubtitle(p) }}
                      </div>
                    </button>
                  }
                </div>
              }
            </div>

            @if (selectedPatient()) {
              <div class="mt-3 p-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-hover)]">
                <div class="text-sm font-semibold text-[var(--color-text-primary)]">
                  Patient sélectionné: {{ selectedPatient()!.prenom }} {{ selectedPatient()!.nom }}
                </div>
                <div class="text-xs text-[var(--color-text-muted)] mt-1">
                  {{ patientSubtitle(selectedPatient()!) }}
                </div>
              </div>
            } @else {
              <div class="text-xs text-[var(--color-text-muted)] mt-2">
                Astuce: tapez au moins 2 caractères pour afficher des propositions.
              </div>
            }
          </div>

          <div>
            <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Numéro DME</label>
            <input
              class="w-full px-3 py-2 rounded-lg border border-[var(--color-border-default)] bg-transparent"
              [(ngModel)]="numeroDme"
              placeholder="Ex: DME-2026-0001"
            />
            <div class="text-xs text-[var(--color-text-muted)] mt-1">
              Requis par l’API (doit être unique).
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Hôpital (ID)</label>
            <input
              class="w-full px-3 py-2 rounded-lg border border-[var(--color-border-default)] bg-transparent"
              [(ngModel)]="hopitalId"
              placeholder="Ex: 1"
            />
            <div class="text-xs text-[var(--color-text-muted)] mt-1">
              Requis par l’API (hopital_id).
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Médecin référent (ID)</label>
            <input
              class="w-full px-3 py-2 rounded-lg border border-[var(--color-border-default)] bg-transparent"
              [(ngModel)]="medecinReferentId"
              placeholder="Ex: 5"
            />
            <div class="text-xs text-[var(--color-text-muted)] mt-1">
              Requis par l’API (medecin_referent_id).
            </div>
          </div>
        </div>

        @if (error()) {
          <div class="mt-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
            {{ error() }}
          </div>
        }

        <div class="mt-6 flex items-center gap-3">
          <button
            class="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition"
            (click)="save()"
            [disabled]="saving()"
          >
            {{ saving() ? 'Enregistrement…' : 'Créer le dossier' }}
          </button>
          <button
            class="px-4 py-2 rounded-lg border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition"
            (click)="cancel()"
            [disabled]="saving()"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  `,
})
export class DossiersMedicauxCreatePage {
  protected actif: boolean = true;

  // Champs requis API create dossier
  protected numeroDme: string = '';
  protected hopitalId: string = '';
  protected medecinReferentId: string = '';

  // Recherche patient
  protected query: string = '';
  protected readonly suggestions = signal<Patient[]>([]);
  protected readonly searching = signal<boolean>(false);
  protected readonly selectedPatient = signal<Patient | null>(null);

  protected readonly saving = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);

  constructor(
    private readonly medicalFileService: MedicalFileService,
    private readonly patientService: PatientService,
    private readonly router: Router
  ) {}

  protected onQueryChange(value: string): void {
    this.query = value;
    this.selectedPatient.set(null);

    const q = value.trim();
    if (q.length < 2) {
      this.suggestions.set([]);
      this.error.set(null);
      return;
    }

    // Debounce simple sans RxJS (pour rester minimal)
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      this.search(q);
    }, 250);
  }

  private search(q: string): void {
    this.searching.set(true);
    this.error.set(null);

    const qq = q.toLowerCase();

    const filterPatients = (patients: Patient[]): Patient[] => {
      return (patients ?? [])
        .filter((p) => {
          const text = `${p.prenom ?? ''} ${p.nom ?? ''} ${p.telephone ?? ''} ${p.email ?? ''} ${p.id ?? ''}`.toLowerCase();
          return text.includes(qq);
        })
        .slice(0, 10);
    };

    // 1) Tentative: endpoint de recherche avancée
    this.patientService.searchPatients({ nom: q, prenom: q, page: 1, limit: 10 }).subscribe({
      next: (res) => {
        const list = filterPatients(res.data ?? []);
        this.suggestions.set(list);
        this.searching.set(false);

        // Si la recherche renvoie vide (cas fréquent si backend n'implémente pas le LIKE),
        // on retombe sur le fallback liste + filtre front.
        if (list.length === 0) {
          this.fallbackListSearch(q);
        }
      },
      error: () => {
        // 2) Fallback: liste + filtre front
        this.fallbackListSearch(q);
      },
    });
  }

  private fallbackListSearch(q: string): void {
    const qq = q.toLowerCase();
    const filterPatients = (patients: Patient[]): Patient[] => {
      return (patients ?? [])
        .filter((p) => {
          const text = `${p.prenom ?? ''} ${p.nom ?? ''} ${p.telephone ?? ''} ${p.email ?? ''} ${p.id ?? ''}`.toLowerCase();
          return text.includes(qq);
        })
        .slice(0, 10);
    };

    // On tente de récupérer plus que 10 items pour que la recherche soit utile.
    // Si ton backend a un bug 500 sur /api/patients, on affichera l'erreur.
    this.patientService.getPatients(1, 100).subscribe({
      next: (res) => {
        const filtered = filterPatients(res.data ?? []);
        this.suggestions.set(filtered);
        this.searching.set(false);
      },
      error: (e) => {
        const msg =
          e?.error?.message ||
          e?.message ||
          "Impossible de rechercher des patients (l'API /api/patients répond en erreur).";
        this.error.set(msg);
        this.suggestions.set([]);
        this.searching.set(false);
      },
    });
  }

  protected selectPatient(p: Patient): void {
    this.selectedPatient.set(p);
    this.query = `${p.prenom} ${p.nom}`.trim();
    this.suggestions.set([]);
    this.error.set(null);
  }

  protected clearSelection(): void {
    this.selectedPatient.set(null);
    this.query = '';
    this.suggestions.set([]);
  }

  protected save(): void {
    const patient = this.selectedPatient();
    const pid = patient?.id;

    if (!pid) {
      this.error.set('Veuillez sélectionner un patient dans les propositions.');
      return;
    }

    // Vérifications basiques côté front sur les infos patient (avant d'appeler l'API)
    const missingPatientFields: string[] = [];
    if (!patient?.nom) missingPatientFields.push('nom');
    if (!patient?.prenom) missingPatientFields.push('prénom');
    if (!patient?.dateNaissance) missingPatientFields.push('date de naissance');
    if (!patient?.sexe) missingPatientFields.push('sexe');

    if (missingPatientFields.length > 0) {
      this.error.set(
        `Le patient sélectionné est incomplet. Champs manquants: ${missingPatientFields.join(', ')}. ` +
          `Veuillez compléter la fiche patient avant de créer un dossier médical.`
      );
      return;
    }

    const numeroDme = (this.numeroDme || '').trim();
    const hopitalId = Number(this.hopitalId);
    const medecinReferentId = Number(this.medecinReferentId);

    if (!numeroDme) {
      this.error.set("Le champ 'numeroDme' est requis.");
      return;
    }
    if (!hopitalId || Number.isNaN(hopitalId)) {
      this.error.set("Le champ 'hopital_id' est requis (ID hôpital)." );
      return;
    }
    if (!medecinReferentId || Number.isNaN(medecinReferentId)) {
      this.error.set("Le champ 'medecin_referent_id' est requis (ID médecin référent)." );
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    // IMPORTANT: l'API Symfony attend des clés snake_case
    // requiredFields = ['numeroDme', 'patient_id', 'hopital_id', 'medecin_referent_id']
    const payload: any = {
      numeroDme,
      patient_id: pid,
      hopital_id: hopitalId,
      medecin_referent_id: medecinReferentId,
      // optionnels - envoyer actif: true pour que le dossier soit actif
      actif: true,
      statut: 'ACTIF',
    };

    this.medicalFileService.createMedicalFile(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/dossiers-medicaux/list']);
      },
      error: (e: any) => {
        // Symfony renvoie souvent { success:false, error:'...', details:[...] }
        const msg =
          e?.error?.error ||
          e?.error?.message ||
          (Array.isArray(e?.error?.details) ? e.error.details.join(' | ') : null) ||
          e?.message ||
          'Impossible de créer le dossier médical.';
        this.error.set(msg);
        this.saving.set(false);
      },
    });
  }

  protected cancel(): void {
    this.router.navigate(['/dossiers-medicaux/list']);
  }

  protected patientSubtitle(p: Patient): string {
    const parts: string[] = [];
    if (p.dateNaissance) parts.push(`Né(e) le ${p.dateNaissance}`);
    if (p.telephone) parts.push(p.telephone);
    if (p.email) parts.push(p.email);
    return parts.filter(Boolean).join(' • ');
  }
}
