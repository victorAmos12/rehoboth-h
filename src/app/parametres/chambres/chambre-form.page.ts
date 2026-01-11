import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ChambreService, Chambre } from '../../services/chambre.service';
import { ServiceService, Service } from '../../services/service.service';

@Component({
  selector: 'app-chambre-form',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './chambre-form.page.html',
})
export class ChambreFormPage implements OnInit {
  protected readonly form = new FormBuilder().group({
    numero_chambre: ['', [Validators.required]],
    type_chambre: [''],
    nombre_lits: [1, [Validators.min(1)]],
    etage: [0, [Validators.min(0)]],
    localisation: [''],
    statut: ['disponible'],
    description: [''],
    service_id: ['', [Validators.required]],
  });

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly isEditMode = signal(false);
  protected readonly chambreId = signal<number | null>(null);
  protected readonly services = signal<Service[]>([]);
  protected readonly loadingServices = signal(false);

  constructor(
    private readonly chambreService: ChambreService,
    private readonly serviceService: ServiceService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadServices();
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode.set(true);
        this.chambreId.set(params['id']);
        this.loadChambre(params['id']);
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

  private loadChambre(id: number): void {
    this.loading.set(true);
    this.chambreService.getById(id).subscribe({
      next: (chambre) => {
        this.form.patchValue({
          numero_chambre: chambre.numero_chambre,
          type_chambre: chambre.type_chambre,
          nombre_lits: chambre.nombre_lits,
          etage: chambre.etage,
          localisation: chambre.localisation,
          statut: chambre.statut,
          description: chambre.description,
          service_id: chambre.service_id?.toString(),
        });
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.error.set('Erreur lors du chargement de la chambre');
        this.loading.set(false);
      },
    });
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.error.set('Veuillez remplir tous les champs requis');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formValue = this.form.value;
    const data: Chambre = {
      numero_chambre: formValue.numero_chambre || '',
      type_chambre: formValue.type_chambre || '',
      nombre_lits: formValue.nombre_lits || 1,
      etage: formValue.etage || 0,
      localisation: formValue.localisation || '',
      statut: formValue.statut || 'disponible',
      description: formValue.description || '',
      service_id: parseInt(formValue.service_id as string, 10),
      hopital_id: 1,
    };

    const request = this.isEditMode()
      ? this.chambreService.update(this.chambreId()!, data)
      : this.chambreService.create(data);

    request.subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/administration/chambres']);
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.error.set('Erreur lors de la sauvegarde');
        this.loading.set(false);
      },
    });
  }

  protected onCancel(): void {
    this.router.navigate(['/administration/chambres']);
  }
}
