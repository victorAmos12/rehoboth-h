import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ServiceService, Service } from '../../services/service.service';
import { TypesAndAffectationsService, TypeService } from '../../services/types-and-affectations.service';

@Component({
  selector: 'app-service-form',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FormsModule],
  templateUrl: './service-form.page.html',
})
export class ServiceFormPage implements OnInit {
  protected readonly form = new FormBuilder().group({
    // Informations générales
    code: ['', [Validators.required, Validators.minLength(2)]],
    nom: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    type_service: [''],
    pole_id: [undefined as number | undefined],
    
    // Gestion opérationnelle
    nombre_lits: [0, [Validators.min(0)]],
    localisation: [''],
    horaires_ouverture: [''],
    niveau_accreditation: [''],
    
    // Gestion des ressources
    budget_annuel: ['' as string | number],
    nombre_personnel: [0, [Validators.min(0)]],
    
    // Informations de contact
    telephone: [''],
    email: ['', Validators.email],
    
    // Statut
    actif: [true],
  });

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly isEditMode = signal(false);
  protected readonly serviceId = signal<number | null>(null);
  protected readonly poles = signal<any[]>([]);
  protected readonly typeServices = signal<TypeService[]>([]);
  protected readonly showTypeServiceModal = signal(false);
  protected readonly newTypeService = signal<TypeService>({ code: '', nom: '' });

  constructor(
    private readonly serviceService: ServiceService,
    private readonly typesService: TypesAndAffectationsService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadPoles();
    this.loadTypeServices();
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode.set(true);
        this.serviceId.set(params['id']);
        this.loadService(params['id']);
      }
    });
  }

  private loadPoles(): void {
    this.serviceService.getAllPoles().subscribe({
      next: (data) => {
        this.poles.set(data);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des pôles:', err);
      },
    });
  }

  private loadTypeServices(): void {
    this.typesService.getAllTypeServices().subscribe({
      next: (data) => {
        this.typeServices.set(data);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des types de services:', err);
      },
    });
  }

  private loadService(id: number): void {
    this.loading.set(true);
    this.serviceService.getDetails(id).subscribe({
      next: (service) => {
        this.form.patchValue(service);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement:', err);
        this.error.set('Erreur lors du chargement du service');
        this.loading.set(false);
      },
    });
  }

  protected openTypeServiceModal(): void {
    this.newTypeService.set({ code: '', nom: '' });
    this.showTypeServiceModal.set(true);
  }

  protected closeTypeServiceModal(): void {
    this.showTypeServiceModal.set(false);
  }

  protected createTypeService(): void {
    const typeService = this.newTypeService();
    if (!typeService.code || !typeService.nom) {
      this.error.set('Code et Nom sont requis');
      return;
    }

    this.typesService.createTypeService(typeService).subscribe({
      next: (data) => {
        this.typeServices.update(types => [...types, data]);
        this.form.patchValue({ type_service: data.code });
        this.closeTypeServiceModal();
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.error.set('Erreur lors de la création du type de service');
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
    
    // Convertir pole_id correctement
    let poleId: number | undefined = undefined;
    if (formValue.pole_id) {
      const parsed = parseInt(String(formValue.pole_id), 10);
      if (!isNaN(parsed)) {
        poleId = parsed;
      }
    }

    // Convertir nombre_lits correctement
    let nombreLits: number | undefined = undefined;
    if (formValue.nombre_lits) {
      const parsed = parseInt(String(formValue.nombre_lits), 10);
      if (!isNaN(parsed) && parsed > 0) {
        nombreLits = parsed;
      }
    }

    // Convertir budget_annuel correctement
    let budgetAnnuel: number | undefined = undefined;
    if (formValue.budget_annuel) {
      const parsed = parseFloat(String(formValue.budget_annuel));
      if (!isNaN(parsed) && parsed > 0) {
        budgetAnnuel = parsed;
      }
    }

    // Convertir nombre_personnel correctement
    let nombrePersonnel: number | undefined = undefined;
    if (formValue.nombre_personnel) {
      const parsed = parseInt(String(formValue.nombre_personnel), 10);
      if (!isNaN(parsed) && parsed > 0) {
        nombrePersonnel = parsed;
      }
    }

    // Nettoyer les valeurs null/undefined et convertir les types
    const data: Service = {
      hopital_id: 1,
      code: formValue.code || '',
      nom: formValue.nom || '',
      description: formValue.description || undefined,
      type_service: formValue.type_service || undefined,
      pole_id: poleId,
      nombre_lits: nombreLits,
      localisation: formValue.localisation || undefined,
      horaires_ouverture: formValue.horaires_ouverture || undefined,
      niveau_accreditation: formValue.niveau_accreditation || undefined,
      budget_annuel: budgetAnnuel,
      nombre_personnel: nombrePersonnel,
      telephone: formValue.telephone || undefined,
      email: formValue.email || undefined,
      actif: formValue.actif !== null ? formValue.actif : true,
    };

    console.log('Données envoyées au serveur:', data);

    const request = this.isEditMode()
      ? this.serviceService.update(this.serviceId()!, data)
      : this.serviceService.create(data);

    request.subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/administration/services']);
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.error.set('Erreur lors de la sauvegarde du service');
        this.loading.set(false);
      },
    });
  }

  protected onCancel(): void {
    this.router.navigate(['/administration/services']);
  }
}
