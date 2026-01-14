import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

type AffectationsOrigin =
  | { type: 'users'; url: string }
  | { type: 'services'; url: string }
  | { type: 'unknown'; url: string };
import { TypesAndAffectationsService, Affectation, AffectationDetail } from '../../services/types-and-affectations.service';
import { ServiceService, Service } from '../../services/service.service';
import { UtilisateursService, Utilisateur } from '../../services/utilisateurs.service';

@Component({
  selector: 'app-affectations-list',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './affectations-list.page.html',
})
export class AffectationsListPage implements OnInit {
  protected readonly origin = signal<AffectationsOrigin>({ type: 'unknown', url: '/dashboard' });
  protected readonly affectations = signal<AffectationDetail[]>([]);
  protected readonly affectationsWithDetails = signal<Map<number, { utilisateur?: Utilisateur; service?: Service }>>(new Map());
  protected readonly services = signal<any[]>([]);
  protected readonly utilisateurs = signal<Utilisateur[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly searchTerm = signal('');
  protected readonly showForm = signal(false);
  protected readonly selectedServiceId = signal<number | null>(null);
  protected readonly selectedUtilisateurId = signal<number | null>(null);
  protected readonly searchUtilisateurTerm = signal('');
  protected readonly selectedUtilisateur = signal<Utilisateur | null>(null);

  protected readonly form = new FormBuilder().group({
    utilisateur_id: ['', Validators.required],
    service_id: ['', Validators.required],
    date_debut: ['', Validators.required],
    date_fin: [''],
    poste: [''],
    statut: [''],
    actif: [true],
  });

  constructor(
    private readonly affectationsService: TypesAndAffectationsService,
    private readonly serviceService: ServiceService,
    private readonly utilisateursService: UtilisateursService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly location: Location
  ) {}

  ngOnInit(): void {
    // Déterminer la provenance (utilisateurs / services / autre)
    // 1) via query param explicite `from`
    // 2) sinon fallback basé sur la présence de `service_id`
    this.route.queryParams.subscribe((params) => {
      const from = (params['from'] ?? '').toString();

      if (from === 'users') {
        this.origin.set({ type: 'users', url: '/rh/utilisateurs' });
      } else if (from === 'services') {
        // Si on arrive d'un service, on veut retourner à la page de service d'origine.
        // On utilise le referrer si disponible, sinon on tente un fallback vers la liste des services.
        const ref = this.safeGetReferrer();
        this.origin.set({ type: 'services', url: ref ?? '/parametres/services' });
      } else if (params['service_id']) {
        // Si aucun `from` mais qu'on a un service_id, c'est très probablement depuis les services.
        const ref = this.safeGetReferrer();
        this.origin.set({ type: 'services', url: ref ?? '/parametres/services' });
      } else {
        // Fallback: revenir à la page précédente (si possible) sinon dashboard
        const ref = this.safeGetReferrer();
        this.origin.set({ type: 'unknown', url: ref ?? '/dashboard' });
      }

      // Vérifier si un service_id est passé en paramètre
      if (params['service_id']) {
        const serviceId = parseInt(params['service_id'], 10);
        this.selectedServiceId.set(serviceId);
        this.form.patchValue({ service_id: serviceId.toString() });
        this.loadAffectationsByService(serviceId);
      } else {
        this.loadAffectations();
      }
    });

    this.loadServices();
    this.loadUtilisateurs();
  }

  private loadAffectations(): void {
    this.loading.set(true);
    this.affectationsService.getAllAffectations().subscribe({
      next: (data) => {
        this.affectations.set(data);
        this.enrichAffectationsWithDetails(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.error.set('Erreur lors du chargement des affectations');
        this.loading.set(false);
      },
    });
  }

  private enrichAffectationsWithDetails(affectations: Affectation[]): void {
    affectations.forEach((affectation) => {
      // Charger les détails de l'utilisateur
      if (affectation.utilisateur_id) {
        this.utilisateursService.getById(affectation.utilisateur_id).subscribe({
          next: (user) => {
            const details = this.affectationsWithDetails();
            if (!details.has(affectation.id || 0)) {
              details.set(affectation.id || 0, {});
            }
            const affectationDetails = details.get(affectation.id || 0);
            if (affectationDetails) {
              affectationDetails.utilisateur = user;
              details.set(affectation.id || 0, affectationDetails);
              this.affectationsWithDetails.set(new Map(details));
            }
          },
          error: (err) => console.error('Erreur lors du chargement de l\'utilisateur:', err),
        });
      }

      // Charger les détails du service
      if (affectation.service_id) {
        this.serviceService.getById(affectation.service_id).subscribe({
          next: (service) => {
            const details = this.affectationsWithDetails();
            if (!details.has(affectation.id || 0)) {
              details.set(affectation.id || 0, {});
            }
            const affectationDetails = details.get(affectation.id || 0);
            if (affectationDetails) {
              affectationDetails.service = service;
              details.set(affectation.id || 0, affectationDetails);
              this.affectationsWithDetails.set(new Map(details));
            }
          },
          error: (err) => console.error('Erreur lors du chargement du service:', err),
        });
      }
    });
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
        this.error.set('Erreur lors du chargement des affectations du service');
        this.loading.set(false);
      },
    });
  }

  private loadServices(): void {
    this.serviceService.getAll().subscribe({
      next: (data) => {
        this.services.set(data);
      },
      error: (err) => {
        console.error('Erreur:', err);
      },
    });
  }

  private loadUtilisateurs(): void {
    // À implémenter avec le service utilisateurs
    // Pour l'instant, on laisse vide
  }

  protected openForm(): void {
    this.form.reset();
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.error.set('Veuillez remplir tous les champs requis');
      return;
    }

    this.loading.set(true);
    const data: Affectation = {
      utilisateur_id: parseInt(this.form.value.utilisateur_id || '0'),
      service_id: parseInt(this.form.value.service_id || '0'),
      date_debut: this.form.value.date_debut || '',
      date_fin: this.form.value.date_fin || undefined,
      poste: this.form.value.poste || undefined,
      statut: this.form.value.statut || undefined,
      actif: this.form.value.actif !== null ? this.form.value.actif : true,
    };

    this.affectationsService.createAffectation(data).subscribe({
      next: () => {
        this.loading.set(false);
        this.closeForm();
        this.loadAffectations();
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.error.set('Erreur lors de la création de l\'affectation');
        this.loading.set(false);
      },
    });
  }

  protected deleteAffectation(id: number | undefined): void {
    if (!id) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette affectation?')) return;

    this.affectationsService.deleteAffectation(id).subscribe({
      next: () => {
        this.loadAffectations();
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.error.set('Erreur lors de la suppression');
      },
    });
  }

  protected searchUtilisateurs(): void {
    const term = this.searchUtilisateurTerm().trim();
    if (!term || term.length < 2) {
      this.utilisateurs.set([]);
      return;
    }

    this.utilisateursService.searchUtilisateurs(term).subscribe({
      next: (data) => {
        this.utilisateurs.set(data);
      },
      error: (err) => {
        console.error('Erreur lors de la recherche:', err);
        this.utilisateurs.set([]);
      },
    });
  }

  protected selectUtilisateur(user: Utilisateur): void {
    this.selectedUtilisateur.set(user);
    this.form.patchValue({ utilisateur_id: user.id?.toString() });
    this.searchUtilisateurTerm.set('');
    this.utilisateurs.set([]);
  }

  protected clearUtilisateur(): void {
    this.selectedUtilisateur.set(null);
    this.form.patchValue({ utilisateur_id: '' });
    this.searchUtilisateurTerm.set('');
  }

  protected filteredUtilisateurs(): Utilisateur[] {
    return this.utilisateurs();
  }

  protected getUtilisateurName(affectation: AffectationDetail): string {
    if (affectation.utilisateur) {
      return `${affectation.utilisateur.prenom} ${affectation.utilisateur.nom}`;
    }
    return `Utilisateur #${affectation.utilisateur_id}`;
  }

  protected getServiceName(affectation: AffectationDetail): string {
    if (affectation.service) {
      return affectation.service.nom;
    }
    return `Service #${affectation.service_id}`;
  }

  protected get filteredAffectations(): AffectationDetail[] {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.affectations();
    return this.affectations().filter(
      (a) =>
        this.getUtilisateurName(a).toLowerCase().includes(term) ||
        this.getServiceName(a).toLowerCase().includes(term) ||
        a.poste?.toLowerCase().includes(term) ||
        a.statut?.toLowerCase().includes(term)
    );
  }

  protected goBack(): void {
    // Comportement le plus fiable: revenir dans l'historique SPA.
    // (C'est ce que l'utilisateur attend: retour exact à l'écran précédent.)
    // Si ça ne change pas de route (cas rare), on fera un fallback.

    const before = this.router.url;
    this.location.back();

    // Fallback: si après un tick on est toujours sur la même URL, on redirige vers l'origin calculée.
    setTimeout(() => {
      const after = this.router.url;
      if (after === before) {
        this.router.navigateByUrl(this.origin().url);
      }
    }, 0);
  }

  private safeGetReferrer(): string | null {
    try {
      const ref = document.referrer;
      if (!ref) return null;

      // Si le referrer est sur le même origin que l'app, on retourne le path+query+hash
      const url = new URL(ref);
      if (url.origin === window.location.origin) {
        return url.pathname + url.search + url.hash;
      }

      return null;
    } catch {
      return null;
    }
  }
}
