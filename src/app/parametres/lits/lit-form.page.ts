import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LitService, Lit } from '../../services/lit.service';
import { ServiceService, Service } from '../../services/service.service';
import { ChambreService, Chambre } from '../../services/chambre.service';

@Component({
  selector: 'app-lit-form',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './lit-form.page.html',
})
export class LitFormPage implements OnInit {
  protected readonly form = new FormBuilder().group({
    numero_lit: ['', [Validators.required, Validators.minLength(2)]],
    type_lit: [''],
    statut: ['disponible'],
    service_id: ['', [Validators.required]],
    chambre_id: ['', [Validators.required]],
  });

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly isEditMode = signal(false);
  protected readonly litId = signal<number | null>(null);
  protected readonly services = signal<Service[]>([]);
  protected readonly chambres = signal<Chambre[]>([]);
  protected readonly loadingServices = signal(false);
  protected readonly loadingChambres = signal(false);
  protected readonly litsParChambre = signal<{ [key: number]: number }>({});
  protected readonly chambreSelectionnee = signal<Chambre | null>(null);

  constructor(
    private readonly litService: LitService,
    private readonly serviceService: ServiceService,
    private readonly chambreService: ChambreService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadServices();
    this.loadChambres();
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode.set(true);
        this.litId.set(params['id']);
        this.loadLit(params['id']);
      }
    });

    // Écouter les changements du formulaire pour mettre à jour la chambre sélectionnée
    this.form.get('chambre_id')?.valueChanges.subscribe((chambreId) => {
      if (!chambreId) {
        this.chambreSelectionnee.set(null);
        return;
      }
      const chambre = this.chambres().find(c => c.id === parseInt(chambreId as string, 10));
      this.chambreSelectionnee.set(chambre || null);
      // Mettre à jour automatiquement service_id depuis la chambre sélectionnée
      if (chambre && chambre.service_id) {
        this.form.patchValue({ service_id: chambre.service_id.toString() }, { emitEvent: false });
      }
    });
  }

  private loadServices(): void {
    this.loadingServices.set(true);
    this.serviceService.getAll().subscribe({
      next: (services) => {
        this.services.set(services);
        this.loadingServices.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des services:', err);
        this.error.set('Erreur lors du chargement des services');
        this.loadingServices.set(false);
      },
    });
  }

  private loadChambres(): void {
    this.loadingChambres.set(true);
    this.chambreService.getAll().subscribe({
      next: (chambres) => {
        this.chambres.set(chambres);
        this.comptabiliserLitsParChambre();
        this.loadingChambres.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des chambres:', err);
        this.error.set('Erreur lors du chargement des chambres');
        this.loadingChambres.set(false);
      },
    });
  }

  private comptabiliserLitsParChambre(): void {
    this.litService.getAll().subscribe({
      next: (lits) => {
        const compteur: { [key: number]: number } = {};
        lits.forEach(lit => {
          if (lit.chambre_id) {
            compteur[lit.chambre_id] = (compteur[lit.chambre_id] || 0) + 1;
          }
        });
        this.litsParChambre.set(compteur);
      },
      error: (err) => {
        console.error('Erreur lors du comptage des lits:', err);
      },
    });
  }

  protected getLitsDisponiblesEnChambre(): number {
    const chambre = this.chambreSelectionnee();
    if (!chambre) return 0;
    const nombreLitsActuels = this.litsParChambre()[chambre.id || 0] || 0;
    const nombreMaxLits = chambre.nombre_lits || 0;
    return Math.max(0, nombreMaxLits - nombreLitsActuels);
  }

  protected canAddMoreLits(): boolean {
    return this.getLitsDisponiblesEnChambre() > 0;
  }

  private loadLit(id: number): void {
    this.loading.set(true);
    this.litService.getById(id).subscribe({
      next: (lit) => {
        this.form.patchValue({
          numero_lit: lit.numero_lit,
          type_lit: lit.type_lit,
          statut: lit.statut,
          service_id: lit.service_id?.toString(),
          chambre_id: lit.chambre_id?.toString(),
        });
        // Définir la chambre sélectionnée (si déjà chargée dans la liste)
        const chambreObj = this.chambres().find(c => c.id === lit.chambre_id);
        if (chambreObj) {
          this.chambreSelectionnee.set(chambreObj);
        } else if (lit.chambre_id) {
          // Récupérer la chambre au besoin
          this.chambreService.getById(lit.chambre_id).subscribe({ next: (c) => this.chambreSelectionnee.set(c), error: () => {} });
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.error.set('Erreur lors du chargement du lit');
        this.loading.set(false);
      },
    });
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.error.set('Veuillez remplir tous les champs requis');
      return;
    }

    // Vérifier si on peut ajouter un lit dans cette chambre
    if (!this.isEditMode() && !this.canAddMoreLits()) {
      this.error.set(`La chambre sélectionnée a atteint sa capacité maximale (${this.chambreSelectionnee()?.nombre_lits} lits)`);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formValue = this.form.value;
    const chambreId = parseInt(formValue.chambre_id as string, 10);
    const chambre = this.chambres().find(c => c.id === chambreId) || this.chambreSelectionnee();

    const data: Lit = {
      numero_lit: formValue.numero_lit || '',
      type_lit: formValue.type_lit || '',
      // Utiliser l'étage provenant de la chambre sélectionnée pour éviter les incohérences
      etage: chambre?.etage || 0,
      statut: formValue.statut || 'disponible',
      // Utiliser le service rattaché à la chambre lorsqu'il existe
      service_id: chambre?.service_id || parseInt(formValue.service_id as string, 10),
      hopital_id: 1,
      chambre_id: chambreId,
    };

    const request = this.isEditMode()
      ? this.litService.update(this.litId()!, data)
      : this.litService.create(data);

    request.subscribe({
      next: () => {
        this.loading.set(false);
        // Recharger les stats des lits
        this.comptabiliserLitsParChambre();
        this.router.navigate(['/administration/lits']);
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.error.set('Erreur lors de la sauvegarde');
        this.loading.set(false);
      },
    });
  }

  protected onCancel(): void {
    this.router.navigate(['/administration/lits']);
  }

  protected getServiceNameForChambre(): string {
    const sid = this.chambreSelectionnee()?.service_id;
    if (!sid) return '-';
    const s = this.services().find((sr) => sr.id === sid);
    return s?.nom || String(sid);
  }

  protected getChambreEtageDisplay(): string | number {
    return this.chambreSelectionnee()?.etage ?? '-';
  }
}
