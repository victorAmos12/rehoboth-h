import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MaintenanceService, Maintenance } from '../../services/maintenance.service';

@Component({
  selector: 'app-maintenance-form',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './maintenance-form.page.html',
})
export class MaintenanceFormPage implements OnInit {
  protected readonly form = new FormBuilder().group({
    numero_intervention: ['', [Validators.required, Validators.minLength(2)]],
    date_intervention: ['', Validators.required],
    type_intervention: [''],
    description_intervention: [''],
    pieces_remplacees: [''],
    duree_intervention: [0, [Validators.min(0)]],
    cout_intervention: [0, [Validators.min(0)]],
    statut: ['planifiee'],
  });

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly isEditMode = signal(false);
  protected readonly maintenanceId = signal<number | null>(null);

  constructor(
    private readonly maintenanceService: MaintenanceService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode.set(true);
        this.maintenanceId.set(params['id']);
        this.loadMaintenance(params['id']);
      }
    });
  }

  private loadMaintenance(id: number): void {
    this.loading.set(true);
    this.maintenanceService.getById(id).subscribe({
      next: (maintenance) => {
        this.form.patchValue(maintenance);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.error.set('Erreur lors du chargement de l\'intervention');
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

    const data = { ...this.form.value, equipement_id: 1, hopital_id: 1, technicien_id: 1 } as Maintenance;

    const request = this.isEditMode()
      ? this.maintenanceService.update(this.maintenanceId()!, data)
      : this.maintenanceService.create(data);

    request.subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/administration/maintenances']);
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.error.set('Erreur lors de la sauvegarde');
        this.loading.set(false);
      },
    });
  }

  protected onCancel(): void {
    this.router.navigate(['/administration/maintenances']);
  }
}
