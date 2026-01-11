import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ServiceService } from '../../services/service.service';
import { TypesAndAffectationsService, TypePole } from '../../services/types-and-affectations.service';

@Component({
  selector: 'app-pole-form',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './pole-form.page.html',
})
export class PoleFormPage implements OnInit {
  protected readonly form = new FormBuilder().group({
    code: ['', [Validators.required, Validators.minLength(2)]],
    nom: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    type_pole: [''],
    budget_annuel: ['' as string | number],
    responsable_id: [undefined as number | undefined],
    actif: [true],
  });

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly isEditMode = signal(false);
  protected readonly poleId = signal<number | null>(null);
  protected readonly typePoles = signal<TypePole[]>([]);
  protected readonly showTypePoleModal = signal(false);
  protected readonly newTypePole = signal<TypePole>({ code: '', nom: '' });

  constructor(
    private readonly serviceService: ServiceService,
    private readonly typesService: TypesAndAffectationsService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadTypePoles();
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode.set(true);
        this.poleId.set(params['id']);
        this.loadPole(params['id']);
      }
    });
  }

  private loadTypePoles(): void {
    this.typesService.getAllTypePoles().subscribe({
      next: (data) => {
        this.typePoles.set(data);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des types de pôles:', err);
      },
    });
  }

  private loadPole(id: number): void {
    this.loading.set(true);
    this.serviceService.getPoleById(id).subscribe({
      next: (pole) => {
        this.form.patchValue(pole);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement:', err);
        this.error.set('Erreur lors du chargement du pôle');
        this.loading.set(false);
      },
    });
  }

  protected openTypePoleModal(): void {
    this.newTypePole.set({ code: '', nom: '' });
    this.showTypePoleModal.set(true);
  }

  protected closeTypePoleModal(): void {
    this.showTypePoleModal.set(false);
  }

  protected createTypePole(): void {
    const typePole = this.newTypePole();
    if (!typePole.code || !typePole.nom) {
      this.error.set('Code et Nom sont requis');
      return;
    }

    this.typesService.createTypePole(typePole).subscribe({
      next: (data) => {
        this.typePoles.update(types => [...types, data]);
        this.form.patchValue({ type_pole: data.code });
        this.closeTypePoleModal();
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.error.set('Erreur lors de la création du type de pôle');
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
    const data: any = {
      hopital_id: 1,
      code: formValue.code || '',
      nom: formValue.nom || '',
      description: formValue.description || undefined,
      type_pole: formValue.type_pole || undefined,
      budget_annuel: formValue.budget_annuel ? parseFloat(String(formValue.budget_annuel)) : undefined,
      responsable_id: formValue.responsable_id || undefined,
      actif: formValue.actif !== null ? formValue.actif : true,
    };

    const request = this.isEditMode()
      ? this.serviceService.updatePole(this.poleId()!, data)
      : this.serviceService.createPole(data);

    request.subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/administration/services']);
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.error.set('Erreur lors de la sauvegarde du pôle');
        this.loading.set(false);
      },
    });
  }

  protected onCancel(): void {
    this.router.navigate(['/administration/services']);
  }
}
