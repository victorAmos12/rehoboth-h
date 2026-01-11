import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EquipementService, Equipement } from '../../services/equipement.service';

@Component({
  selector: 'app-equipement-form',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './equipement-form.page.html',
})
export class EquipementFormPage implements OnInit {
  protected readonly form = new FormBuilder().group({
    code_equipement: ['', [Validators.required, Validators.minLength(2)]],
    nom_equipement: ['', [Validators.required, Validators.minLength(3)]],
    type_equipement: [''],
    marque: [''],
    modele: [''],
    numero_serie: [''],
    date_acquisition: [''],
    date_mise_en_service: [''],
    prix_acquisition: [0, [Validators.min(0)]],
    duree_vie_utile: [0, [Validators.min(0)]],
    statut: ['operationnel'],
    localisation: [''],
  });

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly isEditMode = signal(false);
  protected readonly equipementId = signal<number | null>(null);

  constructor(
    private readonly equipementService: EquipementService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode.set(true);
        this.equipementId.set(params['id']);
        this.loadEquipement(params['id']);
      }
    });
  }

  private loadEquipement(id: number): void {
    this.loading.set(true);
    this.equipementService.getById(id).subscribe({
      next: (equipement) => {
        this.form.patchValue(equipement);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.error.set('Erreur lors du chargement de l\'équipement');
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

    const data = { ...this.form.value, hopital_id: 1 } as Equipement;

    const request = this.isEditMode()
      ? this.equipementService.update(this.equipementId()!, data)
      : this.equipementService.create(data);

    request.subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/administration/equipements']);
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.error.set('Erreur lors de la sauvegarde');
        this.loading.set(false);
      },
    });
  }

  protected onCancel(): void {
    this.router.navigate(['/administration/equipements']);
  }
}
